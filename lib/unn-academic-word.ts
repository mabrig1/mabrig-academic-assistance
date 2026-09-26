import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  NumberFormat,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  TableOfContents,
  TextRun,
} from "docx";
import type { UnnAcademicWorkType, UnnCitationStyle } from "./unn-academic-writer";

const FONT = "Times New Roman";
const BODY_SIZE = 24;
const DOUBLE = 480;
const SINGLE = 240;
const FIRST_LINE = 720;
const ONE_INCH = 1440;
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;

export type UnnAcademicWordInput = {
  workType: UnnAcademicWorkType;
  title: string;
  studentName: string;
  registrationNumber: string;
  faculty: string;
  department: string;
  courseCode: string;
  courseTitle?: string;
  lecturer?: string;
  session?: string;
  submissionDate?: string;
  citationStyle: UnnCitationStyle;
  includeTableOfContents: boolean;
  generatedText: string;
};

function run(text: string, options: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: options.size || BODY_SIZE,
    bold: options.bold,
    italics: options.italics,
  });
}

function paragraph(text: string, options: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean; noIndent?: boolean; single?: boolean; before?: number; after?: number } = {}) {
  return new Paragraph({
    alignment: options.align || AlignmentType.JUSTIFIED,
    indent: options.noIndent ? undefined : { firstLine: FIRST_LINE },
    spacing: {
      line: options.single ? SINGLE : DOUBLE,
      before: options.before || 0,
      after: options.after || 0,
    },
    children: [run(text, { bold: options.bold })],
  });
}

function centered(text: string, options: { bold?: boolean; size?: number; before?: number; after?: number } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: DOUBLE, before: options.before || 0, after: options.after || 0 },
    children: [run(text, { bold: options.bold, size: options.size })],
  });
}

function footer() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ font: FONT, size: 20, children: [PageNumber.CURRENT] })],
      }),
    ],
  });
}

function blankFooter() {
  return new Footer({ children: [new Paragraph({ children: [] })] });
}

function clean(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseSections(markdown: string) {
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = "";
  let body: string[] = [];

  const flush = () => {
    const text = body.join("\n").trim();
    if (heading || text) sections.push({ heading, body: text });
    body = [];
  };

  for (const raw of markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    const line = raw.trim();
    const top = line.match(/^#\s+(.+)$/);
    if (top) {
      flush();
      heading = clean(top[1]).toUpperCase();
      continue;
    }
    body.push(raw);
  }
  flush();
  return sections;
}

function markdownBody(text: string) {
  const children: Paragraph[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let paragraphLines: string[] = [];

  const flush = () => {
    const value = paragraphLines.join(" ").replace(/\s+/g, " ").trim();
    if (value) children.push(paragraph(clean(value)));
    paragraphLines = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);

    if (heading) {
      flush();
      const level = heading[1].length === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      children.push(new Paragraph({
        heading: level,
        alignment: AlignmentType.LEFT,
        spacing: { line: DOUBLE, before: 180, after: 60 },
        children: [run(clean(heading[2]), { bold: true })],
      }));
      continue;
    }

    if (bullet || numbered) {
      flush();
      const value = bullet ? `• ${clean(bullet[1])}` : `${numbered![1]}. ${clean(numbered![2])}`;
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 720, hanging: 360 },
        spacing: { line: DOUBLE, after: 0 },
        children: [run(value)],
      }));
      continue;
    }

    paragraphLines.push(line);
  }

  flush();
  return children;
}

function referenceParagraphs(text: string) {
  const items = text.split(/\n+/).map(item => clean(item)).filter(Boolean);
  if (!items.length) return [paragraph("[Add verified references used in the paper]", { noIndent: true })];
  return items.map(item => new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 720, hanging: 720 },
    spacing: { line: DOUBLE, after: 0 },
    children: [run(item)],
  }));
}

