"use client";

import { useEffect, useState } from "react";
import AcademicPrintOrderForm from "./components/AcademicPrintOrderForm";
import SpecialServicePoster from "./components/SpecialServicePoster";

const services = [
  ["Academic Document Printing", "Upload or paste up to 100 pages for formatting, printing, binding and optional campus delivery. File uploads are limited to 4MB."],
  ["UNN Undergraduate Project Formatting", "Times New Roman 12pt, 2.0 double spacing, justified academic layout, headings, references and project-ready Word formatting."],
  ["Research Assisted", "Structured research assistance for undergraduate and postgraduate students: topic refinement, proposal and chapter planning, literature-search guidance, verified-source organization, methodology guidance, questionnaire support, data-analysis guidance, citation/reference checks, proofreading and supervisor-correction support."],
  ["Article Rewriter & Humanizer", "Rewrite articles, assignments and academic drafts for clearer, more natural flow while preserving the original meaning, facts, citations and references."],
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
    if (code) { setReferralCode(code); window.sessionStorage.setItem("mabrig_referral_code", code); }
  }, []);
  return <>
    <header className="container nav"><div className="brand">MABRIG ICT</div><div className="actions"><a className="btn secondary" href="/academic-printing">Academic Printing</a><a className="btn secondary" href="#research-assisted">Research Assisted</a><a className="btn secondary" href="/work-with-us">Work With Us</a><a className="btn secondary" href="/partners">Partner Referrals</a><a className="btn secondary" href="/track">Track Order</a><a className="btn secondary" href="#order">Place an Order</a></div></header>
    <main>
      <section className="hero"><div className="container"><span className="badge">UNN Academic & Document Services</span><h1>Research. Assist. Rewrite. Format. Print.</h1><p className="lead">Academic and research support for undergraduate and postgraduate students, including guided research assistance, document processing, UNN formatting, printing, binding and campus delivery.</p><div className="actions"><a className="btn primary" href="/academic-printing/order">Submit My Work</a><a className="btn secondary" href="#research-assisted">Research Assisted</a><a className="btn secondary" href="/work-with-us">UNN Part-Time Work</a></div></div></section>
      {referralCode && <section className="section container" style={{paddingBottom:0}}><div className="notice"><strong>Partner referral recorded.</strong> Your order will be attributed to referral code <strong>{referralCode}</strong> where eligible.</div></section>}
      <SpecialServicePoster />
      <section id="research-assisted" className="section container"><div className="card"><span className="badge">Undergraduate & Postgraduate</span><h2>Research Assisted</h2><p>Get structured human-assisted research support from topic development to final corrections. Support can cover proposal planning, literature discovery and organization, conceptual and theoretical framework guidance, methodology, research instruments, data preparation and analysis guidance, results presentation, citation/reference verification, proofreading, formatting and supervisor corrections.</p><p><strong>Research integrity:</strong> the service supports learning and legitimate research development. Students remain responsible for their academic work, decisions, original data and final submission.</p><a className="btn primary" href="/academic-printing/order">Request Research Assistance</a></div></section>
      <section id="services" className="section container"><h2>What we deliver</h2><div className="grid">{services.map(([title,text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p>{["Academic Document Printing","Article Rewriter & Humanizer","Research Assisted"].includes(title) && <a className="btn primary" href="/academic-printing/order">Use This Service</a>}</article>)}</div></section>
      <section className="section container"><div className="card"><span className="badge">Student Opportunities</span><h2>UNN students: work part-time with Mabrig</h2><p>Join a screened worker pool for research assistance, literature support, academic formatting, data support, printing/production, customer service, referrals and campus delivery. Specialist research roles require stronger screening and role-specific practical tests.</p><a className="btn primary" href="/work-with-us">See Roles & Recruitment Standard</a></div></section>
      <section id="order" className="section"><div className="container order"><AcademicPrintOrderForm /><p style={{textAlign:"center",marginTop:16}}><a href="/academic-printing/order"><strong>Open the dedicated order page →</strong></a></p></div></section>
    </main>
    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance.</div></footer>
  </>;
}
