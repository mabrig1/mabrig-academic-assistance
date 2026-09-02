import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";

const ALLOWED_LEVELS = new Set(["100", "200", "300", "400", "500", "600", "POSTGRADUATE"]);

function normalizeWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234")) return `+${digits}`;
  return `+${digits}`;
}

function createApplicationNumber() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UNN-PRO-${time}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim().replace(/\s+/g, " ").slice(0, 120);
    const whatsapp = normalizeWhatsapp(String(body?.whatsapp || ""));
    const department = String(body?.department || "").trim().replace(/\s+/g, " ").slice(0, 160);
    const level = String(body?.level || "").trim().toUpperCase();
    const agreedToTerms = body?.agreedToTerms === true;

    if (name.length < 2 || !whatsapp || department.length < 2 || !ALLOWED_LEVELS.has(level)) {
      return NextResponse.json({ error: "Please complete your name, WhatsApp number, department and level." }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ error: "Please accept the commission programme terms before registering." }, { status: 400 });
    }

    await connectMongoDB();

    const existing = await StudentPromoterApplication.findOne({ whatsapp }).lean();
    if (existing) {
      return NextResponse.json({
        ok: true,
        existing: true,
        applicationNumber: existing.applicationNumber,
        status: existing.status,
        message: existing.status === "APPROVED"
          ? "You are already approved for the promoter programme. Use your assigned partner code."
          : "We already have a promoter application for this WhatsApp number.",
      });
    }

    const application = await StudentPromoterApplication.create({
      applicationNumber: createApplicationNumber(),
      name,
      whatsapp,
      department,
      level,
      agreedToTerms,
    });

    return NextResponse.json({
      ok: true,
      applicationNumber: application.applicationNumber,
      status: application.status,
      message: "Registration received. If approved, you will be assigned an official referral code before commissions can be earned.",
    }, { status: 201 });
  } catch (error) {
    console.error("Student promoter registration failed", error);
    return NextResponse.json({ error: "We could not save your registration. Please try again." }, { status: 500 });
  }
}
