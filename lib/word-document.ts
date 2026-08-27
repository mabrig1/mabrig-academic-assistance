import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  PageOrientation,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { BodyAlignment, ParagraphIndentation } from "./document-format-options";

export type WordDocumentOptions = {
  text: string;
  title?: string;
  studentName?: string;
  orderNumber?: string;
  font?: string;
  fontSize?: number;
  spacing?: string;
  coverPage?: boolean;
  references?: boolean;
  paragraphIndentation?: ParagraphIndentation;
  bodyAlignment?: BodyAlignment;
  boldHeadings?: boolean;
  cleanSpecialCharacters?: boolean;
};

type DocumentBlock =
  | { kind: "title"; text: string }
  | { kind: "heading"; text: string; level: number }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "checklist"; text: string; checked: boolean }
  | { kind: "number"; text: string; group: number };

function lineSpacing(value?: string) {
  if (value === "single") return 240;
  if (value === "double") return 480;
  return 360;
}

function cleanText(value: string, cleanSpecialCharacters: boolean) {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");

  if (!cleanSpecialCharacters) return normalized.trim();
  return normalized
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€(?:|�)/g, "”")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/Â/g, "")
    .trim();
}

function cleanPlainSegment(value: string, cleanSpecialCharacters: boolean) {
  if (!cleanSpecialCharacters) return value;
  return value
    .replace(/(^|[\s([{])#{1,6}\s*/g, "$1")
    .replace(/(^|[\s([{])(?:\*{1,3}|_{2,3}|`{1,3}|~{2})/g, "$1")
    .replace(/(?:\*{1,3}|_{2,3}|`{1,3}|~{2})(?=\s|$|[.,;:!?)}\]])/g, "")
    .replace(/(^|\s)[•●▪◆■►▶★☆✓✔✦✧]+\s*/g, "$1");
}

function stripMarkdownForHeading(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .replace(/^__(.*?)__$/, "$1")
    .trim();
}

function isHeading(value: string) {
  const line = stripMarkdownForHeading(value);
  if (!line || line.length > 140) return false;

  return (
    /^(chapter\s+([ivxlcdm]+|\d+)|abstract|introduction|background( of the study)?|statement of the problem|objectives? of the study|research questions?|research hypotheses?|significance of the study|scope of the study|literature review|methodology|research methodology|results?|findings?|discussion( of findings)?|summary|conclusion|recommendations?|references|bibliography|appendix|appendices)$/i.test(line) ||
    /^\d+(\.\d+){0,3}\s+[A-Z][\s\S]{1,120}$/.test(line) ||
    /^[A-Z][A-Z\s&,:()\-]{5,120}$/.test(line)
  );
}

function isReferenceHeading(value: string) {
  return /^(references|bibliography)$/i.test(stripMarkdownForHeading(value));
}

function isLabeledParagraph(value: string) {
  return /^(?:\*\*|__)(?:keywords?|key insight|core mission|note|important|recommendation)s?\b/i.test(value);
}

function isStandaloneEmphasisHeading(value: string) {
  const match = value.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)$/);
  if (!match) return null;
  const text = match[1].trim();
  return text.length <= 140 && /^(?:phase|part|step)\s+(?:[ivxlcdm]+|\d+)\b/i.test(text) ? text : null;
}

function isStructuralLine(value: string) {
  return (
    /^(?:#{1,6}\s+|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+|>\s?|-{3,}$|\*{3,}$|_{3,}$)/.test(value) ||
    Boolean(isStandaloneEmphasisHeading(value)) ||
    isLabeledParagraph(value) ||
    isHeading(value)
  );
}

function shouldJoinWrappedLine(current: string, next: string) {
  if (!next || isStructuralLine(next)) return false;
  const visibleEnding = current.replace(/(?:\*\*|__|\*|_)+$/, "").trimEnd();
  if (/[.!?]["'’”)}\]]*$/.test(visibleEnding)) return false;
  if (/[,;:—–-]$/.test(visibleEnding)) return true;
  return current.length >= 90 || /^[a-z]/.test(next);
}

function parseDocumentBlocks(value: string, cleanSpecialCharacters: boolean) {
  const lines = cleanText(value, cleanSpecialCharacters).split("\n");
  const blocks: DocumentBlock[] = [];
  let paragraphLines: string[] = [];
  let activeNumberGroup = 0;
  let nextNumberGroup = 0;
  let lastNumberValue: number | null = null;
  let previousKind = "";

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join(" ").replace(/\s+/g, " ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    paragraphLines = [];
    lastNumberValue = null;
    previousKind = "paragraph";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      previousKind = "";
      continue;
    }

    const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/);
    const checklist = line.match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      lastNumberValue = null;
      previousKind = "rule";
    } else if (markdownHeading) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({
        kind: "heading",
        text: stripMarkdownForHeading(markdownHeading[2]),
        level: Math.min(3, markdownHeading[1].length),
      });
      previousKind = "heading";
    } else if (checklist) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({
        kind: "checklist",
        text: checklist[2].trim(),
        checked: checklist[1].toLowerCase() === "x",
      });
      previousKind = "checklist";
    } else if (bullet) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({ kind: "bullet", text: bullet[1].trim() });
      previousKind = "bullet";
    } else if (numbered) {
      flushParagraph();
      const numberValue = Number(numbered[1]);
      if (lastNumberValue === null || numberValue !== lastNumberValue + 1) activeNumberGroup = ++nextNumberGroup;
      blocks.push({ kind: "number", text: numbered[2].trim(), group: activeNumberGroup });
      lastNumberValue = numberValue;
      previousKind = "number";
    } else if (quote) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({ kind: "quote", text: quote[1].trim() });
      previousKind = "quote";
    } else if (isStandaloneEmphasisHeading(line)) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({ kind: "heading", text: isStandaloneEmphasisHeading(line)!, level: 3 });
      previousKind = "heading";
    } else if (isHeading(line)) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({ kind: "heading", text: stripMarkdownForHeading(line), level: 1 });
      previousKind = "heading";
    } else {
      paragraphLines.push(line);
      const nextLine = lines[index + 1]?.trim() || "";
      if (!shouldJoinWrappedLine(line, nextLine)) flushParagraph();
    }
  }

  flushParagraph();
  if (blocks[0]?.kind === "paragraph" && blocks[1]?.kind === "heading" && blocks[0].text.length <= 200) {
    blocks[0] = { kind: "title", text: blocks[0].text };
  }
  return blocks;
}

