"use client";

import { FormEvent, useRef, useState } from "react";

type ReferencePreview = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  doi: string;
  url: string;
  citationCount?: number;
  openAccess?: boolean;
  qualityScore: number;
  evidenceLevel: "abstract" | "metadata";
  verificationSources: string[];
  issues: string[];
  retractionChecked: boolean;
  retracted: boolean;
};

export default function AcademicWriterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [workType, setWorkType] = useState("term-paper");
  const [referenceMode, setReferenceMode] = useState("agentic");
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [researching, setResearching] = useState(false);
  const [references, setReferences] = useState<ReferencePreview[]>([]);
  const [selectedDois, setSelectedDois] = useState<string[]>([]);

  async function discoverReferences() {
    if (!formRef.current) return;
    setResearching(true);
    setMessage("Researching scholarly sources, resolving DOIs and checking reference health...");

    try {
      const form = new FormData(formRef.current);
      form.set("referenceMode", referenceMode);
      const response = await fetch("/api/academic-writer/references", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error || "Unable to verify references.");
        return;
      }

      const sources = Array.isArray(payload?.sources) ? payload.sources as ReferencePreview[] : [];
      setReferences(sources);
      setSelectedDois(sources.map(source => source.doi));
      const evidenceReady = sources.filter(source => source.evidenceLevel === "abstract").length;
      setMessage(
        sources.length
          ? "Verified " + sources.length + " scholarly sources. " + evidenceReady + " include abstract-level evidence. Review the list and untick any source you do not want used."
          : "No verified scholarly sources were found with the current settings."
      );
    } catch {
      setMessage("The reference agent could not connect. Please try again.");
    } finally {
      setResearching(false);
    }
  }

  function toggleReference(doi: string) {
    setSelectedDois(current =>
      current.includes(doi)
        ? current.filter(item => item !== doi)
        : [...current, doi]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (referenceMode !== "off" && references.length === 0) {
      setMessage("Discover and review verified references before generating the paper, or choose No reference research.");
      return;
    }
    if (referenceMode !== "off" && selectedDois.length === 0) {
      setMessage("Select at least one verified source to use, or choose No reference research.");
      return;
    }

    setGenerating(true);
    setMessage("Writing from verified evidence and formatting your UNN academic document...");
    const form = new FormData(event.currentTarget);
    form.set("referenceMode", referenceMode);
    form.set("selectedDois", selectedDois.join(","));

    try {
      const response = await fetch("/api/academic-writer/unn", { method: "POST", body: form });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error || "Unable to generate the document.");
        return;
      }

      const verifiedCount = response.headers.get("X-Verified-References") || "0";
      const minQuality = response.headers.get("X-Min-Reference-Quality") || "0";
      const retractionCheck = response.headers.get("X-Retraction-Check");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      const filename = match ? decodeURIComponent(match[1].replace(/"/g, "")) : "UNN-academic-paper.docx";
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(
        "Word document generated with " + verifiedCount +
        " claim-linked verified reference(s). Minimum source-quality score: " + minQuality +
        (retractionCheck === "passed" ? ". Retraction/withdrawal check passed." : ".")
      );
    } catch {
      setMessage("The Academic Writer could not connect. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const termLike = workType === "term-paper" || workType === "seminar-paper";

  return <div className="card">
    <span className="badge">UNN Academic Writer • Agentic Verified References • Editable DOCX</span>
    <h2>Write Assignment, Assessment or Term Paper</h2>
    <p>
      Create an academic draft from your lecturer&apos;s question, verify scholarly references before they are cited,
      and render the final paper directly as a Microsoft Word document using the UNN formatting preset.
    </p>

    <form ref={formRef} onSubmit={submit}>
      <div className="form-grid">
        <label className="field"><span>Paper type</span>
          <select name="workType" value={workType} onChange={e => setWorkType(e.target.value)}>
            <option value="assignment">Assignment</option>
            <option value="assessment">Assessment</option>
            <option value="term-paper">Term paper</option>
            <option value="seminar-paper">Seminar paper</option>
          </select>
        </label>
        <label className="field"><span>Target pages</span><input name="targetPages" type="number" min="1" max="20" defaultValue="12" required /></label>

        <label className="field full"><span>Topic / title</span><input name="title" maxLength={300} required placeholder="e.g. Transition Metals: Properties and Applications in Industry" /></label>

        <label className="field"><span>Student name</span><input name="studentName" required placeholder="Full name" /></label>
        <label className="field"><span>Registration number</span><input name="registrationNumber" required placeholder="2025/000000" /></label>
        <label className="field"><span>Faculty</span><input name="faculty" required placeholder="e.g. Education" /></label>
        <label className="field"><span>Department</span><input name="department" required placeholder="e.g. Social Science Education" /></label>
        <label className="field"><span>Course code</span><input name="courseCode" required placeholder="e.g. GSP 106" /></label>
        <label className="field"><span>Course title</span><input name="courseTitle" placeholder="e.g. Natural Sciences" /></label>
        <label className="field"><span>Lecturer</span><input name="lecturer" placeholder="Lecturer's name" /></label>
        <label className="field"><span>Session</span><input name="session" placeholder="2025/2026" /></label>
        <label className="field"><span>Submission date</span><input name="submissionDate" placeholder="September 2026" /></label>
        <label className="field"><span>Reference style</span>
          <select name="citationStyle" defaultValue="apa7">
            <option value="apa7">APA 7th edition</option>
            <option value="harvard">Harvard</option>
            <option value="mla9">MLA 9th edition</option>
            <option value="none">No prescribed reference style</option>
          </select>
        </label>

        <label className="field full"><span>Assignment question / lecturer&apos;s brief</span>
          <textarea name="assignmentQuestion" rows={7} required placeholder="Paste the exact assignment or term-paper instruction here. Include required headings, page limit and questions to answer." />
        </label>

        <label className="field full"><span>Lecturer / departmental formatting instructions</span>
          <textarea name="lecturerInstructions" rows={5} placeholder="Optional. Paste any special UNN faculty, department or lecturer instructions. These override the default structure." />
        </label>

        <label className="field full"><span>Notes, DOI links or source leads</span>
          <textarea name="sourceMaterial" rows={7} placeholder="Paste lecture notes, DOI links, URLs or source leads. DOI records are verified before use; pasted notes remain contextual material rather than automatically becoming citations." />
        </label>

        <div className="field full reference-agent-panel">
          <div>
            <span className="badge">Verified References Agent</span>
            <h3>Research → DOI verify → health check → evidence map → citation</h3>
            <p>
              The agent discovers scholarly records, confirms DOI metadata, checks retraction/withdrawal relationships,
              enriches evidence when available, and only then exposes sources for you to approve.
            </p>
          </div>

          <div className="form-grid">
            <label className="field"><span>Reference workflow</span>
              <select name="referenceMode" value={referenceMode} onChange={e => {
                setReferenceMode(e.target.value);
                setReferences([]);
                setSelectedDois([]);
              }}>
                <option value="agentic">Agentic discovery + verification</option>
                <option value="provided-only">Verify only DOI sources I provide</option>
                <option value="off">No reference research</option>
              </select>
            </label>
            <label className="field"><span>Target verified references</span>
              <input name="targetReferences" type="number" min="3" max="12" defaultValue="8" />
            </label>
            <label className="field"><span>Publication year from</span>
              <input name="referenceYearStart" type="number" min="1950" max="2026" defaultValue="2016" />
            </label>
            <label className="field"><span>Publication year to</span>
              <input name="referenceYearEnd" type="number" min="1950" max="2026" defaultValue="2026" />
            </label>
          </div>

          {referenceMode !== "off" && <div className="actions">
            <button className="btn secondary" type="button" onClick={discoverReferences} disabled={researching}>
              {researching ? "Verifying Sources..." : "Discover & Verify References"}
            </button>
          </div>}

          {references.length > 0 && <div className="reference-results">
            <div className="reference-results-head">
              <strong>{selectedDois.length} of {references.length} verified sources selected</strong>
              <span>Only checked sources can enter the generated bibliography.</span>
            </div>
            {references.map(reference => <label className="reference-result-card" key={reference.doi}>
              <input
                type="checkbox"
                checked={selectedDois.includes(reference.doi)}
                onChange={() => toggleReference(reference.doi)}
              />
              <div>
                <strong>{reference.title}</strong>
                <span>{reference.authors.join(", ")} ({reference.year}){reference.journal ? " • " + reference.journal : ""}</span>
                <small>
                  Quality {reference.qualityScore}/100 • DOI verified • {reference.evidenceLevel === "abstract" ? "abstract evidence" : "metadata evidence"}
                  {reference.citationCount !== undefined ? " • " + reference.citationCount + " Semantic Scholar citations" : ""}
                  {reference.openAccess ? " • open-access lead available" : ""}
                </small>
                <small>DOI: {reference.doi}</small>
                {reference.issues.length > 0 && <small className="reference-warning">Review note: {reference.issues.join("; ")}</small>}
              </div>
            </label>)}
          </div>}
        </div>

        <div className="field full check-row">
          <input type="hidden" name="includeAbstract" value="off" />
          <input type="hidden" name="includeTableOfContents" value="off" />
          <input type="hidden" name="includeVerificationAppendix" value="off" />
          <label><input type="checkbox" name="includeAbstract" value="on" defaultChecked={termLike} key={"abstract-" + workType} /> Include abstract</label>
          <label><input type="checkbox" name="includeTableOfContents" value="on" defaultChecked={workType === "term-paper"} key={"toc-" + workType} /> Include table of contents</label>
          <label><input type="checkbox" name="includeVerificationAppendix" value="on" /> Add source-verification appendix</label>
        </div>

        <div className="notice field full">
          UNN preset: Times New Roman 12pt, double spacing, justified body text, A4 page, academic title page and page numbers.
          Verified-reference mode builds the bibliography from resolved scholarly metadata rather than AI-generated reference strings.
          Lecturer instructions still take priority. Review the final paper before submission.
        </div>
      </div>

      <div className="actions">
        <button className="btn primary" type="submit" disabled={generating || researching}>
          {generating ? "Writing from Verified Evidence..." : "Write with Verified Sources & Download DOCX"}
        </button>
        <a className="btn secondary" href="/academic-printing/order">Send for Printing</a>
      </div>
      {message && <div className="form-message">{message}</div>}
    </form>
  </div>;
}
