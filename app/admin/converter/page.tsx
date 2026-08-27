export const dynamic = "force-dynamic";

export default function AdminConverterPage() {
  const aiConfigured = Boolean(
    process.env.AI_API_KEY?.trim() &&
    process.env.AI_BASE_URL?.trim() &&
    process.env.AI_MODEL?.trim(),
  );
  const aiModel = process.env.AI_MODEL?.trim();

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span className="badge">MABRIG DOCUMENT SUPERPOWER</span>
          <h1>Word Conversion Studio</h1>
          <p>Turn pasted academic text into a clean, print-ready Microsoft Word document in seconds.</p>
        </div>
        <div className="actions">
          <a className="btn secondary" href="/admin">Admin Dashboard</a>
          <a className="btn secondary" href="/academic-printing">Student Printing Page</a>
        </div>
      </header>

      <section className="admin-converter-layout">
        <article className="card admin-converter-card">
          <div className="conversion-power-badge">⚡ FORMAT + CONVERT → WORD</div>
          <h2>Create a Word Document</h2>
          <p>Useful for online orders, WhatsApp customers and walk-in printing jobs. Paste the text, choose the format and generate a .docx file.</p>

          <form action="/api/admin/convert/word" method="post" target="_blank">
            <div className="form-grid">
              <label className="field">
                <span>Document title</span>
                <input name="title" placeholder="e.g. Political Science Assignment" defaultValue="Academic Document" />
              </label>
              <label className="field">
                <span>Student name (optional)</span>
                <input name="studentName" placeholder="Student name" />
              </label>
              <label className="field">
                <span>Font</span>
                <select name="font" defaultValue="Times New Roman">
                  <option>Times New Roman</option>
                  <option>Arial</option>
                  <option>Calibri</option>
                  <option>Georgia</option>
                </select>
              </label>
              <label className="field">
                <span>Font size</span>
                <input name="fontSize" type="number" min="8" max="30" defaultValue="12" />
              </label>
              <label className="field">
                <span>Line spacing</span>
                <select name="spacing" defaultValue="1.5">
                  <option value="single">Single</option>
                  <option value="1.15">1.15 lines</option>
                  <option value="1.5">1.5 lines</option>
                  <option value="double">Double</option>
                </select>
              </label>
              <label className="field">
                <span>Text treatment</span>
                <select name="transformationMode" defaultValue="proofread">
                  <option value="proofread">Proofread &amp; improve clarity (AI)</option>
                  <option value="rewrite">Rewrite for clarity and originality (AI)</option>
                  <option value="format">Format only — keep the wording</option>
                </select>
              </label>
              <label className="field">
                <span>Body alignment</span>
                <select name="bodyAlignment" defaultValue="justified">
                  <option value="justified">Justified (academic)</option>
                  <option value="left">Left aligned</option>
                </select>
              </label>
              <label className="field">
                <span>Paragraph indentation</span>
                <select name="paragraphIndentation" defaultValue="first-line">
                  <option value="first-line">First line — 0.5 inch</option>
                  <option value="first-line-wide">First line — 1 inch</option>
                  <option value="none">No first-line indentation</option>
                </select>
              </label>
              <label className="field">
                <span>Heading style</span>
                <select name="headingPreset" defaultValue="academic">
                  <option value="academic">Classic academic hierarchy</option>
                  <option value="apa7">APA 7 heading hierarchy</option>
                  <option value="compact">Compact report hierarchy</option>
                </select>
              </label>
              <label className="field">
                <span>Referencing style</span>
                <select name="referenceStyle" defaultValue="none">
                  <option value="none">No prescribed reference style</option>
                  <option value="apa7">APA 7 — References and paper layout</option>
                  <option value="mla9">MLA 9 — Works Cited and paper layout</option>
                </select>
              </label>
              <label className="field">
                <span>Page numbers</span>
                <select name="pageNumberPosition" defaultValue="footer-center">
                  <option value="footer-center">Footer — centred</option>
                  <option value="footer-right">Footer — right</option>
                  <option value="header-right">Header — right</option>
                  <option value="none">No page numbers</option>
                </select>
              </label>
              <label className="field">
                <span>Header text (optional)</span>
                <input name="headerText" maxLength={160} placeholder="Short title or department" />
              </label>
              <label className="field">
                <span>Footer text (optional)</span>
                <input name="footerText" maxLength={160} placeholder="Student name, course or institution" />
              </label>
              <div className="field check-row">
                <input type="hidden" name="boldHeadings" value="off" />
                <input type="hidden" name="cleanSpecialCharacters" value="off" />
                <input type="hidden" name="automaticTableOfContents" value="off" />
                <input type="hidden" name="apaFormatting" value="off" />
                <input type="hidden" name="removeEmptyParagraphs" value="off" />
                <input type="hidden" name="widowOrphanControl" value="off" />
                <label><input type="checkbox" name="boldHeadings" value="on" defaultChecked /> Bold headings</label>
                <label><input type="checkbox" name="cleanSpecialCharacters" value="on" defaultChecked /> Remove stray special / Markdown characters</label>
                <label><input type="checkbox" name="removeEmptyParagraphs" value="on" defaultChecked /> Remove empty spaces / blank paragraphs</label>
                <label><input type="checkbox" name="automaticTableOfContents" value="on" /> Automatic contents page</label>
                <label><input type="checkbox" name="widowOrphanControl" value="on" defaultChecked /> Prevent widow / orphan lines</label>
                <label><input type="checkbox" name="coverPage" /> Add cover page</label>
                <label><input type="checkbox" name="references" /> Format references with hanging indent</label>
              </div>
              <label className="field full">
                <span>Paste document text</span>
                <textarea name="text" required className="converter-textarea" placeholder="Paste the assignment, term paper, project section, notes or other academic text here..." />
              </label>
            </div>

            <div className="notice" style={{ marginTop: 16 }}>
              <strong>Smart academic conversion:</strong> AI modes genuinely improve or rewrite the wording before Word generation. APA 7 applies APA headings and a References list; MLA 9 applies a surname/page header and Works Cited layout. Both use double spacing, Times New Roman 12pt and hanging reference indents. The tool formats supplied sources but never invents missing citations.
            </div>
            <div className="notice" style={{ marginTop: 10 }}>
              <strong>AI connection:</strong> {aiConfigured ? `Configured${aiModel ? ` with ${aiModel}` : ""}.` : "Not fully configured. Add AI_API_KEY, AI_BASE_URL and AI_MODEL in Vercel, then redeploy."}
            </div>
            <button className="btn primary conversion-download-btn" type="submit">⚡ Generate Formatted Word (.docx)</button>
          </form>
        </article>

        <aside className="card conversion-business-card">
          <span className="poster-kicker">NEW REVENUE SERVICE</span>
          <h2>Sell Document Conversion</h2>
          <p>This tool gives the print shop a fast service that can be sold independently of printing.</p>
          <div className="conversion-feature-list">
            <div><strong>Paste → Word</strong><span>WhatsApp or copied text becomes .docx.</span></div>
            <div><strong>DOCX/PDF → clean Word</strong><span>New supported uploads are text-extracted and can be regenerated from their order.</span></div>
            <div><strong>Academic formatting</strong><span>Times New Roman 12pt, spacing and heading cleanup.</span></div>
            <div><strong>Printer control</strong><span>The Word file is generated inside the protected admin system.</span></div>
            <div><strong>Clean empty spaces</strong><span>Remove blank paragraphs and accidental vertical gaps before download.</span></div>
            <div><strong>APA or MLA</strong><span>Choose APA 7 References or MLA 9 Works Cited formatting.</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
