import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromoterPayout, PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";
import { loadPromoterLedger } from "@/lib/promoter-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);

function referralCodeFor(applicationNumber: string) {
  const suffix = applicationNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-8);
  return `UNN-${suffix}`;
}

function payoutNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PAY-${date}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    await connectMongoDB();
    const applications = await StudentPromoterApplication.find({}).sort({ createdAt: -1 }).limit(500);
    const enriched = await Promise.all(applications.map(async application => ({
      ...application.toObject(),
      _id: String(application._id),
      commissionSummary: await loadPromoterLedger(application),
    })));

    return NextResponse.json({ ok: true, applications: enriched });
  } catch (error) {
    console.error("Unable to list promoter applications", error);
    return NextResponse.json({ error: "Unable to load promoter applications." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const applicationNumber = String(body?.applicationNumber || "").trim();
    const action = String(body?.action || "STATUS").trim().toUpperCase();

    if (!applicationNumber) return NextResponse.json({ error: "Choose a valid promoter application." }, { status: 400 });
    await connectMongoDB();
    const application = await StudentPromoterApplication.findOne({ applicationNumber });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    if (action === "PAYOUT") {
      if (application.status !== "APPROVED" || !application.assignedReferralCode) {
        return NextResponse.json({ error: "Only approved promoters with an official referral code can receive commission payouts." }, { status: 400 });
      }
      const summary = await loadPromoterLedger(application);
      if (summary.accruedUnpaid <= 0 || (summary.unpaidOrderNumbers.length === 0 && summary.unpaidExternalReferences.length === 0)) {
        return NextResponse.json({ error: "There is no cleared unpaid commission for this promoter." }, { status: 400 });
      }
      const number = payoutNumber();
      const payout = await PromoterPayout.create({
        payoutNumber: number,
        applicationNumber: application.applicationNumber,
        referralCode: application.assignedReferralCode,
        orderNumbers: summary.unpaidOrderNumbers,
        externalReferences: summary.unpaidExternalReferences,
        amount: summary.accruedUnpaid,
        commissionRate: summary.currentCommissionRate,
        status: "PAID",
        paidAt: new Date(),
        note: String(body?.note || "Weekly multi-product promoter commission payout recorded by admin.").trim().slice(0, 500),
      });
      if (summary.unpaidExternalReferences.length) {
        await PromoterReferralEvent.updateMany(
          {
            referralCode: application.assignedReferralCode,
            eventType: "PURCHASE",
            externalReference: { $in: summary.unpaidExternalReferences },
            payoutNumber: null,
          },
          { $set: { payoutNumber: number } },
        );
      }
      return NextResponse.json({
        ok: true,
        payout: {
          payoutNumber: payout.payoutNumber,
          amount: payout.amount,
          currency: payout.currency,
          commissionRate: payout.commissionRate,
          orderCount: payout.orderNumbers.length,
          externalPurchaseCount: payout.externalReferences.length,
          paidAt: payout.paidAt,
        },
      });
    }

    const status = String(body?.status || "").trim().toUpperCase();
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Choose a valid application status." }, { status: 400 });
    }

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
