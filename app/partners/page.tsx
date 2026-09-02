"use client";

import { useMemo, useState } from "react";

export default function PartnersPage() {
  const [code, setCode] = useState("MABRIG001");
  const [copied, setCopied] = useState("");

  const cleanCode = useMemo(() => code.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "MABRIG001", [code]);
  const links = useMemo(() => [
    { name: "Academic Assistance", url: `https://academic.mabrigkorie.org/?ref=${encodeURIComponent(cleanCode)}` },
    { name: "Fintigen", url: `https://www.fintigen.com/?ref=${encodeURIComponent(cleanCode)}` },
    { name: "DDEI", url: `https://ddei.online/?ref=${encodeURIComponent(cleanCode)}` },
  ], [cleanCode]);

  async function copyLink(name: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(name);
    setTimeout(() => setCopied(""), 1800);
  }

  async function shareLink(name: string, url: string) {
    if (navigator.share) {
      await navigator.share({ title: name, text: `Use my ${name} referral link:`, url });
    } else {
      await copyLink(name, url);
    }
  }

  return <main className="section"><div className="container" style={{maxWidth:980}}>
    <div className="actions">
      <a className="btn secondary" href="/">← Academic Assistance</a>
      <a className="btn primary" href="/promoter">My Promoter Dashboard</a>
      <a className="btn secondary" href="/promoter/promotions">Promotion Pay</a>
      <a className="btn secondary" href="/recruitment">Recruitment</a>
    </div>

    <div className="notice" style={{marginTop:18}}>
      <strong>Not yet an approved promoter?</strong> Our first intake is open to UNN students. <a href="/recruitment"><strong>Register for the multi-product promoter network →</strong></a>
    </div>

    <div className="card" style={{marginTop:18}}>
      <span className="badge">Mabrig Multi-Product Promoter Network</span>
      <h1 style={{fontSize:"clamp(34px,6vw,58px)"}}>Create Your 3 Referral Links</h1>
      <p className="lead">Enter the official referral code assigned after approval. The same code generates separate links for Academic Assistance, Fintigen and DDEI.</p>

      <label className="field" style={{marginTop:20}}><span>Your Assigned Promoter Code</span><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. UNN-ABC12345" autoCapitalize="characters" /></label>

      <div className="grid" style={{marginTop:20}}>
        {links.map(link => <article className="card" key={link.name}>
          <span className="badge">{link.name}</span>
          <div className="notice" style={{marginTop:12,wordBreak:"break-all"}}><a href={link.url} style={{color:"var(--green)",fontWeight:700}}>{link.url}</a></div>
          <div className="actions" style={{marginTop:12}}>
            <button className="btn primary" onClick={() => copyLink(link.name, link.url)}>{copied === link.name ? "✓ Copied" : "Copy Link"}</button>
            <button className="btn secondary" onClick={() => shareLink(link.name, link.url)}>Share</button>
            <a className="btn secondary" href={link.url} target="_blank" rel="noreferrer">Open</a>
          </div>
        </article>)}
      </div>

      <div className="card" style={{marginTop:24,background:"#f5f8f6"}}>
        <h3>Two Ways You Can Be Paid</h3>
        <p><strong>1. Promotion pay:</strong> complete approved promotional work, submit proof, and receive the amount approved for that activity.</p>
        <p><strong>2. Referral conversion commission:</strong> earn commission when your official referral link produces an eligible verified paid sale.</p>
        <p><strong>3.</strong> The two earnings are separate. One promotion can earn both when the promotional work is approved and it also generates an eligible sale.</p>
        <p><strong>4.</strong> Academic Assistance, Fintigen and DDEI preserve promoter attribution across the connected conversion flows.</p>
        <p style={{marginBottom:0}}><strong>5.</strong> Use the Promotion Pay Center for proof submissions and the Promoter Dashboard for conversion commission and overall performance.</p>
      </div>

      <div className="actions" style={{marginTop:16}}>
        <a className="btn primary" href="/promoter/promotions">Submit Promotion Proof</a>
        <a className="btn secondary" href="/promoter">View Conversion Commission</a>
      </div>

      <div className="notice" style={{marginTop:16}}>
        <strong>Important:</strong> a click is not referral commission, and a post is not automatically promotion pay. Promotion pay requires approved proof; conversion commission requires an eligible verified paid transaction.
      </div>
    </div>
  </div></main>;
}
