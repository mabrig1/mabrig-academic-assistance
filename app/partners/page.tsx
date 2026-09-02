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
        <h3>How the network works</h3>
        <p><strong>1.</strong> Register once and wait for approval.</p>
        <p><strong>2.</strong> Use only your official assigned promoter code.</p>
        <p><strong>3.</strong> Match the right product to the right audience: academic support, career/digital training, or beginner skills training.</p>
        <p><strong>4.</strong> Fintigen and DDEI now preserve and report promoter-code visits back to the shared dashboard.</p>
        <p><strong>5.</strong> Academic Assistance currently has paid-order commission settlement connected; other products become payable when their commercial checkout conversion is connected.</p>
        <p style={{marginBottom:0}}><strong>6.</strong> Use the Promoter Dashboard to monitor tracked visits, eligible orders, accrued commission and payouts.</p>
      </div>

      <div className="notice" style={{marginTop:16}}>
        <strong>Important:</strong> A visit or click is attribution evidence, not automatically a commission. Commission is earned only from eligible commissionable paid transactions under the programme rules.
      </div>
    </div>
  </div></main>;
}