function titlePage(input: UnnAcademicWordInput) {
  const workLabel = input.workType === "term-paper"
    ? "TERM PAPER"
    : input.workType === "seminar-paper"
      ? "SEMINAR PAPER"
      : input.workType === "assessment"
        ? "ASSESSMENT"
        : "ASSIGNMENT";

  return [
    centered("UNIVERSITY OF NIGERIA, NSUKKA", { bold: true, size: 28, before: 240, after: 360 }),
    centered(`FACULTY OF ${input.faculty.toUpperCase()}`, { bold: true, after: 120 }),
    centered(`DEPARTMENT OF ${input.department.toUpperCase()}`, { bold: true, after: 480 }),
    centered(workLabel, { bold: true, after: 240 }),
    centered(input.title.toUpperCase(), { bold: true, size: 28, after: 600 }),
    centered("BY", { bold: true, after: 180 }),
    centered(input.studentName.toUpperCase(), { bold: true, after: 100 }),
    centered(input.registrationNumber.toUpperCase(), { bold: true, after: 480 }),
    centered(`COURSE: ${[input.courseCode, input.courseTitle].filter(Boolean).join(" — ").toUpperCase()}`, { bold: true, after: 240 }),
    ...(input.lecturer ? [centered(`LECTURER: ${input.lecturer.toUpperCase()}`, { bold: true, after: 180 })] : []),
    ...(input.session ? [centered(`SESSION: ${input.session.toUpperCase()}`, { bold: true, after: 120 })] : []),
    ...(input.submissionDate ? [centered(`DATE: ${input.submissionDate.toUpperCase()}`, { bold: true })] : []),
  ];
}

export async function buildUnnAcademicWordDocument(input: UnnAcademicWordInput) {
  const sections = parseSections(input.generatedText);
  const abstract = sections.find(section => section.heading === "ABSTRACT");
  const references = sections.find(section => /^(REFERENCES|WORKS CITED|BIBLIOGRAPHY)$/.test(section.heading));
  const bodySections = sections.filter(section =>
    section.heading !== "ABSTRACT" &&
    !/^(REFERENCES|WORKS CITED|BIBLIOGRAPHY)$/.test(section.heading)
  );

  const page = {
    size: { width: A4_WIDTH, height: A4_HEIGHT, orientation: PageOrientation.PORTRAIT },
    margin: { top: ONE_INCH, right: ONE_INCH, bottom: ONE_INCH, left: ONE_INCH, header: 720, footer: 720 },
  };

  const documentSections: any[] = [
    {
      properties: { titlePage: true, page },
      footers: { default: blankFooter() },
      children: titlePage(input),
    },
  ];

  if (abstract || input.includeTableOfContents) {
    const prelimChildren: any[] = [];
    if (abstract) {
      prelimChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { line: DOUBLE, after: 180 },
          children: [run("ABSTRACT", { bold: true })],
        }),
        ...markdownBody(abstract.body),
      );
    }
    if (input.includeTableOfContents) {
      prelimChildren.push(
        new Paragraph({
          pageBreakBefore: Boolean(abstract),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { line: DOUBLE, after: 180 },
          children: [run("TABLE OF CONTENTS", { bold: true })],
        }),
        new TableOfContents("", { hyperlink: true, headingStyleRange: "1-3" }),
        paragraph("Update the table of contents in Microsoft Word after final pagination.", { noIndent: true, single: true }),
      );
    }

    documentSections.push({
      properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: footer() },
      children: prelimChildren,
    });
  }

  const bodyChildren: any[] = [];
  for (const section of bodySections) {
    if (section.heading) {
      bodyChildren.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { line: DOUBLE, before: 180, after: 120 },
        children: [run(section.heading, { bold: true })],
      }));
    }
    bodyChildren.push(...markdownBody(section.body));
  }

  if (input.citationStyle !== "none") {
    bodyChildren.push(new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { line: DOUBLE, after: 160 },
      children: [run(input.citationStyle === "mla9" ? "WORKS CITED" : "REFERENCES", { bold: true })],
    }));
    bodyChildren.push(...referenceParagraphs(references?.body || ""));
  }

  documentSections.push({
    properties: { page: { ...page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
    footers: { default: footer() },
    children: bodyChildren.length ? bodyChildren : [paragraph("No document body was generated.")],
  });

  const doc = new Document({ sections: documentSections });
  return Packer.toBuffer(doc);
}
