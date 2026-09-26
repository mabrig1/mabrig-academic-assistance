"use client";

import { FormEvent, useMemo, useState } from "react";

type CoverTemplate = "unn-classic" | "royal-blue" | "gold-formal" | "minimal-black";

type CoverState = {
  institution: string;
  faculty: string;
  department: string;
  workType: string;
  title: string;
  subtitle: string;
  studentName: string;
  registrationNumber: string;
  courseCode: string;
  courseTitle: string;
  lecturer: string;
  session: string;
  date: string;
};

const initialState: CoverState = {
  institution: "UNIVERSITY OF NIGERIA, NSUKKA",
  faculty: "",
  department: "",
  workType: "TERM PAPER",
  title: "",
  subtitle: "",
  studentName: "",
  registrationNumber: "",
  courseCode: "",
  courseTitle: "",
  lecturer: "",
  session: "2025/2026",
  date: "SEPTEMBER 2026",
};

const templateMeta: Record<CoverTemplate, { label: string; className: string; note: string }> = {
  "unn-classic": {
    label: "UNN Classic",
    className: "cover-theme-green",
    note: "Formal green double-border design for UNN assignments, term papers and projects.",
  },
  "royal-blue": {
    label: "Royal Blue",
    className: "cover-theme-blue",
    note: "Deep-blue double-border style for presentations, reports and seminar papers.",
  },
  "gold-formal": {
    label: "Gold Formal",
    className: "cover-theme-gold",
    note: "Elegant gold double-border design for polished academic submissions.",
  },
  "minimal-black": {
    label: "Minimal Black",
    className: "cover-theme-black",
    note: "Clean monochrome border for departments that prefer restrained formatting.",
  },
};

function downloadName(disposition: string) {
  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    try { return decodeURIComponent(utf[1]); } catch { return "academic-cover-page.docx"; }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain?.[1] || "academic-cover-page.docx";
}

