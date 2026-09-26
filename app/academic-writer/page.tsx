import Link from "next/link";
import AcademicWriterForm from "../components/AcademicWriterForm";

export default function AcademicWriterPage() {
  return <>
    <header className="container nav">
      <Link className="brand" href="/">MABRIG ICT</Link>
      <div className="actions">
        <Link className="btn secondary" href="/academic-printing">Academic Printing</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </div>
    </header>
    <main>
      <section className="hero compact-hero">
        <div className="container">
          <span className="badge">UNN Academic Writer</span>
          <h1>From Lecturer's Question to Editable Word Document.</h1>
          <p className="lead">Generate assignments, assessments, term papers and seminar papers with an UNN-focused academic structure, then download the result as an editable .docx file.</p>
        </div>
      </section>
      <section className="section">
        <div className="container order"><AcademicWriterForm /></div>
      </section>
    </main>
    <footer className="footer"><div className="container">Mabrig ICT & Academic Assistance • UNN Academic Writer</div></footer>
  </>;
}
