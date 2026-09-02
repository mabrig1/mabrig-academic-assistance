"use client";

export default function JoinMabrigPage() {
  const url = "https://academic.mabrigkorie.org/join";

  async function share() {
    const text = "Mabrig opportunities: earn through approved promotion work and referral conversions, or connect as a recruiter, employer, sponsor or institutional partner.";
    if (navigator.share) {
      await navigator.share({ title: "Mabrig Opportunities", text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    alert("Opportunity link copied.");
  }

  return <>
    <header className="container nav">
      <div className="brand">MABRIG OPPORTUNITIES</div>
      <div className="actions">
        <a className="btn secondary" href="/">Academic Assistance</a>
        <a className="btn secondary" href="https://www.fintigen.com/" target="_blank" rel="noreferrer">Fintigen</a>
        <a className="btn secondary" href="https://ddei.online/" target="_blank" rel="noreferrer">DDEI</a>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="container" style={{maxWidth: 980}}>
          <span className="badge">Students • Promoters • Recruiters • Employers • Sponsors • Partners</span>
          <h1>Earn, Recruit or Partner With the Mabrig Network</h1>
          <p className="lead">One public gateway to the Mabrig ecosystem: Academic Assistance, Fintigen and DDEI / Destiny Skills Bridge.</p>
          <div className="actions">
            <a className="btn primary" href="/recruitment">Become a Paid Promoter</a>
            <a className="btn secondary" href="/recruiters-partners">Recruit / Partner With Us</a>
            <button className="btn secondary" type="button" onClick={share}>Share Opportunity</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{maxWidth: 1050}}>
          <div className="grid">
            <article className="card">
              <span className="badge">For UNN Students & Promoters</span>
              <h2>Two Independent Ways to Earn</h2>
              <p><strong>1. Promotion Pay:</strong> complete approved promotional work, submit proof, and receive the amount approved for that campaign or activity.</p>
              <p><strong>2. Referral Conversion Commission:</strong> earn commission when your official referral code produces an eligible verified paid conversion.</p>
              <p>A qualifying campaign can earn both promotion pay and conversion commission.</p>
              <div className="actions">
                <a className="btn primary" href="/recruitment">Apply as a Promoter</a>
                <a className="btn secondary" href="/promoter/promotions">Promotion Pay Center</a>
              </div>
            </article>

            <article className="card">
              <span className="badge">For Recruiters & Organisations</span>
              <h2>Find Talent and Build Partnerships</h2>
              <p>Recruit emerging digital talent, offer internships, sponsor learners, partner on campus activations, co-deliver training, or integrate technology into the Mabrig ecosystem.</p>
              <p>The interest form is short and designed for employers, institutions, sponsors and technology partners.</p>
              <div className="actions">
                <a className="btn primary" href="/recruiters-partners">Recruit / Partner With Mabrig</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop: 0}}>
        <div className="container" style={{maxWidth: 1050}}>
          <div className="card">
            <span className="badge">Three Products • One Network</span>
            <div className="grid" style={{marginTop: 16}}>
              <div><h3>Academic Assistance</h3><p>Academic formatting, research support, printing and student services.</p></div>
              <div><h3>Fintigen</h3><p>Digital skills, full-stack development, founder training and career development.</p></div>
              <div><h3>DDEI</h3><p>Accessible digital-skills training, certificates and employability pathways.</p></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT • Opportunities Network</div></footer>
  </>;
}
