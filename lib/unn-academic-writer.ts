export type UnnAcademicWorkType = "assignment" | "assessment" | "term-paper" | "seminar-paper";
export type UnnCitationStyle = "apa7" | "harvard" | "mla9" | "none";

export type UnnAcademicWriterInput = {
  workType: UnnAcademicWorkType;
  title: string;
  assignmentQuestion: string;
  lecturerInstructions?: string;
  sourceMaterial?: string;
  targetPages: number;
  citationStyle: UnnCitationStyle;
  includeAbstract: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const AI_TIMEOUT_MS = 120_000;
const MAX_SOURCE_CHARS = 60_000;
const MAX_INSTRUCTION_CHARS = 20_000;

export class UnnAcademicWriterError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "UnnAcademicWriterError";
  }
}

export function parseUnnAcademicWorkType(value: unknown): UnnAcademicWorkType {
  if (value === "assessment" || value === "term-paper" || value === "seminar-paper") return value;
  return "assignment";
}

export function parseUnnCitationStyle(value: unknown): UnnCitationStyle {
  if (value === "harvard" || value === "mla9" || value === "none") return value;
  return "apa7";
}

function endpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function stripCodeFence(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:markdown|text)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] || trimmed).trim();
}

function structureFor(input: UnnAcademicWriterInput) {
  if (input.workType === "term-paper") {
    return [
      input.includeAbstract ? "# ABSTRACT" : "",
      "# INTRODUCTION",
      "# LITERATURE REVIEW",
      "# METHODOLOGY",
      "# DISCUSSION / ANALYSIS",
      "# CONCLUSION",
      "# RECOMMENDATIONS",
      input.citationStyle === "none" ? "" : "# REFERENCES",
    ].filter(Boolean).join("\n");
  }

  if (input.workType === "seminar-paper") {
    return [
      input.includeAbstract ? "# ABSTRACT" : "",
      "# INTRODUCTION",
      "# CONCEPTUAL / LITERATURE REVIEW",
      "# MAIN DISCUSSION",
      "# IMPLICATIONS / CHALLENGES",
      "# CONCLUSION",
      input.citationStyle === "none" ? "" : "# REFERENCES",
    ].filter(Boolean).join("\n");
  }

  return [
    input.includeAbstract ? "# ABSTRACT" : "",
    "# INTRODUCTION",
    "# MAIN DISCUSSION",
    "# CONCLUSION",
    input.citationStyle === "none" ? "" : "# REFERENCES",
  ].filter(Boolean).join("\n");
}

export async function generateUnnAcademicPaper(input: UnnAcademicWriterInput) {
  const apiKey = process.env.AI_API_KEY?.trim();
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!apiKey || !baseUrl || !model) {
    throw new UnnAcademicWriterError(
      "Academic Writer AI is not configured. Add AI_API_KEY, AI_BASE_URL and AI_MODEL.",
      503,
    );
  }

  const title = input.title.trim();
  const assignmentQuestion = input.assignmentQuestion.trim();
  if (!title || !assignmentQuestion) {
    throw new UnnAcademicWriterError("Add the topic/title and the assignment question or brief.");
  }

  const targetPages = Math.min(20, Math.max(1, Math.round(input.targetPages || 5)));
  const targetWords = Math.min(7_000, Math.max(700, targetPages * 350));
  const sourceMaterial = (input.sourceMaterial || "").trim().slice(0, MAX_SOURCE_CHARS);
  const lecturerInstructions = (input.lecturerInstructions || "").trim().slice(0, MAX_INSTRUCTION_CHARS);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://mabrig-academic-assistance.vercel.app";
    headers["X-Title"] = "Mabrig UNN Academic Writer";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint(baseUrl), {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: Math.min(14_000, Math.max(2_500, Math.ceil(targetWords * 1.8))),
        messages: [
          {
            role: "system",
            content: [
              "You are an academic writing assistant for University of Nigeria, Nsukka students.",
              "Produce a strong university-level draft that the student must review, verify and adapt before submission.",
              "Follow the lecturer's specific instructions whenever they conflict with the default structure.",
              "Use clear Nigerian university academic English, coherent paragraphs and meaningful headings.",
              "Do not fabricate citations, references, quotations, statistics, authors, dates, findings or URLs.",
              "Use only verifiable sources supplied by the user for source-specific claims.",
              "If citations or a reference list are required but no verified sources were supplied, insert [Add verified citation] and [Add verified source] placeholders instead of inventing references.",
              "Do not add a title page; the Word renderer creates the UNN title page from student/course metadata.",
              "Use Markdown headings exactly so the Word renderer can style the document.",
              "Return only the paper content. Do not add commentary or code fences.",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Work type: ${input.workType}`,
              `Topic/title: ${title}`,
              `Target length: approximately ${targetWords} words (${targetPages} pages at the selected UNN preset)`,
              `Citation style: ${input.citationStyle}`,
              `Preferred section framework:\n${structureFor(input)}`,
              `Assignment question / brief:\n${assignmentQuestion}`,
              lecturerInstructions ? `Lecturer / departmental instructions (take priority):\n${lecturerInstructions}` : "",
              sourceMaterial ? `Verified notes, source extracts or references supplied by the student:\n${sourceMaterial}` : "No verified source material was supplied. Do not invent references.",
            ].filter(Boolean).join("\n\n"),
          },
        ],
      }),
    });

    const payload = await response.json().catch(() => null) as ChatCompletionResponse | null;
    if (!response.ok) {
      console.error("UNN Academic Writer provider error", { status: response.status, message: payload?.error?.message });
      throw new UnnAcademicWriterError(
        "The Academic Writer could not complete this draft. Check the configured AI provider, model and credit balance.",
        502,
      );
    }

    const text = stripCodeFence(payload?.choices?.[0]?.message?.content || "");
    if (!text) throw new UnnAcademicWriterError("The Academic Writer returned an empty draft. Please try again.", 502);
    return text;
  } catch (error) {
    if (error instanceof UnnAcademicWriterError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new UnnAcademicWriterError("The Academic Writer timed out. Try a shorter page target and try again.", 504);
    }
    console.error("UNN Academic Writer request failed", error);
    throw new UnnAcademicWriterError("The Academic Writer is temporarily unavailable.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
