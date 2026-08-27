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
    setMessage("Submitting and preparing your document for conversion...");
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/orders/v2", { method: "POST", body: form });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to create your order.");
      return;
    }

    const conversionMessage = data.conversionReady
      ? " Your text is ready for Word formatting by the print shop."
      : data.conversionWarning
        ? ` ${data.conversionWarning}`
        : "";
    setMessage(`Order ${data.orderId} created. Quotation: ₦${Number(data.quotedAmount).toLocaleString()}.${conversionMessage} We will continue with you on WhatsApp.`);
    e.currentTarget.reset();
    setPrintOption("DIGITAL_AND_PRINT");
    setPages(1);
  }

  return <div className={compact ? "" : "card"}>
    {!compact && <>
      <span className="badge">Maximum 20 pages</span>
      <h2>Academic Document Printing & Word Conversion</h2>
      <p>Upload your work or paste it directly. We can clean the text, apply academic formatting, generate a Word document and prepare it for printing.</p>
    </>}

    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field"><span>Name</span><input name="name" required placeholder="Your name" /></label>
        <label className="field"><span>WhatsApp number</span><input name="whatsapp" required inputMode="tel" placeholder="080..." /></label>

        <label className="field full"><span>Document title / topic</span><input name="documentTitle" maxLength={200} placeholder="e.g. The Impact of E-Governance on Service Delivery" /></label>

        <label className="field"><span>Document / service</span>
          <select name="service" defaultValue="Academic Document Printing" required>
            {services.map(service => <option key={service}>{service}</option>)}
          </select>
        </label>

        <label className="field"><span>Preferred output</span>
          <select name="requestedFormat" defaultValue="DOCX">
            <option value="DOCX">Microsoft Word (.docx)</option>
            <option value="PDF">PDF</option>
            <option value="PPTX">PowerPoint</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="field"><span>Number of pages (max 20)</span><input name="pages" type="number" min="1" max="20" value={pages} onChange={e => setPages(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} required /></label>
        <label className="field"><span>Copies</span><input name="copies" type="number" min="1" max="100" defaultValue="1" /></label>

        <label className="field"><span>Spacing</span>
          <select name="spacing" defaultValue="1.5"><option value="single">Single</option><option value="1.15">1.15 lines</option><option value="1.5">1.5 lines</option><option value="double">Double</option></select>
        </label>
        <label className="field"><span>Font</span>
          <select name="font" defaultValue="Times New Roman"><option>Times New Roman</option><option>Arial</option><option>Calibri</option><option>Georgia</option></select>
        </label>

        <label className="field"><span>Font size</span><input name="fontSize" type="number" min="8" max="30" defaultValue="12" /></label>
        <label className="field"><span>Text treatment</span>
          <select name="transformationMode" defaultValue="proofread">
            <option value="proofread">Proofread &amp; improve clarity (AI)</option>
            <option value="rewrite">Rewrite for clarity and originality (AI)</option>
            <option value="format">Format only — keep the wording</option>
          </select>
        </label>
        <label className="field"><span>Body alignment</span>
          <select name="bodyAlignment" defaultValue="justified">
            <option value="justified">Justified (academic)</option>
            <option value="left">Left aligned</option>
          </select>
        </label>
        <label className="field"><span>Paragraph indentation</span>
          <select name="paragraphIndentation" defaultValue="first-line">
            <option value="first-line">First line — 0.5 inch</option>
            <option value="first-line-wide">First line — 1 inch</option>
            <option value="none">No first-line indentation</option>
          </select>
        </label>
        <label className="field"><span>Heading style</span>
          <select name="headingPreset" defaultValue="academic">
            <option value="academic">Classic academic hierarchy</option>
            <option value="apa7">APA 7 heading hierarchy</option>
            <option value="compact">Compact report hierarchy</option>
          </select>
        </label>
        <label className="field"><span>Referencing style</span>
          <select name="referenceStyle" defaultValue="none">
            <option value="none">No prescribed style</option>
            <option value="apa7">APA 7 — References</option>
            <option value="mla9">MLA 9 — Works Cited</option>
          </select>
        </label>
        <label className="field"><span>Page numbers</span>
          <select name="pageNumberPosition" defaultValue="footer-center">
            <option value="footer-center">Footer — centred</option>
            <option value="footer-right">Footer — right</option>
            <option value="header-right">Header — right</option>
            <option value="none">No page numbers</option>
          </select>
        </label>
        <label className="field"><span>Header text (optional)</span><input name="headerText" maxLength={160} placeholder="Short title or department" /></label>
        <label className="field"><span>Footer text (optional)</span><input name="footerText" maxLength={160} placeholder="Student name, course or institution" /></label>
        <label className="field"><span>Production</span>
          <select name="printOption" value={printOption} onChange={e => setPrintOption(e.target.value)}>
            <option value="DIGITAL_ONLY">Word conversion / digital processing only</option>
            <option value="PRINT_ONLY">Print only</option>
            <option value="DIGITAL_AND_PRINT">Format + Word + print</option>
            <option value="DIGITAL_PRINT_DELIVERY">Format + Word + print + campus delivery</option>
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

        <label className="field full"><span>Option 1 — Upload for conversion (max 4MB)</span><input name="file" type="file" accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></label>
        <div className="conversion-upload-note field full">⚡ Instant text extraction for Word generation is available for pasted text, TXT/Markdown, DOCX and text-based PDFs. Complex layouts, scanned PDFs, PowerPoint and Excel may require manual printer review.</div>

        <div className="upload-divider field full"><span>OR</span></div>

        <label className="field full"><span>Option 2 — Paste your work here for instant Word conversion</span><textarea name="pastedContent" rows={12} maxLength={100000} placeholder="Paste the text of your assignment, term paper, project or other document here. The print shop can generate a formatted Word document from this text." /></label>

        <div className="field full check-row">
          <input type="hidden" name="boldHeadings" value="off" />
          <input type="hidden" name="cleanSpecialCharacters" value="off" />
          <input type="hidden" name="automaticTableOfContents" value="off" />
          <input type="hidden" name="apaFormatting" value="off" />
          <input type="hidden" name="removeEmptyParagraphs" value="off" />
          <input type="hidden" name="widowOrphanControl" value="off" />
          <label><input name="boldHeadings" value="on" type="checkbox" defaultChecked /> Bold headings</label>
          <label><input name="cleanSpecialCharacters" value="on" type="checkbox" defaultChecked /> Remove stray special / Markdown characters</label>
          <label><input name="removeEmptyParagraphs" value="on" type="checkbox" defaultChecked /> Remove empty spaces / blank paragraphs</label>
          <label><input name="automaticTableOfContents" value="on" type="checkbox" /> Automatic contents page</label>
          <label><input name="widowOrphanControl" value="on" type="checkbox" defaultChecked /> Prevent widow / orphan lines</label>
          <label><input name="citations" type="checkbox" /> Citations</label>
          <label><input name="references" type="checkbox" /> References / hanging indent</label>
          <label><input name="coverPage" type="checkbox" /> Cover page</label>
          <label><input name="conversionRequested" type="checkbox" defaultChecked /> Convert / format into Word</label>
        </div>

        <label className="field full"><span>Instructions / deadline</span><textarea name="instructions" required placeholder="Tell us your deadline and any special formatting, conversion or printing instructions." /></label>
        <input type="hidden" name="referralCode" value={referralCode} />
      </div>

      <div className="notice" style={{marginTop:16}}><strong>Word superpower:</strong> Times New Roman, 12pt and 1.5 spacing are selected by default. APA 7 and MLA 9 apply double spacing, 0.5-inch paragraph indents, hanging references and top-right page numbers. The service formats the sources supplied; it does not invent missing citations.</div>
      <div className="notice" style={{marginTop:10}}>Academic integrity: this service supports editing, formatting, proofreading and document production. Students remain responsible for assessed submissions.</div>
      <button className="btn primary" style={{marginTop:16}} type="submit" disabled={submitting}>{submitting ? "Preparing conversion..." : "Submit, Format & Convert to Word"}</button>
      {message && <p className="form-message" aria-live="polite">{message}</p>}
      {message.includes("Order ") && <a className="btn whatsapp" style={{marginTop:8}} target="_blank" rel="noreferrer" href="https://wa.me/2347065342818?text=Hello%20Mabrig%20ICT%2C%20I%20have%20submitted%20an%20academic%20document%20conversion%20and%20printing%20order%20on%20the%20website.%20Please%20help%20me%20continue%20with%20the%20order.">Continue on WhatsApp</a>}
    </form>
  </div>;
}
