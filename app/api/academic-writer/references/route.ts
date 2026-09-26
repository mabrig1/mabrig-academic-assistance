import { NextResponse } from "next/server";
import {
  discoverVerifiedReferences,
  extractDoiList,
  publicReferenceSnapshot,
  type ReferenceMode,
} from "@/lib/verified-references";

export const runtime = "nodejs";
export const maxDuration = 90;

function field(form: FormData, name: string, max = 20_000) {
  return String(form.get(name) || "").trim().slice(0, max);
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
    const title = field(form, "title", 300);
    const assignmentQuestion = field(form, "assignmentQuestion", 30_000);
    const sourceMaterial = field(form, "sourceMaterial", 60_000);
    const mode = parseReferenceMode(form.get("referenceMode"));
    const currentYear = new Date().getFullYear();
    const targetCount = boundedNumber(form.get("targetReferences"), 8, 3, 12);
    const fromYear = boundedNumber(form.get("referenceYearStart"), Math.max(2000, currentYear - 10), 1950, currentYear);
    const toYear = boundedNumber(form.get("referenceYearEnd"), currentYear, fromYear, currentYear);

    if (!title || !assignmentQuestion) {
      return NextResponse.json({ error: "Add the topic and assignment question before discovering references." }, { status: 400 });
    }
    if (mode === "off") {
      return NextResponse.json({ queries: [], sources: [], message: "Reference research is turned off." });
    }
    if (mode === "provided-only" && !extractDoiList(sourceMaterial).length) {
      return NextResponse.json({
        error: "Paste at least one DOI into the notes/source field for provided-only verification.",
      }, { status: 400 });
    }

    const research = await discoverVerifiedReferences({
      title,
      assignmentQuestion,
      sourceMaterial,
      targetCount,
      fromYear,
      toYear,
      mode,
    });

    return NextResponse.json({
      ok: true,
      queries: research.queries,
      sources: research.references.map(publicReferenceSnapshot),
      retractionCheck: "Crossref update/retraction metadata",
      semanticScholarEnrichment: research.references.some(reference => reference.verificationSources.includes("Semantic Scholar")),
    });
  } catch (error) {
    console.error("Verified reference discovery failed", error);
    return NextResponse.json({ error: "Unable to discover and verify references right now." }, { status: 500 });
  }
}