function normalizeInlineLinks(value: string) {
  return value.replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, "$1 ($2)");
}

function inlineRuns(
  value: string,
  font: string,
  size: number,
  cleanSpecialCharacters: boolean,
  base: { bold?: boolean; italics?: boolean; color?: string } = {},
) {
  const text = normalizeInlineLinks(value);
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const runs: TextRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      runs.push(new TextRun({
        text: cleanPlainSegment(text.slice(cursor, index), cleanSpecialCharacters),
        font,
        size,
        ...base,
      }));
    }

    const token = match[0];
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      runs.push(new TextRun({ text: token.slice(2, -2), font, size, ...base, bold: true }));
    } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
      runs.push(new TextRun({ text: token.slice(1, -1), font, size, ...base, italics: true }));
    } else {
      runs.push(new TextRun({ text: token.slice(1, -1), font: "Courier New", size, ...base }));
    }
    cursor = index + token.length;
  }

  if (cursor < text.length) {
    runs.push(new TextRun({ text: cleanPlainSegment(text.slice(cursor), cleanSpecialCharacters), font, size, ...base }));
  }
  return runs.length
    ? runs
    : [new TextRun({ text: cleanPlainSegment(text, cleanSpecialCharacters), font, size, ...base })];
}

function headingLevel(level: number) {
  if (level <= 1) return HeadingLevel.HEADING_1;
  if (level === 2) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
}

