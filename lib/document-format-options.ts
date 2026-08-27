export type ParagraphIndentation = "none" | "first-line" | "first-line-wide";
export type BodyAlignment = "left" | "justified";

export function parseParagraphIndentation(value: unknown): ParagraphIndentation {
  return value === "none" || value === "first-line-wide" ? value : "first-line";
}

export function parseBodyAlignment(value: unknown): BodyAlignment {
  return value === "left" ? "left" : "justified";
}

export function formToggleEnabled(form: FormData, name: string, fallback = true) {
  const values = form.getAll(name).map(value => String(value).toLowerCase());
  if (!values.length) return fallback;
  return values.some(value => value === "on" || value === "true" || value === "1");
}
