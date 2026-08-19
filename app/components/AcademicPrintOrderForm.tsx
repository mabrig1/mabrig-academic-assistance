"use client";

import { FormEvent, useEffect, useState } from "react";

const services = [
  "Academic Document Printing",
  "Assignment & Term-Paper Support",
  "Project & Thesis Formatting",
  "Research Assistance",
  "Data Analysis Assistance",
  "Printing & Binding",
];

const locations = ["Nkrumah", "Franco", "Bello", "Okpara", "Mariere", "Balewa", "Eni Njoku", "Hilltop", "Odim", "Zik's Flat"];

export default function AcademicPrintOrderForm({ compact = false }: { compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [printOption, setPrintOption] = useState("DIGITAL_AND_PRINT");
  const [pages, setPages] = useState(1);
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    e.preventDefault();
    setSubmitting(true);
    setMessage("Submitting your document request...");
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/orders/v2", { method: "POST", body: form });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to create your order.");
      return;
    }

    setMessage(`Order ${data.orderId} created. Quotation: ₦${Number(data.quotedAmount).toLocaleString()}. We will continue with you on WhatsApp.`);
    e.currentTarget.reset();
    setPrintOption("DIGITAL_AND_PRINT");
    setPages(1);
  }

  return <div className={compact ? "" : "card"}>
    {!compact && <>
      <span className="badge">Maximum 20 pages</span>
      <h2>Academic Document Printing</h2>
      <p>Upload your work or paste it directly for professional review, formatting and printing. The print shop checks the document before production.</p>
    </>}

    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field"><span>Name</span><input name="name" required placeholder="Your name" /></label>
        <label className="field"><span>WhatsApp number</span><input name="whatsapp" required inputMode="tel" placeholder="080..." /></label>

        <label className="field"><span>Document / service</span>
          <select name="service" defaultValue="Academic Document Printing" required>
            {services.map(service => <option key={service}>{service}</option>)}
          </select>
        </label>

        <label className="field"><span>File type</span>
          <select name="requestedFormat" defaultValue="PDF">
            <option>PDF</option><option>DOCX</option><option>PPTX</option><option>OTHER</option>
          </select>
        </label>

        <label className="field"><span>Number of pages (max 20)</span><input name="pages" type="number" min="1" max="20" value={pages} onChange={e => setPages(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} required /></label>
        <label className="field"><span>Copies</span><input name="copies" type="number" min="1" max="100" defaultValue="1" /></label>

        <label className="field"><span>Spacing</span>
          <select name="spacing" defaultValue="1.5"><option value="single">Single</option><option value="1.5">1.5 lines</option><option value="double">Double</option></select>
        </label>
        <label className="field"><span>Font</span>
          <select name="font" defaultValue="Times New Roman"><option>Times New Roman</option><option>Arial</option><option>Calibri</option><option>Other</option></select>
        </label>

        <label className="field"><span>Font size</span><input name="fontSize" type="number" min="8" max="30" defaultValue="12" /></label>
        <label className="field"><span>Production</span>
          <select name="printOption" value={printOption} onChange={e => setPrintOption(e.target.value)}>
            <option value="DIGITAL_ONLY">Digital processing only</option>
            <option value="PRINT_ONLY">Print only</option>
            <option value="DIGITAL_AND_PRINT">Format + print</option>
            <option value="DIGITAL_PRINT_DELIVERY">Format + print + campus delivery</option>
          </select>
        </label>

        {printOption !== "DIGITAL_ONLY" && <>
          <label className="field"><span>Print type</span><select name="printType"><option value="BLACK_WHITE">Black & white — ₦30/page</option><option value="COLOUR">Colour — ₦100/page</option></select></label>
          <label className="field"><span>Binding</span><select name="binding"><option value="NONE">No binding</option><option value="SPIRAL">Spiral</option><option value="SOFT">Soft binding</option><option value="HARD">Hard binding</option></select></label>
        </>}

        {printOption === "DIGITAL_PRINT_DELIVERY" && <>
          <label className="field"><span>UNN delivery location</span><select name="deliveryLocation" required><option value="">Choose location</option>{locations.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>Delivery note</span><input name="deliveryNote" placeholder="Hostel, block or meeting point" /></label>
        </>}

        <label className="field full"><span>Option 1 — Upload your document</span><input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>

        <div className="upload-divider field full"><span>OR</span></div>

        <label className="field full"><span>Option 2 — Paste your work here</span><textarea name="pastedContent" rows={12} maxLength={100000} placeholder="Paste the text of your assignment, term paper, project or other document here. You can use this instead of uploading a file." /></label>

        <div className="field full check-row">
          <label><input name="citations" type="checkbox" /> Citations</label>
          <label><input name="references" type="checkbox" /> References</label>
          <label><input name="coverPage" type="checkbox" /> Cover page</label>
          <label><input name="conversionRequested" type="checkbox" defaultChecked /> Convert / format before printing</label>
        </div>

        <label className="field full"><span>Instructions / deadline</span><textarea name="instructions" required placeholder="Tell us your deadline and any special formatting or printing instructions." /></label>
        <input type="hidden" name="referralCode" value={referralCode} />
      </div>

      <div className="notice" style={{marginTop:16}}><strong>UNN preset:</strong> Times New Roman, 12pt and 1.5 spacing are ready to select. Upload a file <strong>or</strong> paste your work directly.</div>
      <div className="notice" style={{marginTop:10}}>Academic integrity: this service supports editing, formatting, proofreading and document production. Students remain responsible for assessed submissions.</div>
      <button className="btn primary" style={{marginTop:16}} type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit to Print Shop & Get Quote"}</button>
      {message && <p className="form-message" aria-live="polite">{message}</p>}
      {message.includes("Order ") && <a className="btn whatsapp" style={{marginTop:8}} target="_blank" rel="noreferrer" href="https://wa.me/2347065342818?text=Hello%20Mabrig%20ICT%2C%20I%20have%20submitted%20an%20academic%20printing%20order%20on%20the%20website.%20Please%20help%20me%20continue%20with%20the%20order.">Continue on WhatsApp</a>}
    </form>
  </div>;
}
