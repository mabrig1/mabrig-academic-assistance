import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Order, Payment } from "@/lib/models";
import { PromoterPayout, StudentPromoterApplication } from "@/lib/partner-models";
import { commissionForOrder, previousCalendarMonth } from "@/lib/partner-commissions";

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

async function commissionSummary(application: any) {
  const referralCode = String(application.assignedReferralCode || "");
  if (!referralCode) {
    return {
      totalReferrals: 0,
      eligibleCompleted: 0,
      currentCommissionRate: Number(application.standardCommissionRate || 15),
      accruedUnpaid: 0,
      totalPaidCommission: 0,
      unpaidOrderNumbers: [] as string[],
    };
  }

  const orders = await Order.find({ referralCode }).sort({ createdAt: -1 }).lean();
  const orderIds = orders.map(order => order._id);
  const [payments, payouts] = await Promise.all([
    Payment.find({ orderId: { $in: orderIds } }).lean(),
    PromoterPayout.find({ applicationNumber: application.applicationNumber, status: "PAID" }).lean(),
  ]);
  const paymentsByOrder = new Map(payments.map(payment => [String(payment.orderId), payment]));
  const previousMonth = previousCalendarMonth(new Date());
  const previousMonthEligible = orders.filter(order => {
    const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
    const line = commissionForOrder(order, paymentsByOrder.get(String(order._id)), Number(application.standardCommissionRate || 15));
    return line.eligible && updatedAt && updatedAt >= previousMonth.start && updatedAt < previousMonth.end;
  }).length;

  const currentCommissionRate = previousMonthEligible >= Number(application.performanceThreshold || 10)
    ? Number(application.performanceCommissionRate || 20)
    : Number(application.standardCommissionRate || 15);
  const lines = orders.map(order => commissionForOrder(order, paymentsByOrder.get(String(order._id)), currentCommissionRate));
  const paidOrderNumbers = new Set<string>();
  for (const payout of payouts) for (const orderNumber of payout.orderNumbers || []) paidOrderNumbers.add(String(orderNumber));
  const eligibleLines = lines.filter(line => line.eligible);
  const unpaidLines = eligibleLines.filter(line => !paidOrderNumbers.has(line.orderNumber));

  return {
    totalReferrals: orders.length,
    eligibleCompleted: eligibleLines.length,
    previousMonthEligible,
    currentCommissionRate,
    accruedUnpaid: Math.round(unpaidLines.reduce((sum, line) => sum + line.commissionAmount, 0) * 100) / 100,
    totalPaidCommission: Math.round(payouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) * 100) / 100,
    unpaidOrderNumbers: unpaidLines.map(line => line.orderNumber),
  };
}

export async function GET() {
  try {
    await connectMongoDB();
    const applications = await StudentPromoterApplication.find({}).sort({ createdAt: -1 }).limit(500);
    const enriched = await Promise.all(applications.map(async application => ({
      ...application.toObject(),
      _id: String(application._id),
      commissionSummary: await commissionSummary(application),
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
      const summary = await commissionSummary(application);
      if (summary.accruedUnpaid <= 0 || summary.unpaidOrderNumbers.length === 0) {
        return NextResponse.json({ error: "There is no cleared unpaid commission for this promoter." }, { status: 400 });
      }
      const payout = await PromoterPayout.create({
        payoutNumber: payoutNumber(),
        applicationNumber: application.applicationNumber,
        referralCode: application.assignedReferralCode,
        orderNumbers: summary.unpaidOrderNumbers,
        amount: summary.accruedUnpaid,
        commissionRate: summary.currentCommissionRate,
        status: "PAID",
        paidAt: new Date(),
        note: String(body?.note || "Weekly promoter commission payout recorded by admin.").trim().slice(0, 500),
      });
      return NextResponse.json({
        ok: true,
        payout: {
          payoutNumber: payout.payoutNumber,
          amount: payout.amount,
          currency: payout.currency,
          commissionRate: payout.commissionRate,
          orderCount: payout.orderNumbers.length,
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
