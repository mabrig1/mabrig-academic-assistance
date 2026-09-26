import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  AlignmentType,
  Document,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PDF_MARGIN = 54;
const PDF_BODY_SIZE = 11.5;
const PDF_HEADING_SIZE = 13;
const PDF_LINE_HEIGHT = 17;
const PDF_PARAGRAPH_GAP = 8;
const DOCX_FONT = "Times New Roman";
const DOCX_SIZE = 24;
const DOCX_LINE = 300;

export class FileConversionError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "FileConversionError";
  }
}

function normalizeForPdf(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u00d7/g, "x")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function isHeadingParagraph(value: string) {
  const text = value.trim();
  if (!text || text.length > 110) return false;
  if (/^\d+(?:\.\d+)*[.)]?\s+\S+/.test(text)) return true;
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && text === text.toUpperCase();
}

function splitLongToken(token: string, font: PDFFont, size: number, maxWidth: number) {
  const chunks: string[] = [];
  let current = "";
  for (const char of token) {
    const next = current + char;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      chunks.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [token];
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const originalToken of tokens) {
    const pieces = font.widthOfTextAtSize(originalToken, size) > maxWidth
      ? splitLongToken(originalToken, font, size, maxWidth)
      : [originalToken];

    for (const token of pieces) {
      const candidate = current ? current + " " + token : token;
      if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(current);
        current = token;
      } else {
        current = candidate;
      }
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawPageNumber(page: PDFPage, pageNumber: number, font: PDFFont) {
  const text = String(pageNumber);
  const size = 9;
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (A4_WIDTH - width) / 2,
    y: 24,
    size,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
}

export async function convertDocxToPdf(input: Uint8Array, sourceName = "document.docx") {
  if (!input.byteLength) throw new FileConversionError("The Word file is empty.");

  const extracted = await mammoth.extractRawText({ buffer: Buffer.from(input) });
  const rawText = extracted.value?.trim();
  if (!rawText) {
    throw new FileConversionError(
      "No readable text was found in this Word document. Image-only or legacy .doc files are not supported by this converter.",
      422,
    );
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle(sourceName.replace(/\.docx$/i, ""));
  pdf.setCreator("Mabrig Academic Assistance File Converter");
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  let page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - PDF_MARGIN;
  let pageNumber = 1;

  const newPage = () => {
    drawPageNumber(page, pageNumber, regular);
    pageNumber += 1;
    page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
    y = A4_HEIGHT - PDF_MARGIN;
  };

  const paragraphs = normalizeForPdf(rawText)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map(value => value.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    const heading = isHeadingParagraph(paragraph);
    const font = heading ? bold : regular;
    const size = heading ? PDF_HEADING_SIZE : PDF_BODY_SIZE;
    const lineHeight = heading ? PDF_LINE_HEIGHT + 1 : PDF_LINE_HEIGHT;
    const lines = wrapLine(paragraph, font, size, A4_WIDTH - PDF_MARGIN * 2);

    if (y - (lines.length * lineHeight) < PDF_MARGIN + 24) newPage();

    for (const line of lines) {
      if (y < PDF_MARGIN + 24) newPage();
      page.drawText(line, {
        x: PDF_MARGIN,
        y,
        size,
        font,
        color: rgb(0.08, 0.08, 0.08),
      });
      y -= lineHeight;
    }
    y -= PDF_PARAGRAPH_GAP;
  }

  drawPageNumber(page, pageNumber, regular);
  return pdf.save();
}

function pageParagraphs(text: string, pageIndex: number) {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  if (!cleaned) {
    return [
      new Paragraph({
        pageBreakBefore: pageIndex > 0,
        children: [new TextRun({ text: "[No extractable text on this PDF page]", font: DOCX_FONT, size: DOCX_SIZE })],
      }),
    ];
  }

  const blocks = cleaned
    .split(/\n{2,}/)
    .map(block => block.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return blocks.map((block, index) => new Paragraph({
    pageBreakBefore: pageIndex > 0 && index === 0,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: DOCX_LINE, after: 120 },
    children: [new TextRun({ text: block, font: DOCX_FONT, size: DOCX_SIZE })],
  }));
}

export async function convertPdfToDocx(input: Uint8Array, sourceName = "document.pdf") {
  if (!input.byteLength) throw new FileConversionError("The PDF file is empty.");

  const parser = new PDFParse({ data: input });
  try {
    const result = await parser.getText({
      pageJoiner: "\n<<<MABRIG_PAGE_BREAK page_number of total_number>>>\n",
    });

    const text = result.text?.trim();
    if (!text) {
      throw new FileConversionError(
        "No selectable text was found in this PDF. Scanned/image-only PDFs need OCR before they can be converted to editable Word text.",
        422,
      );
    }

    const pages = text.split(/\n?<<<MABRIG_PAGE_BREAK\s+\d+\s+of\s+\d+>>>\n?/g);
    const children = pages.flatMap((pageText, index) => pageParagraphs(pageText, index));

    const doc = new Document({
      creator: "Mabrig Academic Assistance File Converter",
      title: sourceName.replace(/\.pdf$/i, ""),
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: children.length ? children : [
          new Paragraph({
            children: [new TextRun({ text: text, font: DOCX_FONT, size: DOCX_SIZE })],
          }),
        ],
      }],
    });

    return Packer.toBuffer(doc);
  } finally {
    await parser.destroy();
  }
}

export function conversionBaseName(filename: string) {
  return filename
    .replace(/\.(docx|pdf)$/i, "")
    .trim() || "converted-document";
}
