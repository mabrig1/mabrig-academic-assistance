"use client";

import { FormEvent, useState } from "react";

export default function AcademicWriterForm() {
  const [workType, setWorkType] = useState("term-paper");
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    setMessage("Writing and formatting your UNN academic document...");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/academic-writer/unn", { method: "POST", body: form });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error || "Unable to generate the document.");
        return;
      }

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
      setMessage("Your editable Word document has been generated.");
    } catch {
      setMessage("The Academic Writer could not connect. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const termLike = workType === "term-paper" || workType === "seminar-paper";

  return <div className="card">
    <span className="badge">UNN Academic Writer • Editable DOCX</span>
    <h2>Write Assignment, Assessment or Term Paper</h2>
    <p>Create an academic draft from your lecturer's question and render it directly as a Microsoft Word document using the UNN formatting preset.</p>

    <form onSubmit={submit}>
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

        <label className="field full"><span>Assignment question / lecturer's brief</span>
          <textarea name="assignmentQuestion" rows={7} required placeholder="Paste the exact assignment or term-paper instruction here. Include required headings, page limit and questions to answer." />
        </label>

        <label className="field full"><span>Lecturer / departmental formatting instructions</span>
          <textarea name="lecturerInstructions" rows={5} placeholder="Optional. Paste any special UNN faculty, department or lecturer instructions. These override the default structure." />
        </label>

        <label className="field full"><span>Verified notes, sources or references</span>
          <textarea name="sourceMaterial" rows={8} placeholder="Paste lecture notes, verified source extracts, DOI/URL details or references. The writer will not invent sources when none are supplied." />
        </label>

        <div className="field full check-row">
          <input type="hidden" name="includeAbstract" value="off" />
          <input type="hidden" name="includeTableOfContents" value="off" />
          <label><input type="checkbox" name="includeAbstract" value="on" defaultChecked={termLike} key={`abstract-${workType}`} /> Include abstract</label>
          <label><input type="checkbox" name="includeTableOfContents" value="on" defaultChecked={workType === "term-paper"} key={`toc-${workType}`} /> Include table of contents</label>
        </div>

        <div className="notice field full">
          UNN preset: Times New Roman 12pt, double spacing, justified body text, A4 page, academic title page and page numbers. Lecturer instructions take priority. Verify all facts and references before submission.
        </div>
      </div>

      <div className="actions">
        <button className="btn primary" type="submit" disabled={generating}>{generating ? "Generating Word Document..." : "Write & Download DOCX"}</button>
        <a className="btn secondary" href="/academic-printing/order">Send for Printing</a>
      </div>
      {message && <div className="form-message">{message}</div>}
    </form>
  </div>;
}
