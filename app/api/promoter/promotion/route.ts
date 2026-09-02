import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromotionSubmission, StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCTS = new Set(["ACADEMIC", "FINTIGEN", "DDEI", "NETWORK"]);
const CHANNELS = new Set(["WHATSAPP", "FACEBOOK", "INSTAGRAM", "TIKTOK", "X", "LINKEDIN", "CAMPUS", "EVENT", "OTHER"]);

function normalizeWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234")) return `+${digits}`;
  return `+${digits}`;
}

function submissionNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PRO-${date}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function verifyPromoter(referralCode: string, whatsapp: string) {
  const promoter = await StudentPromoterApplication.findOne({ assignedReferralCode: referralCode, whatsapp });
  if (!promoter) return { error: "We could not match that promoter code and WhatsApp number.", status: 404 as const };
  if (promoter.status !== "APPROVED") return { error: `Your promoter account is ${String(promoter.status).toLowerCase()}.`, status: 403 as const };
  return { promoter };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const referralCode = String(body?.referralCode || "").trim().toUpperCase().slice(0, 64);
    const whatsapp = normalizeWhatsapp(String(body?.whatsapp || ""));
    const product = String(body?.product || "").trim().toUpperCase();
    const channel = String(body?.channel || "").trim().toUpperCase();
    const proofUrl = String(body?.proofUrl || "").trim().slice(0, 600);
    const note = String(body?.note || "").trim().slice(0, 800) || null;

    if (!referralCode || !whatsapp || !PRODUCTS.has(product) || !CHANNELS.has(channel) || !proofUrl) {
      return NextResponse.json({ error: "Complete the promotion proof form." }, { status: 400 });
    }
    try { new URL(proofUrl); } catch { return NextResponse.json({ error: "Enter a valid public proof link or post URL." }, { status: 400 }); }

    await connectMongoDB();
    const verified = await verifyPromoter(referralCode, whatsapp);
    if ("error" in verified) return NextResponse.json({ error: verified.error }, { status: verified.status });

    const submission = await PromotionSubmission.create({
      submissionNumber: submissionNumber(),
      applicationNumber: verified.promoter.applicationNumber,
      referralCode,
      product,
      channel,
      proofUrl,
      note,
      status: "SUBMITTED",
    });

    return NextResponse.json({
      ok: true,
      submissionNumber: submission.submissionNumber,
      message: "Promotion proof submitted. Admin will verify the activity and assign the approved promotion payment amount.",
    }, { status: 201 });
  } catch (error) {
    console.error("Unable to submit promotion proof", error);
    return NextResponse.json({ error: "Unable to submit promotion proof right now." }, { status: 500 });
  }
}
