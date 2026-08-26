export const dynamic = "force-dynamic";

export default function AdminConverterPage() {
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
              <div className="field check-row">
                <label><input type="checkbox" name="coverPage" /> Add cover page</label>
                <label><input type="checkbox" name="references" /> Format references with hanging indent</label>
              </div>
              <label className="field full">
                <span>Paste document text</span>
                <textarea name="text" required className="converter-textarea" placeholder="Paste the assignment, term paper, project section, notes or other academic text here..." />
              </label>
            </div>

            <div className="notice" style={{ marginTop: 16 }}>
              <strong>Smart academic conversion:</strong> AI modes genuinely improve or rewrite the wording before Word generation. Format-only mode preserves the wording but converts Markdown headings, emphasis, lists and quotations into real Word formatting.
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
          </div>
        </aside>
      </section>
    </main>
  );
}
