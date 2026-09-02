"use client";

import { useEffect, useState } from "react";

type Promotion = {
  _id: string;
  submissionNumber: string;
  applicationNumber: string;
  referralCode: string;
  product: string;
  channel: string;
  proofUrl: string;
  note?: string | null;
  status: string;
  approvedAmount: number;
  currency: string;
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  paidAt?: string | null;
};

function money(value: number) { return `₦${Number(value || 0).toLocaleString()}`; }
function label(value: string) { return String(value || "").replaceAll("_", " "); }

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [message, setMessage] = useState("Loading promotion submissions...");

  async function load() {
    const response = await fetch("/api/admin/promotions", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Unable to load submissions."); return; }
    setItems(data.submissions || []);
    setMessage("");
  }

  useEffect(() => { void load(); }, []);

  async function update(item: Promotion, status: string) {
    const amountRaw = status === "APPROVED" || status === "PAID"
      ? window.prompt("Promotion payment amount in NGN", String(item.approvedAmount || ""))
      : "0";
    if (amountRaw === null) return;
    const approvedAmount = Number(amountRaw || 0);
    const adminNote = window.prompt("Admin note (optional)", item.adminNote || "") ?? item.adminNote ?? "";
    setMessage(`Updating ${item.submissionNumber}...`);
    const response = await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionNumber: item.submissionNumber, status, approvedAmount, adminNote }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Promotion payment status updated." : (data.error || "Unable to update."));
    if (response.ok) await load();
  }

  const pending = items.filter(item => item.status === "SUBMITTED").length;
  const approved = items.filter(item => item.status === "APPROVED").length;
  const paidTotal = items.filter(item => item.status === "PAID").reduce((sum, item) => sum + Number(item.approvedAmount || 0), 0);

  return <main className="section"><div className="container" style={{maxWidth: 1150}}>
    <span className="badge">Promotion Pay</span>
    <h1>Paid Promotion Submissions</h1>
    <p className="lead">Review proof of promotional activity, approve a payment amount, reject invalid activity, and record payment separately from referral-conversion commission.</p>

    <div className="grid" style={{marginTop: 20}}>
      <article className="card"><span className="badge">Awaiting Review</span><h2>{pending}</h2></article>
      <article className="card"><span className="badge">Approved / Unpaid</span><h2>{approved}</h2></article>
      <article className="card"><span className="badge">Promotion Pay Recorded</span><h2>{money(paidTotal)}</h2></article>
    </div>

    {message && <div className="notice" style={{marginTop: 18}}>{message}</div>}

    <div style={{display: "grid", gap: 16, marginTop: 20}}>
      {items.map(item => <article className="card" key={item.submissionNumber}>
        <div className="actions" style={{justifyContent: "space-between"}}>
          <div><span className="badge">{label(item.status)}</span><h2 style={{marginBottom: 4}}>{item.product} • {item.channel}</h2><p>{item.submissionNumber} • {item.referralCode}</p></div>
          <div><strong>{item.approvedAmount > 0 ? money(item.approvedAmount) : "Amount not set"}</strong></div>
        </div>
        <p><strong>Submitted:</strong> {new Date(item.createdAt).toLocaleString()}</p>
        {item.note && <p><strong>Promoter note:</strong> {item.note}</p>}
        {item.adminNote && <p><strong>Admin note:</strong> {item.adminNote}</p>}
        <a className="btn secondary" href={item.proofUrl} target="_blank" rel="noreferrer">Open Promotion Proof</a>
        <div className="actions" style={{marginTop: 14}}>
          <button className="btn primary" onClick={() => update(item, "APPROVED")}>Approve & Set Amount</button>
          <button className="btn secondary" onClick={() => update(item, "PAID")}>Mark Promotion Paid</button>
          <button className="btn secondary" onClick={() => update(item, "REJECTED")}>Reject</button>
        </div>
      </article>)}
      {!items.length && !message && <div className="card"><p>No promotion proof submissions yet.</p></div>}
    </div>
  </div></main>;
}
