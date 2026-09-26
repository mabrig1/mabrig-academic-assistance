import Link from "next/link";
import FileConverterForm from "../components/FileConverterForm";

export const metadata = {
  title: "File Converter | Mabrig Academic Assistance",
  description: "Convert DOCX to PDF and PDF to editable DOCX for academic and office documents.",
};

export default function FileConverterPage() {
  return <>
    <header className="container nav">
      <Link className="brand" href="/">MABRIG ICT</Link>
      <div className="actions">
        <Link className="btn secondary" href="/academic-writer">Academic Writer</Link>
        <Link className="btn secondary" href="/cover-page">Cover Page Creator</Link>
        <Link className="btn secondary" href="/academic-printing">Academic Printing</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </div>
    </header>
    <main>
      <section className="hero compact-hero">
        <div className="container">
          <span className="badge">File Conversion</span>
          <h1>Word to PDF. PDF to Editable Word.</h1>
          <p className="lead">
            Convert student assignments, term papers, projects and office documents, then download the converted file or send it directly into the Mabrig printing workflow.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container order">
          <FileConverterForm />
        </div>
      </section>
      <section className="section container">
        <div className="grid">
          <article className="card">
            <h3>DOCX → PDF</h3>
            <p>Extracts readable Word content and produces a clean paginated PDF suitable for sharing and printing.</p>
          </article>
          <article className="card">
            <h3>PDF → DOCX</h3>
            <p>Turns selectable PDF text into an editable Microsoft Word document with page boundaries retained.</p>
          </article>
          <article className="card">
            <h3>Private Processing</h3>
            <p>Files are processed for the conversion request and are not intentionally stored by the converter.</p>
          </article>
        </div>
      </section>
    </main>
    <footer className="footer">
      <div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance • File Converter</div>
    </footer>
  </>;
}
