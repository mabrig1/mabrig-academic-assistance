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
        <a className="btn secondary" href="/partners">Referral Links</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 980}}>
          <span className="badge">First Intake • UNN Students</span>
          <h1>Earn While You Learn</h1>
          <p className="lead">Join the Mabrig Student Marketer & Campus Promoter Network. One approval and one official referral code gives you access to promote Academic Assistance, Fintigen and DDEI across your campus and online networks.</p>
          <div className="actions">
            <a className="btn primary" href="#register">Register in under 2 minutes</a>
            <a className="btn secondary" href="#products">See Products to Promote</a>
          </div>
          <p style={{marginTop: 14}}><strong>No registration fee. No CV. No long application form.</strong></p>
        </div>
      </section>

      <section className="section container" style={{maxWidth: 980}}>
        <div className="grid">
          <article className="card">
            <span className="badge">Standard Commission</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>15%</h2>
            <p>Earn 15% on eligible paid and fulfilled commissionable sales attributed to your official referral code.</p>
          </article>
          <article className="card">
            <span className="badge">Performance Level</span>
            <h2 style={{fontSize: 38, marginBottom: 8}}>20%</h2>
            <p>Reach 10 eligible completed commissionable referrals in a calendar month and qualify for the 20% performance rate for the following month.</p>
          </article>
          <article className="card">
            <span className="badge">One Promoter Code</span>
            <h2 style={{fontSize: 30, marginBottom: 8}}>3 Products</h2>
            <p>Use the same official code across Academic Assistance, Fintigen and DDEI. Product visits are tracked separately in your promoter dashboard.</p>
          </article>
        </div>
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
              <h2>How the programme works</h2>
              <p><strong>1.</strong> Register once with the short form below.</p>
              <p><strong>2.</strong> Approved promoters receive one official referral code.</p>
              <p><strong>3.</strong> Your dashboard generates separate links for Academic Assistance, Fintigen and DDEI.</p>
              <p><strong>4.</strong> Product visits are attributed to your code.</p>
              <p><strong>5.</strong> Commission is paid only on products whose eligible paid conversion is connected to the commission engine.</p>
            </article>

            <article className="card">
              <h2>Transparent rollout</h2>
              <p><strong>Academic Assistance:</strong> order/payment commission attribution is already connected.</p>
              <p><strong>Fintigen & DDEI:</strong> promoter-code and visit attribution are being integrated now. Their purchase/enrolment conversion events will be connected to the same payout engine as each commercial checkout is enabled.</p>
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
                  <span>I confirm that I am a UNN student and I agree to promote Mabrig products honestly under the commission programme terms below.</span>
                </label>
              </div>

              <button className="btn primary" type="submit" disabled={submitting} style={{marginTop: 16}}>{submitting ? "Submitting..." : "Register as a UNN Promoter"}</button>

              {message && <div className="notice" style={{marginTop: 16}} aria-live="polite"><strong>{applicationNumber ? `Application ${applicationNumber}` : "Registration"}</strong><br />{message}</div>}
            </form>
          </div>

          <div className="card" style={{marginTop: 18}}>
            <h3>Commission Programme Terms — Simple Version</h3>
            <p>There is no application or registration fee. This is a commission-based promoter opportunity, not salaried employment, and earnings are not guaranteed.</p>
            <p>Commission applies only where a product has an active commissionable transaction flow and the sale is correctly attributed to your official code, successfully paid, and fulfilled. A tracked click or visit by itself is not a payable sale.</p>
            <p>The standard rate is 15% on eligible commissionable sales. Promoters who reach the stated performance threshold qualify for the 20% performance rate under the programme rules.</p>
            <p>Promoters must not spam, misrepresent prices or services, promise grades or guaranteed jobs/income, impersonate staff, or encourage academic misconduct.</p>
          </div>
        </div>
      </section>
    </main>

    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT • Multi-Product Student Promoter Network</div></footer>
  </>;
}
