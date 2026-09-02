import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { StudentPromoterApplication } from "@/lib/partner-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);

function referralCodeFor(applicationNumber: string) {
  const suffix = applicationNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-8);
  return `UNN-${suffix}`;
}

export async function GET() {
  try {
    await connectMongoDB();
    const applications = await StudentPromoterApplication.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      ok: true,
      applications: applications.map(application => ({
        ...application,
        _id: String(application._id),
      })),
    });
  } catch (error) {
    console.error("Unable to list promoter applications", error);
    return NextResponse.json({ error: "Unable to load promoter applications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const applicationNumber = String(body?.applicationNumber || "").trim();
    const status = String(body?.status || "").trim().toUpperCase();

    if (!applicationNumber || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Choose a valid application and status." }, { status: 400 });
    }

    await connectMongoDB();
    const application = await StudentPromoterApplication.findOne({ applicationNumber });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    application.status = status;
    if (status === "APPROVED") {
      application.assignedReferralCode = application.assignedReferralCode || referralCodeFor(application.applicationNumber);
      application.approvedAt = application.approvedAt || new Date();
    }
    await application.save();

    return NextResponse.json({
      ok: true,
      application: {
        applicationNumber: application.applicationNumber,
        status: application.status,
        assignedReferralCode: application.assignedReferralCode,
        approvedAt: application.approvedAt,
      },
    });
  } catch (error) {
    console.error("Unable to update promoter application", error);
    return NextResponse.json({ error: "Unable to update promoter application." }, { status: 500 });
  }
}
