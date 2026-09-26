import { NextResponse } from "next/server";
import { attachmentContentDisposition, safeAttachmentFilename } from "@/lib/download-filename";
import {
  FileConversionError,
  conversionBaseName,
  convertDocxToPdf,
  convertPdfToDocx,
} from "@/lib/file-converter";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 4 * 1024 * 1024;

function hasPdfMagic(bytes: Uint8Array) {
  return bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;
}

function hasZipMagic(bytes: Uint8Array) {
  return bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const direction = String(form.get("direction") || "");
    const upload = form.get("file");

    if (!(upload instanceof File)) {
      return NextResponse.json({ error: "Choose a file to convert." }, { status: 400 });
    }
    if (!upload.size) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }
    if (upload.size > MAX_FILE_BYTES) {
      return NextResponse.json({
        error: "File is too large. The current converter accepts files up to 4MB.",
      }, { status: 413 });
    }

    const bytes = new Uint8Array(await upload.arrayBuffer());
    const base = conversionBaseName(upload.name);

    if (direction === "docx-to-pdf") {
      if (!upload.name.toLowerCase().endsWith(".docx")) {
        return NextResponse.json({
          error: "Word to PDF currently accepts .docx files. Legacy .doc files must first be saved as .docx.",
        }, { status: 415 });
      }
      if (!hasZipMagic(bytes)) {
        return NextResponse.json({ error: "This does not appear to be a valid DOCX file." }, { status: 415 });
      }

      const converted = await convertDocxToPdf(bytes, upload.name);
      const filename = safeAttachmentFilename(base, {
        extension: ".pdf",
        fallback: "converted-document",
      });

      return new Response(converted, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": attachmentContentDisposition(filename),
          "Content-Length": String(converted.byteLength),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Mabrig-Conversion": "docx-to-pdf",
        },
      });
    }

    if (direction === "pdf-to-docx") {
      if (!upload.name.toLowerCase().endsWith(".pdf") || !hasPdfMagic(bytes)) {
        return NextResponse.json({ error: "Choose a valid PDF file." }, { status: 415 });
      }

      const converted = await convertPdfToDocx(bytes, upload.name);
      const filename = safeAttachmentFilename(base, {
        extension: ".docx",
        fallback: "converted-document",
      });

      return new Response(new Uint8Array(converted), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": attachmentContentDisposition(filename),
          "Content-Length": String(converted.byteLength),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "X-Mabrig-Conversion": "pdf-to-docx",
        },
      });
    }

    return NextResponse.json({ error: "Choose a supported conversion direction." }, { status: 400 });
  } catch (error) {
    if (error instanceof FileConversionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("File conversion failed", error);
    return NextResponse.json({
      error: "The file could not be converted. Check that it is not corrupted or password-protected and try again.",
    }, { status: 500 });
  }
}
