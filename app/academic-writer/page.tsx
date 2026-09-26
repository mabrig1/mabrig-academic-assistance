import Link from "next/link";
import AcademicWriterForm from "../components/AcademicWriterForm";

export default function AcademicWriterPage() {
  return <>
    <header className="container nav">
      <Link className="brand" href="/">MABRIG ICT</Link>
      <div className="actions">
        <Link className="btn secondary" href="/cover-page">Cover Page Creator</Link>
        <Link className="btn secondary" href="/academic-printing">Academic Printing</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </div>
    </header>
    <main>
      <section className="hero compact-hero">
        <div className="container">
          <span className="badge">UNN Academic Writer • Verified References Agent</span>
          <h1>From Lecturer&apos;s Question to Verified, Citation-Ready Word Document.</h1>
          <p className="lead">Generate assignments, assessments, term papers and seminar papers with an UNN-focused structure. Discover scholarly sources, verify DOI metadata and reference health, approve what may be cited, then download the final editable .docx.</p>
        </div>
      </section>
      <section className="section">
        <div className="container order"><AcademicWriterForm /></div>
      </section>
    </main>
    <footer className="footer"><div className="container">Mabrig ICT & Academic Assistance • UNN Academic Writer</div></footer>
  </>;
}
