"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const interests = [
  ["RECRUIT_TALENT", "Recruit trained talent"],
  ["INTERNSHIPS", "Offer internships / entry roles"],
  ["SPONSORSHIP", "Sponsor learners or a cohort"],
  ["CAMPUS_PARTNERSHIP", "Campus / institution partnership"],
  ["TRAINING_PARTNERSHIP", "Training / curriculum partnership"],
  ["TECH_PARTNERSHIP", "Technology / platform partnership"],
  ["OTHER", "Other collaboration"],
];

function cleanCode(value: string | null) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 64);
}

export default function RecruitersPartnersPage() {
  const [referralCode, setReferralCode] = useState("");
  const [message, setMessage] = useState("");
  const [leadNumber, setLeadNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const shareUrl = useMemo(() => `https://academic.mabrigkorie.org/recruiters-partners${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`, [referralCode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferralCode(cleanCode(params.get("ref")));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("Submitting your interest...");
    setLeadNumber("");
    try {
      const response = await fetch("/api/partnership-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: data.get("contactName"),
          organisation: data.get("organisation"),
          email: data.get("email"),
          whatsapp: data.get("whatsapp"),
          interestType: data.get("interestType"),
          message: data.get("message"),
          referralCode,
        }),
      });
      const result = await response.json();
      setSubmitting(false);
      if (!response.ok) { setMessage(result.error || "Unable to submit your interest."); return; }
      setLeadNumber(result.leadNumber || "");
      setMessage(result.message || "Your interest has been received.");
      form.reset();
    } catch {
      setSubmitting(false);
      setMessage("Unable to submit right now. Please try again.");
    }
  }

  async function share() {
    const text = "Mabrig connects academic services, practical digital-skills training and emerging talent. Recruit talent, sponsor learners, offer internships, or explore campus, training and technology partnerships.";
    if (navigator.share) {
      await navigator.share({ title: "Recruit Talent or Partner With Mabrig", text, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setMessage("Partnership invitation copied.");
    }
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG ICT</div>
      <div className="actions">
        <a className="btn secondary" href="/">Academic Assistance</a>
        <a className="btn secondary" href="https://www.fintigen.com/" target="_blank" rel="noreferrer">Fintigen</a>
        <a className="btn secondary" href="https://ddei.online/" target="_blank" rel="noreferrer">DDEI</a>
      </div>
    </header>

    <main>
      <section className="hero"><div className="container" style={{maxWidth: 1000}}>
        <span className="badge">Recruiters • Employers • Sponsors • Institutions • Technology Partners</span>
        <h1>Recruit Talent. Sponsor Skills. Partner With Mabrig.</h1>
        <p className="lead">Connect with a growing ecosystem serving students, learners and emerging digital talent through Academic Assistance, Fintigen Academy and DDEI / Destiny Skills Bridge.</p>
        <div className="actions"><a className="btn primary" href="#partner-form">Express Interest</a><button className="btn secondary" onClick={share}>Share This Opportunity</button></div>
      </div></section>

      <section className="section"><div className="container" style={{maxWidth: 1100}}>
        <div className="grid">
          <article className="card"><span className="badge">Academic Assistance</span><h2>Academic & Research Services</h2><p>Document formatting, research assistance, printing and academic workflow support for students and researchers.</p><a className="btn secondary" href={`https://academic.mabrigkorie.org/${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`} target="_blank" rel="noreferrer">Explore Product</a></article>
          <article className="card"><span className="badge">Fintigen</span><h2>Digital Skills & Founder Training</h2><p>Practical digital-skills education, full-stack development, entrepreneurship and career-building programmes.</p><a className="btn secondary" href={`https://www.fintigen.com/${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`} target="_blank" rel="noreferrer">Explore Fintigen</a></article>
          <article className="card"><span className="badge">DDEI</span><h2>Destiny Skills Bridge</h2><p>Accessible digital training, certificates, premium learning and employability pathways for emerging African talent.</p><a className="btn secondary" href={`https://ddei.online/${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""}`} target="_blank" rel="noreferrer">Explore DDEI</a></article>
        </div>
      </div></section>

      <section className="section"><div className="container" style={{maxWidth: 1050}}>
        <h2>Ways to Work With Us</h2>
        <div className="grid" style={{marginTop: 18}}>
          <article className="card"><h3>Recruit & Hire</h3><p>Discover trained learners for internships, entry roles, project work, campus ambassador programmes and junior digital positions.</p></article>
          <article className="card"><h3>Sponsor Talent</h3><p>Support individual learners or cohorts with training access, certification, project opportunities and employability pathways.</p></article>
          <article className="card"><h3>Campus Partnerships</h3><p>Collaborate with departments, faculties, student groups, institutions and communities on digital-skills and academic-support programmes.</p></article>
          <article className="card"><h3>Training Partnerships</h3><p>Co-deliver practical courses, workshops, boot camps and workforce-development programmes.</p></article>
          <article className="card"><h3>Technology Partnerships</h3><p>Integrate tools, cloud services, APIs, infrastructure, mentorship or technical programmes into the Mabrig ecosystem.</p></article>
          <article className="card"><h3>Distribution & Promotion</h3><p>Work with the campus promoter network to bring suitable products, opportunities and educational programmes to student communities.</p></article>
        </div>
      </div></section>

      <section id="partner-form" className="section"><div className="container" style={{maxWidth: 760}}>
        <div className="card">
          <span className="badge">Organisation Interest Form</span><h2>Start a Conversation</h2><p>Keep it simple. Tell us who you are and the kind of collaboration you want.</p>
          {referralCode && <div className="notice" style={{marginTop: 14}}>Introduced through promoter code <strong>{referralCode}</strong>.</div>}
          <form onSubmit={submit} style={{marginTop: 20}}><div className="form-grid">
            <label className="field"><span>Contact name</span><input name="contactName" required maxLength={120} /></label>
            <label className="field"><span>Organisation / company</span><input name="organisation" required maxLength={180} /></label>
            <label className="field"><span>Email</span><input name="email" type="email" maxLength={180} /></label>
            <label className="field"><span>WhatsApp / phone</span><input name="whatsapp" inputMode="tel" maxLength={40} /></label>
            <label className="field full"><span>What are you interested in?</span><select name="interestType" required defaultValue=""><option value="" disabled>Select one</option>{interests.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            <label className="field full"><span>Short message (optional)</span><textarea name="message" rows={5} maxLength={1800} placeholder="Tell us what you want to recruit, sponsor, build or partner on." /></label>
          </div><button className="btn primary" type="submit" disabled={submitting} style={{marginTop: 16}}>{submitting ? "Submitting..." : "Submit Partnership Interest"}</button></form>
          {message && <div className="notice" style={{marginTop: 16}}><strong>{leadNumber ? `Reference ${leadNumber}` : "Partnership enquiry"}</strong><br />{message}</div>}
        </div>
      </div></section>
    </main>

    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT • Recruiters & Partnership Network</div></footer>
  </>;
}