function makeBlockParagraph(options: {
  block: DocumentBlock;
  font: string;
  fontSize: number;
  spacing: number;
  referenceMode: boolean;
  pageBreakBefore: boolean;
  paragraphIndentation: ParagraphIndentation;
  bodyAlignment: BodyAlignment;
  boldHeadings: boolean;
  cleanSpecialCharacters: boolean;
}) {
  const {
    block,
    font,
    fontSize,
    spacing,
    referenceMode,
    pageBreakBefore,
    paragraphIndentation,
    bodyAlignment,
    boldHeadings,
    cleanSpecialCharacters,
  } = options;
  const normalSize = fontSize * 2;

  if (block.kind === "title") {
    return new Paragraph({
      style: "AcademicTitle",
      pageBreakBefore,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 120, after: 300, line: spacing },
      children: inlineRuns(block.text, font, Math.max(normalSize + 8, 32), cleanSpecialCharacters, { bold: true, color: "000000" }),
    });
  }

  if (block.kind === "heading") {
    const size = block.level === 1 ? Math.max(normalSize + 6, 30) : block.level === 2 ? Math.max(normalSize + 4, 28) : Math.max(normalSize + 2, 26);
    return new Paragraph({
      pageBreakBefore,
      heading: headingLevel(block.level),
      keepNext: true,
      keepLines: true,
      spacing: { before: block.level === 1 ? 280 : 220, after: 100, line: 240 },
      children: inlineRuns(block.text, font, size, cleanSpecialCharacters, {
        bold: boldHeadings,
        italics: block.level === 3,
        color: "000000",
      }),
    });
  }

  if (block.kind === "quote") {
    return new Paragraph({
      pageBreakBefore,
      style: "AcademicQuote",
      alignment: AlignmentType.LEFT,
      indent: { left: 540, right: 360 },
      spacing: { before: 80, after: 140, line: spacing },
      keepLines: true,
      widowControl: true,
      children: inlineRuns(block.text, font, normalSize, cleanSpecialCharacters, { italics: true }),
    });
  }

  if (block.kind === "bullet") {
    return new Paragraph({
      pageBreakBefore,
      style: "AcademicList",
      bullet: { level: 0 },
      alignment: AlignmentType.LEFT,
      spacing: { after: 60, line: spacing },
      keepLines: true,
      widowControl: true,
      children: inlineRuns(block.text, font, normalSize, cleanSpecialCharacters),
    });
  }

  if (block.kind === "checklist") {
    return new Paragraph({
      pageBreakBefore,
      style: "AcademicList",
      indent: { left: 720, hanging: 360 },
      alignment: AlignmentType.LEFT,
      spacing: { after: 60, line: spacing },
      keepLines: true,
      widowControl: true,
      children: [
        new TextRun({ text: block.checked ? "☒  " : "☐  ", font: "Arial", size: normalSize }),
        ...inlineRuns(block.text, font, normalSize, cleanSpecialCharacters),
      ],
    });
  }

  if (block.kind === "number") {
    return new Paragraph({
      pageBreakBefore,
      style: "AcademicList",
      numbering: { reference: `academic-numbering-${block.group}`, level: 0 },
      alignment: AlignmentType.LEFT,
      spacing: { after: 80, line: spacing },
      keepLines: true,
      widowControl: true,
      children: inlineRuns(block.text, font, normalSize, cleanSpecialCharacters),
    });
  }

  return new Paragraph({
    pageBreakBefore,
    style: referenceMode ? "AcademicReference" : "AcademicBody",
    alignment: referenceMode || bodyAlignment === "left"
      ? AlignmentType.LEFT
      : AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: spacing },
    indent: referenceMode
      ? { left: 720, hanging: 720 }
      : paragraphIndentation === "none" || isLabeledParagraph(block.text)
        ? undefined
        : { firstLine: paragraphIndentation === "first-line-wide" ? 1440 : 720 },
    widowControl: true,
    children: inlineRuns(block.text, font, normalSize, cleanSpecialCharacters),
  });
}

