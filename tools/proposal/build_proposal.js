const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel,
  BorderStyle, ShadingType, Header, Footer, PageNumber, LevelFormat, TabStopType, PageBreak,
} = require("docx");

const NAVY = "14283A", TEAL = "0F766E", GRAY = "6B7280", LINE = "D9D9D9";
const FONT = "Calibri";
const PAGE_W = 12240, MARGIN = 1296, CONTENT_W = PAGE_W - 2 * MARGIN; // 9648

const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: 21, ...o });
const P = (children, o = {}) => new Paragraph({ spacing: { after: 120, line: 276 }, ...o, children: Array.isArray(children) ? children : [run(children)] });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 }, children: [new TextRun({ text: t, font: FONT, size: 28, bold: true, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, children: [new TextRun({ text: t, font: FONT, size: 23, bold: true, color: NAVY })] });
const B = (t, level = 0) => new Paragraph({ numbering: { reference: "bullets", level }, spacing: { after: 80, line: 264 }, children: typeof t === "string" ? [run(t)] : t });
const bold = (t) => run(t, { bold: true });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
function cell(content, w, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) => (typeof c === "string" ? new Paragraph({ spacing: { after: 40, line: 252 }, children: [run(c, o.bold ? { bold: true } : {})] }) : c));
  return new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 110, right: 110 }, shading: o.shade ? { type: ShadingType.CLEAR, fill: o.shade, color: "auto" } : undefined, children: paras });
}
function kvTable(rows, kw = 2200) {
  const vw = CONTENT_W - kw;
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [kw, vw], borders, rows: rows.map(([k, v]) => new TableRow({ children: [cell(k, kw, { bold: true, shade: "F3F4F6" }), cell(v, vw)] })) });
}
function grid(headers, rows, widths) {
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, borders, rows: [
    new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, shade: "E8EEF0" })) }),
    ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, widths[i])) })),
  ] });
}
const spacer = () => new Paragraph({ spacing: { after: 60 }, children: [] });

