"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type Direction = "docx-to-pdf" | "pdf-to-docx";

function downloadNameFromDisposition(disposition: string, fallback: string) {
  const utf = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    try { return decodeURIComponent(utf[1]); } catch { return fallback; }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain?.[1] || fallback;
}

export default function FileConverterForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [direction, setDirection] = useState<Direction>("docx-to-pdf");
  const [selectedName, setSelectedName] = useState("");
  const [message, setMessage] = useState("");
  const [converting, setConverting] = useState(false);

  const config = useMemo(() => direction === "docx-to-pdf"
    ? {
        accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        label: "Word (.docx) to PDF",
        source: "DOCX",
        target: "PDF",
        fallback: "converted-document.pdf",
      }
    : {
        accept: ".pdf,application/pdf",
        label: "PDF to Word (.docx)",
        source: "PDF",
        target: "DOCX",
        fallback: "converted-document.docx",
      }, [direction]);

  function chooseDirection(next: Direction) {
    setDirection(next);
    setSelectedName("");
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");

    if (!(file instanceof File) || !file.size) {
      setMessage("Choose a " + config.source + " file first.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage("This file is above the current 4MB conversion limit.");
      return;
    }

    setConverting(true);
    setMessage("Converting " + file.name + "...");

    try {
      form.set("direction", direction);
      const response = await fetch("/api/file-converter", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error || "The file could not be converted.");
        return;
      }

      const blob = await response.blob();
      const filename = downloadNameFromDisposition(
        response.headers.get("Content-Disposition") || "",
        config.fallback,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Conversion complete. Your " + config.target + " file has been prepared for download.");
    } catch {
      setMessage("The converter could not connect. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  return <div className="card converter-card">
    <span className="badge">Mabrig File Converter</span>
    <h2>Convert Word and PDF Files</h2>
    <p>Convert academic and office documents directly in the browser workflow without sending them to a third-party conversion website.</p>

    <div className="converter-switch" role="group" aria-label="Conversion direction">
      <button
        className={"converter-switch-btn " + (direction === "docx-to-pdf" ? "active" : "")}
        type="button"
        onClick={() => chooseDirection("docx-to-pdf")}
      >
        DOCX → PDF
      </button>
      <button
        className={"converter-switch-btn " + (direction === "pdf-to-docx" ? "active" : "")}
        type="button"
        onClick={() => chooseDirection("pdf-to-docx")}
      >
        PDF → DOCX
      </button>
    </div>

    <form onSubmit={submit}>
      <input type="hidden" name="direction" value={direction} />
      <label className="converter-dropzone">
        <strong>{config.label}</strong>
        <span>{selectedName || "Tap to choose a " + config.source + " file"}</span>
        <small>Maximum file size: 4MB</small>
        <input
          ref={inputRef}
          name="file"
          type="file"
          accept={config.accept}
          required
          onChange={event => {
            const file = event.target.files?.[0];
            setSelectedName(file?.name || "");
            setMessage("");
          }}
        />
      </label>

      <div className="notice converter-notice">
        {direction === "docx-to-pdf"
          ? "DOCX → PDF creates a clean text-first PDF with paragraph flow and page numbering. Complex Word layouts, floating images and advanced tables may not reproduce exactly."
          : "PDF → DOCX extracts selectable text into an editable Word document. Scanned/image-only PDFs need OCR and will be flagged instead of producing an empty Word file."}
      </div>

      <div className="actions">
        <button className="btn primary" type="submit" disabled={converting}>
          {converting ? "Converting..." : "Convert " + config.source + " to " + config.target}
        </button>
        <a className="btn secondary" href="/academic-printing/order">Send Converted File for Printing</a>
      </div>
      {message && <div className="form-message">{message}</div>}
    </form>
  </div>;
}
