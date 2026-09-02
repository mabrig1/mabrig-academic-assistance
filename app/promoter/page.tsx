"use client";

import { FormEvent, useMemo, useState } from "react";

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
    verifiedExternalPurchases: number;
    purchasesByProduct: { FINTIGEN: number; DDEI: number };
  };
  commissions: { accruedUnpaid: number; totalRecordedPaid: number; currency: string };
  recentReferrals: Array<{ orderNumber: string; orderStatus: string; paymentStatus: string; eligible: boolean; commissionAmount: number; payoutStatus: string }>;
  recentExternalPurchases: Array<{ product: string; externalReference: string; label: string; value: number; currency: string; paidAt: string; commissionAmount: number; payoutStatus: string }>;
  recentPayouts: Array<{ payoutNumber: string; amount: number; currency: string; paidAt: string; orderCount: number; externalPurchaseCount: number }>;
  productLinks: { academic: string; fintigen: string; ddei: string };
  partnerInviteLink: string;
  shareLink: string;
};

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function label(value: string) { return String(value || "—").replaceAll("_", " "); }

export default function PromoterDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const partnerMessage = useMemo(() => {
    if (!summary) return "";
    return `Hello, I am part of the Mabrig UNN Student Marketer & Campus Promoter Network. Mabrig operates Academic Assistance, Fintigen digital-skills training, and DDEI / Destiny Skills Bridge. We are open to recruiters, employers, sponsors, training partners, campus partners and organisations looking for emerging digital talent. Explore the partnership and recruitment opportunity here: ${summary.partnerInviteLink}`;
  }, [summary]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("Checking your promoter account...");
    setSummary(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/promoter/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: String(form.get("referralCode") || ""), whatsapp: String(form.get("whatsapp") || "") }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) { setMessage(data.error || "Unable to load your dashboard."); return; }
    setSummary(data);
    setMessage("");
  }

  async function copyText(name: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(name);
    setTimeout(() => setCopied(""), 1800);
  }

  async function nativeShare(name: string, url: string, text?: string) {
    if (navigator.share) {
      await navigator.share({ title: name, text: text || `Use my ${name} referral link:`, url });
      return;
    }
    await copyText(name, text ? `${text}\n${url}` : url);
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
      <section className="hero"><div className="container" style={{maxWidth: 920}}>
        <span className="badge">Student Marketer & Campus Promoter</span>
        <h1>Multi-Product Promoter Dashboard</h1>
        <p className="lead">One code across Academic Assistance, Fintigen and DDEI. Track visits, verified purchases, commissions and payouts—and share the network with customers, recruiters and institutional partners.</p>
      </div></section>

      <section className="section"><div className="container" style={{maxWidth: 820}}><div className="card">
        <h2>Open My Dashboard</h2>
        <p>Your official referral code and registered WhatsApp number must match.</p>
        <form onSubmit={submit}><div className="form-grid">
          <label className="field"><span>Official referral code</span><input name="referralCode" required placeholder="e.g. UNN-ABC12345" autoCapitalize="characters" /></label>
          <label className="field"><span>Registered WhatsApp number</span><input name="whatsapp" required inputMode="tel" placeholder="080..." /></label>
        </div><button className="btn primary" type="submit" disabled={loading} style={{marginTop: 16}}>{loading ? "Checking..." : "View My Performance"}</button></form>
        {message && <div className="notice" style={{marginTop: 16}}>{message}</div>}
      </div></div></section>

      {summary && <section className="section" style={{paddingTop: 0}}><div className="container" style={{maxWidth: 1100}}>
        <div className="card"><span className="badge">{summary.promoter.status}</span><h2 style={{marginBottom: 6}}>{summary.promoter.name}</h2><p>{summary.promoter.department} • {summary.promoter.level} Level • Code: <strong>{summary.promoter.referralCode}</strong></p></div>

        <div className="grid" style={{marginTop: 18}}>
          {[["Academic Assistance", summary.productLinks.academic, summary.performance.clicksByProduct.ACADEMIC], ["Fintigen", summary.productLinks.fintigen, summary.performance.clicksByProduct.FINTIGEN], ["DDEI", summary.productLinks.ddei, summary.performance.clicksByProduct.DDEI]].map(([name, url, clicks]) => <article className="card" key={String(name)}>
            <span className="badge">{String(name)}</span><h2 style={{fontSize: 30}}>{Number(clicks)} tracked visit{Number(clicks) === 1 ? "" : "s"}</h2>
            <div className="notice" style={{wordBreak: "break-all"}}>{String(url)}</div>
            <div className="actions" style={{marginTop: 12}}><button className="btn primary" onClick={() => copyText(String(name), String(url))}>{copied === name ? "✓ Copied" : "Copy Link"}</button><button className="btn secondary" onClick={() => nativeShare(String(name), String(url))}>Share</button><a className="btn secondary" href={String(url)} target="_blank" rel="noreferrer">Open</a></div>
          </article>)}
        </div>

        <div className="card" style={{marginTop: 18}}>
          <span className="badge">Recruiters • Employers • Sponsors • Partners</span>
          <h2>Share with Potential Recruiters & Partners</h2>
          <p>Use this invitation to reach organisations that may recruit trained learners, sponsor cohorts, support campus activation, provide internships, or form training and technology partnerships.</p>
          <div className="notice" style={{whiteSpace: "pre-wrap", wordBreak: "break-word"}}>{partnerMessage}</div>
          <div className="actions" style={{marginTop: 14}}>
            <button className="btn primary" onClick={() => nativeShare("Mabrig Recruiter & Partner Network", summary.partnerInviteLink, partnerMessage)}>Share Invitation</button>
            <button className="btn secondary" onClick={() => copyText("partner-message", partnerMessage)}>{copied === "partner-message" ? "✓ Message Copied" : "Copy Invitation"}</button>
            <a className="btn whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(partnerMessage)}`}>WhatsApp</a>
            <a className="btn secondary" target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(summary.partnerInviteLink)}`}>LinkedIn</a>
            <a className="btn secondary" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(summary.partnerInviteLink)}`}>Facebook</a>
            <a className="btn secondary" target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(partnerMessage)}`}>X</a>
            <a className="btn secondary" href={`mailto:?subject=${encodeURIComponent("Mabrig Recruiter & Partnership Opportunity")}&body=${encodeURIComponent(partnerMessage)}`}>Email</a>
          </div>
        </div>

        <div className="grid" style={{marginTop: 18}}>
          <article className="card"><span className="badge">Tracked Product Visits</span><h2 style={{fontSize: 38}}>{summary.performance.trackedProductClicks}</h2><p>Combined attributed visits across all three products.</p></article>
          <article className="card"><span className="badge">Verified Fintigen + DDEI Sales</span><h2 style={{fontSize: 38}}>{summary.performance.verifiedExternalPurchases}</h2><p>{summary.performance.purchasesByProduct.FINTIGEN} Fintigen • {summary.performance.purchasesByProduct.DDEI} DDEI</p></article>
          <article className="card"><span className="badge">Current Rate</span><h2 style={{fontSize: 38}}>{summary.promoter.currentCommissionRate}%</h2><p>Standard {summary.promoter.standardCommissionRate}% • Performance {summary.promoter.performanceCommissionRate}%</p></article>
          <article className="card"><span className="badge">Accrued Commission</span><h2 style={{fontSize: 34}}>{money(summary.commissions.accruedUnpaid)}</h2><p>Verified eligible commission not yet recorded as paid.</p></article>
          <article className="card"><span className="badge">Paid Commission</span><h2 style={{fontSize: 34}}>{money(summary.commissions.totalRecordedPaid)}</h2><p>Total commission payouts recorded by admin.</p></article>
          <article className="card"><span className="badge">Performance Target</span><h2 style={{fontSize: 38}}>{summary.performance.previousMonthEligibleReferrals}/{summary.performance.threshold}</h2><p>Eligible completed sales across connected products.</p></article>
        </div>

        <div className="card" style={{marginTop: 18}}><h2>Verified Fintigen & DDEI Purchases</h2>
          {summary.recentExternalPurchases.length === 0 ? <p>No verified paid purchase from Fintigen or DDEI has been attributed yet.</p> : summary.recentExternalPurchases.map(item => <div className="notice" style={{marginTop: 10}} key={`${item.product}-${item.externalReference}`}><strong>{item.product} • {item.label}</strong><br />Sale: {money(item.value)} • Commission: {money(item.commissionAmount)} • {label(item.payoutStatus)}<br /><small>{item.externalReference} • {new Date(item.paidAt).toLocaleString()}</small></div>)}
        </div>

        <div className="card" style={{marginTop: 18}}><h2>Recent Academic Assistance Referrals</h2>
          {summary.recentReferrals.length === 0 ? <p>No Academic Assistance orders have been attributed yet.</p> : <div style={{overflowX: "auto"}}><table style={{width: "100%", borderCollapse: "collapse"}}><thead><tr><th style={{textAlign: "left", padding: 10}}>Order</th><th style={{textAlign: "left", padding: 10}}>Status</th><th style={{textAlign: "left", padding: 10}}>Payment</th><th style={{textAlign: "left", padding: 10}}>Commission</th><th style={{textAlign: "left", padding: 10}}>Payout</th></tr></thead><tbody>{summary.recentReferrals.map(referral => <tr key={referral.orderNumber}><td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{referral.orderNumber}</td><td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.orderStatus)}</td><td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.paymentStatus)}</td><td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{referral.eligible ? money(referral.commissionAmount) : "Pending"}</td><td style={{padding: 10, borderTop: "1px solid #e5e7eb"}}>{label(referral.payoutStatus)}</td></tr>)}</tbody></table></div>}
        </div>

        <div className="card" style={{marginTop: 18}}><h2>Payout History</h2>{summary.recentPayouts.length === 0 ? <p>No commission payout has been recorded yet.</p> : summary.recentPayouts.map(payout => <div className="notice" style={{marginTop: 10}} key={payout.payoutNumber}><strong>{money(payout.amount)}</strong> • {payout.orderCount} academic order{payout.orderCount === 1 ? "" : "s"} • {payout.externalPurchaseCount || 0} external purchase{payout.externalPurchaseCount === 1 ? "" : "s"}<br />{payout.payoutNumber} • {new Date(payout.paidAt).toLocaleString()}</div>)}</div>

        <div className="notice" style={{marginTop: 18}}><strong>Commission safety:</strong> clicks and registrations are tracking signals, not payable sales. Academic Assistance requires a verified paid and fulfilled order. Fintigen and DDEI commissions enter the ledger only after their servers verify a successful NGN payment.</div>
      </div></section>}
    </main>
  </>;
}
