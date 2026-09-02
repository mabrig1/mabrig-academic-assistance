"use client";

import { useMemo, useState } from "react";

const SITE_URL = "https://academic.mabrigkorie.org";

export default function PartnersPage() {
  const [code, setCode] = useState("MABRIG001");
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const clean = code.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "MABRIG001";
    return `${SITE_URL}/?ref=${encodeURIComponent(clean)}`;
  }, [code]);

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: "Mabrig Academic Assistance", text: "Use my Mabrig Academic Assistance referral link:", url: referralLink });
    } else {
      await copyLink();
    }
  }

  return <main className="section"><div className="container" style={{maxWidth:800}}>
    <a className="btn secondary" href="/">← Back to Academic Assistance</a>

    <div className="notice" style={{marginTop:18}}>
      <strong>Not yet an approved promoter?</strong> Our first intake is open to UNN students. <a href="/recruitment"><strong>See the commission programme and register here →</strong></a>
    </div>

    <div className="card" style={{marginTop:18}}>
      <span className="badge">Mabrig Academic Partners Network</span>
      <h1 style={{fontSize:"clamp(34px,6vw,58px)"}}>Create Your Referral Link</h1>
      <p className="lead">Approved promoters can enter the official referral code assigned by Mabrig Academic Assistance. When an eligible customer opens the link and places an order, the referral code is carried into the order for attribution.</p>

      <label className="field" style={{marginTop:20}}><span>Your Assigned Partner / Referral Code</span><input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. UNN-ABC12345" autoCapitalize="characters" /></label>

      <div className="notice" style={{marginTop:16,wordBreak:"break-all"}}>
        <strong>Your referral link</strong><br />
        <a href={referralLink} style={{color:"var(--green)",fontWeight:700}}>{referralLink}</a>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={copyLink}>{copied ? "✓ Link Copied" : "Copy Referral Link"}</button>
        <button className="btn secondary" onClick={shareLink}>Share Link</button>
        <a className="btn secondary" href={referralLink}>Open Link</a>
      </div>

      <div className="card" style={{marginTop:24,background:"#f5f8f6"}}>
        <h3>How it works</h3>
        <p><strong>1.</strong> Register for the promoter programme and wait for approval.</p>
        <p><strong>2.</strong> Use only the official referral code assigned to you.</p>
        <p><strong>3.</strong> Give your referral link to an interested student or client.</p>
        <p><strong>4.</strong> The student opens the link and the referral code is remembered during the session.</p>
        <p><strong>5.</strong> Eligible paid and completed orders are attributed to your code for commission.</p>
      </div>

      <div className="notice" style={{marginTop:16}}>
        <strong>Important:</strong> Do not invent referral codes, impersonate another partner, misrepresent services, or make misleading commission claims. Commission applies only under the approved partner programme terms.
      </div>
    </div>
  </div></main>;
}
