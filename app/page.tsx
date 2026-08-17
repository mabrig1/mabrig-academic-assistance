"use client";

import { FormEvent, useEffect, useState } from "react";

const services = [
  ["Project & Thesis Formatting", "APA, MLA, Harvard, Chicago, pagination, TOC and document cleanup."],
  ["Research Assistance", "Topic refinement, methodology guidance, literature organization and editing."],
  ["Assignment & Term-Paper Support", "Research, proofreading, structure and academic writing support."],
  ["Data Analysis Assistance", "Excel/SPSS guidance, tables, charts and interpretation support."],
  ["Printing & Binding", "Black-and-white or colour printing, binding and final document production."],
  ["Campus Delivery", "Printed academic work delivered to selected UNN campus locations."],
];
const locations = ["Nkrumah", "Franco", "Bello", "Okpara", "Mariere", "Balewa", "Eni Njoku", "Hilltop", "Odim", "Zik's Flat"];

export default function Home() {
  const [message, setMessage] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [printOption, setPrintOption] = useState("DIGITAL_ONLY");
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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPaymentUrl(""); setMessage("Creating your order and quotation...");
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/orders/v2", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Unable to create order.");
    setMessage(`Order ${data.orderId} created. Quotation: ₦${Number(data.quotedAmount).toLocaleString()}.`);
    if (form.get("email")) {
      setMessage(`Order ${data.orderId} created. Quotation: ₦${Number(data.quotedAmount).toLocaleString()}. Initializing Paystack...`);
      const pay = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: data.orderId, email: form.get("email") }) });
      const payData = await pay.json();
      if (pay.ok) { setPaymentUrl(payData.authorizationUrl); setMessage("Order created. Click the payment button to complete payment."); }
      else setMessage(`Order created. Quotation: ₦${Number(data.quotedAmount).toLocaleString()}. Payment setup is not ready yet.`);
    }
    e.currentTarget.reset(); setPrintOption("DIGITAL_ONLY");
  }

  return <>
    <header className="container nav"><div className="brand">MABRIG ICT</div><div className="actions"><a className="btn secondary" href="/partners">Partner Referrals</a><a className="btn secondary" href="/track">Track Order</a><a className="btn secondary" href="#order">Place an Order</a></div></header>
    <main>
      <section className="hero"><div className="container"><span className="badge">UNN Academic & Document Services</span><h1>Submit. Pay. Track. Print. Deliver.</h1><p className="lead">One platform for academic support, professional document processing, printing, binding and campus delivery.</p><div className="actions"><a className="btn primary" href="#order">Start an Order</a><a className="btn secondary" href="#services">Explore Services</a><a className="btn secondary" href="/partners">Become a Partner</a></div></div></section>
      {referralCode && <section className="section container" style={{paddingBottom:0}}><div className="notice"><strong>Partner referral recorded.</strong> Your order will be attributed to referral code <strong>{referralCode}</strong> where eligible under the partner programme.</div></section>}
      <section id="services" className="section container"><h2>What we deliver</h2><div className="grid">{services.map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section id="order" className="section"><div className="container order"><div className="card"><h2>Place an Order</h2><p>We review the request, calculate the quotation and activate payment before work begins.</p>
        <form onSubmit={submit}><div className="form-grid">
          <label className="field"><span>Name</span><input name="name" required placeholder="Your name" /></label>
          <label className="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="080..." /></label>
          <label className="field"><span>Email for receipt/payment</span><input name="email" type="email" required placeholder="you@example.com" /></label>
          <label className="field"><span>Department</span><input name="department" placeholder="e.g. Political Science" /></label>
          <label className="field"><span>Service</span><select name="service" required><option value="">Select a service</option>{services.map(([title]) => <option key={title}>{title}</option>)}</select></label>
          <label className="field"><span>Production</span><select name="printOption" value={printOption} onChange={e => setPrintOption(e.target.value)}><option value="DIGITAL_ONLY">Digital only</option><option value="PRINT_ONLY">Print only</option><option value="DIGITAL_AND_PRINT">Digital + print</option><option value="DIGITAL_PRINT_DELIVERY">Digital + print + campus delivery</option></select></label>
          <label className="field"><span>Copies</span><input name="copies" type="number" min="1" max="100" defaultValue="1" /></label>
          {printOption !== "DIGITAL_ONLY" && <><label className="field"><span>Print type</span><select name="printType"><option value="BLACK_WHITE">Black & white</option><option value="COLOUR">Colour</option></select></label><label className="field"><span>Binding</span><select name="binding"><option value="NONE">No binding</option><option value="SPIRAL">Spiral</option><option value="SOFT">Soft binding</option><option value="HARD">Hard binding</option></select></label></>}
          {printOption === "DIGITAL_PRINT_DELIVERY" && <><label className="field"><span>UNN delivery location</span><select name="deliveryLocation" required><option value="">Choose location</option>{locations.map(x => <option key={x}>{x}</option>)}</select></label><label className="field"><span>Delivery note</span><input name="deliveryNote" placeholder="Hostel/block/meeting point" /></label></>}
          <label className="field full"><span>Instructions / deadline</span><textarea name="instructions" required placeholder="Tell us what you need, page count and deadline." /></label>
          <label className="field full"><span>File (optional)</span><input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>
          <input type="hidden" name="referralCode" value={referralCode} />
        </div>
        <div className="notice" style={{marginTop:16}}>Academic integrity: services focus on tutoring, research assistance, editing, proofreading, formatting and document production. Students remain responsible for assessed submissions.</div>
        <button className="btn primary" style={{marginTop:16}} type="submit">Create Order & Get Quote</button>
        {message && <p aria-live="polite">{message}</p>}
        {paymentUrl && <a className="btn primary" style={{marginTop:8}} href={paymentUrl}>Pay Securely with Paystack</a>}
        </form></div></div></section>
    </main>
    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance.</div></footer>
  </>;
}
