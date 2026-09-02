import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Order, Payment } from "@/lib/models";
import { PromoterPayout, PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";
import { commissionForOrder, previousCalendarMonth, startOfCalendarMonth } from "@/lib/partner-commissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "";
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith("234")) return `+${digits}`;
  return `+${digits}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const referralCode = String(body?.referralCode || "").trim().toUpperCase().slice(0, 64);
    const whatsapp = normalizeWhatsapp(String(body?.whatsapp || ""));
    if (!referralCode || !whatsapp) {
      return NextResponse.json({ error: "Enter your official referral code and WhatsApp number." }, { status: 400 });
    }

    await connectMongoDB();
    const promoter = await StudentPromoterApplication.findOne({ assignedReferralCode: referralCode, whatsapp });
    if (!promoter) return NextResponse.json({ error: "We could not match that promoter code and WhatsApp number." }, { status: 404 });
    if (promoter.status !== "APPROVED") return NextResponse.json({ error: `Your promoter account is ${String(promoter.status).toLowerCase()}.` }, { status: 403 });

    const orders = await Order.find({ referralCode }).sort({ createdAt: -1 }).lean();
    const orderIds = orders.map(order => order._id);
    const [payments, payouts, referralEvents] = await Promise.all([
      Payment.find({ orderId: { $in: orderIds } }).lean(),
      PromoterPayout.find({ applicationNumber: promoter.applicationNumber, status: "PAID" }).sort({ paidAt: -1 }).lean(),
      PromoterReferralEvent.find({ referralCode, eventType: "CLICK" }).sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    const paymentsByOrder = new Map(payments.map(payment => [String(payment.orderId), payment]));
    const now = new Date();
    const currentMonthStart = startOfCalendarMonth(now);
    const previousMonth = previousCalendarMonth(now);

    const fulfilledPreviousMonth = orders.filter(order => {
      const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
      const line = commissionForOrder(order, paymentsByOrder.get(String(order._id)), promoter.standardCommissionRate);
      return line.eligible && updatedAt && updatedAt >= previousMonth.start && updatedAt < previousMonth.end;
    }).length;

    const currentRate = fulfilledPreviousMonth >= Number(promoter.performanceThreshold || 10)
      ? Number(promoter.performanceCommissionRate || 20)
      : Number(promoter.standardCommissionRate || 15);

    const lines = orders.map(order => commissionForOrder(order, paymentsByOrder.get(String(order._id)), currentRate));
    const paidOrderNumbers = new Set<string>();
    for (const payout of payouts) for (const orderNumber of payout.orderNumbers || []) paidOrderNumbers.add(String(orderNumber));

    const eligibleLines = lines.filter(line => line.eligible);
    const unpaidLines = eligibleLines.filter(line => !paidOrderNumbers.has(line.orderNumber));
    const currentMonthEligible = orders.filter(order => {
      const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
      const line = commissionForOrder(order, paymentsByOrder.get(String(order._id)), currentRate);
      return line.eligible && updatedAt && updatedAt >= currentMonthStart;
    }).length;

    const clicksByProduct = { ACADEMIC: 0, FINTIGEN: 0, DDEI: 0 };
    for (const event of referralEvents) {
      const product = String(event.product || "").toUpperCase() as keyof typeof clicksByProduct;
      if (product in clicksByProduct) clicksByProduct[product] += 1;
    }

    return NextResponse.json({
      ok: true,
      promoter: {
        name: promoter.name,
        applicationNumber: promoter.applicationNumber,
        referralCode,
        department: promoter.department,
        level: promoter.level,
        status: promoter.status,
        standardCommissionRate: promoter.standardCommissionRate,
        performanceCommissionRate: promoter.performanceCommissionRate,
        performanceThreshold: promoter.performanceThreshold,
        currentCommissionRate: currentRate,
      },
      performance: {
        totalReferrals: orders.length,
        paidReferrals: lines.filter(line => line.paymentStatus === "PAID").length,
        eligibleCompletedReferrals: eligibleLines.length,
        currentMonthEligibleReferrals: currentMonthEligible,
        previousMonthEligibleReferrals: fulfilledPreviousMonth,
        threshold: Number(promoter.performanceThreshold || 10),
        trackedProductClicks: referralEvents.length,
        clicksByProduct,
      },
      commissions: {
        accruedUnpaid: Math.round(unpaidLines.reduce((sum, line) => sum + line.commissionAmount, 0) * 100) / 100,
        totalRecordedPaid: Math.round(payouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) * 100) / 100,
        currency: "NGN",
      },
      recentReferrals: lines.slice(0, 12).map(line => ({
        orderNumber: line.orderNumber,
        orderStatus: line.orderStatus,
        paymentStatus: line.paymentStatus,
        eligible: line.eligible,
        commissionAmount: line.eligible ? line.commissionAmount : 0,
        payoutStatus: paidOrderNumbers.has(line.orderNumber) ? "PAID" : line.eligible ? "ACCRUED" : "PENDING",
      })),
      recentPayouts: payouts.slice(0, 8).map(payout => ({
        payoutNumber: payout.payoutNumber,
        amount: payout.amount,
        currency: payout.currency,
        paidAt: payout.paidAt,
        orderCount: (payout.orderNumbers || []).length,
      })),
      productLinks: {
        academic: `https://academic.mabrigkorie.org/?ref=${encodeURIComponent(referralCode)}`,
        fintigen: `https://www.fintigen.com/?ref=${encodeURIComponent(referralCode)}`,
        ddei: `https://ddei.online/?ref=${encodeURIComponent(referralCode)}`,
      },
      shareLink: `https://academic.mabrigkorie.org/?ref=${encodeURIComponent(referralCode)}`,
    });
  } catch (error) {
    console.error("Unable to load promoter summary", error);
    return NextResponse.json({ error: "Unable to load your promoter dashboard right now." }, { status: 500 });
  }
}
