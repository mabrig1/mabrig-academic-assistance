import type { UnnCitationStyle } from "./unn-academic-writer";

export type ReferenceMode = "agentic" | "provided-only" | "off";

export type VerifiedReference = {
  id: string;
  title: string;
  authors: Array<{ given?: string; family: string }>;
  year: number;
  journal?: string;
  publisher?: string;
  doi: string;
  url: string;
  type?: string;
  abstract?: string;
  citationCount?: number;
  openAccess?: boolean;
  qualityScore: number;
  evidenceLevel: "abstract" | "metadata";
  verificationSources: string[];
  issues: string[];
  retractionChecked: boolean;
  retracted: boolean;
};

export type VerifiedReferenceSearchInput = {
  title: string;
  assignmentQuestion: string;
  sourceMaterial?: string;
  targetCount?: number;
  fromYear?: number;
  toYear?: number;
  selectedDois?: string[];
  mode?: ReferenceMode;
};

type CrossrefWork = {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  published?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  publisher?: string;
  type?: string;
  URL?: string;
  abstract?: string;
  score?: number;
  "updated-by"?: Array<{ type?: string; label?: string; source?: string }>;
  "update-to"?: Array<{ type?: string; label?: string; source?: string }>;
};

type SemanticScholarPaper = {
  title?: string;
  abstract?: string | null;
  year?: number | null;
  venue?: string | null;
  citationCount?: number | null;
  externalIds?: { DOI?: string | null };
  openAccessPdf?: { url?: string | null } | null;
};

const CROSSREF_BASE = "https://api.crossref.org/works";
const SEMANTIC_SCHOLAR_BATCH = "https://api.semanticscholar.org/graph/v1/paper/batch";
const REQUEST_TIMEOUT_MS = 18_000;
const MAX_QUERY_COUNT = 4;
const MAX_CANDIDATES_TO_VERIFY = 30;

function aiEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function safeYear(work: CrossrefWork) {
  const candidates = [
    work.published?.["date-parts"]?.[0]?.[0],
    work.issued?.["date-parts"]?.[0]?.[0],
    work.created?.["date-parts"]?.[0]?.[0],
  ];
  return candidates.find(value => Number.isInteger(value) && Number(value) > 1500) || 0;
}

function normalizeDoi(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[\s.,;:)\]}]+$/g, "")
    .toLowerCase();
}

export function extractDoiList(value: string) {
  const matches = value.match(/10\.\d{4,9}\/[\-._;()/:A-Z0-9]+/gi) || [];
  return [...new Set(matches.map(normalizeDoi).filter(Boolean))].slice(0, 30);
}

function titleTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(token => token.length >= 4),
  );
}

function relevanceScore(candidateTitle: string, topic: string) {
  const candidate = titleTokens(candidateTitle);
  const desired = titleTokens(topic);
  if (!candidate.size || !desired.size) return 0;
  let overlap = 0;
  desired.forEach(token => {
    if (candidate.has(token)) overlap += 1;
  });
  return Math.min(10, Math.round((overlap / Math.min(desired.size, 10)) * 14));
}

