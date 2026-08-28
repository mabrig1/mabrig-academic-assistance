import { NextResponse } from "next/server";
import { attachmentContentDisposition, safeAttachmentFilename } from "@/lib/download-filename";
import {
  buildNounThesisWordDocument,
  generateNounThesis,
  NounThesisError,
  parseNounDegreeLevel,
  parseNounWriterMode,
  titleWordCount,
  type NounThesisInput,
} from "@/lib/noun-thesis";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_CONTEXT_CHARS = 120_000;

function field(form: FormData, name: string, max = 20_000) {
  return String(form.get(name) || "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const mode = parseNounWriterMode(form.get("mode"));
    const degreeLevel = parseNounDegreeLevel(form.get("degreeLevel"));
    const title = field(form, "title", 300);
    const studentName = field(form, "studentName", 160);
    const matricNumber = field(form, "matricNumber", 80);
    const faculty = field(form, "faculty", 160);
    const department = field(form, "department", 160);
    const programme = field(form, "programme", 160);
    const award = field(form, "award", 200);
    const studyCentre = field(form, "studyCentre", 160);
    const supervisor = field(form, "supervisor", 160);
    const monthYear = field(form, "monthYear", 80);
    const targetPages = Math.min(100, Math.max(4, Math.round(Number(form.get("targetPages") || 50))));

    if (!title || !studentName || !matricNumber || !faculty || !department || !programme || !award || !monthYear) {
      return NextResponse.json({ error: "Complete the thesis title, student, matric number, faculty, department, programme, award and completion date." }, { status: 400 });
    }
    if (titleWordCount(title) > 23) {
      return NextResponse.json({ error: "NOUN Faculty of Education guidance limits a project/dissertation/thesis title to a maximum of 23 words. Shorten the title or record a faculty-specific exception in the instructions." }, { status: 400 });
    }

    const input: NounThesisInput = {
      mode,
      degreeLevel,
      targetPages,
      title,
      studentName,
      matricNumber,
      faculty,
      department,
      programme,
      award,
      studyCentre,
      supervisor,
      monthYear,
      backgroundBrief: field(form, "backgroundBrief", MAX_CONTEXT_CHARS),
      problemStatement: field(form, "problemStatement", MAX_CONTEXT_CHARS),
      objectives: field(form, "objectives", MAX_CONTEXT_CHARS),
      researchQuestions: field(form, "researchQuestions", MAX_CONTEXT_CHARS),
      methodology: field(form, "methodology", MAX_CONTEXT_CHARS),
      findingsData: field(form, "findingsData", MAX_CONTEXT_CHARS),
      verifiedSources: field(form, "verifiedSources", MAX_CONTEXT_CHARS),
      dedication: field(form, "dedication", 5_000),
      acknowledgement: field(form, "acknowledgement", 12_000),
      appendices: field(form, "appendices", 60_000),
      facultyInstructions: field(form, "facultyInstructions", 20_000),
      automaticTableOfContents: form.get("automaticTableOfContents") === "on",
    };

    const generated = await generateNounThesis(input);
    const buffer = await buildNounThesisWordDocument(input, generated);
    const filename = safeAttachmentFilename(`${studentName}-${mode === "full" ? "NOUN-Thesis" : `NOUN-${mode}`}`, {
      extension: ".docx",
      fallback: "NOUN-thesis-draft",
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": attachmentContentDisposition(filename),
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-NOUN-Writer-Mode": mode,
        "X-NOUN-Degree-Level": degreeLevel,
        "X-AI-Used": "true",
      },
    });
  } catch (error) {
    if (error instanceof NounThesisError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("NOUN thesis writer failed", error);
    return NextResponse.json({ error: "Unable to generate the NOUN thesis document." }, { status: 500 });
  }
}
