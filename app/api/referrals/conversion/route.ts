import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PRODUCTS = new Set(["FINTIGEN", "DDEI"]);

function secretFrom(request: Request) {
  const direct = request.headers.get("x-mabrig-referral-secret");
  if (direct) return direct;
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.PROMOTER_CONVERSION_SECRET || "";
    const suppliedSecret = secretFrom(request);
    if (!expectedSecret || suppliedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized conversion source." }, { status: 401 });
    }

    const body = await request.json();
    const referralCode = String(body?.referralCode || "").trim().toUpperCase().slice(0, 64);
    const product = String(body?.product || "").trim().toUpperCase();
    const externalReference = String(body?.externalReference || "").trim().slice(0, 160);
    const label = String(body?.label || "Paid conversion").trim().slice(0, 240);
    const value = Number(body?.value || 0);
    const currency = String(body?.currency || "NGN").trim().toUpperCase().slice(0, 8);
    const paidAt = body?.paidAt ? new Date(body.paidAt) : new Date();

    if (!referralCode || !externalReference || !ALLOWED_PRODUCTS.has(product) || !Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Invalid paid conversion." }, { status: 400 });
    }
    if (currency !== "NGN") {
      return NextResponse.json({ error: "Only NGN promoter payouts are automated in this intake." }, { status: 400 });
    }

    await connectMongoDB();
    const promoter = await StudentPromoterApplication.findOne({ assignedReferralCode: referralCode, status: "APPROVED" }).select("_id");
    if (!promoter) {
      return NextResponse.json({ error: "Referral code is not active." }, { status: 404 });
    }

    try {
      const event = await PromoterReferralEvent.create({
        referralCode,
        product,
        eventType: "PURCHASE",
        sessionId: `${product}:${externalReference}`,
        externalReference,
        sourceHost: product === "FINTIGEN" ? "www.fintigen.com" : "ddei.online",
        label,
        value,
        currency,
        paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
      });
      return NextResponse.json({ ok: true, recorded: true, id: String(event._id) }, { status: 201 });
    } catch (error: any) {
      if (error?.code === 11000) {
        return NextResponse.json({ ok: true, recorded: false, duplicate: true });
      }
      throw error;
    }
  } catch (error) {
    console.error("Paid referral conversion failed", error);
    return NextResponse.json({ error: "Unable to record paid referral conversion." }, { status: 500 });
  }
}