export async function buildAcademicWordDocument(options: WordDocumentOptions) {
  const cleanSpecialCharacters = options.cleanSpecialCharacters !== false;
  const text = cleanText(options.text, cleanSpecialCharacters);
  if (!text) throw new Error("No document text was supplied for Word conversion.");

  const font = (options.font || "Times New Roman").trim() || "Times New Roman";
  const fontSize = Math.min(30, Math.max(8, Number(options.fontSize || 12)));
  const spacing = lineSpacing(options.spacing);
  const paragraphIndentation = options.paragraphIndentation || "first-line";
  const bodyAlignment = options.bodyAlignment || "justified";
  const boldHeadings = options.boldHeadings !== false;
  const blocks = parseDocumentBlocks(text, cleanSpecialCharacters);
  const numberGroups = Array.from(new Set(
    blocks.filter((block): block is Extract<DocumentBlock, { kind: "number" }> => block.kind === "number").map(block => block.group),
  ));

  const body: Paragraph[] = [];
  let referenceMode = false;

  if (options.coverPage) {
    body.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 360 },
      children: [new TextRun({
        text: (options.title || "ACADEMIC DOCUMENT").toUpperCase(),
        font,
        size: Math.max(fontSize * 2 + 8, 32),
        bold: true,
      })],
    }));
    if (options.studentName) {
      body.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [new TextRun({ text: options.studentName, font, size: fontSize * 2, bold: true })],
      }));
    }
    if (options.orderNumber) {
      body.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Order: ${options.orderNumber}`, font, size: fontSize * 2 })],
      }));
    }
  }

  blocks.forEach((block, index) => {
    if (block.kind === "heading" && isReferenceHeading(block.text)) referenceMode = true;
    body.push(makeBlockParagraph({
      block,
      font,
      fontSize,
      spacing,
      referenceMode: Boolean(referenceMode && options.references && block.kind === "paragraph"),
      pageBreakBefore: Boolean(options.coverPage && index === 0),
      paragraphIndentation,
      bodyAlignment,
      boldHeadings,
      cleanSpecialCharacters,
    }));
  });

  const doc = new Document({
    creator: "Mabrig ICT & Academic Assistance",
    title: options.title || "Academic Document",
    description: options.orderNumber ? `Generated for ${options.orderNumber}` : "Generated academic document",
    compatibility: { doNotExpandShiftReturn: true },
    styles: {
      default: {
        document: {
          run: { font, size: fontSize * 2, color: "000000" },
          paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { line: spacing, after: 120 } },
        },
        heading1: {
          run: { font, size: Math.max(fontSize * 2 + 6, 30), bold: boldHeadings, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 280, after: 100 }, keepNext: true },
        },
        heading2: {
          run: { font, size: Math.max(fontSize * 2 + 4, 28), bold: boldHeadings, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 100 }, keepNext: true },
        },
        heading3: {
          run: { font, size: Math.max(fontSize * 2 + 2, 26), bold: boldHeadings, italics: true, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 220, after: 80 }, keepNext: true },
        },
      },
      paragraphStyles: [
        {
          id: "AcademicTitle",
          name: "Academic Title",
          basedOn: "Normal",
          next: "AcademicBody",
          quickFormat: true,
          run: { font, size: Math.max(fontSize * 2 + 8, 32), bold: true, color: "000000" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 300, line: spacing }, keepNext: true },
        },
        {
          id: "AcademicBody",
          name: "Academic Body",
          basedOn: "Normal",
          next: "AcademicBody",
          quickFormat: true,
          run: { font, size: fontSize * 2, color: "000000" },
          paragraph: {
            alignment: bodyAlignment === "left" ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: spacing },
          },
        },
        {
          id: "AcademicList",
          name: "Academic List",
          basedOn: "Normal",
          next: "AcademicList",
          quickFormat: true,
          run: { font, size: fontSize * 2, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { after: 60, line: spacing } },
        },
        {
          id: "AcademicQuote",
          name: "Academic Quote",
          basedOn: "Normal",
          next: "AcademicBody",
          quickFormat: true,
          run: { font, size: fontSize * 2, italics: true, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 80, after: 140, line: spacing } },
        },
        {
          id: "AcademicReference",
          name: "Academic Reference",
          basedOn: "Normal",
          next: "AcademicReference",
          quickFormat: true,
          run: { font, size: fontSize * 2, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { after: 80, line: spacing } },
        },
      ],
    },
    numbering: {
      config: numberGroups.map(group => ({
        reference: `academic-numbering-${group}`,
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      })),
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: body,
    }],
  });

  return Packer.toBuffer(doc);
}
