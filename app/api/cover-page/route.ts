import { NextResponse } from "next/server";
import { attachmentContentDisposition, safeAttachmentFilename } from "@/lib/download-filename";
import {
  buildCoverPageDocument,
  coverTemplateLabel,
  parseCoverTemplate,
} from "@/lib/cover-page";

export const runtime = "nodejs";
export const maxDuration = 30;

function field(form: FormData, name: string, max = 300) {
  return String(form.get(name) || "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const template = parseCoverTemplate(form.get("template"));
    const title = field(form, "title", 500);
    const studentName = field(form, "studentName", 180);

    if (!title || !studentName) {
      return NextResponse.json({
        error: "Add the cover-page title and student name.",
      }, { status: 400 });
    }

    const buffer = await buildCoverPageDocument({
      template,
      institution: field(form, "institution", 240) || "UNIVERSITY OF NIGERIA, NSUKKA",
      faculty: field(form, "faculty", 180),
      department: field(form, "department", 180),
      workType: field(form, "workType", 100),
      title,
      subtitle: field(form, "subtitle", 300),
      studentName,
      registrationNumber: field(form, "registrationNumber", 100),
      courseCode: field(form, "courseCode", 80),
      courseTitle: field(form, "courseTitle", 180),
      lecturer: field(form, "lecturer", 180),
      session: field(form, "session", 80),
      date: field(form, "date", 100),
    });

    const filename = safeAttachmentFilename(
      studentName + "-" + title.slice(0, 50) + "-cover-page",
      { extension: ".docx", fallback: "academic-cover-page" },
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": attachmentContentDisposition(filename),
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Cover-Template": coverTemplateLabel(template),
      },
    });
  } catch (error) {
    console.error("Cover page generation failed", error);
    return NextResponse.json({
      error: "The cover page could not be generated. Please check the fields and try again.",
    }, { status: 500 });
  }
}
