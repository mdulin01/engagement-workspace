// Draft Amendment authorizing the engagement workspace, as a .docx.
// Built from engagement.json so each client deployment gets its own draft.
// This is a drafting aid, not legal advice: client counsel reviews it, and
// the client may require its own amendment form (Proposal §8).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from "docx";

const GREY = "6B7280";
const BLANK = "[__________]";

const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: [].concat(text).map((t) => (typeof t === "string" ? new TextRun(t) : t)) });
const b = (t) => new TextRun({ text: t, bold: true });
const h = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun(t)] });
const item = (label, text) => p([b(`${label} `), text], { indent: { left: 360 } });

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const sigCell = (lines) => new TableCell({
  width: { size: 4680, type: WidthType.DXA },
  borders: { top: none, bottom: none, left: none, right: none },
  children: lines.map((l) => p(l)),
});

export const addendumFileName = (config, keyPersonnel = null) =>
  `${config.clientShort}-Amendment-${keyPersonnel ? "Workspace-and-Key-Personnel" : "Engagement-Workspace"}-DRAFT.docx`;

/**
 * @param {{config: object, siteUrl: string, keyPersonnel?: {name, credentials, role, qualifications}}} args
 * config: engagement.json. siteUrl: the workspace address. keyPersonnel: an
 * additional person whose participation Client must consent to under Section 4.
 */