function crossrefHeaders() {
  const mailto = process.env.CROSSREF_MAILTO?.trim();
  return {
    Accept: "application/json",
    "User-Agent": mailto
      ? `MabrigAcademicAssistance/1.0 (mailto:${mailto})`
      : "MabrigAcademicAssistance/1.0",
  };
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackQueries(input: VerifiedReferenceSearchInput) {
  const title = input.title.trim();
  const question = input.assignmentQuestion
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return [...new Set([
    title,
    question && question !== title ? `${title} ${question}` : "",
    `${title} review`,
  ].filter(Boolean))].slice(0, MAX_QUERY_COUNT);
}

async function planResearchQueries(input: VerifiedReferenceSearchInput) {
  const apiKey = process.env.AI_API_KEY?.trim();
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!apiKey || !baseUrl || !model) return fallbackQueries(input);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://mabrig-academic-assistance.vercel.app";
    headers["X-Title"] = "Mabrig Verified References Agent";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(aiEndpoint(baseUrl), {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: [
              "You are the research-planning agent for a scholarly reference verifier.",
              "Create 3 to 4 concise bibliographic search queries that cover the central concept, theory/evidence, and application/context of the assignment.",
              "Do not invent authors or paper titles.",
              "Return only a JSON array of strings.",
            ].join(" "),
          },
          {
            role: "user",
            content: `Topic: ${input.title}\nAssignment brief: ${input.assignmentQuestion.slice(0, 4000)}`,
          },
        ],
      }),
    });
    if (!response.ok) return fallbackQueries(input);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = payload.choices?.[0]?.message?.content?.trim() || "";
    const match = raw.match(/\[[\s\S]*\]/);
    const parsed = match ? JSON.parse(match[0]) : null;
    if (!Array.isArray(parsed)) return fallbackQueries(input);
    const queries = parsed
      .map(value => String(value).replace(/\s+/g, " ").trim())
      .filter(value => value.length >= 3 && value.length <= 220);
    return [...new Set(queries)].slice(0, MAX_QUERY_COUNT).length
      ? [...new Set(queries)].slice(0, MAX_QUERY_COUNT)
      : fallbackQueries(input);
  } catch {
    return fallbackQueries(input);
  } finally {
    clearTimeout(timeout);
  }
}

async function searchCrossref(query: string, fromYear: number, toYear: number) {
  const params = new URLSearchParams({
    "query.bibliographic": query,
    rows: "8",
    filter: `from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31`,
  });
  const mailto = process.env.CROSSREF_MAILTO?.trim();
  if (mailto) params.set("mailto", mailto);
  const payload = await fetchJson(`${CROSSREF_BASE}?${params.toString()}`, { headers: crossrefHeaders() }) as {
    message?: { items?: CrossrefWork[] };
  };
  return payload.message?.items || [];
}

async function exactCrossref(doi: string) {
  const params = new URLSearchParams();
  const mailto = process.env.CROSSREF_MAILTO?.trim();
  if (mailto) params.set("mailto", mailto);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  try {
    const payload = await fetchJson(`${CROSSREF_BASE}/${encodeURIComponent(doi)}${suffix}`, {
      headers: crossrefHeaders(),
    }) as { message?: CrossrefWork };
    return payload.message || null;
  } catch {
    return null;
  }
}

function hasUpdateType(work: CrossrefWork, pattern: RegExp) {
  const updates = [...(work["updated-by"] || []), ...(work["update-to"] || [])];
  return updates.some(update => pattern.test(`${update.type || ""} ${update.label || ""}`));
}

async function semanticScholarBatch(dois: string[]) {
  if (!dois.length) return new Map<string, SemanticScholarPaper>();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
  if (key) headers["x-api-key"] = key;

  try {
    const payload = await fetchJson(
      `${SEMANTIC_SCHOLAR_BATCH}?fields=title,abstract,year,venue,citationCount,externalIds,openAccessPdf`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: dois.map(doi => `DOI:${doi}`) }),
      },
    ) as Array<SemanticScholarPaper | null>;
    const mapped = new Map<string, SemanticScholarPaper>();
    payload.forEach(paper => {
      const doi = paper?.externalIds?.DOI ? normalizeDoi(paper.externalIds.DOI) : "";
      if (doi && paper) mapped.set(doi, paper);
    });
    return mapped;
  } catch {
    return new Map<string, SemanticScholarPaper>();
  }
}

function authorsFromCrossref(work: CrossrefWork) {
  return (work.author || [])
    .map(author => ({
      given: author.given?.trim() || undefined,
      family: (author.family || author.name || "").trim(),
    }))
    .filter(author => author.family);
}

