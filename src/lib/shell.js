// Builds a deliverable shell (.docx) from engagement.json + shells.json.
// Pure: no browser or Firebase imports, so it runs in the page (on click,
// dynamically imported) and in scripts/make-shells.mjs and tests.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  AlignmentType, Header, Footer, PageNumber, TableOfContents, PageBreak,
} from "docx";
import { fmt } from "./dates.js";

const CLAUSE = { day90: "3.1", month6: "3.2" };
const GREY = "6B7280";

// Fixed widths in twips (6.5" text width). Percentage widths collapse in
// Google Docs, LibreOffice and Quick Look.
const TEXT_WIDTH = 9360;

const cell = (text, width, bold = false) =>
  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })], width: { size: width, type: WidthType.DXA } });

/** fractions: share of the text width for each column. */
const table = (header, rows, fractions) => {
  const cols = fractions.map((f) => Math.round(f * TEXT_WIDTH));
  return new Table({
    width: { size: TEXT_WIDTH, type: WidthType.DXA },
    columnWidths: cols,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, cols[i], true)) }), ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, cols[i])) }))],
  });
};

const guidance = (text) => new Paragraph({ children: [new TextRun({ text: `[${text}]`, italics: true, color: GREY })] });

export function shellFileName(config, deliverable) {
  const slug = deliverable.name.replace(/\(.*?\)/g, "").trim().replace(/[^A-Za-z0-9]+/g, "-").replace(/-+$/, "");
  return `${config.clientShort}-D${deliverable.number}-${slug}-v0.1.docx`;
}

/** @param {{config, deliverable: {number,name,due,dueDate}, outline: {purpose, sections}}} p */
export function buildShell({ config, deliverable, outline }) {
  const d = deliverable;
  const label = `${config.clientShort} · Deliverable ${d.number} · ${d.name}`;

  const cover = [
    new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: config.client, size: 28, color: GREY })] }),
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(d.name)] }),
    new Paragraph({ children: [new TextRun({ text: `Deliverable ${d.number} of ${config.deliverables.length} · ${config.title}`, size: 24 })] }),
    new Paragraph({ spacing: { before: 400 }, children: [new TextRun(`Due: ${fmt(d.dueDate)} (Proposal §${CLAUSE[d.due] || "3"})`)] }),
    new Paragraph({ children: [new TextRun(`Prepared by: ${config.consultant}`)] }),
    new Paragraph({ children: [new TextRun(`Prepared for: ${config.sponsor}`)] }),
    new Paragraph({ children: [new TextRun({ text: "Version 0.1 · DRAFT for review", bold: true })] }),
    new Paragraph({ spacing: { before: 800 }, children: [new TextRun({ text: `Store this document in ${config.client} SharePoint. Do not upload it to the engagement workspace.`, italics: true, color: GREY, size: 18 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const control = [
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Document control")] }),
    table(["Version", "Date", "Author", "Change"], [["0.1", "", config.consultant, "Shell created"], ["", "", "", ""]], [0.15, 0.2, 0.3, 0.35]),
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("Review and approval")] }),
    table(["Name", "Role", "Date", "Decision"], [[config.sponsor.split(" — ")[0], config.sponsor.split(" — ")[1] || "Sponsor", "", ""], [config.dayToDay.split(" — ")[0], config.dayToDay.split(" — ")[1] || "Day-to-day lead", "", ""]], [0.3, 0.3, 0.15, 0.25]),
    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("Contents")] }),
    new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    guidance("Right-click the contents and choose Update Field once the document has content."),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const body = [
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Purpose of this document")] }),
    new Paragraph({ children: [new TextRun(outline.purpose)] }),
    ...outline.sections.flatMap((s, i) => [
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360 }, children: [new TextRun(`${i + 1}. ${s.heading}`)] }),
      guidance(s.guidance),
      new Paragraph(""),
    ]),
  ];

  return new Document({
    creator: config.consultant,
    title: `${config.clientShort} D${d.number} ${d.name}`,
    description: "Deliverable shell",
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${label} · DRAFT`, size: 16, color: GREY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: GREY })] })] }) },
      children: [...cover, ...control, ...body],
    }],
  });
}

export const shellToBlob = (doc) => Packer.toBlob(doc);
export const shellToBuffer = (doc) => Packer.toBuffer(doc);
