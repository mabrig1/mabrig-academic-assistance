"use client";

import { useEffect, useState } from "react";
import AcademicPrintOrderForm from "./components/AcademicPrintOrderForm";
import SpecialServicePoster from "./components/SpecialServicePoster";

const services = [
  ["Academic Document Printing", "Upload or paste up to 20 pages for formatting, printing, binding and optional campus delivery."],
  ["Project & Thesis Formatting", "APA, MLA, Harvard, Chicago, pagination, TOC and document cleanup."],
  ["Research Assistance", "Topic refinement, methodology guidance, literature organization and editing."],
  ["Assignment & Term-Paper Support", "Research, proofreading, structure and academic writing support."],
  ["Data Analysis Assistance", "Excel/SPSS guidance, tables, charts and interpretation support."],
  ["Printing & Binding", "Black-and-white or colour printing, binding and final document production."],
  ["Campus Delivery", "Printed academic work delivered to selected UNN campus locations."],
];

export default function Home() {
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = (params.get("ref") || "").trim().slice(0, 64);
    const saved = window.sessionStorage.getItem("mabrig_referral_code") || "";
    const code = fromUrl || saved;
    if (code) {
      setReferralCode(code);
      window.sessionStorage.setItem("mabrig_referral_code", code);
    }
  }, []);

  return <>
    <header className="container nav"><div className="brand">MABRIG ICT</div><div className="actions"><a className="btn secondary" href="/academic-printing">Academic Printing</a><a className="btn secondary" href="/partners">Partner Referrals</a><a className="btn secondary" href="/track">Track Order</a><a className="btn secondary" href="#order">Place an Order</a></div></header>
    <main>
      <section className="hero"><div className="container"><span className="badge">UNN Academic & Document Services</span><h1>Submit. Track. Print. Deliver.</h1><p className="lead">One platform for academic support, professional document processing, printing, binding and campus delivery.</p><div className="actions"><a className="btn primary" href="/academic-printing/order">Upload or Paste My Work</a><a className="btn secondary" href="#services">Explore Services</a><a className="btn secondary" href="/partners">Become a Partner</a></div></div></section>
      {referralCode && <section className="section container" style={{paddingBottom:0}}><div className="notice"><strong>Partner referral recorded.</strong> Your order will be attributed to referral code <strong>{referralCode}</strong> where eligible under the partner programme.</div></section>}

      <SpecialServicePoster />

      <section id="services" className="section container"><h2>What we deliver</h2><div className="grid">{services.map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p>{title === "Academic Document Printing" && <a className="btn primary" href="/academic-printing">View Special Service</a>}</article>)}</div></section>

      <section id="order" className="section">
        <div className="container order">
          <AcademicPrintOrderForm />
          <p style={{textAlign:"center", marginTop:16}}><a href="/academic-printing/order"><strong>Open the dedicated Academic Printing order page →</strong></a></p>
        </div>
      </section>
    </main>
    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance.</div></footer>
  </>;
}