function candidateToVerified(
  work: CrossrefWork,
  semantic: SemanticScholarPaper | undefined,
  topic: string,
  id: string,
): VerifiedReference | null {
  const doi = work.DOI ? normalizeDoi(work.DOI) : "";
  const title = (work.title?.[0] || "").replace(/\s+/g, " ").trim();
  const authors = authorsFromCrossref(work);
  const year = safeYear(work);
  if (!doi || !title || !authors.length || !year) return null;

  const retracted = hasUpdateType(work, /retract|withdraw/i);
  const correction = hasUpdateType(work, /correct|errat/i);
  const type = work.type || "";
  const journal = work["container-title"]?.[0]?.trim() || semantic?.venue?.trim() || undefined;
  const abstract = stripTags(semantic?.abstract || work.abstract || "").slice(0, 2600) || undefined;
  const verificationSources = ["Crossref DOI"];
  if (semantic) verificationSources.push("Semantic Scholar");

  const issues: string[] = [];
  if (!abstract) issues.push("No abstract available for claim-level evidence");
  if (/posted-content|preprint/i.test(type)) issues.push("Preprint / posted content");
  if (correction) issues.push("Record has a correction or erratum relationship");
  if (retracted) issues.push("Retraction or withdrawal relationship detected");

  let score = 40;
  if (journal) score += 10;
  if (authors.length) score += 8;
  if (year) score += 7;
  if (abstract) score += 15;
  if (semantic) score += 5;
  if (semantic?.citationCount && semantic.citationCount > 0) {
    score += Math.min(5, Math.max(1, Math.round(Math.log10(semantic.citationCount + 1) * 2)));
  }
  score += relevanceScore(title, topic);
  if (/posted-content|preprint/i.test(type)) score -= 15;
  if (retracted) score = 0;

  return {
    id,
    title,
    authors,
    year,
    journal,
    publisher: work.publisher?.trim() || undefined,
    doi,
    url: `https://doi.org/${doi}`,
    type,
    abstract,
    citationCount: semantic?.citationCount ?? undefined,
    openAccess: Boolean(semantic?.openAccessPdf?.url),
    qualityScore: Math.max(0, Math.min(100, score)),
    evidenceLevel: abstract ? "abstract" : "metadata",
    verificationSources,
    issues,
    retractionChecked: true,
    retracted,
  };
}

function initialCandidateScore(work: CrossrefWork, topic: string) {
  const title = work.title?.[0] || "";
  let score = relevanceScore(title, topic) * 4;
  if (work.DOI) score += 20;
  if (work.abstract) score += 10;
  if (work["container-title"]?.[0]) score += 5;
  if (/journal-article|proceedings-article|book-chapter/i.test(work.type || "")) score += 8;
  if (/posted-content|preprint/i.test(work.type || "")) score -= 8;
  return score;
}

async function verifyExactCandidates(works: CrossrefWork[], topic: string, targetCount: number) {
  const unique = new Map<string, CrossrefWork>();
  works.forEach(work => {
    const doi = work.DOI ? normalizeDoi(work.DOI) : "";
    if (doi && !unique.has(doi)) unique.set(doi, work);
  });

  const selected = [...unique.values()]
    .sort((a, b) => initialCandidateScore(b, topic) - initialCandidateScore(a, topic))
    .slice(0, Math.min(MAX_CANDIDATES_TO_VERIFY, Math.max(12, targetCount * 3)));

  const exact: CrossrefWork[] = [];
  for (let start = 0; start < selected.length; start += 6) {
    const batch = selected.slice(start, start + 6);
    const records = await Promise.all(batch.map(work => exactCrossref(normalizeDoi(work.DOI || ""))));
    records.forEach(record => {
      if (record) exact.push(record);
    });
  }

  const semantic = await semanticScholarBatch(exact.map(work => normalizeDoi(work.DOI || "")).filter(Boolean));
  const verified = exact
    .map((work, index) => candidateToVerified(
      work,
      semantic.get(normalizeDoi(work.DOI || "")),
      topic,
      `VR${index + 1}`,
    ))
    .filter((item): item is VerifiedReference => Boolean(item))
    .filter(item => !item.retracted && item.qualityScore >= 50)
    .sort((a, b) => {
      if (a.evidenceLevel !== b.evidenceLevel) return a.evidenceLevel === "abstract" ? -1 : 1;
      return b.qualityScore - a.qualityScore;
    })
    .slice(0, targetCount)
    .map((item, index) => ({ ...item, id: `VR${index + 1}` }));

  return verified;
}

