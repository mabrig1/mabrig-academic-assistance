import {
  AlignmentType,
  BorderStyle,
  Document,
  PageBorderDisplay,
  PageBorderOffsetFrom,
  PageBorderZOrder,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export type CoverTemplate = "unn-classic" | "royal-blue" | "gold-formal" | "minimal-black";

export type CoverPageInput = {
  template: CoverTemplate;
  institution: string;
  faculty?: string;
  department?: string;
  workType?: string;
  title: string;
  subtitle?: string;
  studentName: string;
  registrationNumber?: string;
  courseCode?: string;
  courseTitle?: string;
  lecturer?: string;
  session?: string;
  date?: string;
};

type TemplateConfig = {
  color: string;
  borderStyle: (typeof BorderStyle)[keyof typeof BorderStyle];
  borderSize: number;
  ornament: string;
  headingSize: number;
  titleSize: number;
  label: string;
};

const FONT = "Times New Roman";
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;

const TEMPLATES: Record<CoverTemplate, TemplateConfig> = {
  "unn-classic": {
    color: "0B5D43",
    borderStyle: BorderStyle.DOUBLE,
    borderSize: 18,
    ornament: "◆  ◆  ◆",
    headingSize: 30,
    titleSize: 34,
    label: "UNN Classic",
  },
  "royal-blue": {
    color: "173B7A",
    borderStyle: BorderStyle.DOUBLE,
    borderSize: 20,
    ornament: "✦  ✦  ✦",
    headingSize: 30,
    titleSize: 36,
    label: "Royal Blue",
  },
  "gold-formal": {
    color: "8A661A",
    borderStyle: BorderStyle.DOUBLE,
    borderSize: 22,
    ornament: "◆  ◇  ◆",
    headingSize: 30,
    titleSize: 36,
    label: "Gold Formal",
  },
  "minimal-black": {
    color: "222222",
    borderStyle: BorderStyle.SINGLE,
    borderSize: 16,
    ornament: "—  •  —",
    headingSize: 28,
    titleSize: 34,
    label: "Minimal Black",
  },
};

function clean(value?: string) {
  return (value || "").trim();
}

function centered(
  text: string,
  options: {
    size?: number;
    bold?: boolean;
    color?: string;
    before?: number;
    after?: number;
    italics?: boolean;
  } = {},
) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      before: options.before || 0,
      after: options.after || 0,
      line: 360,
    },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: options.size || 24,
        bold: options.bold,
        color: options.color,
        italics: options.italics,
      }),
    ],
  });
}

function labelLine(label: string, value: string, color: string) {
  return centered(label + ": " + value, {
    size: 24,
    bold: true,
    color,
    after: 70,
  });
}

export function parseCoverTemplate(value: unknown): CoverTemplate {
  if (value === "royal-blue" || value === "gold-formal" || value === "minimal-black") return value;
  return "unn-classic";
}

export async function buildCoverPageDocument(input: CoverPageInput) {
  const template = TEMPLATES[input.template] || TEMPLATES["unn-classic"];
  const institution = clean(input.institution) || "UNIVERSITY OF NIGERIA, NSUKKA";
  const title = clean(input.title);
  const studentName = clean(input.studentName);

  if (!title || !studentName) {
    throw new Error("Cover page title and student name are required.");
  }

  const border = {
    style: template.borderStyle,
    size: template.borderSize,
    color: template.color,
  };

  const children: Paragraph[] = [
    centered(institution.toUpperCase(), {
      size: template.headingSize,
      bold: true,
      color: template.color,
      before: 420,
      after: 130,
    }),
  ];

  if (clean(input.faculty)) {
    children.push(centered("FACULTY OF " + clean(input.faculty).toUpperCase(), {
      size: 24,
      bold: true,
      color: template.color,
      after: 80,
    }));
  }
  if (clean(input.department)) {
    children.push(centered("DEPARTMENT OF " + clean(input.department).toUpperCase(), {
      size: 24,
      bold: true,
      color: template.color,
      after: 180,
    }));
  }

  children.push(
    centered(template.ornament, {
      size: 22,
      color: template.color,
      before: 120,
      after: 180,
    }),
  );

  if (clean(input.workType)) {
    children.push(centered(clean(input.workType).toUpperCase(), {
      size: 25,
      bold: true,
      color: template.color,
      after: 180,
    }));
  }

  children.push(centered(title.toUpperCase(), {
    size: template.titleSize,
    bold: true,
    color: "111111",
    before: 100,
    after: 180,
  }));

  if (clean(input.subtitle)) {
    children.push(centered(clean(input.subtitle), {
      size: 24,
      italics: true,
      color: "444444",
      after: 260,
    }));
  } else {
    children.push(centered("", { after: 180 }));
  }

  children.push(
    centered("BY", {
      size: 22,
      bold: true,
      color: template.color,
      after: 120,
    }),
    centered(studentName.toUpperCase(), {
      size: 28,
      bold: true,
      color: "111111",
      after: 90,
    }),
  );

  if (clean(input.registrationNumber)) {
    children.push(centered(clean(input.registrationNumber).toUpperCase(), {
      size: 24,
      bold: true,
      color: "333333",
      after: 260,
    }));
  } else {
    children.push(centered("", { after: 180 }));
  }

  const course = [clean(input.courseCode), clean(input.courseTitle)].filter(Boolean).join(" — ");
  if (course) children.push(labelLine("COURSE", course.toUpperCase(), template.color));
  if (clean(input.lecturer)) children.push(labelLine("LECTURER", clean(input.lecturer).toUpperCase(), template.color));
  if (clean(input.session)) children.push(labelLine("SESSION", clean(input.session).toUpperCase(), template.color));
  if (clean(input.date)) children.push(labelLine("DATE", clean(input.date).toUpperCase(), template.color));

  children.push(centered(template.ornament, {
    size: 20,
    color: template.color,
    before: 220,
  }));

  const document = new Document({
    creator: "Mabrig Academic Assistance Cover Page Creator",
    title,
    description: "Editable academic cover page generated by Mabrig Academic Assistance",
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH, height: A4_HEIGHT },
          margin: { top: 900, right: 900, bottom: 900, left: 900 },
          borders: {
            pageBorderTop: border,
            pageBorderRight: border,
            pageBorderBottom: border,
            pageBorderLeft: border,
            pageBorders: {
              display: PageBorderDisplay.ALL_PAGES,
              offsetFrom: PageBorderOffsetFrom.PAGE,
              zOrder: PageBorderZOrder.FRONT,
            },
          },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(document);
}

export function coverTemplateLabel(template: CoverTemplate) {
  return TEMPLATES[template]?.label || TEMPLATES["unn-classic"].label;
}
