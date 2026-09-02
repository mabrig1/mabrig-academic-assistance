"use client";

import { FormEvent, useState } from "react";

type Promotion = {
  submissionNumber: string;
  product: string;
  channel: string;
  proofUrl: string;
  status: string;
  approvedAmount: number;
  createdAt: string;
  paidAt?: string | null;
  adminNote?: string | null;
};

type Summary = {
  promoter: { name: string; referralCode: string };
  promotionPay: { submissions: number; awaitingReview: number; approvedUnpaid: number; totalPaid: number; currency: string };
  commissions: { accruedUnpaid: number; totalRecordedPaid: number; currency: string };
  recentPromotions: Promotion[];
};

function money(value: number) { return `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function label(value: string) { return String(value || "").replaceAll("_", " "); }

export default function PromotionPayPage() {
  const [referralCode, setReferralCode] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadDashboard(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setMessage("Loading your earnings...");
    const response = await fetch("/api/promoter/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode, whatsapp }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) { setSummary(null); setMessage(data.error || "Unable to load your account."); return; }
    setSummary(data);
    setMessage("");
  }

  async function submitPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    setMessage("Submitting promotion proof...");
    const response = await fetch("/api/promoter/promotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode,
        whatsapp,
        product: data.get("product"),
        channel: data.get("channel"),
        proofUrl: data.get("proofUrl"),
        note: data.get("note"),
      }),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? `${result.message} Submission: ${result.submissionNumber}` : (result.error || "Unable to submit proof."));
    if (response.ok) { form.reset(); await loadDashboard(); }
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG PROMOTER</div>
      <div className="actions">
        <a className="btn secondary" href="/promoter">Main Dashboard</a>
        <a className="btn secondary" href="/partners">Referral Links</a>
        <a className="btn secondary" href="/recruitment">Programme Terms</a>
      </div>
    </header>

    <main>
      <section className="hero"><div className="container" style={{maxWidth: 950}}>
        <span className="badge">Two Ways to Earn</span>
        <h1>Promotion Pay + Referral Conversion Commission</h1>
        <p className="lead">You can earn for approved promotional work and also earn commission when your referral code produces a verified eligible sale. These are separate earnings and can both be paid.</p>
      </div></section>

      <section className="section"><div className="container" style={{maxWidth: 850}}><div className="card">
        <h2>Open My Promotion Pay Center</h2>
        <form onSubmit={loadDashboard}><div className="form-grid">
          <label className="field"><span>Official referral code</span><input required value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} placeholder="UNN-ABC12345" /></label>
          <label className="field"><span>Registered WhatsApp</span><input required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="080..." /></label>
        </div><button className="btn primary" disabled={loading} style={{marginTop: 16}}>{loading ? "Checking..." : "View My Earnings"}</button></form>
        {message && <div className="notice" style={{marginTop: 16}}>{message}</div>}
      </div></div></section>

      {summary && <section className="section" style={{paddingTop: 0}}><div className="container" style={{maxWidth: 1050}}>
        <div className="grid">
          <article className="card"><span className="badge">Promotion Pay — Approved</span><h2>{money(summary.promotionPay.approvedUnpaid)}</h2><p>Approved promotional work awaiting recorded payment.</p></article>
          <article className="card"><span className="badge">Promotion Pay — Paid</span><h2>{money(summary.promotionPay.totalPaid)}</h2><p>Total promotional activity payments recorded.</p></article>
          <article className="card"><span className="badge">Conversion Commission — Accrued</span><h2>{money(summary.commissions.accruedUnpaid)}</h2><p>Eligible referral-conversion commission awaiting payout.</p></article>
          <article className="card"><span className="badge">Conversion Commission — Paid</span><h2>{money(summary.commissions.totalRecordedPaid)}</h2><p>Total referral-conversion commission recorded as paid.</p></article>
        </div>

        <div className="card" style={{marginTop: 18}}>
          <span className="badge">Submit Promotion Proof</span>
          <h2>Get Paid for Approved Promotion</h2>
          <p>Submit a public link showing the promotion you completed. Admin verifies the activity and sets the payable amount. A post is not automatically payable until approved.</p>
          <form onSubmit={submitPromotion} style={{marginTop: 18}}><div className="form-grid">
            <label className="field"><span>Product promoted</span><select name="product" required defaultValue=""><option value="" disabled>Select product</option><option value="ACADEMIC">Academic Assistance</option><option value="FINTIGEN">Fintigen</option><option value="DDEI">DDEI</option><option value="NETWORK">Recruiter / Partner Network</option></select></label>
            <label className="field"><span>Promotion channel</span><select name="channel" required defaultValue=""><option value="" disabled>Select channel</option><option value="WHATSAPP">WhatsApp</option><option value="FACEBOOK">Facebook</option><option value="INSTAGRAM">Instagram</option><option value="TIKTOK">TikTok</option><option value="X">X</option><option value="LINKEDIN">LinkedIn</option><option value="CAMPUS">Campus activation</option><option value="EVENT">Event</option><option value="OTHER">Other</option></select></label>
            <label className="field full"><span>Public proof link / post URL</span><input name="proofUrl" required type="url" placeholder="https://..." /></label>
            <label className="field full"><span>Short note (optional)</span><textarea name="note" rows={3} maxLength={800} placeholder="What did you promote and where?" /></label>
          </div><button className="btn primary" disabled={loading} style={{marginTop: 16}}>Submit Promotion Proof</button></form>
        </div>

        <div className="card" style={{marginTop: 18}}><h2>My Promotion Submissions</h2>
          {summary.recentPromotions.length === 0 ? <p>No promotion proof submitted yet.</p> : summary.recentPromotions.map(item => <div className="notice" style={{marginTop: 10}} key={item.submissionNumber}>
            <strong>{item.product} • {item.channel} • {label(item.status)}</strong><br />
            {item.approvedAmount > 0 ? `Approved payment: ${money(item.approvedAmount)}` : "Payment amount pending review"}<br />
            <a href={item.proofUrl} target="_blank" rel="noreferrer">Open proof</a> • {item.submissionNumber} • {new Date(item.createdAt).toLocaleString()}
            {item.adminNote && <><br /><small>Admin: {item.adminNote}</small></>}
          </div>)}
        </div>

        <div className="notice" style={{marginTop: 18}}><strong>Two separate payment rules:</strong> promotion pay is for approved promotional activity with proof; referral conversion commission is earned from eligible verified paid sales attributed to your official referral code. One activity can lead to both types of earnings.</div>
      </div></section>}
    </main>
  </>;
}
