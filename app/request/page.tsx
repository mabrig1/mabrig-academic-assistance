import Link from "next/link";
import AcademicPrintOrderForm from "../components/AcademicPrintOrderForm";

export const metadata = {
  title: "Request a Service | MABRIG Academic & Print Hub",
  description:
    "Submit assignments, term papers, projects, seminar papers, research assistance, editing, formatting, printing and delivery requests online.",
};

export default function RequestPage() {
  return (
    <>
      <header className="container nav">
        <Link className="brand" href="/">MABRIG Academic & Print Hub</Link>
        <div className="actions">
          <Link className="btn secondary" href="/">Home</Link>
          <Link className="btn secondary" href="/track">Track Order</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <span className="badge">Online Academic & Print Services</span>
            <h1>Request a Service</h1>
            <p className="lead">
              Submit your topic, paste your full instructions, upload supporting files,
              choose your deadline and request digital delivery, printing or print delivery.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container order">
            <AcademicPrintOrderForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          MABRIG Academic & Print Hub • Research • Write • Print • Deliver
        </div>
      </footer>
    </>
  );
}
