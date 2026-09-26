import Link from "next/link";
import CoverPageCreatorForm from "../components/CoverPageCreatorForm";

export const metadata = {
  title: "Cover Page Creator | Mabrig Academic Assistance",
  description: "Create fancy editable academic cover pages with Word-native borders and download as DOCX.",
};

export default function CoverPageCreatorPage() {
  return <>
    <header className="container nav">
      <Link className="brand" href="/">MABRIG ICT</Link>
      <div className="actions">
        <Link className="btn secondary" href="/academic-writer">Academic Writer</Link>
        <Link className="btn secondary" href="/file-converter">File Converter</Link>
        <Link className="btn secondary" href="/academic-printing">Academic Printing</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </div>
    </header>
    <main>
      <section className="hero compact-hero">
        <div className="container">
          <span className="badge">Academic Cover Designer</span>
          <h1>Fancy Borders. Proper Academic Details. Editable Word Cover.</h1>
          <p className="lead">
            Design a professional assignment, assessment, term-paper, seminar, report or project cover page and download it as an editable Microsoft Word document.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <CoverPageCreatorForm />
        </div>
      </section>
    </main>
    <footer className="footer">
      <div className="container">© {new Date().getFullYear()} Mabrig ICT & Academic Assistance • Cover Page Creator</div>
    </footer>
  </>;
}
