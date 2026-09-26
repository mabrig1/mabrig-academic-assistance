import { NextResponse } from "next/server";
import { attachmentContentDisposition, safeAttachmentFilename } from "@/lib/download-filename";
import {
  generateUnnAcademicPaper,
  parseUnnAcademicWorkType,
  parseUnnCitationStyle,
  UnnAcademicWriterError,
} from "@/lib/unn-academic-writer";
import { buildUnnAcademicWordDocument } from "@/lib/unn-academic-word";
import {
  applyVerifiedCitationMarkers,
  discoverVerifiedReferences,
  extractDoiList,
  type ReferenceMode,
  type VerifiedReference,
} from "@/lib/verified-references";

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

function boundedNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function parseReferenceMode(value: FormDataEntryValue | null): ReferenceMode {
  if (value === "provided-only" || value === "off") return value;
  return "agentic";
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
    const targetPages = boundedNumber(form.get("targetPages"), 5, 1, 20);
    const includeAbstract = toggle(form, "includeAbstract", workType === "term-paper" || workType === "seminar-paper");
    const includeTableOfContents = toggle(form, "includeTableOfContents", workType === "term-paper");
    const includeVerificationAppendix = toggle(form, "includeVerificationAppendix", false);
    const referenceMode = parseReferenceMode(form.get("referenceMode"));
    const currentYear = new Date().getFullYear();
    const targetReferences = boundedNumber(form.get("targetReferences"), 8, 3, 12);
    const fromYear = boundedNumber(form.get("referenceYearStart"), Math.max(2000, currentYear - 10), 1950, currentYear);
    const toYear = boundedNumber(form.get("referenceYearEnd"), currentYear, fromYear, currentYear);
    const selectedDois = field(form, "selectedDois", 8_000)
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (!title || !studentName || !registrationNumber || !faculty || !department || !courseCode || !assignmentQuestion) {
      return NextResponse.json({
        error: "Complete the topic, student name, registration number, faculty, department, course code and assignment question.",
      }, { status: 400 });
    }

    let verifiedReferences: VerifiedReference[] = [];
    if (citationStyle !== "none" && referenceMode !== "off") {
      if (referenceMode === "provided-only" && !selectedDois.length && !extractDoiList(sourceMaterial).length) {
        return NextResponse.json({
          error: "Provided-only verification needs at least one DOI in your source material or selected source list.",
        }, { status: 400 });
      }

      const research = await discoverVerifiedReferences({
        title,
        assignmentQuestion,
        sourceMaterial,
        targetCount: targetReferences,
        fromYear,
        toYear,
        selectedDois,
        mode: referenceMode,
      });
      verifiedReferences = research.references;

      if (!verifiedReferences.length) {
        return NextResponse.json({
          error: "No references passed DOI, metadata and retraction verification. Widen the year range, change the topic keywords, paste verified DOIs, or choose No references.",
        }, { status: 422 });
      }
    }

    const rawGeneratedText = await generateUnnAcademicPaper({
      workType,
      title,
      assignmentQuestion,
      lecturerInstructions,
      sourceMaterial,
      targetPages,
      citationStyle,
      includeAbstract,
      verifiedReferences,
    });

    const citationResult = verifiedReferences.length
      ? applyVerifiedCitationMarkers(rawGeneratedText, verifiedReferences, citationStyle)
      : { text: rawGeneratedText, usedReferences: [] };

    if (verifiedReferences.length && citationResult.usedReferences.length === 0) {
      return NextResponse.json({
        error: "The draft did not attach any verified source markers to its claims, so the system stopped rather than create an uncited reference list. Please try again.",
      }, { status: 422 });
    }

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
      includeVerificationAppendix,
      verifiedReferences: citationResult.usedReferences,
      generatedText: citationResult.text,
    });

    const filename = safeAttachmentFilename(`${studentName}-${courseCode}-${workType}`, {
      extension: ".docx",
      fallback: "UNN-academic-paper",
    });

    const minQuality = citationResult.usedReferences.length
      ? Math.min(...citationResult.usedReferences.map(reference => reference.qualityScore))
      : 0;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": attachmentContentDisposition(filename),
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Academic-Writer": "UNN-Agentic-Verified",
        "X-Work-Type": workType,
        "X-AI-Used": "true",
        "X-Verified-References": String(citationResult.usedReferences.length),
        "X-Min-Reference-Quality": String(minQuality),
        "X-Retraction-Check": citationResult.usedReferences.length ? "passed" : "not-applicable",
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
