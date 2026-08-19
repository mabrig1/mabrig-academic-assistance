import {
  AlignmentType,
  Document,
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

function isHeading(value: string) {
  const line = value.trim();
  if (!line || line.length > 120) return false;

  return (
    /^(chapter\s+([ivxlcdm]+|\d+)|abstract|introduction|background( of the study)?|statement of the problem|objectives? of the study|research questions?|research hypotheses?|significance of the study|scope of the study|literature review|methodology|research methodology|results?|findings?|discussion( of findings)?|summary|conclusion|recommendations?|references|bibliography|appendix|appendices)$/i.test(line) ||
    /^\d+(\.\d+){0,3}\s+[A-Z][\s\S]{1,100}$/.test(line) ||
    /^[A-Z][A-Z\s&,:()\-]{5,100}$/.test(line)
  );
}

function isReferenceHeading(value: string) {
  return /^(references|bibliography)$/i.test(value.trim());
}

function makeBodyParagraph(
  text: string,
  font: string,
  fontSize: number,
  spacing: number,
  referenceMode: boolean,
  pageBreakBefore = false,
) {
  const heading = isHeading(text);

  if (heading) {
    return new Paragraph({
      pageBreakBefore,
      alignment: AlignmentType.CENTER,
      spacing: { before: 220, after: 180, line: spacing },
      children: [
        new TextRun({
          text: text.trim(),
          font,
          size: Math.max(fontSize * 2 + 4, 28),
          bold: true,
        }),
      ],
    });
  }

  return new Paragraph({
    pageBreakBefore,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160, line: spacing },
    indent: referenceMode ? { left: 720, hanging: 720 } : undefined,
    children: [
      new TextRun({
        text: text.trim(),
        font,
        size: fontSize * 2,
      }),
    ],
  });
}

export async function buildAcademicWordDocument(options: WordDocumentOptions) {
  const text = cleanText(options.text);
  if (!text) throw new Error("No document text was supplied for Word conversion.");

  const font = (options.font || "Times New Roman").trim() || "Times New Roman";
  const fontSize = Math.min(30, Math.max(8, Number(options.fontSize || 12)));
  const spacing = lineSpacing(options.spacing);
  const blocks = text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);

  const body: Paragraph[] = [];
  let referenceMode = false;

  if (options.coverPage) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 360 },
        children: [
          new TextRun({
            text: (options.title || "ACADEMIC DOCUMENT").toUpperCase(),
            font,
            size: Math.max(fontSize * 2 + 8, 32),
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 220 },
        children: [new TextRun({ text: options.studentName || "", font, size: fontSize * 2, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: options.orderNumber ? `Order: ${options.orderNumber}` : "", font, size: fontSize * 2 })],
      }),
    );
  }

  blocks.forEach((block, index) => {
    if (isReferenceHeading(block)) referenceMode = true;
    const shouldIndentAsReference = referenceMode && !isHeading(block) && Boolean(options.references);
    body.push(
      makeBodyParagraph(
        block,
        font,
        fontSize,
        spacing,
        shouldIndentAsReference,
        Boolean(options.coverPage && index === 0),
      ),
    );
  });

  const doc = new Document({
    creator: "Mabrig ICT & Academic Assistance",
    title: options.title || "Academic Document",
    description: options.orderNumber ? `Generated for ${options.orderNumber}` : "Generated academic document",
    compatibility: { doNotExpandShiftReturn: true },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
