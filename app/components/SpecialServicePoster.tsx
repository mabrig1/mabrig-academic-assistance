"use client";

import { useState } from "react";

const SITE_URL = "https://academic.mabrigkorie.org/academic-printing";
const ORDER_URL = "/academic-printing/order";
const WHATSAPP_NUMBER = "2347065342818";
const SHARE_TEXT = "🎓 Deadline close? Upload or paste up to 20 pages to Mabrig Academic Assistance for formatting, printing, binding and campus delivery.";

const shareUrl = encodeURIComponent(SITE_URL);
const shareText = encodeURIComponent(SHARE_TEXT);
const contactText = encodeURIComponent("Hello Mabrig Academic Assistance. I want to use the 20-page Academic Document Formatting & Printing service.");

export default function SpecialServicePoster() {
  const [shareMessage, setShareMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setShareMessage("Link copied — share it with a student who needs it.");
    } catch {
      setShareMessage(`Copy this link: ${SITE_URL}`);
    }
  }

  return (
    <section id="special-service" className="special-service-section">
      <div className="container">
        <article className="poster-ad" aria-labelledby="special-service-title">
          <div className="poster-copy">
            <span className="poster-kicker">🔥 SPECIAL STUDENT SERVICE • UNN</span>
            <h2 id="special-service-title">Deadline Close? Don’t Let Formatting & Printing Delay Your Submission.</h2>
            <p className="poster-lead">
              Upload your academic work <strong>or paste it directly</strong> — up to <strong>20 pages</strong> — and send it straight into our print-shop workflow. We review the requirements, format where needed, convert, print, bind and arrange campus delivery.
            </p>
            <p className="poster-punch">Your work is written. Let us make it submission-ready.</p>

            <div className="poster-features" aria-label="Service features">
              <span>Upload or Paste</span>
              <span>Times New Roman • 12pt</span>
              <span>Single / 1.5 / Double spacing</span>
              <span>Citations & References</span>
              <span>Cover Page</span>
              <span>Binding & Campus Delivery</span>
            </div>

            <div className="poster-actions">
              <a className="poster-btn poster-btn-primary" href={ORDER_URL}>📄 Upload or Paste My Work</a>
              <a
                className="poster-btn poster-btn-whatsapp"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${contactText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 WhatsApp 07065342818
              </a>
            </div>
          </div>

          <aside className="poster-offer" aria-label="Printing prices and sharing">
            <div className="poster-limit">MAXIMUM <strong>20 PAGES</strong> PER SUBMISSION</div>
            <div className="poster-price-card">
              <span>BLACK & WHITE</span>
              <strong>₦30</strong>
              <small>per page</small>
            </div>
            <div className="poster-price-card">
              <span>COLOUR</span>
              <strong>₦100</strong>
              <small>per page</small>
            </div>
            <p className="poster-note">Formatting, binding and delivery charges depend on the service selected.</p>

            <div className="poster-share">
              <strong>Know a student with a deadline?</strong>
              <span>Share this service:</span>
              <div className="share-links">
                <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer">X</a>
                <button type="button" onClick={copyLink}>Copy Link</button>
              </div>
              {shareMessage && <small className="share-message" aria-live="polite">{shareMessage}</small>}
            </div>
          </aside>
        </article>
      </div>
    </section>
  );
}