export default function CoverPageCreatorForm() {
  const [template, setTemplate] = useState<CoverTemplate>("unn-classic");
  const [fields, setFields] = useState<CoverState>(initialState);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const theme = useMemo(() => templateMeta[template], [template]);

  function updateField(name: keyof CoverState, value: string) {
    setFields(current => ({ ...current, [name]: value }));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    setMessage("Creating your editable Word cover page...");

    try {
      const form = new FormData(event.currentTarget);
      form.set("template", template);
      const response = await fetch("/api/cover-page", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error || "Unable to create the cover page.");
        return;
      }

      const blob = await response.blob();
      const filename = downloadName(response.headers.get("Content-Disposition") || "");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Cover page created. The fancy border and text remain editable in Microsoft Word.");
    } catch {
      setMessage("The cover page creator could not connect. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return <div className="cover-creator-layout">
    <div className="card cover-form-card">
      <span className="badge">Editable DOCX Cover Page</span>
      <h2>Create a Fancy Academic Cover Page</h2>
      <p>Choose a border design, enter the academic details and download a one-page Word cover that you can insert into an assignment, term paper or project.</p>

      <form onSubmit={submit}>
        <div className="cover-template-grid">
          {(Object.keys(templateMeta) as CoverTemplate[]).map(key => {
            const option = templateMeta[key];
            return <button
              key={key}
              type="button"
              className={"cover-template-choice " + option.className + (template === key ? " active" : "")}
              onClick={() => setTemplate(key)}
            >
              <span className="cover-template-mini-border" />
              <strong>{option.label}</strong>
              <small>{option.note}</small>
            </button>;
          })}
        </div>

        <div className="form-grid cover-fields">
          <label className="field full"><span>Institution</span>
            <input name="institution" value={fields.institution} onChange={e => updateField("institution", e.target.value)} required />
          </label>
          <label className="field"><span>Faculty</span>
            <input name="faculty" value={fields.faculty} onChange={e => updateField("faculty", e.target.value)} placeholder="e.g. Education" />
          </label>
          <label className="field"><span>Department</span>
            <input name="department" value={fields.department} onChange={e => updateField("department", e.target.value)} placeholder="e.g. Social Science Education" />
          </label>
          <label className="field"><span>Type of work</span>
            <select name="workType" value={fields.workType} onChange={e => updateField("workType", e.target.value)}>
              <option>ASSIGNMENT</option>
              <option>ASSESSMENT</option>
              <option>TERM PAPER</option>
              <option>SEMINAR PAPER</option>
              <option>PROJECT</option>
              <option>REPORT</option>
              <option>BOOK REVIEW</option>
              <option>PRACTICAL REPORT</option>
            </select>
          </label>
          <label className="field"><span>Session</span>
            <input name="session" value={fields.session} onChange={e => updateField("session", e.target.value)} />
          </label>
          <label className="field full"><span>Title / topic</span>
            <textarea name="title" rows={3} value={fields.title} onChange={e => updateField("title", e.target.value)} required placeholder="Enter the full assignment, term-paper or project title" />
          </label>
          <label className="field full"><span>Optional subtitle</span>
            <input name="subtitle" value={fields.subtitle} onChange={e => updateField("subtitle", e.target.value)} placeholder="Optional descriptive subtitle" />
          </label>
          <label className="field"><span>Student name</span>
            <input name="studentName" value={fields.studentName} onChange={e => updateField("studentName", e.target.value)} required placeholder="Full name" />
          </label>
          <label className="field"><span>Registration number</span>
            <input name="registrationNumber" value={fields.registrationNumber} onChange={e => updateField("registrationNumber", e.target.value)} placeholder="2025/000000" />
          </label>
          <label className="field"><span>Course code</span>
            <input name="courseCode" value={fields.courseCode} onChange={e => updateField("courseCode", e.target.value)} placeholder="GSP 106" />
          </label>
          <label className="field"><span>Course title</span>
            <input name="courseTitle" value={fields.courseTitle} onChange={e => updateField("courseTitle", e.target.value)} placeholder="Natural Sciences" />
          </label>
          <label className="field"><span>Lecturer</span>
            <input name="lecturer" value={fields.lecturer} onChange={e => updateField("lecturer", e.target.value)} placeholder="Lecturer's name" />
          </label>
          <label className="field"><span>Date</span>
            <input name="date" value={fields.date} onChange={e => updateField("date", e.target.value)} />
          </label>
        </div>

        <div className="notice">
          The exported Word file uses a real Word page border, not a screenshot. You can still edit the text, border colour and border style after download.
        </div>

        <div className="actions">
          <button className="btn primary" type="submit" disabled={generating}>
            {generating ? "Creating Cover Page..." : "Create & Download DOCX Cover"}
          </button>
          <a className="btn secondary" href="/file-converter">Convert Finished DOCX to PDF</a>
        </div>
        {message && <div className="form-message">{message}</div>}
      </form>
    </div>

    <aside className="cover-preview-wrap">
      <div className="cover-preview-label">Live preview • {theme.label}</div>
      <div className={"cover-preview-paper " + theme.className}>
        <div className="cover-preview-inner">
          <div className="cover-preview-institution">{fields.institution || "UNIVERSITY NAME"}</div>
          {fields.faculty && <div className="cover-preview-small">FACULTY OF {fields.faculty.toUpperCase()}</div>}
          {fields.department && <div className="cover-preview-small">DEPARTMENT OF {fields.department.toUpperCase()}</div>}
          <div className="cover-preview-ornament">◆ ◇ ◆</div>
          <div className="cover-preview-worktype">{fields.workType}</div>
          <div className="cover-preview-title">{fields.title || "YOUR ACADEMIC TITLE APPEARS HERE"}</div>
          {fields.subtitle && <div className="cover-preview-subtitle">{fields.subtitle}</div>}
          <div className="cover-preview-by">BY</div>
          <div className="cover-preview-name">{fields.studentName || "STUDENT NAME"}</div>
          <div className="cover-preview-reg">{fields.registrationNumber}</div>
          <div className="cover-preview-details">
            {(fields.courseCode || fields.courseTitle) && <div>COURSE: {[fields.courseCode, fields.courseTitle].filter(Boolean).join(" — ").toUpperCase()}</div>}
            {fields.lecturer && <div>LECTURER: {fields.lecturer.toUpperCase()}</div>}
            {fields.session && <div>SESSION: {fields.session.toUpperCase()}</div>}
            {fields.date && <div>DATE: {fields.date.toUpperCase()}</div>}
          </div>
          <div className="cover-preview-ornament bottom">◆ ◇ ◆</div>
        </div>
      </div>
    </aside>
  </div>;
}