async function verifyDois(dois: string[], topic: string) {
  const normalized = [...new Set(dois.map(normalizeDoi).filter(Boolean))].slice(0, 20);
  const exact: CrossrefWork[] = [];
  for (let start = 0; start < normalized.length; start += 6) {
    const records = await Promise.all(normalized.slice(start, start + 6).map(exactCrossref));
    records.forEach(record => {
      if (record) exact.push(record);
    });
  }
  const semantic = await semanticScholarBatch(exact.map(work => normalizeDoi(work.DOI || "")).filter(Boolean));
  return exact
    .map((work, index) => candidateToVerified(
      work,
      semantic.get(normalizeDoi(work.DOI || "")),
      topic,
      `VR${index + 1}`,
    ))
    .filter((item): item is VerifiedReference => Boolean(item))
    .filter(item => !item.retracted && item.qualityScore >= 50)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .map((item, index) => ({ ...item, id: `VR${index + 1}` }));
}

export async function discoverVerifiedReferences(input: VerifiedReferenceSearchInput) {
  const currentYear = new Date().getFullYear();
  const targetCount = Math.min(12, Math.max(3, Math.round(input.targetCount || 8)));
  const fromYear = Math.min(currentYear, Math.max(1950, Math.round(input.fromYear || currentYear - 10)));
  const toYear = Math.min(currentYear, Math.max(fromYear, Math.round(input.toYear || currentYear)));
  const topic = `${input.title} ${input.assignmentQuestion}`;

  const selectedDois = input.selectedDois?.map(normalizeDoi).filter(Boolean) || [];
  if (selectedDois.length) {
    return { queries: ["Selected DOI verification"], references: await verifyDois(selectedDois, topic) };
  }

  const suppliedDois = extractDoiList(input.sourceMaterial || "");
  if (input.mode === "provided-only") {
    return { queries: ["Provided DOI verification"], references: await verifyDois(suppliedDois, topic) };
  }

  const queries = await planResearchQueries(input);
  const batches = await Promise.all(
    queries.map(query => searchCrossref(query, fromYear, toYear).catch(() => [] as CrossrefWork[])),
  );
  const suppliedWorks = suppliedDois.length
    ? (await Promise.all(suppliedDois.map(exactCrossref))).filter((work): work is CrossrefWork => Boolean(work))
    : [];

  const references = await verifyExactCandidates(
    [...suppliedWorks, ...batches.flat()],
    topic,
    targetCount,
  );

  return { queries, references };
}

function familyNames(reference: VerifiedReference) {
  return reference.authors.map(author => author.family).filter(Boolean);
}

export function formatInTextCitation(reference: VerifiedReference, style: UnnCitationStyle) {
  const families = familyNames(reference);
  if (!families.length) return `(${reference.year})`;
  if (style === "mla9") {
    return families.length === 1 ? `(${families[0]})` : `(${families[0]} et al.)`;
  }
  const connector = style === "harvard" ? " and " : " & ";
  const authorText = families.length === 1
    ? families[0]
    : families.length === 2
      ? `${families[0]}${connector}${families[1]}`
      : `${families[0]} et al.`;
  return `(${authorText}, ${reference.year})`;
}

