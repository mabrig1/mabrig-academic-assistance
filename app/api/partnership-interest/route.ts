import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PartnerLead, PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";

const ALLOWED_INTERESTS = new Set([
  "RECRUIT_TALENT",
  "INTERNSHIPS",
  "SPONSORSHIP",
  "CAMPUS_PARTNERSHIP",
  "TRAINING_PARTNERSHIP",
  "TECH_PARTNERSHIP",
  "OTHER",
]);

function leadNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PART-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function cleanCode(value: unknown) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 64) || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactName = String(body?.contactName || "").trim().slice(0, 120);
    const organisation = String(body?.organisation || "").trim().slice(0, 180);
    const email = String(body?.email || "").trim().toLowerCase().slice(0, 180) || null;
    const whatsapp = String(body?.whatsapp || "").trim().slice(0, 40) || null;
    const interestType = String(body?.interestType || "").trim().toUpperCase();
    const message = String(body?.message || "").trim().slice(0, 1800) || null;
    const referralCode = cleanCode(body?.referralCode);

    if (!contactName || !organisation || !ALLOWED_INTERESTS.has(interestType)) {
      return NextResponse.json({ error: "Enter your name, organisation and partnership interest." }, { status: 400 });
    }
    if (!email && !whatsapp) {
      return NextResponse.json({ error: "Add an email address or WhatsApp number so we can respond." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    await connectMongoDB();
    let activeReferralCode: string | null = null;
    if (referralCode) {
      const promoter = await StudentPromoterApplication.findOne({ assignedReferralCode: referralCode, status: "APPROVED" }).select("assignedReferralCode");
      if (promoter) activeReferralCode = referralCode;
    }

    const lead = await PartnerLead.create({
      leadNumber: leadNumber(),
      contactName,
      organisation,
      email,
      whatsapp,
      interestType,
      message,
      referralCode: activeReferralCode,
    });

    if (activeReferralCode) {
      try {
        await PromoterReferralEvent.create({
          referralCode: activeReferralCode,
          product: "ACADEMIC",
          eventType: "LEAD",
          sessionId: `PARTNER:${lead.leadNumber}`,
          externalReference: lead.leadNumber,
          label: `${interestType}: ${organisation}`,
          sourceHost: "academic.mabrigkorie.org",
          page: "/recruiters-partners",
        });
      } catch (error: any) {
        if (error?.code !== 11000) console.error("Unable to attach promoter lead attribution", error);
      }
    }

    return NextResponse.json({
      ok: true,
      leadNumber: lead.leadNumber,
      message: "Thank you. Your recruiter/partnership interest has been received and can now be followed up by the Mabrig team.",
    }, { status: 201 });
  } catch (error) {
    console.error("Unable to save partnership interest", error);
    return NextResponse.json({ error: "Unable to submit your interest right now." }, { status: 500 });
  }
}
