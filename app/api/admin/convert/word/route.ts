import { NextResponse } from "next/server";
import { buildAcademicWordDocument } from "@/lib/word-document";

export const runtime = "nodejs";

const MAX_CHARS = 120_000;

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 100);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const text = String(form.get("text") || "").trim();
    const title = String(form.get("title") || "Academic Document").trim() || "Academic Document";
    const studentName = String(form.get("studentName") || "").trim();
    const font = String(form.get("font") || "Times New Roman").trim() || "Times New Roman";
    const fontSize = Math.min(30, Math.max(8, Number(form.get("fontSize") || 12)));
    const spacing = String(form.get("spacing") || "1.5");
    const coverPage = form.get("coverPage") === "on";
    const references = form.get("references") === "on";

    if (!text) return NextResponse.json({ error: "Paste text before converting to Word." }, { status: 400 });
    if (text.length > MAX_CHARS) return NextResponse.json({ error: "Text is too long for the instant converter." }, { status: 413 });

    const buffer = await buildAcademicWordDocument({
      text,
      title,
      studentName,
      font,
      fontSize,
      spacing,
      coverPage,
      references,
    });

    const filename = safeFilename(`${title || "academic-document"}.docx`);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Standalone Word conversion failed", error);
    return NextResponse.json({ error: "Unable to generate the Word document." }, { status: 500 });
  }
}
