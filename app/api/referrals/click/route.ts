import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PRODUCTS = new Set(["ACADEMIC", "FINTIGEN", "DDEI"]);
const ALLOWED_ORIGINS = new Set([
  "https://academic.mabrigkorie.org",
  "https://www.fintigen.com",
  "https://fintigen.com",
  "https://ddei.online",
  "https://www.ddei.online",
]);

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://academic.mabrigkorie.org";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();
    const referralCode = String(body?.referralCode || "").trim().toUpperCase().slice(0, 64);
    const product = String(body?.product || "").trim().toUpperCase();
    const sessionId = String(body?.sessionId || "").trim().slice(0, 96);
    const page = String(body?.page || "").trim().slice(0, 300) || null;

    if (!referralCode || !sessionId || !ALLOWED_PRODUCTS.has(product)) {
      return NextResponse.json({ error: "Invalid referral event." }, { status: 400, headers: cors(origin) });
    }

    await connectMongoDB();
    const promoter = await StudentPromoterApplication.findOne({ assignedReferralCode: referralCode, status: "APPROVED" }).select("_id");
    if (!promoter) {
      return NextResponse.json({ error: "Referral code is not active." }, { status: 404, headers: cors(origin) });
    }

    try {
      await PromoterReferralEvent.create({
        referralCode,
        product,
        eventType: "CLICK",
        sessionId,
        page,
        sourceHost: origin ? new URL(origin).host : null,
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }

    return NextResponse.json({ ok: true }, { headers: cors(origin) });
  } catch (error) {
    console.error("Referral event failed", error);
    return NextResponse.json({ error: "Unable to record referral." }, { status: 500, headers: cors(origin) });
  }
}
