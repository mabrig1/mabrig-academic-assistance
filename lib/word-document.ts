import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

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
};

type DocumentBlock =
  | { kind: "title"; text: string }
  | { kind: "heading"; text: string; level: number }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "checklist"; text: string; checked: boolean }
  | { kind: "number"; text: string; group: number }
  | { kind: "rule"; text: "" };

function lineSpacing(value?: string) {
  if (value === "single") return 240;
  if (value === "double") return 480;
  return 360;
}

function cleanText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
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

function parseDocumentBlocks(value: string) {
  const lines = cleanText(value).split("\n");
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

  for (const rawLine of lines) {
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
      blocks.push({ kind: "rule", text: "" });
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
    } else if (isHeading(line)) {
      flushParagraph();
      lastNumberValue = null;
      blocks.push({ kind: "heading", text: stripMarkdownForHeading(line), level: 1 });
      previousKind = "heading";
    } else {
      paragraphLines.push(line);
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
  base: { bold?: boolean; italics?: boolean } = {},
) {
  const text = normalizeInlineLinks(value);
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const runs: TextRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      runs.push(new TextRun({ text: text.slice(cursor, index), font, size, ...base }));
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

  if (cursor < text.length) runs.push(new TextRun({ text: text.slice(cursor), font, size, ...base }));
  return runs.length ? runs : [new TextRun({ text, font, size, ...base })];
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
}) {
  const { block, font, fontSize, spacing, referenceMode, pageBreakBefore } = options;
  const normalSize = fontSize * 2;

  if (block.kind === "rule") {
    return new Paragraph({
      pageBreakBefore,
      spacing: { before: 120, after: 160 },
      border: { bottom: { color: "B7B7B7", size: 6, space: 1, style: BorderStyle.SINGLE } },
    });
  }

  if (block.kind === "title") {
    return new Paragraph({
      pageBreakBefore,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 280, line: spacing },
      children: inlineRuns(block.text, font, Math.max(normalSize + 8, 32), { bold: true }),
    });
  }

  if (block.kind === "heading") {
    const size = block.level === 1 ? Math.max(normalSize + 6, 30) : block.level === 2 ? Math.max(normalSize + 4, 28) : Math.max(normalSize + 2, 26);
    return new Paragraph({
      pageBreakBefore,
      heading: headingLevel(block.level),
      keepNext: true,
      spacing: { before: block.level === 1 ? 260 : 200, after: 120, line: spacing },
      children: inlineRuns(block.text, font, size, { bold: true }),
    });
  }

  if (block.kind === "quote") {
    return new Paragraph({
      pageBreakBefore,
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 540, right: 360 },
      spacing: { before: 80, after: 160, line: spacing },
      children: inlineRuns(block.text, font, normalSize, { italics: true }),
    });
  }

  if (block.kind === "bullet") {
    return new Paragraph({
      pageBreakBefore,
      bullet: { level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: spacing },
      children: inlineRuns(block.text, font, normalSize),
    });
  }

  if (block.kind === "checklist") {
    return new Paragraph({
      pageBreakBefore,
      indent: { left: 720, hanging: 360 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: spacing },
      children: [
        new TextRun({ text: block.checked ? "☒  " : "☐  ", font: "Arial", size: normalSize }),
        ...inlineRuns(block.text, font, normalSize),
      ],
    });
  }

  if (block.kind === "number") {
    return new Paragraph({
      pageBreakBefore,
      numbering: { reference: `academic-numbering-${block.group}`, level: 0 },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80, line: spacing },
      children: inlineRuns(block.text, font, normalSize),
    });
  }

  return new Paragraph({
    pageBreakBefore,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: spacing },
    indent: referenceMode ? { left: 720, hanging: 720 } : undefined,
    children: inlineRuns(block.text, font, normalSize),
  });
}

export async function buildAcademicWordDocument(options: WordDocumentOptions) {
  const text = cleanText(options.text);
  if (!text) throw new Error("No document text was supplied for Word conversion.");

  const font = (options.font || "Times New Roman").trim() || "Times New Roman";
  const fontSize = Math.min(30, Math.max(8, Number(options.fontSize || 12)));
  const spacing = lineSpacing(options.spacing);
  const blocks = parseDocumentBlocks(text);
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
    }));
  });

  const doc = new Document({
    creator: "Mabrig ICT & Academic Assistance",
    title: options.title || "Academic Document",
    description: options.orderNumber ? `Generated for ${options.orderNumber}` : "Generated academic document",
    compatibility: { doNotExpandShiftReturn: true },
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
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: body,
    }],
  });

  return Packer.toBuffer(doc);
}
