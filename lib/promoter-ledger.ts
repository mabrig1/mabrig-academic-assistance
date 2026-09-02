import { Order, Payment } from "@/lib/models";
import { PromoterPayout, PromoterReferralEvent } from "@/lib/partner-models";
import { commissionForOrder, previousCalendarMonth, startOfCalendarMonth } from "@/lib/partner-commissions";

export async function loadPromoterLedger(application: any) {
  const referralCode = String(application.assignedReferralCode || "");
  const standardRate = Number(application.standardCommissionRate || 15);
  const performanceRate = Number(application.performanceCommissionRate || 20);
  const threshold = Number(application.performanceThreshold || 10);
  if (!referralCode) {
    return {
      currentCommissionRate: standardRate,
      threshold,
      totalAcademicReferrals: 0,
      paidAcademicReferrals: 0,
      eligibleAcademicReferrals: 0,
      currentMonthEligible: 0,
      previousMonthEligible: 0,
      externalPurchases: [] as any[],
      accruedUnpaid: 0,
      totalPaidCommission: 0,
      unpaidOrderNumbers: [] as string[],
      unpaidExternalReferences: [] as string[],
      lines: [] as any[],
      payouts: [] as any[],
    };
  }

  const [orders, purchases, payouts] = await Promise.all([
    Order.find({ referralCode }).sort({ createdAt: -1 }).lean(),
    PromoterReferralEvent.find({ referralCode, eventType: "PURCHASE", currency: "NGN" }).sort({ paidAt: -1, createdAt: -1 }).lean(),
    PromoterPayout.find({ applicationNumber: application.applicationNumber, status: "PAID" }).sort({ paidAt: -1 }).lean(),
  ]);
  const orderIds = orders.map(order => order._id);
  const payments = await Payment.find({ orderId: { $in: orderIds } }).lean();
  const paymentsByOrder = new Map(payments.map(payment => [String(payment.orderId), payment]));
  const now = new Date();
  const currentMonthStart = startOfCalendarMonth(now);
  const previousMonth = previousCalendarMonth(now);

  const previousAcademic = orders.filter(order => {
    const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
    const line = commissionForOrder(order, paymentsByOrder.get(String(order._id)), standardRate);
    return line.eligible && updatedAt && updatedAt >= previousMonth.start && updatedAt < previousMonth.end;
  }).length;
  const previousExternal = purchases.filter((event: any) => {
    const paidAt = event.paidAt ? new Date(event.paidAt) : new Date(event.createdAt);
    return paidAt >= previousMonth.start && paidAt < previousMonth.end;
  }).length;
  const previousMonthEligible = previousAcademic + previousExternal;
  const currentRate = previousMonthEligible >= threshold ? performanceRate : standardRate;

  const lines = orders.map(order => commissionForOrder(order, paymentsByOrder.get(String(order._id)), currentRate));
  const paidOrderNumbers = new Set<string>();
  const paidExternalReferences = new Set<string>();
  for (const payout of payouts as any[]) {
    for (const orderNumber of payout.orderNumbers || []) paidOrderNumbers.add(String(orderNumber));
    for (const reference of payout.externalReferences || []) paidExternalReferences.add(String(reference));
  }
  const eligibleLines = lines.filter(line => line.eligible);
  const unpaidLines = eligibleLines.filter(line => !paidOrderNumbers.has(line.orderNumber));

  const externalPurchases = (purchases as any[]).map(event => {
    const value = Number(event.value || 0);
    const reference = String(event.externalReference || event.sessionId || "");
    const payoutStatus = event.payoutNumber || paidExternalReferences.has(reference) ? "PAID" : "ACCRUED";
    return {
      product: String(event.product || ""),
      externalReference: reference,
      label: String(event.label || "Paid purchase"),
      value,
      currency: String(event.currency || "NGN"),
      paidAt: event.paidAt || event.createdAt,
      commissionAmount: Math.round((value * currentRate / 100) * 100) / 100,
      payoutStatus,
    };
  });
  const unpaidExternal = externalPurchases.filter(item => item.payoutStatus !== "PAID");

  const currentMonthAcademic = orders.filter(order => {
    const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
    const line = commissionForOrder(order, paymentsByOrder.get(String(order._id)), currentRate);
    return line.eligible && updatedAt && updatedAt >= currentMonthStart;
  }).length;
  const currentMonthExternal = purchases.filter((event: any) => {
    const paidAt = event.paidAt ? new Date(event.paidAt) : new Date(event.createdAt);
    return paidAt >= currentMonthStart;
  }).length;

  const accruedAcademic = unpaidLines.reduce((sum, line) => sum + line.commissionAmount, 0);
  const accruedExternal = unpaidExternal.reduce((sum, item) => sum + item.commissionAmount, 0);

  return {
    currentCommissionRate: currentRate,
    threshold,
    totalAcademicReferrals: orders.length,
    paidAcademicReferrals: lines.filter(line => line.paymentStatus === "PAID").length,
    eligibleAcademicReferrals: eligibleLines.length,
    currentMonthEligible: currentMonthAcademic + currentMonthExternal,
    previousMonthEligible,
    externalPurchases,
    accruedUnpaid: Math.round((accruedAcademic + accruedExternal) * 100) / 100,
    totalPaidCommission: Math.round((payouts as any[]).reduce((sum, payout) => sum + Number(payout.amount || 0), 0) * 100) / 100,
    unpaidOrderNumbers: unpaidLines.map(line => line.orderNumber),
    unpaidExternalReferences: unpaidExternal.map(item => item.externalReference),
    lines,
    payouts,
  };
}
