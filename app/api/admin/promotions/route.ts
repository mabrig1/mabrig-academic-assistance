import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromotionSubmission } from "@/lib/partner-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["SUBMITTED", "APPROVED", "REJECTED", "PAID"]);

export async function GET() {
  try {
    await connectMongoDB();
    const submissions = await PromotionSubmission.find({}).sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ ok: true, submissions });
  } catch (error) {
    console.error("Unable to load promotion submissions", error);
    return NextResponse.json({ error: "Unable to load promotion submissions." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const submissionNumber = String(body?.submissionNumber || "").trim();
    const status = String(body?.status || "").trim().toUpperCase();
    const approvedAmount = Math.max(0, Number(body?.approvedAmount || 0));
    const adminNote = String(body?.adminNote || "").trim().slice(0, 800) || null;

    if (!submissionNumber || !STATUSES.has(status)) {
      return NextResponse.json({ error: "Choose a valid promotion submission and status." }, { status: 400 });
    }
    if ((status === "APPROVED" || status === "PAID") && approvedAmount <= 0) {
      return NextResponse.json({ error: "Enter the approved promotion payment amount." }, { status: 400 });
    }

    await connectMongoDB();
    const submission = await PromotionSubmission.findOne({ submissionNumber });
    if (!submission) return NextResponse.json({ error: "Promotion submission not found." }, { status: 404 });

    submission.status = status;
    submission.adminNote = adminNote;
    if (status === "APPROVED" || status === "PAID") {
      submission.approvedAmount = approvedAmount;
      submission.reviewedAt = submission.reviewedAt || new Date();
    }
    if (status === "REJECTED") {
      submission.approvedAmount = 0;
      submission.reviewedAt = new Date();
      submission.paidAt = null;
    }
    if (status === "PAID") submission.paidAt = submission.paidAt || new Date();
    if (status === "SUBMITTED") {
      submission.approvedAmount = 0;
      submission.reviewedAt = null;
      submission.paidAt = null;
    }
    await submission.save();

    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    console.error("Unable to update promotion submission", error);
    return NextResponse.json({ error: "Unable to update promotion submission." }, { status: 500 });
  }
}
