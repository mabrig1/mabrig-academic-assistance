import { NextResponse } from "next/server";
import {
  DocumentTransformationError,
  parseDocumentTransformationMode,
  transformAcademicText,
} from "@/lib/ai-document-transform";
import {
  formToggleEnabled,
  parseBodyAlignment,
  parseParagraphIndentation,
} from "@/lib/document-format-options";
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
    const transformationMode = parseDocumentTransformationMode(form.get("transformationMode"));
    const bodyAlignment = parseBodyAlignment(form.get("bodyAlignment"));
    const paragraphIndentation = parseParagraphIndentation(form.get("paragraphIndentation"));
    const boldHeadings = formToggleEnabled(form, "boldHeadings");
    const cleanSpecialCharacters = formToggleEnabled(form, "cleanSpecialCharacters");

    if (!text) return NextResponse.json({ error: "Paste text before converting to Word." }, { status: 400 });
    if (text.length > MAX_CHARS) return NextResponse.json({ error: "Text is too long for the instant converter." }, { status: 413 });

    const transformed = await transformAcademicText({ text, title, mode: transformationMode });
    const buffer = await buildAcademicWordDocument({
      text: transformed.text,
      title,
      studentName,
      font,
      fontSize,
      spacing,
      coverPage,
      references,
      bodyAlignment,
      paragraphIndentation,
      boldHeadings,
      cleanSpecialCharacters,
    });

    const filename = safeFilename(`${title || "academic-document"}.docx`);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Text-Transformation": transformationMode,
        "X-Text-Changed": transformed.changed ? "true" : "false",
      },
    });
  } catch (error) {
    if (error instanceof DocumentTransformationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Standalone Word conversion failed", error);
    return NextResponse.json({ error: "Unable to generate the Word document." }, { status: 500 });
  }
}
