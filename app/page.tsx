"use client";

import { FormEvent, useState } from "react";

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
  const [printOption, setPrintOption] = useState("DIGITAL_ONLY");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Creating your order...");
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/orders", { method: "POST", body: form });
    const data = await response.json();
    setMessage(response.ok ? `Order created: ${data.orderId}. We will contact you with the quotation.` : data.error || "Unable to create order.");
    if (response.ok) e.currentTarget.reset();
  }

  return (
    <>
      <header className="container nav"><div className="brand">MABRIG ICT</div><a className="btn secondary" href="#order">Place an Order</a></header>
      <main>
        <section className="hero"><div className="container"><span className="badge">UNN Academic & Document Services</span><h1>Submit. Pay. Track. Print. Deliver.</h1><p className="lead">Mabrig Academic Assistance connects students to academic support, professional document processing, printing, binding and campus delivery from one simple platform.</p><div className="actions"><a className="btn primary" href="#order">Start an Order</a><a className="btn secondary" href="#services">Explore Services</a></div></div></section>
        <section id="services" className="section container"><h2>What we deliver</h2><div className="grid">{services.map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section id="order" className="section"><div className="container order"><div className="card"><h2>Place an Order</h2><p>Tell us what you need. We will review the request, confirm the quotation and delivery time, then begin after payment.</p>
          <form onSubmit={submit}><div className="form-grid">
            <label className="field"><span>Name</span><input name="name" required placeholder="Your name" /></label>
            <label className="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="080..." /></label>
            <label className="field"><span>Department</span><input name="department" placeholder="e.g. Political Science" /></label>
            <label className="field"><span>Service</span><select name="service" required><option value="">Select a service</option>{services.map(([title]) => <option key={title}>{title}</option>)}</select></label>
            <label className="field full"><span>Instructions / deadline</span><textarea name="instructions" required placeholder="Tell us what you need, page count and deadline." /></label>
            <label className="field full"><span>File (optional)</span><input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>
            <label className="field"><span>Production</span><select name="printOption" value={printOption} onChange={e => setPrintOption(e.target.value)}><option value="DIGITAL_ONLY">Digital only</option><option value="PRINT_ONLY">Print only</option><option value="DIGITAL_AND_PRINT">Digital + print</option><option value="DIGITAL_PRINT_DELIVERY">Digital + print + campus delivery</option></select></label>
            <label className="field"><span>Copies</span><input name="copies" type="number" min="1" max="100" defaultValue="1" /></label>
            {printOption !== "DIGITAL_ONLY" && <>
              <label className="field"><span>Print type</span><select name="printType"><option value="BLACK_WHITE">Black & white</option><option value="COLOUR">Colour</option></select></label>
              <label className="field"><span>Binding</span><select name="binding"><option value="NONE">No binding</option><option value="SPIRAL">Spiral</option><option value="SOFT">Soft binding</option><option value="HARD">Hard binding</option></select></label>
            </>}
            {printOption === "DIGITAL_PRINT_DELIVERY" && <>
              <label className="field"><span>UNN delivery location</span><select name="deliveryLocation" required><option value="">Choose location</option>{locations.map(location => <option key={location}>{location}</option>)}</select></label>
              <label className="field"><span>Delivery note</span><input name="deliveryNote" placeholder="Hostel/block/meeting point" /></label>
            </>}
          </div>
          <div className="notice" style={{marginTop:16}}>For assessed academic work, the platform focuses on research support, tutoring, editing, proofreading and formatting. Students remain responsible for their own submissions.</div>
          <button className="btn primary" style={{marginTop:16}} type="submit">Submit Order Request</button>{message && <p aria-live="polite">{message}</p>}
          </form></div></div></section>
      </main>
      <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance. Built for scalable campus service delivery.</div></footer>
    </>
  );
}