export function buildAddendum({ config, siteUrl, keyPersonnel = null }) {
  const kp = keyPersonnel;
  const last = kp ? kp.name.split(" ").slice(-1)[0] : "";
  const client = config.client;
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const consultant = config.consultant;
  const [sponsorName, sponsorTitle] = config.sponsor.split(" — ");

  const children = [
    p(new TextRun({ text: "DRAFT FOR REVIEW BY CLIENT COUNSEL · NOT LEGAL ADVICE", bold: true, color: "B45309", size: 18 }), { alignment: AlignmentType.CENTER }),
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, children: [new TextRun("Amendment No. 1")] }),
    p(new TextRun({ text: kp ? "Engagement Workspace and Key Personnel" : "Use of the Engagement Workspace", size: 28 }), { alignment: AlignmentType.CENTER }),
    p(new TextRun({ text: config.title, color: GREY }), { alignment: AlignmentType.CENTER, spacing: { after: 360 } }),

    p([`This Amendment No. 1 (the "Amendment") is entered into as of ${BLANK} (the "Amendment Date") by and between the `, b(client), ` ("Client") and `, b(`${consultant}, individually`), ` ("Consultant"), and amends the services agreement between the parties dated ${BLANK}, which incorporates Consultant's proposal for the ${config.title} engagement (together, the "Agreement"). Capitalized terms not defined here have the meanings given in the Agreement.`]),

    h("Recitals"),
    p("A. Section 8 of the Agreement requires any change to be documented in a written amendment signed by both parties."),
    p("B. Section 9.2 of the Agreement provides that Consultant will not store PHI or Client confidential data on personal devices or personal cloud accounts, and that work involving identifiable data will be performed within Client's environment."),
    p("C. To manage the engagement efficiently, Consultant operates a secure, invitation-only website dedicated to this engagement, and the parties wish to authorize its use for the Term and to set out what information it may hold and how that information is protected."),
    ...(kp ? [p("D. Section 4 of the Agreement provides that all Services be performed personally by Consultant, and that Consultant not subcontract any portion of the Services without Client's prior written consent. The parties wish to record Client's consent to the participation of the person named in Section 9.")] : []),

    h("1. Definitions"),
    item("1.1", `"Workspace" means the website at https://${host}, and any successor address Consultant gives Client in writing, together with the hosting, authentication and database services that support it.`),
    item("1.2", `"Service Providers" means the third-party infrastructure providers Consultant uses to operate the Workspace: currently Google (Firebase Authentication and Cloud Firestore, with data located in the United States) and Vercel (web hosting). Consultant will notify Client in writing before adding or replacing a Service Provider that stores Workspace Data.`),
    item("1.3", `"Workspace Data" means information stored in the Workspace.`),
    item("1.4", `"Participant" means a member of Client's workforce, or another person Client designates, who is invited to sign in to the Workspace or to complete a Workspace survey.`),

    h("2. Authorization"),
    p(`Client authorizes Consultant to operate and use the Workspace for the Term, including any extension, for the following purposes only:`),
    item("(a)", "engagement management, including the timeline, milestones, Deliverable status, status reports, and Consultant's effort and expense records;"),
    item("(b)", "sign-in access for Participants invited by Consultant with the approval of Client's project sponsor, with access limited by role;"),
    item("(c)", "identifying, scheduling and tracking stakeholder interviews;"),
    item("(d)", "pre-interview surveys of Participants, including rating questions and short written responses;"),
    item("(e)", "preparing and presenting briefing materials for engagement meetings;"),
    item("(f)", "listing links to engagement documents, including the Agreement and this Amendment, and to materials that remain stored in Client's environment."),

    h("3. Workspace Data"),
    item("3.1 Permitted.", "The Workspace may hold: names, work email addresses, titles and work units of Participants and interviewees; interview scheduling status; survey responses; theme tags that do not identify individuals; engagement management records; briefing slide text; and links to documents."),
    item("3.2 Not permitted.", "The Workspace will not hold: (a) protected health information (\"PHI\"); (b) interview notes, audio recordings or transcripts, which remain in Client's Microsoft 365 environment and are referenced in the Workspace by link only; (c) drafts or final versions of written Deliverables, which remain in Client's environment; or (d) passwords or other credentials for Client systems."),
    item("3.3 Section 9.2.", "Client agrees that the Workspace is an engagement-dedicated service operated by Consultant, not a personal cloud account for the purposes of Section 9.2, and that holding Workspace Data as permitted by this Amendment does not breach Section 9.2. Section 9.2 otherwise applies in full, including to any PHI or Client confidential data that reaches the Workspace despite Section 3.2."),

    h("4. Incidental PHI"),
    p("Surveys and other entry forms will tell Participants not to include patient information. If Consultant becomes aware that PHI has been entered into the Workspace, Consultant will (a) delete it from the Workspace within two (2) business days of discovery, (b) notify Client in accordance with the incident-reporting provision of Section 9.2, and (c) cooperate with Client's assessment of the event under Client's policies and the HIPAA arrangement elected under Section 9.2."),

    h("5. Participants"),
    item("5.1", "Completing a survey is voluntary. Each survey begins with a notice that explains its purpose, who will see the responses, and that responses should not include patient information."),
    item("5.2", `Individual survey responses are visible only to Consultant. Client leadership sees survey results only as averages, and only once at least three (3) Participants have responded. Consultant will not attribute survey responses or interview content to named individuals in reports or Deliverables.`),
    item("5.3", "Client will not use Workspace Data to evaluate the performance of any individual employee."),

    h("6. Security"),
    item("6.1", "Access to the Workspace requires an invitation from Consultant and sign-in with a verified email address. Access rights are enforced by server-side rules according to each user's role. Survey links are unique, unguessable, and accept one submission each."),
    item("6.2", "Workspace Data is encrypted in transit (HTTPS) and, by the Service Providers, at rest."),
    item("6.3", "Consultant is the sole administrator of the Workspace, will protect administrative credentials with multi-factor authentication, and will not sell Workspace Data or use it for any purpose outside the Services."),
    item("6.4", "Consultant will not process Workspace Data with third-party artificial intelligence services without Client's prior written approval."),

    h("7. Records, retention and deletion"),
    item("7.1", "Consultant acknowledges that Workspace Data may be subject to the Georgia Open Records Act and will cooperate with records requests as directed by Client, consistent with Section 9.3."),
    item("7.2", "Within thirty (30) days after expiration or termination of the Agreement, Consultant will, at Client's direction, deliver an export of Workspace Data to Client in a common electronic format, then delete Workspace Data from the Workspace and the Service Providers, and confirm the deletion to Client in writing. Consultant may retain the Agreement, this Amendment, and its own invoicing and effort records."),

    ...(kp ? [
      h("9. Key personnel"),
      item("9.1 Consent.", `Under Section 4 of the Agreement, Client consents to the participation of ${kp.name}, ${kp.credentials}, as a subcontractor to Consultant performing ${kp.role} under Consultant's direction and supervision.`),
      item("9.2 Qualifications.", `${kp.qualifications} A curriculum vitae has been provided to Client.`),
      item("9.3 Responsibility.", `Consultant remains fully responsible for all Services and Deliverables, including any portion performed by Dr. ${last}, and remains Client's single point of contact and accountability. Section 4 otherwise continues to apply, and no further subcontracting or assignment is authorized.`),
      item("9.4 No change in cost.", `Dr. ${last} is engaged and paid by Consultant. This Amendment does not change the compensation, Consulting Days, or reimbursable expenses payable by Client under the Agreement, and Client has no payment obligation to Dr. ${last}.`),
      item("9.5 Flow-down.", `Before performing any Services, Dr. ${last} will enter into a written agreement with Consultant binding him to confidentiality, data-handling and PHI obligations no less protective than Section 9.2 of the Agreement and this Amendment, to the independence and conflict-of-interest obligations of Section 9.4, and to Client policies and any HIPAA arrangement elected under Section 9.2. Dr. ${last} will provide a written conflict-of-interest disclosure to Client before performing any Services.`),
      item("9.6 Workspace access.", `Dr. ${last} may be given a "team" account in the Workspace, which reaches engagement management, interview and survey information and briefing materials, and excludes Consultant's billing records and administrative settings.`),
      item("9.7 Changes.", `Consultant will not add or replace key personnel without Client's prior written consent. Client may request in writing that Dr. ${last} be removed from the engagement, and Consultant will comply promptly, then perform the affected Services personally or propose a replacement for Client's consent.`),
    ] : []),

    h(kp ? "10. General" : "8. General"),
    item(kp ? "10.1" : "8.1", "This Amendment is effective on the Amendment Date and ends with the Agreement, except that Section 7.2 survives until it is performed."),
    item(kp ? "10.2" : "8.2", `This Amendment does not change the scope of Services, the Deliverables, the level of effort, or compensation. The Workspace${kp ? " and the participation of the person named in Section 9 are" : " is"} provided at no additional cost to Client.`),
    item(kp ? "10.3" : "8.3", "Except as stated in this Amendment, the Agreement remains in full force and effect. If this Amendment and the Agreement conflict, this Amendment controls."),

    p("The parties have signed this Amendment as of the Amendment Date.", { spacing: { before: 360, after: 240 } }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
      rows: [new TableRow({
        children: [
          sigCell([b(client.toUpperCase()), "", "By: ______________________________", `Name: ${BLANK}`, `Title: ${BLANK}`, "Date: ____________________"]),
          sigCell([b("CONSULTANT"), "", "By: ______________________________", `Name: ${consultant}`, "Title: Independent Consultant", "Date: ____________________"]),
        ],
      })],
    }),
    p(new TextRun({ text: `Client's project sponsor is ${sponsorName}${sponsorTitle ? `, ${sponsorTitle}` : ""}. Insert the authorized signatory for Client.`, italics: true, color: GREY, size: 18 }), { spacing: { before: 360 } }),
  ];

  return new Document({
    creator: consultant,
    title: `${config.clientShort} Amendment No. 1 — ${kp ? "Workspace and Key Personnel" : "Engagement Workspace"} (draft)`,
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [`${config.clientShort} · Amendment No. 1 · DRAFT · Page `, PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: GREY })] })] }) },
      children,
    }],
  });
}

export const addendumToBlob = (doc) => Packer.toBlob(doc);
export const addendumToBuffer = (doc) => Packer.toBuffer(doc);
