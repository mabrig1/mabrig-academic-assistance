import Link from "next/link";
import FileBridgeTransfer from "./FileBridgeTransfer";

export const metadata = {
  title: "FileBridge | Mabrig Academic Assistance",
  description: "Transfer files directly between your Android phone and laptop using secure browser pairing or a private local Windows FileBridge receiver.",
};

export default function FileBridgePage() {
  return <>
    <header className="container nav">
      <Link className="brand" href="/">MABRIG ICT</Link>
      <nav className="actions" aria-label="FileBridge navigation">
        <Link className="btn secondary" href="/file-converter">File Converter</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </nav>
    </header>
    <main><FileBridgeTransfer /></main>
    <footer className="footer"><div className="container">© {new Date().getFullYear()} Mabrig ICT • FileBridge</div></footer>
  </>;
}