function authorReferenceText(reference: VerifiedReference, style: UnnCitationStyle) {
  const authors = reference.authors;
  if (!authors.length) return "";
  if (style === "mla9") {
    const first = authors[0];
    const firstName = [first.family, first.given].filter(Boolean).join(", ");
    return authors.length > 1 ? `${firstName}, et al.` : `${firstName}.`;
  }
  const rendered = authors.slice(0, 8).map(author => {
    const initials = (author.given || "")
      .split(/\s+/)
      .filter(Boolean)
      .map(part => `${part[0]?.toUpperCase() || ""}.`)
      .join(" ");
    return [author.family, initials].filter(Boolean).join(", ");
  });
  if (authors.length > 8) rendered.push("et al.");
  if (rendered.length === 1) return rendered[0];
  const joiner = style === "harvard" ? " and " : ", & ";
  return `${rendered.slice(0, -1).join(", ")}${joiner}${rendered.at(-1)}`;
}

export function formatVerifiedReference(reference: VerifiedReference, style: UnnCitationStyle) {
  const authors = authorReferenceText(reference, style);
  const journal = reference.journal || reference.publisher || "";
  if (style === "mla9") {
    return [
      authors,
      `“${reference.title}.”`,
      journal ? `${journal},` : "",
      String(reference.year) + ",",
      reference.url,
    ].filter(Boolean).join(" ").replace(/\s+,/g, ",");
  }
  if (style === "harvard") {
    return [
      authors,
      `(${reference.year})`,
      `‘${reference.title}’.`,
      journal ? `${journal}.` : "",
      `Available at: ${reference.url}`,
    ].filter(Boolean).join(" ");
  }
  return [
    authors ? `${authors}.` : "",
    `(${reference.year}).`,
    `${reference.title}.`,
    journal ? `${journal}.` : "",
    reference.url,
  ].filter(Boolean).join(" ");
}

export function buildEvidencePacket(references: VerifiedReference[]) {
  if (!references.length) return "";
  return references.map(reference => [
    `[${reference.id}] ${reference.title}`,
    `Authors: ${reference.authors.map(author => [author.given, author.family].filter(Boolean).join(" ")).join(", ")}`,
    `Year: ${reference.year}`,
    reference.journal ? `Publication: ${reference.journal}` : "",
    `DOI: ${reference.doi}`,
    `Verification: ${reference.verificationSources.join(" + ")}; quality ${reference.qualityScore}/100; retraction check passed`,
    reference.abstract ? `Evidence abstract: ${reference.abstract.slice(0, 1800)}` : "Evidence abstract: unavailable — use this source only for claims justified by its bibliographic metadata/title.",
  ].filter(Boolean).join("\n")).join("\n\n");
}

export function applyVerifiedCitationMarkers(
  text: string,
  references: VerifiedReference[],
  style: UnnCitationStyle,
) {
  const byId = new Map(references.map(reference => [reference.id.toUpperCase(), reference]));
  const used = new Set<string>();
  const transformed = text.replace(/\[\[(VR\d+)\]\]/gi, (_, rawId: string) => {
    const id = rawId.toUpperCase();
    const reference = byId.get(id);
    if (!reference) return "[citation verification failed]";
    used.add(id);
    return formatInTextCitation(reference, style);
  });

  return {
    text: transformed,
    usedReferences: references.filter(reference => used.has(reference.id.toUpperCase())),
  };
}

export function publicReferenceSnapshot(reference: VerifiedReference) {
  return {
    id: reference.id,
    title: reference.title,
    authors: reference.authors.map(author => [author.given, author.family].filter(Boolean).join(" ")),
    year: reference.year,
    journal: reference.journal,
    doi: reference.doi,
    url: reference.url,
    citationCount: reference.citationCount,
    openAccess: reference.openAccess,
    qualityScore: reference.qualityScore,
    evidenceLevel: reference.evidenceLevel,
    verificationSources: reference.verificationSources,
    issues: reference.issues,
    retractionChecked: reference.retractionChecked,
    retracted: reference.retracted,
  };
}
