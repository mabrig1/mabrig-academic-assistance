"use client";

import { FormEvent, useState } from "react";

type Summary = {
  promoter: {
    name: string;
    applicationNumber: string;
    referralCode: string;
    department: string;
    level: string;
    status: string;
    standardCommissionRate: number;
    performanceCommissionRate: number;
    performanceThreshold: number;
    currentCommissionRate: number;
  };
  performance: {
    totalReferrals: number;
    paidReferrals: number;
    eligibleCompletedReferrals: number;
    currentMonthEligibleReferrals: number;
    previousMonthEligibleReferrals: number;
    threshold: number;
  };
  commissions: {
    accruedUnpaid: number;
    totalRecordedPaid: number;
    currency: string;
  };
  recentReferrals: Array<{
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    eligible: boolean;
    commissionAmount: number;
    payoutStatus: string;
  }>;
  recentPayouts: Array<{
    payoutNumber: string;
    amount: number;
    currency: string;
    paidAt: string;
    orderCount: number;
  }>;
  shareLink: string;
};

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function label(value: string) {
  return String(value || "—").replaceAll("_", " ");
}

export default function PromoterDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("Checking your promoter account...");
    setSummary(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/promoter/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode: String(form.get("referralCode") || ""),
        whatsapp: String(form.get("whatsapp") || ""),
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "Unable to load your dashboard.");
      return;
    }
    setSummary(data);
    setMessage("");
  }

  async function copyLink() {
    if (!summary?.shareLink) return;
    await navigator.clipboard.writeText(summary.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    if (!summary?.shareLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Mabrig Academic Assistance",
        text: "Use my Mabrig Academic Assistance referral link for academic document services:",
        url: summary.shareLink,
      });
      return;
    }
    await copyLink();
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG ICT</div>
      <div className="actions">
        <a className="btn secondary" href="/recruitment">Recruitment</a>
        <a className="btn secondary" href="/partners">Partner Referrals</a>
        <a className="btn secondary" href="/">Academic Assistance</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 920}}>
          <span className="badge">Student Marketer & Campus Promoter</span>
          <h1>Promoter Dashboard</h1>
          <p className="lead">Check your referrals, completed eligible orders, commission progress and recorded payouts using your official referral code and WhatsApp number.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth: 820}}>
          <div className="card">
            <h2>Open My Dashboard</h2>
            <p>No password is required for this first intake. Your official referral code and registered WhatsApp number must match.</p>
            <form onSubmit={submit}>
              <div className="form-grid">
                <label className="field"><span>Official referral code</span><input name="referralCode" required placeholder="e.g. UNN-ABC12345" autoCapitalize="characters" /></label>
                <label className="field"><span>Registered WhatsApp number</span><input name="whatsapp" required inputMode="tel" placeholder="080..." /></label>
              </div>
              <button className="btn primary" type="submit" disabled={loading} style={{marginTop: 16}}>{loading ? "Checking..." : "View My Performance"}</button>
            </form>
            {message && <div className="notice" style={{marginTop: 16}}>{message}</div>}
          </div>
        </div>
      </section>

      {summary && <section className="section" style={{paddingTop: 0}}>
        <div className="container" style={{maxWidth: 1100}}>
          <div className="card">
            <span className="badge">{summary.promoter.status}</span>
            <h2 style={{marginBottom: 6}}>{summary.promoter.name}</h2>
            <p>{summary.promoter.department} • {summary.promoter.level} Level • Code: <strong>{summary.promoter.referralCode}</strong></p>
            <div className="notice" style={{wordBreak: "break-all"}}><strong>Your referral link</strong><br />{summary.shareLink}</div>
            <div className="actions" style={{marginTop: 12}}>
              <button className="btn primary" onClick={copyLink}>{copied ? "✓ Link Copied" : "Copy Referral Link"}</button>
              <button className="btn secondary" onClick={shareLink}>Share Link</button>
              <a className="btn secondary" href={summary.shareLink}>Open My Link</a>
            </div>
          </div>

          <div className="grid" style={{marginTop: 18}}>
            <article className="card"><span className="badge">Current Rate</span><h2 style={{fontSize: 38}}>{summary.promoter.currentCommissionRate}%</h2><p>Standard {summary.promoter.standardCommissionRate}% • Performance {summary.promoter.performanceCommissionRate}%</p></article>
            <article className="card"><span className="badge">Accrued</span><h2 style={{fontSize: 34}}>{money(summary.commissions.accruedUnpaid)}</h2><p>Eligible commission not yet recorded as paid.</p></article>
            <article className="card"><span className="badge">Paid Commission</span><h2 style={{fontSize: 34}}>{money(summary.commissions.totalRecordedPaid)}</h2><p>Total commission payouts recorded by admin.</p></article>
            <article className="card"><span className="badge">Total Referrals</span><h2 style={{fontSize: 38}}>{summary.performance.totalReferrals}</h2><p>{summary.performance.paidReferrals} paid • {summary.performance.eligibleCompletedReferrals} eligible completed</p></article>
            <article className="card"><span className="badge">This Month</span><h2 style={{fontSize: 38}}>{summary.performance.currentMonthEligibleReferrals}</h2><p>Eligible completed referrals this month.</p></article>
            <article className="card"><span className="badge">Performance Target</span><h2 style={{fontSize: 38}}>{summary.performance.previousMonthEligibleReferrals}/{summary.performance.threshold}</h2><p>Previous calendar month progress used to determine the current performance rate.</p></article>
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h2>Recent Referrals</h2>
            {summary.recentReferrals.length === 0 ? <p>No referrals have been recorded yet. Share your official link to begin.</p> : <div style={{overflowX: "auto"}}>
              <table style={{width: "100%", borderCollapse: "collapse"}}>
                <thead><tr><th style={{textAlign: "left", padding: 10}}>Order</th><th style={{textAlign: "left", padding: 10}}>Order Status</th><th style={{textAlign: "left", padding: 10}}>Payment</th><th style={{textAlign: "left", padding: 10}}>Commission</th><th style={{textAlign: "left", padding: 10}}>Payout</th></tr></thead>
                <tbody>{summary.recentReferrals.map(referral => <tr key={referral.orderNumber}>
                  <td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{referral.orderNumber}</td>
                  <td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.orderStatus)}</td>
                  <td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.paymentStatus)}</td>
                  <td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{referral.eligible ? money(referral.commissionAmount) : "Pending"}</td>
                  <td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.payoutStatus)}</td>
                </tr>)}</tbody>
              </table>
            </div>}
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h2>Payout History</h2>
            {summary.recentPayouts.length === 0 ? <p>No commission payout has been recorded yet.</p> : summary.recentPayouts.map(payout => <div className="notice" style={{marginTop: 10}} key={payout.payoutNumber}>
              <strong>{money(payout.amount)}</strong> • {payout.orderCount} order{payout.orderCount === 1 ? "" : "s"}<br />
              {payout.payoutNumber} • {new Date(payout.paidAt).toLocaleString()}
            </div>)}
          </div>

          <div className="notice" style={{marginTop: 18}}><strong>How commission clears:</strong> the referred order must carry your official code, have a verified PAID payment, and reach a fulfilled status (READY, COLLECTED or DELIVERED). Cancelled, refunded, fraudulent, duplicate and self-referral orders remain ineligible.</div>
        </div>
      </section>}
    </main>
  </>;
}
