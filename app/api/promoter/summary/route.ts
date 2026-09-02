import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { PromoterReferralEvent, StudentPromoterApplication } from "@/lib/partner-models";
import { loadPromoterLedger } from "@/lib/promoter-ledger";

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

    const [ledger, referralEvents] = await Promise.all([
      loadPromoterLedger(promoter),
      PromoterReferralEvent.find({ referralCode, eventType: "CLICK" }).sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    const clicksByProduct = { ACADEMIC: 0, FINTIGEN: 0, DDEI: 0 };
    for (const event of referralEvents) {
      const product = String(event.product || "").toUpperCase() as keyof typeof clicksByProduct;
      if (product in clicksByProduct) clicksByProduct[product] += 1;
    }
    const purchasesByProduct = { FINTIGEN: 0, DDEI: 0 };
    for (const purchase of ledger.externalPurchases) {
      const product = String(purchase.product || "").toUpperCase() as keyof typeof purchasesByProduct;
      if (product in purchasesByProduct) purchasesByProduct[product] += 1;
    }
    const paidOrderNumbers = new Set<string>();
    for (const payout of ledger.payouts as any[]) for (const orderNumber of payout.orderNumbers || []) paidOrderNumbers.add(String(orderNumber));

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
        currentCommissionRate: ledger.currentCommissionRate,
      },
      performance: {
        totalReferrals: ledger.totalAcademicReferrals,
        paidReferrals: ledger.paidAcademicReferrals,
        eligibleCompletedReferrals: ledger.eligibleAcademicReferrals,
        currentMonthEligibleReferrals: ledger.currentMonthEligible,
        previousMonthEligibleReferrals: ledger.previousMonthEligible,
        threshold: ledger.threshold,
        trackedProductClicks: referralEvents.length,
        clicksByProduct,
        verifiedExternalPurchases: ledger.externalPurchases.length,
        purchasesByProduct,
      },
      commissions: {
        accruedUnpaid: ledger.accruedUnpaid,
        totalRecordedPaid: ledger.totalPaidCommission,
        currency: "NGN",
      },
      recentReferrals: ledger.lines.slice(0, 12).map((line: any) => ({
        orderNumber: line.orderNumber,
        orderStatus: line.orderStatus,
        paymentStatus: line.paymentStatus,
        eligible: line.eligible,
        commissionAmount: line.eligible ? line.commissionAmount : 0,
        payoutStatus: paidOrderNumbers.has(line.orderNumber) ? "PAID" : line.eligible ? "ACCRUED" : "PENDING",
      })),
      recentExternalPurchases: ledger.externalPurchases.slice(0, 12),
      recentPayouts: (ledger.payouts as any[]).slice(0, 8).map(payout => ({
        payoutNumber: payout.payoutNumber,
        amount: payout.amount,
        currency: payout.currency,
        paidAt: payout.paidAt,
        orderCount: (payout.orderNumbers || []).length,
        externalPurchaseCount: (payout.externalReferences || []).length,
      })),
      productLinks: {
        academic: `https://academic.mabrigkorie.org/?ref=${encodeURIComponent(referralCode)}`,
        fintigen: `https://www.fintigen.com/?ref=${encodeURIComponent(referralCode)}`,
        ddei: `https://ddei.online/?ref=${encodeURIComponent(referralCode)}`,
      },
      partnerInviteLink: `https://academic.mabrigkorie.org/recruiters-partners?ref=${encodeURIComponent(referralCode)}`,
      shareLink: `https://academic.mabrigkorie.org/?ref=${encodeURIComponent(referralCode)}`,
    });
  } catch (error) {
    console.error("Unable to load promoter summary", error);
    return NextResponse.json({ error: "Unable to load your promoter dashboard right now." }, { status: 500 });
  }
}
