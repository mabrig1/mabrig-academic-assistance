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
    trackedProductClicks: number;
    clicksByProduct: { ACADEMIC: number; FINTIGEN: number; DDEI: number };
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
  productLinks: { academic: string; fintigen: string; ddei: string };
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
  const [copied, setCopied] = useState("");

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

  async function copyLink(name: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(name);
    setTimeout(() => setCopied(""), 1800);
  }

  async function shareLink(name: string, url: string) {
    if (navigator.share) {
      await navigator.share({ title: name, text: `Use my ${name} referral link:`, url });
      return;
    }
    await copyLink(name, url);
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG ICT</div>
      <div className="actions">
        <a className="btn secondary" href="/recruitment">Recruitment</a>
        <a className="btn secondary" href="/partners">Referral Links</a>
        <a className="btn secondary" href="/">Academic Assistance</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 920}}>
          <span className="badge">Student Marketer & Campus Promoter</span>
          <h1>Multi-Product Promoter Dashboard</h1>
          <p className="lead">Use one official promoter code across Academic Assistance, Fintigen and DDEI. Check tracked product visits, eligible Academic Assistance orders, commission progress and recorded payouts.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth: 820}}>
          <div className="card">
            <h2>Open My Dashboard</h2>
            <p>Your official referral code and registered WhatsApp number must match.</p>
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
          </div>

          <div className="grid" style={{marginTop: 18}}>
            {[
              ["Academic Assistance", summary.productLinks.academic, summary.performance.clicksByProduct.ACADEMIC],
              ["Fintigen", summary.productLinks.fintigen, summary.performance.clicksByProduct.FINTIGEN],
              ["DDEI", summary.productLinks.ddei, summary.performance.clicksByProduct.DDEI],
            ].map(([name, url, clicks]) => <article className="card" key={String(name)}>
              <span className="badge">{String(name)}</span>
              <h2 style={{fontSize: 30}}>{Number(clicks)} tracked visit{Number(clicks) === 1 ? "" : "s"}</h2>
              <div className="notice" style={{wordBreak: "break-all"}}>{String(url)}</div>
              <div className="actions" style={{marginTop: 12}}>
                <button className="btn primary" onClick={() => copyLink(String(name), String(url))}>{copied === name ? "✓ Copied" : "Copy Link"}</button>
                <button className="btn secondary" onClick={() => shareLink(String(name), String(url))}>Share</button>
                <a className="btn secondary" href={String(url)} target="_blank" rel="noreferrer">Open</a>
              </div>
            </article>)}
          </div>

          <div className="grid" style={{marginTop: 18}}>
            <article className="card"><span className="badge">Tracked Product Visits</span><h2 style={{fontSize: 38}}>{summary.performance.trackedProductClicks}</h2><p>Combined attributed visits across all three products.</p></article>
            <article className="card"><span className="badge">Current Rate</span><h2 style={{fontSize: 38}}>{summary.promoter.currentCommissionRate}%</h2><p>Standard {summary.promoter.standardCommissionRate}% • Performance {summary.promoter.performanceCommissionRate}%</p></article>
            <article className="card"><span className="badge">Accrued Commission</span><h2 style={{fontSize: 34}}>{money(summary.commissions.accruedUnpaid)}</h2><p>Eligible commission not yet recorded as paid.</p></article>
            <article className="card"><span className="badge">Paid Commission</span><h2 style={{fontSize: 34}}>{money(summary.commissions.totalRecordedPaid)}</h2><p>Total commission payouts recorded by admin.</p></article>
            <article className="card"><span className="badge">Academic Orders</span><h2 style={{fontSize: 38}}>{summary.performance.totalReferrals}</h2><p>{summary.performance.paidReferrals} paid • {summary.performance.eligibleCompletedReferrals} eligible fulfilled</p></article>
            <article className="card"><span className="badge">Performance Target</span><h2 style={{fontSize: 38}}>{summary.performance.previousMonthEligibleReferrals}/{summary.performance.threshold}</h2><p>Previous calendar month eligible completed sales used for the current rate.</p></article>
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h2>Recent Commissionable Academic Referrals</h2>
            {summary.recentReferrals.length === 0 ? <p>No Academic Assistance orders have been attributed yet.</p> : <div style={{overflowX: "auto"}}>
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

          <div className="notice" style={{marginTop: 18}}><strong>Current rollout:</strong> Academic Assistance has order/payment commission settlement connected. Fintigen and DDEI now carry and report promoter-code visits; their payable conversion events will join the same commission ledger when their commercial checkout/enrolment payments are connected. A click alone is not a payable commission.</div>
        </div>
      </section>}
    </main>
  </>;
}