const doc = new Document({
  creator: "Michael Dulin, MD, PhD",
  title: "Proposal for Consulting Services: Public Health Data Modernization, Data Strategy & Governance (revised October 9, 2026)",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [{ reference: "bullets", levels: [
    { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
    { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } },
  ] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: 1200, bottom: 1100, left: MARGIN, right: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } }, children: [new TextRun({ text: "Dulin  |  Consulting Proposal  |  Fulton County Board of Health  |  Revised October 9, 2026", font: FONT, size: 16, color: GRAY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: FONT, size: 16, color: GRAY }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: GRAY }), new TextRun({ text: " of ", font: FONT, size: 16, color: GRAY }), new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: GRAY })] })] }) },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "MICHAEL (MIKE) DULIN, MD, PhD", font: FONT, size: 26, bold: true, color: NAVY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: "Independent Consultant  |  Population Health, Health Data Strategy & Applied Analytics", font: FONT, size: 18, color: GRAY })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 320 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 6 } }, children: [new TextRun({ text: "113 N. Church Street #110, Greensboro, NC 27401  |  (704) 641-2157  |  mdulin@gmail.com", font: FONT, size: 18, color: GRAY })] }),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Proposal for Consulting Services", font: FONT, size: 40, bold: true, color: NAVY })] }),
      new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "Public Health Data Modernization, Data Strategy & Governance", font: FONT, size: 26, color: TEAL })] }),
      P("This proposal is submitted by Michael Dulin, MD, PhD, individually (“Consultant”) to the Fulton County Board of Health (“FCBOH” or the “Client”). It sets out the proposed scope of services, deliverables, schedule, level of effort, and compensation for the engagement described below. Upon acceptance, this proposal is intended to be attached to and made part of a definitive services agreement between the parties."),
      P([run("This revision, dated October 9, 2026, supersedes the version dated September 11, 2026. It reflects the kickoff discussions held at FCBOH on October 8, 2026 with the District Health Director, the Medical Director, the Deputy District Health Director, information technology leadership, and the evaluation team, and records Client’s consent to the engagement team described in Section 4.1 and the engagement workspace described in Section 9.5. Scope, level of effort, and compensation are unchanged.", { italic: true })]),
      kvTable([
        ["Client", "Fulton County Board of Health, 10 Park Place SE, Atlanta, GA 30303"],
        ["Client sponsor", "Marcus Plescia, MD, MPH — District Health Director, Fulton Health District (District 3-2)"],
        ["Day-to-day contact", "Susan Hrapcak, MD — Medical Director"],
        ["Client liaison", "Alix Ferdinand, MD — resident physician, designated by Client as project liaison (Section 9.1)"],
        ["Consultant", "Michael Dulin, MD, PhD, individually, as an independent contractor"],
        ["Effective date", "Date of full execution"],
        ["Term", "Six (6) months from the Effective Date, unless extended by written amendment or terminated earlier in accordance with the definitive services agreement"],
      ]),

      H1("1.  Purpose"),
      P("Consultant will provide strategic advisory services to assess FCBOH’s current public health data infrastructure and to develop a data strategy, data governance framework, artificial intelligence opportunity assessment, and organizational and vendor recommendations supporting clinical operations, performance improvement and quality assurance, the Community Health Assessment, public health department accreditation under the Public Health Accreditation Board (PHAB) Standards & Measures, Version 2022, and mandated reporting."),
      P("The work builds on what FCBOH has already started. FCBOH has a Data Modernization Initiative with a standing committee, a completed data-needs assessment and data management guide, an evaluation team producing targeted evaluation plans and survey-based measurement, and a Microsoft 365 environment that includes Power BI and SharePoint. The strategy will extend these assets rather than replace them."),
      P("Services are advisory only. Consultant will not provide patient care, clinical supervision, or any service requiring clinical privileges or Georgia medical licensure, and will not implement, configure, or administer any information system."),

      H1("2.  Services"),
      P("Consultant will perform the following Services:"),
      H2("2.1  Current-state assessment and stakeholder engagement"),
      B("Conduct structured interviews with FCBOH leadership, clinical program and clinic operations staff, epidemiology and surveillance staff, information technology staff, grants and finance staff, the evaluation team, and end users of clinical and reporting systems (anticipated 12–15 interviews). An initial stakeholder list is provided in Appendix A."),
      B("Review the Data Modernization Initiative’s existing materials, including its charter and membership, the data-needs assessment, the data management guide, and the environmental health reporting work that has been completed, and incorporate them into the baseline."),
      B("Develop an inventory of data systems, interfaces, extracts, reports, dashboards, survey instruments, and manual processes, including data flows to and from state and regional systems and the routine reports FCBOH submits to the Georgia Department of Public Health."),
      B("Document the Microsoft 365 estate in use for data work (Power BI, SharePoint, Microsoft Forms, Lists, OneDrive, Excel) and the external survey tools in use (for example SurveyMonkey), and confirm with Client information technology which Microsoft cloud data services are licensed and permitted under Georgia Department of Public Health policy."),
      B("Document laboratory data flows, including how results from Quest Diagnostics and LabCorp reach the clinical system of record and the Ryan White program, and identify where results are entered or reconciled manually."),
      B("Review vendor contracts, service-level agreements, data-access and data-ownership terms, and analytics license entitlements provided by Client, including the Visual HealthNet (VHN) agreement’s provisions on data ownership, export rights, recurring extract entitlements, report-development fees, and termination assistance and data return."),
      B("Confirm VHN’s ONC certification status and certified criteria on the Certified Health IT Product List, including whether the product is certified to 45 CFR § 170.315(b)(10) electronic health information export, and evaluate the export and extract capability the product demonstrably provides."),
      B("Assess Client’s options for obtaining recurring, computable extracts of its own data, including the applicability of the information blocking rules at 45 CFR Part 171 and the fees exception at 45 CFR § 171.302. Any position asserted with a vendor on these matters is subject to review by Client counsel; see Section 10.2."),
      B("Assess current analytic, informatics, and epidemiologic capacity and staffing."),
      B("Complete a capability maturity assessment against an established public health informatics framework."),
      H2("2.2  Data strategy and governance"),
      B("Develop a recommended target-state data architecture addressing data warehousing or lakehouse approach, integration, master person index and record linkage, master provider and location reference data, metadata and data dictionary management, and reporting and visualization, with options evaluated first within the Microsoft platform FCBOH already licenses."),
      B("Develop a data governance framework addressing decision rights, data stewardship roles, governance body charter and membership, data classification, and data-quality standards and monitoring, including a recommendation on the charter, membership, and meeting cadence of the existing Data Modernization Initiative committee."),
      B("Develop an internal and external data-sharing framework, including recommended agreement structures and de-identification standards."),
      B("Develop a prioritized, sequenced implementation roadmap with dependencies, order-of-magnitude cost ranges, and alignment to available funding sources."),
      H2("2.3  Clinical operations, performance improvement and quality assurance"),
      B("Identify operational and quality measures relevant to FCBOH clinical services and assess current measurability of each, starting from the list of required program measures maintained by the Medical Director and the reports FCBOH already submits to the state."),
      B([run("Address first the measures leadership identified at kickoff: "), bold("encounter volume by provider and by site"), run(", which requires a maintained provider roster (master clinician list); "), bold("syphilis, HIV, and cervical cancer screening"), run(", including the time from a positive result to client notification, treatment, or linkage to care, so that no positive result is missed; and "), bold("STI and HIV testing volume"), run(" compared with neighboring health districts, to understand why FCBOH’s reported testing levels are lower.")]),
      B("Recommend reporting cadence, feedback mechanisms, and dashboard and scorecard requirements for clinical and program management."),
      B("Identify documentation and workflow changes in the clinical system of record required to capture missing data elements."),
      H2("2.4  Community Health Assessment and accreditation support"),
      B("Review the current Community Health Assessment approach, data sources, and production process."),
      B("Recommend a sustainable, refreshable data architecture for the Community Health Assessment, including small-area indicators, social and economic determinants, geospatial layers, and linkage of service data to community-level measures."),
      B("Recommend automation opportunities and linkage of Assessment outputs to Community Health Improvement Plan monitoring."),
      B("Map the recommended data strategy, governance framework, and measurement approach to the PHAB Version 2022 domains and measures that depend on data capability, including Domain 1 (assess and monitor population health status, factors that influence health, and community needs and assets), Domain 5 (create, champion, and implement policies, plans, and laws that impact health), and the domains addressing evaluation and quality improvement and organizational infrastructure."),
      B("Identify where current practice would not produce documentation acceptable for accreditation, and recommend how required accreditation evidence can be generated and retained as a routine output of the data platform rather than assembled during an application window."),
      B("Identify accreditation-relevant gaps carrying long lead times so that remediation can begin in advance of an initial accreditation or reaccreditation submission."),
      H2("2.5  Artificial intelligence opportunity assessment"),
      B("Catalog and prioritize candidate artificial intelligence use cases across data management, data quality, insight generation, and operations, assessed against value, feasibility, data readiness, cost, and risk."),
      B("Develop an artificial intelligence governance framework addressing permitted and prohibited uses, protected health information handling and vendor terms, human-in-the-loop requirements, bias and equity evaluation, validation and monitoring, documentation, and public transparency, written to operate within Georgia Department of Public Health policy."),
      B("Respect the State’s current constraints. Consultant will not introduce or operate any artificial intelligence tool in Client’s or the Georgia Department of Public Health’s environment, including meeting transcription or note-taking tools, and will not process Client data with third-party artificial intelligence services. Any recommended pilot will require written approval from Client and, where applicable, the Department, and will be designed to run on de-identified or synthetic data until such approval is in place."),
      B("Recommend one or more pilot use cases with defined success criteria, prerequisites, and the approvals required before they could begin."),
      H2("2.6  Organizational structure, staffing and vendor strategy"),
      B("Recommend target organizational structure, reporting relationships, and role definitions for the data, informatics, and epidemiology function, including draft position descriptions and market cost estimates."),
      B("Assess build-versus-buy and direct-hire-versus-contracted-service options."),
      B("Facilitate structured requirements-definition and technical due-diligence sessions with vendors designated by Client, which may include Harris Integrative (Visual HealthNet), Microsoft, Quest Diagnostics, LabCorp, and others. Client shall participate in all vendor sessions."),
      B("Structure and support a data-egress discussion with the EMR vendor addressing recurring computable extracts, population-level export, interface specifications, and the basis for any fees charged, with the objective of replacing per-report purchasing with a standing data feed controlled by Client."),
      B("Establish with the EMR vendor which laboratory result interfaces the product supports today, what each costs to enable, and the user interface update path the vendor has described, so that any decision on laboratory vendors (including the Ryan White program’s) is made with the interface facts in hand."),
      B("Prepare functional and technical requirements suitable for Client use in any future solicitation."),
      H2("2.7  Engagement management"),
      B("Kickoff session and confirmation of engagement charter within two (2) weeks of the Effective Date. The October 8, 2026 meetings serve as the kickoff session; the charter will be confirmed in writing."),
      B("Biweekly status check-in with the Client day-to-day contact and the Client liaison, and a written monthly status summary."),
      B("Interim findings readout to Client leadership at approximately Week 6; on-site Executive Briefing at approximately Week 13 (Day 90); draft-strategy working session with leadership at approximately Week 18."),
      B("One peer learning session with Mecklenburg County Public Health’s informatics leadership (Section 4.1), scheduled at Client’s convenience."),

      H1("3.  Deliverables"),
      P("Consultant will provide the following Deliverables in editable electronic format. Written Deliverables are submitted in draft for Client review, with one round of consolidated Client revisions included. Client will provide consolidated written comments within ten (10) business days of receipt of any draft."),
      H2("3.1  Day 90 deliverable package"),
      grid(["#", "Deliverable", "Contents", "Due"], [
        ["1", "Current-State Assessment Report", "Systems and data inventory, data-flow documentation (including laboratory and state reporting flows), interview synthesis, capability maturity baseline, prioritized gap analysis", "Day 90"],
        ["2", "EMR Data Access Assessment (VHN)", "Certification status and certified criteria, contractual data rights, demonstrated export capability, supported laboratory interfaces, gap list, and recommended path to recurring computable data egress", "Day 90"],
        ["3", "AI Opportunity Assessment", "Prioritized use-case catalog with value, feasibility and risk ratings; AI governance framework aligned with Georgia Department of Public Health policy; recommended pilot(s), success criteria, and required approvals", "Day 90"],
        ["4", "Executive Briefing", "On-site presentation and working discussion with the District Health Director and leadership team covering all findings above, together with the emerging strategic direction and its preliminary organizational implications", "Day 90"],
      ], [500, 2300, 5748, 1100]),
      spacer(),
      H2("3.2  End-of-term deliverable package"),
      grid(["#", "Deliverable", "Contents", "Due"], [
        ["5", "Data Strategy, Governance Framework and Roadmap", "Target-state architecture; governance framework covering decision rights, stewardship, data classification, data-quality standards and data sharing; sequenced roadmap with dependencies and order-of-magnitude cost ranges; organizational structure and staffing recommendations with draft position descriptions; vendor capability and contract findings; and a detailed first-year work plan", "Month 6"],
        ["6", "Clinical Operations Measurement Plan", "Recommended PI/QA measure set beginning with provider-level volume and the syphilis, HIV and cervical cancer screening and follow-up measures; data sources; reporting cadence; dashboard requirements; required documentation changes", "Month 6"],
        ["7", "Community Health Assessment and Accreditation Readiness", "Sustainable Assessment data architecture, source inventory and automation recommendations with CHIP linkage; mapping to PHAB Version 2022 domains and measures with documentation gap list, suggested owners and lead times", "Month 6"],
        ["8", "Transition Briefing and Handoff", "Final presentation to leadership; delivery of all working materials and source documentation", "Month 6"],
      ], [500, 2300, 5748, 1100]),
      spacer(),
      P("“Day 90” means ninety (90) calendar days following the Effective Date. Deliverable dates shift day-for-day to the extent of any Client-caused delay in providing access, data, documents, or personnel."),
      H2("3.3  Engagement schedule"),
      P("The Term spans six (6) months. Deliverable timing is anchored to the phases below; week numbers run from the Effective Date, and adjacent phases overlap by design."),
      B([bold("Phase 1 — Discovery (Weeks 1–8). "), run("Kickoff and charter confirmation; stakeholder interviews; systems and data inventory; review of Data Modernization Initiative materials; contract, certification and export-capability review; initial vendor conversations, including the laboratory interface question.")]),
      B([bold("Phase 2 — Analysis and synthesis (Weeks 7–12). "), run("Synthesis of interview and inventory findings; capability maturity assessment; gap analysis; artificial intelligence use-case screening.")]),
      B([bold("Phase 3 — Day 90 findings package (Weeks 11–13). "), run("Completion and delivery of Deliverables 1 through 4, concluding with the on-site Executive Briefing.")]),
      B([bold("Phase 4 — Strategy and recommendations development (Weeks 14–21). "), run("Target-state architecture, governance framework and roadmap; organizational and staffing recommendations; clinical operations measurement plan; Community Health Assessment and accreditation mapping; structured vendor working sessions.")]),
      B([bold("Phase 5 — Socialization, finalization and handoff (Weeks 22–26). "), run("Circulation of drafts to staff, information technology and vendors; incorporation of consolidated Client comments; delivery of Deliverables 5 through 8, concluding with the on-site Transition Briefing.")]),

      H1("4.  Level of Effort"),
      kvTable([
        ["Committed effort", "Up to five (5) Consulting Days per calendar month, corresponding to approximately one to one and one-half days per week."],
        ["Definition of a Consulting Day", "Eight (8) hours of professional time, whether performed on-site or remotely, including interviews, analysis, deliverable preparation, vendor sessions, and engagement management. Time may be aggregated across partial days."],
        ["On-site presence", "Approximately two (2) on-site days per month at Client facilities in Atlanta, Georgia, drawn from the monthly allotment. On-site days may be weighted toward Phase 1 discovery and the Day 90 executive briefing by mutual agreement."],
        ["Carryover", "Unused Consulting Days do not carry forward between months and are not refundable. Reasonable month-to-month variation in effort within the Term is absorbed by Consultant at no additional charge."],
        ["Key personnel", "Services are performed by Michael Dulin, MD, PhD, with the participation of the persons named in Section 4.1, to which Client consents by accepting this proposal. Consultant shall not otherwise subcontract or assign any portion of the Services without the prior written consent of Client."],
        ["Scheduling", "Consultant will provide a proposed schedule of on-site dates at least fourteen (14) days in advance. Client-requested cancellation of a confirmed on-site day within seven (7) days of the date does not reduce the monthly allotment, and non-refundable travel costs already incurred remain reimbursable."],
      ], 2400),
      spacer(),
      H2("4.1  Engagement team"),
      P([bold("Michael Dulin, MD, PhD "), run("leads the engagement, performs the Services, and remains fully responsible for all Services and Deliverables, including any portion performed by the persons below. Consultant is Client’s single point of contact and accountability.")]),
      P([bold("Rashaud Senior, MD, MMCi "), run("(board-certified in clinical informatics and family medicine; Medical Director of Informatics at Avance Care; formerly Data Insights Consultant to the North Carolina Department of Health and Human Services Data Office) supports the artificial intelligence opportunity assessment described in Section 2.5 and Deliverable 3, and assists with stakeholder interviews and analysis, under Consultant’s direction and supervision. Dr. Senior is engaged and paid by Consultant; this adds no cost to Client. Before performing any Services, Dr. Senior will sign a written agreement with Consultant binding him to confidentiality, data-handling and PHI obligations no less protective than Section 9.2, to the independence obligations of Section 9.4, and to Client policies and any HIPAA arrangement elected under Section 9.2, and will provide a written conflict-of-interest disclosure to Client. A curriculum vitae is provided with this proposal.")]),
      P([bold("Jonathan Ong, MBA, PMP, CDMP "), run("(Public Health Data Director, Mecklenburg County Public Health, North Carolina) participates as a peer advisor at no charge to Client or Consultant: one on-site or virtual peer learning session for FCBOH leadership and staff on Mecklenburg’s informatics program and community data governance, and informal consultation to Consultant. Mr. Ong has no role in the Deliverables, receives no Client data, and is not a subcontractor. Any travel cost for an on-site session will be agreed in writing in advance.")]),
      P([bold("Client participants. "), run("Client designates Alix Ferdinand, MD, resident physician, as project liaison; Dr. Ferdinand participates under Client’s supervision and residency program requirements, and Consultant will provide a one-page description of the liaison role for Client’s approval. The Data Modernization Initiative committee and the evaluation team serve as the working group for review of interim findings and drafts.")]),
      P("Consultant will not add or replace key personnel without Client’s prior written consent. Client may request in writing that any named person be removed from the engagement, and Consultant will comply promptly and perform the affected Services personally or propose a replacement for Client’s consent."),

      H1("5.  Compensation"),
      kvTable([
        ["Monthly retainer", "$10,000 per month, payable monthly in arrears, covering the committed effort described in Section 4 and the participation of the engagement team in Section 4.1."],
        ["Total base compensation", "$60,000.00 for the six-month Term, exclusive of reimbursable expenses. This is the maximum amount payable absent a written amendment under Section 8."],
        ["Additional Consulting Days", "Consulting Days in excess of the monthly allotment: $2,000 per day, or $250 per hour for partial days. Additional Days shall be performed only upon prior written authorization from the Client sponsor or designee, and shall not exceed any authorized not-to-exceed amount."],
        ["Pre-contract consultation", "Professional time for the October 8, 2026 kickoff visit, invoiced separately at $250 per hour before the Effective Date, is outside this proposal and does not reduce the retainer."],
        ["Partial months", "Where the Term begins or ends mid-month, the retainer is prorated based on Consulting Days actually available in that month."],
        ["Escalation", "None during the initial Term. Any extension is subject to rates agreed in writing at the time of extension."],
      ], 2400),

      H1("6.  Travel and Reimbursable Expenses"),
      P("Consultant’s travel originates from Greensboro, North Carolina (GSO). Client shall reimburse pre-approved, documented travel expenses at actual cost, without markup or administrative fee, subject to the following:"),
      B("Airfare: coach/economy class only, booked at least fourteen (14) days in advance where practicable."),
      B("Lodging and meals: at or below the prevailing federal General Services Administration per diem rate for Atlanta, Georgia, in effect on the date of travel."),
      B("Ground transportation, airport parking, tolls, and baggage fees at actual cost; personal-vehicle mileage at the prevailing federal mileage rate."),
      B("Travel time is not billable and is not charged against the monthly Consulting Day allotment."),
      B("Estimated travel cost is $1,200–1,800 per month for two on-site days, to be reconciled against actual documented cost."),
      B("Not-to-exceed. Total reimbursable expenses over the Term shall not exceed $11,000.00 without prior written authorization from Client."),
      B("Receipts are required for all reimbursable expenses. Expenses not conforming to this Section are borne by Consultant."),
      B("Client may, at its option, arrange and pay directly for airfare and lodging in lieu of reimbursement."),

      H1("7.  Invoicing and Payment"),
      B("Consultant will invoice monthly in arrears. Each invoice will state the Consulting Days worked, a summary of activities performed and Deliverables advanced, any authorized Additional Days, and itemized reimbursable expenses with receipts attached."),
      B("Invoices are payable net thirty (30) days from receipt of a correct and complete invoice."),
      B("Consultant is an independent contractor and is solely responsible for all federal, state, and local taxes on amounts paid under this engagement. Client will issue an IRS Form 1099 as applicable. Consultant has provided a completed IRS Form W-9 and Client’s supplier form."),
      B("Upon termination, Consultant will be paid for Services rendered and expenses incurred through the effective date of termination, and will deliver all work in progress."),

      H1("8.  Change Control"),
      P("Any change to scope, Deliverables, Term, level of effort, or compensation must be documented in a written amendment or change order signed by both parties before the affected work is performed. Consultant will notify Client promptly in writing if Consultant believes a Client request constitutes a change to scope, and will not proceed with the affected work until the change is authorized."),

      H1("9.  Client Obligations, Access and Data Handling"),
      H2("9.1  Client obligations"),
      B("Designate a project sponsor, a scheduling coordinator, and the Client liaison within one (1) week of the Effective Date."),
      B("Communicate leadership endorsement of the engagement to staff and make personnel available for interviews and working sessions, including the Data Modernization Initiative committee and the evaluation team."),
      B("Provide requested documents, data, system access, and vendor introductions within ten (10) business days of request, including the Data Modernization Initiative materials, the current list of required program measures, examples of reports submitted to the state, and an introduction to the Visual HealthNet account team."),
      B("Provide a Client-issued email account and, where system access is required, a Client-issued device or virtual desktop environment, with access to the Microsoft 365 workspace used for the engagement."),
      B("Provide required onboarding, privacy, security, and compliance training and process any required background screening."),
      H2("9.2  Protected health information and confidentiality"),
      B([bold("Minimum necessary. "), run("Consultant will request and use de-identified data, limited data sets, or synthetic or test data wherever adequate for the purpose, and will access identifiable protected health information (“PHI”) only where required by the analytic question and only for so long as required.")]),
      B([bold("HIPAA arrangement. "), run("Client shall elect one of the following, at Client’s discretion and subject to review by Client counsel: (a) designation of Consultant and Dr. Senior as members of Client’s workforce for the limited purposes of this engagement, subject to Client policies, training, and supervision; or (b) execution of a Business Associate Agreement in Client’s standard form. Consultant will comply with either election.")]),
      B([bold("Handling. "), run("Consultant will not store PHI or Client confidential data on personal devices or personal cloud accounts, transmit it through personal email, or use it for any purpose outside the Services. Work involving identifiable data will be performed within Client’s environment. All Deliverables will contain only aggregate or de-identified information.")]),
      B([bold("Incident reporting. "), run("Consultant will report any suspected loss, unauthorized access, or unauthorized disclosure of PHI or confidential information to Client immediately upon discovery, and will cooperate fully in any resulting investigation.")]),
      B([bold("Return or destruction. "), run("Upon expiration or termination, Consultant will return or destroy all Client data and confidential materials at Client’s direction and surrender all access credentials.")]),
      H2("9.3  Work product and public records"),
      B("All Deliverables and materials prepared specifically for Client under this engagement are the property of Client. Consultant retains the right to use general methodologies, frameworks, tools, and know-how that do not disclose Client confidential information or PHI."),
      B("Consultant acknowledges that Client is subject to the Georgia Open Records Act and will cooperate with records requests as directed by Client."),
      B("Consultant will not publish, present, or otherwise disclose any Client-specific findings without Client’s prior written consent."),
      H2("9.4  Independence and conflicts of interest"),
      B("Consultant holds no financial interest in, and receives no compensation, referral fee, commission, or other consideration from, any vendor evaluated or recommended under this engagement."),
      B("Prior affiliation (voluntary disclosure). Consultant served as Chief Medical Officer of Gray Matter Analytics, a healthcare analytics firm, from 2018 to 2025. That relationship ended in 2025. Consultant holds no financial, equity, advisory, or consulting interest in that entity or any successor entity, and none in any other analytics, artificial intelligence, or health technology vendor."),
      B("Mitigation. Should any recommendation under this engagement touch Gray Matter Analytics, a successor entity, or a product it supplies, Consultant will disclose that fact in writing and recuse from the affected recommendation at Client’s direction."),
      B("Consultant will disclose promptly in writing any relationship arising during the Term that could reasonably be perceived as a conflict, and will recuse from the affected recommendation at Client’s direction. Dr. Senior’s disclosure under Section 4.1 is subject to the same standard."),
      B("Consultant has no procurement authority, will not negotiate with any vendor on Client’s behalf, and will not execute any instrument binding Client."),
      H2("9.5  Engagement workspace"),
      P("To manage the engagement, Consultant operates an invitation-only website dedicated to this engagement at https://fcboh.dulinconsulting.app (the “Workspace”), hosted on Vercel with authentication and database services from Google Firebase, data located in the United States. Client authorizes its use for the Term, including any extension, on the following terms:"),
      B([bold("Purposes. "), run("Engagement management (timeline, milestones, Deliverable status, status reports, effort and expense records); role-limited sign-in for Client participants invited by Consultant with the sponsor’s approval; identifying, scheduling and tracking stakeholder interviews; voluntary pre-interview surveys; briefing materials and demonstrations built on public or synthetic data; and links to documents that remain in Client’s environment.")]),
      B([bold("Permitted data. "), run("Names, work email addresses, titles and work units of participants; interview scheduling status; survey responses; theme tags that do not identify individuals; engagement management records; briefing slide text; and document links.")]),
      B([bold("Not permitted. "), run("PHI; interview notes, recordings or transcripts, which remain in Client’s Microsoft 365 environment and are referenced by link only; drafts or final Deliverables, which remain in Client’s environment; and credentials for Client systems. Surveys and forms instruct participants not to include client information; any PHI discovered will be deleted within two (2) business days and reported under Section 9.2.")]),
      B([bold("Participants. "), run("Surveys are voluntary and begin with a notice of purpose and audience. Individual responses are visible only to Consultant; Client leadership sees averages only, and only once at least three (3) people have responded. Client will not use Workspace data to evaluate the performance of any individual employee.")]),
      B([bold("Security. "), run("Access requires an invitation and sign-in with a verified email address, enforced by server-side rules by role; data is encrypted in transit and at rest; Consultant is the sole administrator and protects administrative credentials with multi-factor authentication. Consultant will not process Workspace data with third-party artificial intelligence services without Client’s prior written approval.")]),
      B([bold("Records and deletion. "), run("Workspace data may be subject to the Georgia Open Records Act and Consultant will cooperate with records requests as directed by Client. Within thirty (30) days after the Term ends, Consultant will deliver an export of Workspace data to Client in a common electronic format, delete it from the Workspace and its service providers, and confirm the deletion in writing. Client agrees that the Workspace, used as described here, is an engagement-dedicated service and not a personal cloud account for purposes of Section 9.2.")]),

      H1("10.  Assumptions and Exclusions"),
      H2("10.1  Assumptions"),
      B("Client obligations under Section 9.1 are met on the stated timelines."),
      B("Client leadership is available for the Week 6 interim readout, the Day 90 executive briefing, the Week 18 draft-strategy working session, and the Month 6 transition briefing."),
      B("Vendor account teams participate in scheduled requirements sessions."),
      B("Consultant relies on the accuracy and completeness of information, documents, and data furnished by Client and its vendors, and has no obligation to independently audit or verify them."),
      H2("10.2  Exclusions"),
      B([bold("Clinical services. "), run("No patient care, clinical supervision, collaborative practice, prescribing, on-call coverage, or any activity requiring clinical privileges is included. Georgia medical licensure and medical professional liability (malpractice) coverage are accordingly not required for the Services. Where Client requires evidence of insurance, the applicable coverages are professional liability / errors and omissions and commercial general liability.")]),
      B([bold("Implementation. "), run("Software development, system configuration, data migration, interface development, dashboard construction, platform administration, and testing are excluded. Demonstrations prepared on public or synthetic data to illustrate recommendations are not implementation. A proof of concept on Client data, if desired, will be scoped and priced by written amendment.")]),
      B([bold("Procurement. "), run("Consultant will not act as Client’s procurement agent, prepare or issue solicitation documents on Client’s behalf, or serve as a scoring evaluator in any competitive process, except as separately agreed in writing.")]),
      B([bold("Legal, compliance, and audit opinions. "), run("Recommendations addressing HIPAA, the information blocking rules at 45 CFR Part 171, ONC/ASTP certification requirements, TEFCA, Georgia law, procurement rules, or grant requirements are advisory and reflect practical experience. They do not constitute legal advice or an audit opinion, and Client counsel should review any such position before it is asserted with a vendor or relied upon.")]),
      B([bold("Personnel actions. "), run("Organizational and staffing recommendations are advisory. Hiring, classification, compensation, reassignment, discipline, and separation decisions remain solely with Client.")]),
      B([bold("Grant writing and reporting. "), run("Preparation of grant applications or submission of grant reports is excluded unless added by written amendment.")]),
      B([bold("Accreditation application. "), run("Services include mapping the data strategy to PHAB requirements and identifying documentation gaps. Preparation, assembly, or submission of an accreditation application, and service as an accreditation coordinator, are excluded unless added by written amendment.")]),

      H1("11.  Acceptance"),
      P("The parties, by signature below, accept this proposal and agree that its scope, deliverables, schedule, and compensation terms will be incorporated into the definitive services agreement between them. Client’s signature also records its consent under Section 4 to the engagement team described in Section 4.1 and its authorization of the engagement workspace described in Section 9.5."),
      new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [4624, 400, 4624], borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }, rows: [
        new TableRow({ children: [cell("CONSULTANT", 4624, { bold: true, shade: "F3F4F6" }), cell("", 400, { shade: "F3F4F6" }), cell("FULTON COUNTY BOARD OF HEALTH", 4624, { bold: true, shade: "F3F4F6" })] }),
        new TableRow({ children: [cell(["", "______________________________", "Michael Dulin, MD, PhD", "Independent Contractor", "", "Date: ________________"], 4624), cell("", 400), cell(["", "______________________________", "Name: ", "Title: ", "", "Date: ________________"], 4624)] }),
      ] }),

      new Paragraph({ children: [new PageBreak()] }),
      H1("Appendix A.  Initial stakeholder list"),
      P("Persons met at the October 8, 2026 kickoff, who form the initial key-informant list for the interviews in Section 2.1. Additional interviewees will be confirmed with the sponsor during Phase 1."),
      grid(["Name", "Role", "Interview group"], [
        ["Marcus Plescia, MD, MPH", "District Health Director; engagement sponsor", "Leadership"],
        ["Susan Hrapcak, MD", "Medical Director; day-to-day contact", "Leadership; clinical programs"],
        ["Brian Easom", "Deputy District Health Director", "Leadership; state reporting"],
        ["Dwayne Jumpp", "Director of Information Technology", "Information technology"],
        ["Reginald Goddard", "FCBOH leadership team", "Leadership"],
        ["Alix Ferdinand, MD", "Resident physician; Client liaison", "Clinical programs"],
        ["Dorothy Gaines", "Office of the District Health Director; scheduling and state report examples", "Engagement coordination"],
        ["Naida Pare-Alanda", "Evaluation team; Data Modernization Initiative", "Evaluation and quality improvement"],
        ["Jared Bishop", "Evaluation team", "Evaluation and quality improvement"],
        ["Oluwafemi Lafua", "Evaluation team", "Evaluation and quality improvement"],
        ["Brandon Leftwich, PhD", "Director of Environmental Health; Data Modernization Initiative early adopter", "Program leadership"],
      ], [2600, 4648, 2400]),
      spacer(),
      P("Anticipated additional interviews: Director of Epidemiology; District Program Director; clinic and health center managers; STI, HIV and Ryan White program leads; laboratory and tuberculosis program staff; Community Health Assessment lead; grants and finance; and the Visual HealthNet account team (vendor session)."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync("Dulin_Consulting_Proposal_Fulton_County_BOH_6mo_rev2026-10-09.docx", buf); console.log("written"); });
