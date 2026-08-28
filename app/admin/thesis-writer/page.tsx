export const dynamic = "force-dynamic";

export default function NounThesisWriterPage() {
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
          <span className="badge">NOUN RESEARCH WRITING STUDIO • ADMIN</span>
          <h1>Full Thesis Writer — National Open University of Nigeria</h1>
          <p>Generate a supervised NOUN-format thesis draft, research proposal or individual chapter, then download it as a formatted Microsoft Word document.</p>
        </div>
        <div className="actions">
          <a className="btn secondary" href="/admin">Admin Dashboard</a>
          <a className="btn secondary" href="/admin/converter">Word Conversion Studio</a>
        </div>
      </header>

      <section className="admin-converter-layout">
        <article className="card admin-converter-card">
          <div className="conversion-power-badge">🎓 NOUN FULL THESIS WRITER</div>
          <h2>Create a NOUN Research Project / Dissertation / Thesis</h2>
          <p>Complete the research brief below. The writer follows the NOUN five-chapter structure, preserves supplied evidence and creates explicit placeholders rather than inventing missing sources or findings.</p>

          <form action="/api/admin/thesis/noun" method="post" target="_blank">
            <div className="form-grid">
              <label className="field">
                <span>Writing mode</span>
                <select name="mode" defaultValue="full">
                  <option value="full">Full thesis — preliminary pages + Chapters 1–5 + references + appendices</option>
                  <option value="proposal">Research proposal — Chapters 1–3</option>
                  <option value="chapter1">Chapter One only</option>
                  <option value="chapter2">Chapter Two only</option>
                  <option value="chapter3">Chapter Three only</option>
                  <option value="chapter4">Chapter Four only</option>
                  <option value="chapter5">Chapter Five only</option>
                </select>
              </label>

              <label className="field">
                <span>Degree level</span>
                <select name="degreeLevel" defaultValue="undergraduate">
                  <option value="undergraduate">Undergraduate / First Degree</option>
                  <option value="pgde">PGDE</option>
                  <option value="masters">Master's</option>
                  <option value="phd">PhD</option>
                </select>
              </label>

              <label className="field">
                <span>Target pages for this generation</span>
                <input name="targetPages" type="number" min="4" max="100" defaultValue="50" />
              </label>

              <label className="field">
                <span>Completion month and year</span>
                <input name="monthYear" required defaultValue="August 2026" placeholder="e.g. August 2026" />
              </label>

              <label className="field full">
                <span>Thesis / project title — maximum 23 words under the NOUN Education baseline</span>
                <input name="title" required maxLength={300} placeholder="Enter the approved research title" />
              </label>

              <label className="field">
                <span>Student full name</span>
                <input name="studentName" required placeholder="Surname and other names as approved" />
              </label>

              <label className="field">
                <span>Matriculation number</span>
                <input name="matricNumber" required placeholder="e.g. NOU123456789" />
              </label>

              <label className="field">
                <span>Faculty</span>
                <input name="faculty" required placeholder="e.g. Arts, Education, Social Sciences" />
              </label>

              <label className="field">
                <span>Department</span>
                <input name="department" required placeholder="Department" />
              </label>

              <label className="field">
                <span>Programme</span>
                <input name="programme" required placeholder="e.g. B.Sc. Political Science" />
              </label>

              <label className="field">
                <span>Award statement</span>
                <input name="award" required placeholder="e.g. Bachelor of Science (B.Sc.) in Political Science" />
              </label>

              <label className="field">
                <span>Study Centre</span>
                <input name="studyCentre" placeholder="NOUN Study Centre" />
              </label>

              <label className="field">
                <span>Supervisor</span>
                <input name="supervisor" placeholder="Supervisor's name" />
              </label>

              <label className="field full">
                <span>Background / research brief</span>
                <textarea name="backgroundBrief" rows={7} placeholder="Explain the topic, context, variables, location, rationale and any approved background notes." />
              </label>

              <label className="field full">
                <span>Statement of the problem</span>
                <textarea name="problemStatement" rows={6} placeholder="Paste the approved problem statement or explain the research gap the study should address." />
              </label>

              <label className="field full">
                <span>Aim / purpose and specific objectives</span>
                <textarea name="objectives" rows={7} placeholder="Enter the approved general aim and numbered specific objectives." />
              </label>

              <label className="field full">
                <span>Research questions and/or hypotheses</span>
                <textarea name="researchQuestions" rows={7} placeholder="Paste the approved research questions and null hypotheses where applicable." />
              </label>

              <label className="field full">
                <span>Methodology details</span>
                <textarea name="methodology" rows={9} placeholder="Research design, area, population, sample size, sampling technique, instruments, validity, reliability, procedure, analysis methods and ethics where applicable." />
              </label>

              <label className="field full">
                <span>Verified findings / data for Chapters 4 and 5</span>
                <textarea name="findingsData" rows={10} placeholder="Paste verified tables, statistical outputs, interview themes, findings or analysis notes. Leave blank if results are not available; the writer will insert placeholders rather than invent results." />
              </label>

              <label className="field full">
                <span>Verified sources / APA references</span>
                <textarea name="verifiedSources" rows={12} placeholder="Paste verified references and source details, preferably one reference per line. The writer must not invent missing sources." />
              </label>

              <label className="field full">
                <span>Faculty / supervisor-specific instructions</span>
                <textarea name="facultyInstructions" rows={6} placeholder="Add any faculty-specific chapter headings, page requirements, citation rules, terminology or supervisor instructions that override the general NOUN baseline." />
              </label>

              <label className="field full">
                <span>Dedication (optional)</span>
                <textarea name="dedication" rows={3} placeholder="Enter the student's approved dedication, or leave blank for a placeholder." />
              </label>

              <label className="field full">
                <span>Acknowledgements (optional)</span>
                <textarea name="acknowledgement" rows={5} placeholder="Enter approved acknowledgements, or leave blank for a placeholder." />
              </label>

              <label className="field full">
                <span>Appendices / instruments (optional)</span>
                <textarea name="appendices" rows={8} placeholder="Questionnaire, interview guide, letter of introduction, attestation, additional tables or other approved appendices." />
              </label>

              <div className="field full check-row">
                <label><input type="checkbox" name="automaticTableOfContents" defaultChecked /> Insert automatic Word table of contents</label>
              </div>
            </div>

            <div className="notice" style={{ marginTop: 16 }}>
              <strong>NOUN baseline applied automatically:</strong> A4 paper, Times New Roman 12pt, 1-inch margins, justified body text, indented paragraphs, double line spacing, bold chapter/sub-headings, each chapter starting on a new page, APA-style reference list, Roman-numbered preliminary section and Arabic-numbered main text. The abstract is single-spaced and constrained to a maximum of 400 words in the full-thesis workflow.
            </div>

            <div className="notice" style={{ marginTop: 10 }}>
              <strong>Research integrity:</strong> the writer is instructed not to invent citations, references, statistics, respondents, findings or fieldwork. If verified evidence is missing, the draft uses explicit placeholders such as <strong>[Add verified citation]</strong> or <strong>[Insert verified result/data]</strong> for the administrator and supervisor to complete.
            </div>

            <div className="notice" style={{ marginTop: 10 }}>
              <strong>Long dissertations:</strong> NOUN Faculty of Arts guidance lists approximately 40–60 pages for first degree, 80–120 for Master's and 200 pages minimum for PhD. This tool allows up to 100 pages per generation and supports individual chapter generation so long Master's/PhD work can be expanded and reviewed chapter by chapter.
            </div>

            <div className="notice" style={{ marginTop: 10 }}>
              <strong>AI connection:</strong> {aiConfigured ? `Configured${aiModel ? ` with ${aiModel}` : ""}.` : "Not fully configured. Add AI_API_KEY, AI_BASE_URL and AI_MODEL in Vercel before using the thesis writer."}
            </div>

            <button className="btn primary conversion-download-btn" type="submit">🎓 Generate & Download NOUN Word Thesis (.docx)</button>
          </form>
        </article>

        <aside className="card conversion-business-card">
          <span className="poster-kicker">NOUN FORMAT CHECKLIST</span>
          <h2>What the writer builds</h2>
          <div className="conversion-feature-list">
            <div><strong>Preliminary pages</strong><span>Title, declaration, certification, dedication, acknowledgements, contents, lists and abstract.</span></div>
            <div><strong>Chapter One</strong><span>Background, problem, purpose/objectives, questions/hypotheses, significance, scope and definitions.</span></div>
            <div><strong>Chapter Two</strong><span>Conceptual framework, theoretical framework, empirical review and research gap.</span></div>
            <div><strong>Chapter Three</strong><span>Design, population, sample, instrument, validity, reliability, collection procedure and analysis.</span></div>
            <div><strong>Chapter Four</strong><span>Results arranged by research questions/hypotheses using only supplied verified data.</span></div>
            <div><strong>Chapter Five</strong><span>Discussion, implications, summary, conclusion, recommendations and further studies.</span></div>
            <div><strong>References & appendices</strong><span>APA hanging references plus approved instruments and supporting materials.</span></div>
            <div><strong>Word-ready output</strong><span>Automatic structure, pagination and thesis formatting for supervisor review.</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
