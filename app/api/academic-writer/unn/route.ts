import { NextResponse } from "next/server";
import { attachmentContentDisposition, safeAttachmentFilename } from "@/lib/download-filename";
import {
  generateUnnAcademicPaper,
  parseUnnAcademicWorkType,
  parseUnnCitationStyle,
  UnnAcademicWriterError,
} from "@/lib/unn-academic-writer";
import { buildUnnAcademicWordDocument } from "@/lib/unn-academic-word";

export const runtime = "nodejs";
export const maxDuration = 180;

function field(form: FormData, name: string, max = 20_000) {
  return String(form.get(name) || "").trim().slice(0, max);
}

function toggle(form: FormData, name: string, fallback = false) {
  const values = form.getAll(name).map(value => String(value).toLowerCase());
  if (!values.length) return fallback;
  return values.some(value => value === "on" || value === "true" || value === "1");
}

function boundedPages(value: FormDataEntryValue | null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 5;
  return Math.min(20, Math.max(1, Math.round(numeric)));
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const workType = parseUnnAcademicWorkType(form.get("workType"));
    const citationStyle = parseUnnCitationStyle(form.get("citationStyle"));
    const title = field(form, "title", 300);
    const studentName = field(form, "studentName", 160);
    const registrationNumber = field(form, "registrationNumber", 80);
    const faculty = field(form, "faculty", 160);
    const department = field(form, "department", 160);
    const courseCode = field(form, "courseCode", 80);
    const courseTitle = field(form, "courseTitle", 160);
    const lecturer = field(form, "lecturer", 160);
    const session = field(form, "session", 80);
    const submissionDate = field(form, "submissionDate", 80);
    const assignmentQuestion = field(form, "assignmentQuestion", 30_000);
    const lecturerInstructions = field(form, "lecturerInstructions", 20_000);
    const sourceMaterial = field(form, "sourceMaterial", 60_000);
    const targetPages = boundedPages(form.get("targetPages"));
    const includeAbstract = toggle(form, "includeAbstract", workType === "term-paper" || workType === "seminar-paper");
    const includeTableOfContents = toggle(form, "includeTableOfContents", workType === "term-paper");

    if (!title || !studentName || !registrationNumber || !faculty || !department || !courseCode || !assignmentQuestion) {
      return NextResponse.json({
        error: "Complete the topic, student name, registration number, faculty, department, course code and assignment question.",
      }, { status: 400 });
    }

    const generatedText = await generateUnnAcademicPaper({
      workType,
      title,
      assignmentQuestion,
      lecturerInstructions,
      sourceMaterial,
      targetPages,
      citationStyle,
      includeAbstract,
    });

    const buffer = await buildUnnAcademicWordDocument({
      workType,
      title,
      studentName,
      registrationNumber,
      faculty,
      department,
      courseCode,
      courseTitle,
      lecturer,
      session,
      submissionDate,
      citationStyle,
      includeTableOfContents,
      generatedText,
    });

    const filename = safeAttachmentFilename(`${studentName}-${courseCode}-${workType}`, {
      extension: ".docx",
      fallback: "UNN-academic-paper",
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": attachmentContentDisposition(filename),
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Academic-Writer": "UNN",
        "X-Work-Type": workType,
        "X-AI-Used": "true",
      },
    });
  } catch (error) {
    if (error instanceof UnnAcademicWriterError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("UNN Academic Writer failed", error);
    return NextResponse.json({ error: "Unable to generate the academic Word document." }, { status: 500 });
  }
}
