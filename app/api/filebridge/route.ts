import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "host" | "guest";
type Signal = { id: string; from: Role; kind: "offer" | "answer"; sdp: string };
type Room = {
  _id: string;
  codeHash: string;
  hostHash: string;
  guestHash?: string;
  signals: Signal[];
  createdAt: Date;
  expiresAt: Date;
};
type RateRecord = { _id: string; attempts: number; expiresAt: Date };

const ROOM_TTL_MS = 45 * 60_000;
const IP_LIMIT = 12;
const IP_WINDOW_MS = 15 * 60_000;
const MAX_SDP_CHARS = 32_000;

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const json = (body: object, status = 200) => NextResponse.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});

async function collections() {
  await connectMongoDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready");
  return {
    rooms: db.collection<Room>("filebridge_ephemeral_rooms"),
    attempts: db.collection<RateRecord>("filebridge_join_limits"),
  };
}

let indexPromise: Promise<void> | null = null;
async function ensureIndexes() {
  if (!indexPromise) {
    indexPromise = (async () => {
      const { rooms, attempts } = await collections();
      await Promise.all([
        rooms.createIndex({ codeHash: 1 }, { unique: true }),
        rooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    })().catch((error) => { indexPromise = null; throw error; });
  }
  await indexPromise;
}

function currentOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function validRole(raw: string | null): raw is Role {
  return raw === "host" || raw === "guest";
}

function authenticated(room: Room, role: Role, key: string) {
  const actual = room[role === "host" ? "hostHash" : "guestHash"];
  if (!actual || !/^[a-zA-Z0-9_-]{43}$/.test(key)) return false;
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(sha(key), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function limitAttempts(request: NextRequest) {
  const { attempts } = await collections();
  // On Vercel/Cloudflare only accept the first proxy-assigned IP. The code
  // itself is cryptographically random; this is an additional abuse limit.
  const address = (request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").trim().slice(0, 100);
  const id = sha(address + "::" + Math.floor(Date.now() / IP_WINDOW_MS));
  const expiresAt = new Date(Date.now() + IP_WINDOW_MS * 2);
  const state = await attempts.findOneAndUpdate(
    { _id: id },
    { $inc: { attempts: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after" },
  );
  return (state?.attempts ?? IP_LIMIT + 1) <= IP_LIMIT;
}

export async function POST(request: NextRequest) {
  if (!currentOrigin(request)) return json({ error: "Origin not allowed." }, 403);
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 65_536) return json({ error: "Request is too large." }, 413);
  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 65_536) return json({ error: "Request is too large." }, 413);
    input = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid data");
  } catch {
    return json({ error: "Invalid JSON request." }, 400);
  }

  try {
    if (input.action === "create") {
      if (!await limitAttempts(request)) return json({ error: "Too many attempts. Try again later." }, 429);
      await ensureIndexes();
      const { rooms } = await collections();
      const key = token();
      for (let i = 0; i < 4; i++) {
        const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
        const roomId = randomUUID();
        try {
          await rooms.insertOne({
            _id: roomId,
            codeHash: sha(code),
            hostHash: sha(key),
            signals: [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + ROOM_TTL_MS),
          });
          return json({ roomId, role: "host", key, code, expiresInMinutes: 45 }, 201);
        } catch (error) {
          if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 11000) throw error;
        }
      }
      return json({ error: "Could not create a unique pairing code. Retry." }, 503);
    }

    if (input.action === "join") {
      if (!await limitAttempts(request)) return json({ error: "Too many attempts. Try again later." }, 429);
      const code = input.code;
      if (typeof code !== "string" || !/^\d{8}$/.test(code)) return json({ error: "Enter an eight-digit code." }, 400);
      const { rooms } = await collections();
      const key = token();
      const room = await rooms.findOneAndUpdate(
        { codeHash: sha(code), expiresAt: { $gt: new Date() }, guestHash: { $exists: false } },
        { $set: { guestHash: sha(key) } },
        { returnDocument: "after" },
      );
      if (!room) return json({ error: "Code expired, already used, or incorrect." }, 404);
      return json({ roomId: room._id, role: "guest", key, expiresInMinutes: 45 });
    }

    if (input.action === "signal") {
      const { roomId, role, kind, sdp } = input;
      const key = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
      if (typeof roomId !== "string" || !/^[0-9a-f-]{36}$/.test(roomId) ||
          !validRole(typeof role === "string" ? role : null) ||
          (role === "host" ? kind !== "offer" : kind !== "answer") ||
          typeof sdp !== "string" || sdp.length < 10 || sdp.length > MAX_SDP_CHARS ||
          !sdp.startsWith("v=0")) {
        return json({ error: "Invalid WebRTC signal." }, 400);
      }
      const { rooms } = await collections();
      const room = await rooms.findOne({ _id: roomId, expiresAt: { $gt: new Date() } });
      if (!room || !authenticated(room, role, key)) return json({ error: "Session expired or unauthorized." }, 401);
      const signal: Signal = { id: randomUUID(), from: role, kind, sdp };
      await rooms.updateOne(
        { _id: roomId, expiresAt: { $gt: new Date() } },
        { $push: { signals: { $each: [signal], $slice: -8 } } },
      );
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("FileBridge signaling request failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "FileBridge pairing service temporarily unavailable. Check server MongoDB configuration." }, 503);
  }
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId") || "";
  const role = request.headers.get("x-filebridge-role");
  const key = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!/^[0-9a-f-]{36}$/.test(roomId) || !validRole(role)) return json({ error: "Invalid session." }, 400);
  try {
    const { rooms } = await collections();
    const room = await rooms.findOne({ _id: roomId, expiresAt: { $gt: new Date() } });
    if (!room || !authenticated(room, role, key)) return json({ error: "Session expired or unauthorized." }, 401);
    return json({
      paired: Boolean(room.guestHash),
      signals: room.signals.filter((s) => s.from !== role),
      expiresAt: room.expiresAt.toISOString(),
    });
  } catch {
    return json({ error: "Pairing service unavailable." }, 503);
  }
}
