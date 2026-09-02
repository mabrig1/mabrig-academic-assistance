"use client";

import { FormEvent, useState } from "react";

const levels = ["100", "200", "300", "400", "500", "600", "Postgraduate"];

const products = [
  {
    name: "Mabrig Academic Assistance",
    url: "https://academic.mabrigkorie.org/",
    audience: "Students, researchers and academic clients",
    description: "Academic document formatting, rewriting and humanizing, project and thesis support, printing, binding and campus delivery.",
  },
  {
    name: "Fintigen",
    url: "https://www.fintigen.com/",
    audience: "Students, graduates and aspiring digital professionals",
    description: "Digital skills, technology training, career development, business operations and practical future-skills learning.",
  },
  {
    name: "DDEI / Destiny Skills Bridge",
    url: "https://ddei.online/",
    audience: "Youth seeking practical digital skills and opportunities",
    description: "Beginner-friendly digital skills training, project learning, progress tracking and pathways toward freelance, remote-work and entrepreneurial opportunities.",
  },
];

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
        <a className="btn secondary" href="/promoter">Promoter Dashboard</a>
        <a className="btn secondary" href="/promoter/promotions">Promotion Pay</a>
        <a className="btn secondary" href="/partners">Referral Links</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 980}}>
          <span className="badge">First Intake • UNN Students</span>
          <h1>Earn While You Learn</h1>
          <p className="lead">Join the Mabrig Student Marketer & Campus Promoter Network. You can earn in two separate ways: payment for approved promotional work and referral commission when your official code produces eligible verified sales.</p>
          <div className="actions">
            <a className="btn primary" href="#register">Register in under 2 minutes</a>
            <a className="btn secondary" href="#earnings">See How You Earn</a>
          </div>
          <p style={{marginTop: 14}}><strong>No registration fee. No CV. No long application form.</strong></p>
        </div>
      </section>

      <section id="earnings" className="section container" style={{maxWidth: 1050}}>
        <div className="grid">
          <article className="card">
            <span className="badge">Earning Stream 1</span>
            <h2>Paid Promotion</h2>
            <p>Complete approved promotional activities, submit a public proof link, and receive the payment amount approved for that activity. Promotion pay is separate from sales commission.</p>
            <a className="btn secondary" href="/promoter/promotions">Open Promotion Pay Center</a>
          </article>
          <article className="card">
            <span className="badge">Earning Stream 2</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>15% Referral Commission</h2>
            <p>Earn the standard 15% commission on eligible verified paid and fulfilled sales attributed to your official referral code.</p>
          </article>
          <article className="card">
            <span className="badge">Performance Level</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>20%</h2>
            <p>Reach 10 eligible completed commissionable referrals in a calendar month and qualify for the 20% performance rate for the following month.</p>
          </article>
        </div>
        <div className="notice" style={{marginTop: 18}}><strong>You can earn both:</strong> if you complete an approved promotion and that promotion also generates a verified eligible sale through your referral code, the promotion payment and the referral-conversion commission are recorded separately.</div>
      </section>

      <section id="products" className="section">
        <div className="container" style={{maxWidth: 1100}}>
          <span className="badge">Products You Can Promote</span>
          <h2 style={{fontSize: "clamp(30px,5vw,48px)"}}>One Student Network. Multiple Income Opportunities.</h2>
          <p className="lead">Promote the product that best matches the person you are speaking to instead of forcing one offer on everyone.</p>
          <div className="grid" style={{marginTop: 20}}>
            {products.map(product => <article className="card" key={product.name}>
              <h2>{product.name}</h2>
              <p><strong>Best audience:</strong> {product.audience}</p>
              <p>{product.description}</p>
              <a className="btn primary" href={product.url} target="_blank" rel="noreferrer">Explore Product</a>
            </article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth: 980}}>
          <div className="grid">
            <article className="card">
              <h2>Who we are recruiting first</h2>
              <p>Our first intake is for currently enrolled students of the <strong>University of Nigeria (UNN)</strong> who can promote responsibly through real student networks.</p>
              <p>Good promoters use WhatsApp and social media confidently, know students across departments, faculties and hostels, explain products clearly, and avoid spam or false promises.</p>
            </article>

            <article className="card">
              <h2>How paid promotion works</h2>
              <p><strong>1.</strong> Use your official promoter code and approved campaign materials.</p>
              <p><strong>2.</strong> Complete the promotional activity.</p>
              <p><strong>3.</strong> Submit a public proof link in your Promotion Pay Center.</p>
              <p><strong>4.</strong> Admin reviews the proof and assigns the payable amount.</p>
              <p><strong>5.</strong> Approved promotion payment is recorded separately from conversion commission.</p>
            </article>

            <article className="card">
              <h2>How referral commission works</h2>
              <p><strong>1.</strong> Share your unique product referral links.</p>
              <p><strong>2.</strong> Academic Assistance, Fintigen and DDEI preserve your promoter code.</p>
              <p><strong>3.</strong> Commission is credited only after an eligible paid conversion is verified by the connected transaction flow.</p>
              <p><strong>4.</strong> Clicks and registrations remain useful tracking signals but are not referral-conversion commission by themselves.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="register" className="section">
        <div className="container" style={{maxWidth: 760}}>
          <div className="card">
            <span className="badge">UNN Student Promoter Registration</span>
            <h2>Simple Registration</h2>
            <p>Register once for the Mabrig multi-product promoter network. We do not need a CV or long personal statement for this first intake.</p>

            <form onSubmit={submit} style={{marginTop: 20}}>
              <div className="form-grid">
                <label className="field full"><span>Full name</span><input name="name" required maxLength={120} placeholder="Your full name" autoComplete="name" /></label>
                <label className="field full"><span>WhatsApp number</span><input name="whatsapp" required inputMode="tel" maxLength={40} placeholder="e.g. 08012345678" autoComplete="tel" /></label>
                <label className="field"><span>Department</span><input name="department" required maxLength={160} placeholder="e.g. Public Administration" /></label>
                <label className="field"><span>Level</span><select name="level" required defaultValue=""><option value="" disabled>Select level</option>{levels.map(level => <option key={level} value={level}>{level}</option>)}</select></label>
                <label className="field full" style={{display: "flex", gap: 10, alignItems: "flex-start"}}>
                  <input name="agreedToTerms" type="checkbox" required style={{width: 18, height: 18, marginTop: 3}} />
                  <span>I confirm that I am a UNN student and I agree to promote Mabrig products honestly under the promotion-pay and referral-commission programme terms below.</span>
                </label>
              </div>

              <button className="btn primary" type="submit" disabled={submitting} style={{marginTop: 16}}>{submitting ? "Submitting..." : "Register as a UNN Promoter"}</button>

              {message && <div className="notice" style={{marginTop: 16}} aria-live="polite"><strong>{applicationNumber ? `Application ${applicationNumber}` : "Registration"}</strong><br />{message}</div>}
            </form>
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h3>Promoter Payment Terms — Simple Version</h3>
            <p>There is no application or registration fee. This is a promoter opportunity, not salaried employment, and earnings are not guaranteed.</p>
            <p><strong>Promotion pay:</strong> promotional activity must have valid proof and be approved by admin. The payment amount is assigned to the approved activity or campaign; simply posting content does not automatically create a payable claim.</p>
            <p><strong>Referral conversion commission:</strong> the standard rate is 15% on eligible commissionable sales, with a 20% performance rate when the stated threshold is achieved. The sale must be correctly attributed to your official code and verified by the connected payment/fulfilment flow.</p>
            <p>A promoter may receive both promotion pay and referral-conversion commission from the same promotional effort when each payment condition is independently satisfied.</p>
            <p>Promoters must not spam, misrepresent prices or services, promise grades or guaranteed jobs/income, impersonate staff, or encourage academic misconduct.</p>
          </div>
        </div>
      </section>
    </main>

    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT • Promotion Pay + Referral Commission Network</div></footer>
  </>;
}
