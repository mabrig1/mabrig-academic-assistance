"use client";

import { FormEvent, useState } from "react";

const levels = ["100", "200", "300", "400", "500", "600", "Postgraduate"];

export default function RecruitmentPage() {
  const [message, setMessage] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("Submitting your registration...");
    setApplicationNumber("");

    try {
      const response = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          whatsapp: data.get("whatsapp"),
          department: data.get("department"),
          level: data.get("level"),
          agreedToTerms: data.get("agreedToTerms") === "on",
        }),
      });
      const result = await response.json();
      setSubmitting(false);

      if (!response.ok) {
        setMessage(result.error || "Unable to submit your registration.");
        return;
      }

      setApplicationNumber(result.applicationNumber || "");
      setMessage(result.message || "Registration received.");
      if (!result.existing) form.reset();
    } catch {
      setSubmitting(false);
      setMessage("Unable to submit right now. Please check your connection and try again.");
    }
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG ICT</div>
      <div className="actions">
        <a className="btn secondary" href="/">Academic Assistance</a>
        <a className="btn secondary" href="/partners">Partner Referrals</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 980}}>
          <span className="badge">First Intake • UNN Students</span>
          <h1>Earn While You Learn</h1>
          <p className="lead">Join the Mabrig Academic Assistance Student Marketer & Campus Promoter Programme. Help fellow students discover useful academic and document services, share your official referral link, and earn commission from eligible completed orders.</p>
          <div className="actions">
            <a className="btn primary" href="#register">Register in under 2 minutes</a>
            <a className="btn secondary" href="https://academic.mabrigkorie.org/">View the product</a>
          </div>
          <p style={{marginTop: 14}}><strong>No registration fee. No CV. No long application form.</strong></p>
        </div>
      </section>

      <section className="section container" style={{maxWidth: 980}}>
        <div className="grid">
          <article className="card">
            <span className="badge">Standard Commission</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>15%</h2>
            <p>Earn 15% of the eligible net service value on each referred order that is confirmed, paid and completed using your assigned referral code.</p>
          </article>
          <article className="card">
            <span className="badge">Performance Level</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>20%</h2>
            <p>Complete 10 or more eligible referral orders in a calendar month and qualify for the 20% performance commission level for the following month.</p>
          </article>
          <article className="card">
            <span className="badge">Payout</span>
            <h2 style={{fontSize: 30, marginBottom: 8}}>Weekly Review</h2>
            <p>Cleared commissions are reviewed for payout after the customer has paid and the eligible order has been completed.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth: 980}}>
          <div className="grid">
            <article className="card">
              <h2>Who we are recruiting first</h2>
              <p>Our first intake is for currently enrolled students of the <strong>University of Nigeria (UNN)</strong> who can promote responsibly through real student networks.</p>
              <p><strong>You are a good fit if you:</strong></p>
              <p>• Use WhatsApp and social media confidently.<br />• Know students in your department, faculty, hostel or campus community.<br />• Can explain services clearly without false promises.<br />• Want a flexible, commission-based campus opportunity.</p>
            </article>

            <article className="card">
              <h2>What you will promote</h2>
              <p>Mabrig Academic Assistance helps students with academic document formatting, article rewriting and humanizing, project and thesis formatting, research support, printing, binding and campus delivery.</p>
              <a className="btn primary" href="https://academic.mabrigkorie.org/">Explore Academic Assistance</a>
            </article>

            <article className="card">
              <h2>How the programme works</h2>
              <p><strong>1.</strong> Register with the short form below.</p>
              <p><strong>2.</strong> Approved promoters receive an official referral code.</p>
              <p><strong>3.</strong> Turn the code into your personal link on the Partner Referrals page.</p>
              <p><strong>4.</strong> Share the link with interested students and clients.</p>
              <p><strong>5.</strong> Eligible paid and completed orders are attributed to your code for commission.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="register" className="section">
        <div className="container" style={{maxWidth: 760}}>
          <div className="card">
            <span className="badge">UNN Student Promoter Registration</span>
            <h2>Simple Registration</h2>
            <p>Only the essentials. We do not need a CV or long personal statement for this first intake.</p>

            <form onSubmit={submit} style={{marginTop: 20}}>
              <div className="form-grid">
                <label className="field full">
                  <span>Full name</span>
                  <input name="name" required maxLength={120} placeholder="Your full name" autoComplete="name" />
                </label>

                <label className="field full">
                  <span>WhatsApp number</span>
                  <input name="whatsapp" required inputMode="tel" maxLength={40} placeholder="e.g. 08012345678" autoComplete="tel" />
                </label>

                <label className="field">
                  <span>Department</span>
                  <input name="department" required maxLength={160} placeholder="e.g. Public Administration" />
                </label>

                <label className="field">
                  <span>Level</span>
                  <select name="level" required defaultValue="">
                    <option value="" disabled>Select level</option>
                    {levels.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </label>

                <label className="field full" style={{display: "flex", gap: 10, alignItems: "flex-start"}}>
                  <input name="agreedToTerms" type="checkbox" required style={{width: 18, height: 18, marginTop: 3}} />
                  <span>I confirm that I am a UNN student and I agree to promote the service honestly under the commission programme terms below.</span>
                </label>
              </div>

              <button className="btn primary" type="submit" disabled={submitting} style={{marginTop: 16}}>
                {submitting ? "Submitting..." : "Register as a UNN Promoter"}
              </button>

              {message && <div className="notice" style={{marginTop: 16}} aria-live="polite">
                <strong>{applicationNumber ? `Application ${applicationNumber}` : "Registration"}</strong><br />
                {message}
              </div>}
            </form>
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h3>Commission Programme Terms — Simple Version</h3>
            <p>There is no application or registration fee. This is a commission-based promoter opportunity, not a salaried employment offer and earnings are not guaranteed.</p>
            <p>Commission applies only to eligible orders properly attributed to your assigned referral code, successfully paid for, and completed. Cancelled, refunded, fraudulent, duplicate or self-referral orders do not qualify.</p>
            <p>The standard commission rate is 15% of eligible net service value. Promoters who complete at least 10 eligible referral orders in a calendar month qualify for the 20% performance rate for the following month.</p>
            <p>Promoters must not spam, misrepresent prices or services, promise grades or academic outcomes, impersonate staff, or encourage academic misconduct. The programme may suspend promoters who misuse the brand or referral system.</p>
          </div>
        </div>
      </section>
    </main>

    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance • UNN Student Promoter Programme</div></footer>
  </>;
}
