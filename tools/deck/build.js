const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");
const fs = require("fs");
const { applyTheme } = require("/root/.claude/skills/synced/3d940327-0ba1-4bde-bfae-aeb90c93c165_5df715c1-3f58-474f-9679-9517f5f349ab/pptx/scripts/apply_theme.js");

const THEME = {
  name: "FCBOH Data Modernization",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B2233", lt1: "FFFFFF", dk2: "12455A", lt2: "EEF4F5",
    accent1: "1F8A8A", accent2: "F2A93B", accent3: "5B8DB8", accent4: "7A9E7E",
    accent5: "C8553D", accent6: "8C9BA5", hlink: "1F8A8A", folHlink: "5B8DB8",
  },
};
const HEX = THEME.colors;

async function icon(Comp, color, px = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: px }));
  const buf = await sharp(Buffer.from(svg)).resize(px, px).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = "FCBOH Data Modernization: Proposed Endpoint";
  pres.author = "Michael Dulin, MD, PhD";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const shadow = () => ({ type: "outer", color: HEX.dk1, blur: 8, offset: 2, angle: 90, opacity: 0.12 });

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "TITLE_DARK",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 9.0, h: 1.6, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.05, w: 11.7, h: 1.4, fontSize: 20, color: C.background2, valign: "top", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CLOSING_DARK",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 0.6, w: 11.7, h: 1.0, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: C.background1 },
    margin: [0.5, 0.6, 0.6, 0.6],
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.75, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { text: { text: "FCBOH Data Modernization  ·  Working draft for discussion", options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right" },
  });

  // ---------- helpers ----------
  const card = (slide, x, y, w, h, name, fill = C.background1) =>
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.background2, width: 0.75 }, shadow: shadow(), objectName: name });
  const circleIcon = async (slide, x, y, d, Comp, fill, name) => {
    slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name + "_circle" });
    const pad = d * 0.26;
    slide.addImage({ data: await icon(Comp, "FFFFFF"), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name, objectName: name + "_icon" });
  };
  const notes = (slide, t) => slide.addNotes(t);

  // =====================================================================
  // 1. Title
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "Opening" });
  s.addText("From reports to a data-driven health department", { placeholder: "title" });
  s.addText([
    { text: "FCBOH data modernization: proposed endpoint and path", options: { breakLine: true } },
    { text: "Michael Dulin, MD, PhD  ·  Working draft for discussion  ·  October 2026", options: { fontSize: 14, color: C.accent6 } },
  ], { placeholder: "body" });
  s.addShape(pres.shapes.OVAL, { x: 10.4, y: 1.2, w: 2.3, h: 2.3, fill: { color: C.accent1, transparency: 70 }, line: { type: "none" }, objectName: "deco1" });
  s.addShape(pres.shapes.OVAL, { x: 11.6, y: 2.6, w: 1.3, h: 1.3, fill: { color: C.accent2, transparency: 40 }, line: { type: "none" }, objectName: "deco2" });
  notes(s, "Purpose: share a working picture of where FCBOH's data capability could be in about two and a half years, test it against what leadership knows, and agree on a few decisions to start now. This is a draft built from the proposal, public sources, and peer health departments; Phase 1 interviews will confirm or correct it.");


  // =====================================================================
  // 1b. Team
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Opening" });
  s.addText("Who is doing the work", { placeholder: "title" });
  const people = [
    { name: "Michael Dulin, MD, PhD", role: "Lead consultant · all deliverables", img: "mike.jpg", initials: "MD", status: null,
      lines: ["Family physician; built Atrium Health's analytics organization as Chief Clinical Officer for Analytics (HBS case 515-060)", "Professor, UNC Charlotte; co-founded the Academy for Population Health Innovation with Mecklenburg County Public Health (2016–2024)", "Led CHAMPS, Mecklenburg's public HIV data site, and the county's SDOH community profiles", "RWJF Data Across Sectors for Health (DASH) awardee, 2018–19: Integrating Social and Health Data to Advance Equity and Public Health, linking social-sector and clinical data", "Fractional CMO, Gray Matter Analytics (2018–2025); RWJF Health Policy Fellow; NAM/RWJF AI faculty"] },
    { name: "Rashaud Senior, MD, MMCi", role: "Proposed: AI Opportunity Assessment (Deliverable 3)", img: "rashaud.png", initials: "RS", status: "Subject to FCBOH written consent",
      lines: ["Board-certified in clinical informatics and family medicine; Duke clinical informatics fellowship", "Medical Director, Informatics, Avance Care: physician lead for a 270-provider Epic conversion; designed and chaired enterprise governance bodies", "Developed AI governance frameworks and led evaluation of ambient and generative AI tools", "Data Insights Consultant, NC DHHS Data Office: statewide HIE and SDOH data initiatives"] },
    { name: "Jonathan Ong, MBA, PMP, CDMP", role: "Peer advisor (no contract role) · proposed December session", img: "jonathan.png", initials: "JO", status: "Mecklenburg County Public Health",
      lines: ["Public Health Data Director, Informatics and Data Analytics Program, Mecklenburg County", "Built MCPH's informatics program from 2017: governance committee, mixed team, data from five clinical systems", "Co-author, \"Public Health 3.0 at Mecklenburg County Public Health\" (NC Medical Journal, 2019) and the community data governance plan (NACCHO360, 2020)", "Offered to share Mecklenburg's experience with the FCBOH team"] },
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, P = people[i];
    card(s, x, 1.4, 3.9, 5.35, "team_card_" + i);
    if (P.img) {
      s.addImage({ path: P.img, x: x + 0.3, y: 1.7, w: 0.95, h: 0.95, rounding: true, altText: P.name, objectName: "team_img_" + i });
    } else {
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.7, w: 0.95, h: 0.95, fill: { color: i === 1 ? C.accent3 : C.text2 }, line: { type: "none" }, objectName: "team_av_" + i });
      s.addText(P.initials, { x: x + 0.3, y: 1.7, w: 0.95, h: 0.95, fontSize: 22, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "team_ini_" + i });
    }
    s.addText([{ text: P.name, options: { bold: true, fontSize: 16, color: C.text1, breakLine: true } }, { text: P.role, options: { fontSize: 12, color: C.accent1, bold: true } }], { x: x + 1.4, y: 1.65, w: 2.3, h: 1.05, margin: 0, valign: "middle", isTextBox: true, objectName: "team_name_" + i });
    if (P.status) s.addText(P.status, { x: x + 0.3, y: 2.78, w: 3.3, h: 0.32, fontSize: 11, italic: true, color: C.accent5, margin: 0, isTextBox: true, objectName: "team_status_" + i });
    s.addText(P.lines.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < P.lines.length - 1 } })), { x: x + 0.3, y: 3.15, w: 3.3, h: 3.45, fontSize: 11.5, color: C.text2, paraSpaceAfter: 5, margin: 0, valign: "top", isTextBox: true, objectName: "team_lines_" + i });
  }
  notes(s, "Mike leads and remains accountable for every deliverable under the key-personnel clause. Rashaud Senior is proposed for the AI Opportunity Assessment and only joins once FCBOH consents in writing (request sent September 28). Jonathan Ong has no contract role; he has offered to share Mecklenburg's experience, proposed as a lunch-and-learn in December.");

  // =====================================================================
  // 2. Endpoint in one view
  pres.addSection({ title: "Where we're headed" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Where we're headed" });
  s.addText("Where FCBOH could be by mid-2029", { placeholder: "title" });
  s.addText([
    { text: "An informatics-savvy county health department.", options: { bold: true, fontSize: 22, color: C.text2, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "A chartered council decides what data FCBOH collects, shares and publishes.", options: { bullet: true, breakLine: true } },
    { text: "FCBOH controls a standing feed of its own clinical data instead of buying reports.", options: { bullet: true, breakLine: true } },
    { text: "One analytic store joins clinical, state, community and partner data.", options: { bullet: true, breakLine: true } },
    { text: "CHA, CHIP tracking, scorecards and PHAB evidence come out as routine products.", options: { bullet: true } },
  ], { x: 0.6, y: 1.5, w: 7.2, h: 4.6, fontSize: 16, color: C.text1, paraSpaceAfter: 10, valign: "top", isTextBox: true, objectName: "endpoint_text" });
  const stats = [
    ["Mid-2029", "proposed endpoint, about 30 months after the April 2027 handoff"],
    ["1", "governed analytic store serving every program"],
    ["4–6 FTE", "core informatics team on stable funding"],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.5 + i * 1.6;
    card(s, 8.3, y, 4.4, 1.4, "stat_card_" + i, C.background2);
    s.addText(stats[i][0], { x: 8.55, y: y + 0.12, w: 4.0, h: 0.7, fontSize: 36, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "stat_num_" + i });
    s.addText(stats[i][1], { x: 8.55, y: y + 0.82, w: 4.0, h: 0.5, fontSize: 13, color: C.text2, margin: 0, isTextBox: true, objectName: "stat_label_" + i });
  }
  s.addText("Proposed. To be tested against Phase 1 interview findings.", { x: 0.6, y: 6.35, w: 7.2, h: 0.35, fontSize: 12, italic: true, color: C.accent6, margin: 0, isTextBox: true, objectName: "caveat" });
  notes(s, "The endpoint is deliberately right-sized: not a large platform build, but a governed store, a small team and routine products. The six-month engagement does not build this. It ends with leadership having approved the endpoint, a governance charter, a target architecture and a funded first-year plan.");

  // =====================================================================
  // 3. Current state
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Where we're headed" });
  s.addText("Where FCBOH starts", { placeholder: "title" });
  const now = [
    [fa.FaHospitalUser, "Clinical data", "Visual HealthNet reports are bought one at a time; no recurring computable extract yet."],
    [fa.FaBuildingColumns, "State systems", "SendSS, GRITS and the OASIS warehouse are run by Georgia DPH; access is on state terms."],
    [fa.FaChartLine, "Community Health Assessment", "Last published CHA is 2020; a new CHA is being finished to shape the CHIP."],
    [fa.FaAward, "Accreditation", "An accreditation push is under way; the 2023–25 plan committed to clinical and program dashboards."],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.5, 2.9, 4.1, "now_card_" + i);
    await circleIcon(s, x + 0.3, 1.8, 0.8, now[i][0], i % 2 ? HEX.dk2 : HEX.accent1, "now_" + i);
    s.addText(now[i][1], { x: x + 0.3, y: 2.8, w: 2.35, h: 0.75, fontSize: 18, bold: true, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "now_head_" + i });
    s.addText(now[i][2], { x: x + 0.3, y: 3.6, w: 2.35, h: 1.9, fontSize: 15, color: C.text2, margin: 0, valign: "top", isTextBox: true, objectName: "now_body_" + i });
  }
  s.addText("Phase 1 interviews will confirm governance, staffing, IT ownership and data-sharing agreements.", { x: 0.6, y: 6.2, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true, objectName: "now_foot" });
  notes(s, "Much of FCBOH's data sits in systems it does not control: a vendor EHR it pays per report to query, and state-run surveillance and immunization systems. The endpoint has to work inside those limits. Sources: proposal sections 2.1 and 2.6; Georgia DPH interoperability page; FCBOH 2020 CHA; FCBOH 2023-2025 strategic plan.");

  // =====================================================================
  // 4. State of the art: four moves
  pres.addSection({ title: "What good looks like" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "What good looks like" });
  s.addText("Leading health departments make the same five moves", { placeholder: "title" });
  const moves = [
    ["Name a data leader and charter a council", "NYC: a Chief Population Health and Data Officer. Washington DOH: a Chief Data Officer."],
    ["Catalog a few priority datasets first", "Washington DOH targets 3\u20135 cataloged priority datasets, not everything at once."],
    ["Build the store in increments", "King County: 3 to 12 linked sources over 8 years. Chicago matched 90.1% of records across feeds."],
    ["Ship visible products", "Chicago's Health Atlas and LA County's Community Health Profiles keep data in front of leaders and the public."],
    ["Partner with a university", "Mecklenburg and UNC Charlotte ran a joint academy for analytics, evaluation and a student data-steward pipeline. Chicago co-runs its Health Atlas with UIC."],
  ];
  for (let i = 0; i < 5; i++) {
    const x = 0.6 + i * 2.46, cw = 2.3;
    card(s, x, 1.5, cw, 4.5, "move_card_" + i, i === 4 ? C.background2 : C.background1);
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 1.78, w: 0.66, h: 0.66, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "move_num_bg_" + i });
    s.addText(String(i + 1), { x: x + 0.25, y: 1.78, w: 0.66, h: 0.66, fontSize: 22, bold: true, color: C.text1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "move_num_" + i });
    s.addText(moves[i][0], { x: x + 0.25, y: 2.62, w: cw - 0.5, h: 1.15, fontSize: 16, bold: true, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "move_head_" + i });
    s.addText(moves[i][1], { x: x + 0.25, y: 3.8, w: cw - 0.5, h: 2.1, fontSize: 13.5, color: C.text2, margin: 0, valign: "top", isTextBox: true, objectName: "move_body_" + i });
  }
  s.addText("For Fulton: Emory Rollins (home of AIDSVu), Georgia State's Georgia Health Policy Center (produced FCBOH's 2020 CHA), Morehouse School of Medicine and Georgia Tech are all in town.", { x: 0.6, y: 6.1, w: 12.1, h: 0.3, fontSize: 12.5, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: "move_fulton" });
  s.addText("Sources: NYC DOHMH two-year lookback; Washington DOH Data Strategy (2026); Pew on King County (2025); Chicago citywide HIE, JMIR (2022); Harris & Ong, NCMJ (2019); UIC news on the Chicago Health Atlas (2021).", { x: 0.6, y: 6.45, w: 12.1, h: 0.3, fontSize: 10, color: C.accent6, margin: 0, isTextBox: true, objectName: "move_src" });
  notes(s, "Across NYC, Chicago, King County, LA County, Washington and Utah the pattern is the same. None started with a big platform; they started with a leader, a council and a short list of priority data, then built and shipped in increments. The fifth move is the one FCBOH can start cheapest: an academic partner supplies analytic capacity, evaluation rigor, students as data stewards, and grant eligibility the department cannot get alone. Mecklenburg did this through the Academy for Population Health Innovation with UNC Charlotte; Chicago co-governs its Health Atlas with UIC; the CHAMPS and SDOH profile products came out of that model. Fulton has Emory (AIDSVu lives there), Georgia State (GHPC did the 2020 CHA), Morehouse and Georgia Tech. Utah also runs a tiered state-local council that includes all 13 local departments, a model worth raising with Georgia DPH.");

  // =====================================================================
  // 5. Federal direction vs funding
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "What good looks like" });
  s.addText("Federal direction is clear; federal money is not", { placeholder: "title" });
  const fed = [
    ["CDC data strategy, 2026", "Automated feeds, unified data use agreements, AI-ready data."],
    ["eCR at 65,000+ facilities", "The bottleneck for local departments is processing it, not receiving it."],
    ["PHAB refreshed standards", "In effect July 2026: fewer required documents, live demonstrations accepted."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.5 + i * 1.55;
    card(s, 0.6, y, 5.6, 1.35, "fed_card_" + i, C.background2);
    s.addText([
      { text: fed[i][0], options: { bold: true, fontSize: 17, color: C.text1, breakLine: true } },
      { text: fed[i][1], options: { fontSize: 14, color: C.text2 } },
    ], { x: 0.85, y: y + 0.12, w: 5.2, h: 1.1, margin: 0, valign: "middle", isTextBox: true, objectName: "fed_text_" + i });
  }
  s.addChart(pres.charts.BAR, [{ name: "PHIG awards", labels: ["FY23", "FY24", "FY25", "FY26"], values: [3.685, 0.511, 0.245, 0.245] }], {
    x: 6.7, y: 1.5, w: 6.0, h: 4.3, barDir: "col",
    showTitle: true, title: "PHIG awards to health departments ($ billions)", titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mn-lt",
    chartColors: [HEX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$0.00", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
    catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: "+mn-lt", valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, objectName: "phig_chart",
  });
  s.addText("The grant ends November 30, 2027. Plan lean and phased, with core staff on stable funds.", { x: 6.7, y: 5.9, w: 6.0, h: 0.6, fontSize: 14, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: "phig_note" });
  notes(s, "CDC's 2026 Public Health Data Strategy (April 30, 2026) sets the direction. Funding is the constraint: PHIG awards fell from $3.685B in FY23 to $245M in FY26, and Georgia DPH lost $334.2M in the March 2025 terminations; Georgia was not a plaintiff in the suit that restored funds for 23 states. Fulton's PHIG share likely flows through Georgia DPH. Sources: CDC PHDS milestones; CDC PHIG page; GPB; Georgetown litigation tracker.");

  // =====================================================================
  // 6. Mecklenburg lessons
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "What good looks like" });
  s.addText("Mecklenburg shows how a county builds it", { placeholder: "title" });
  const meck = [
    [fa.FaDatabase, "Access to data", "Inventory, dictionaries, data flows first"],
    [fa.FaUsersGear, "A mixed team", "Clinical, technical, analytic, organizational"],
    [fa.FaUserTie, "Leadership buy-in", "Governance committee; informatics at the table"],
    [fa.FaChalkboardUser, "A trained organization", "Data champions in every division"],
    [fa.FaServer, "Access to technology", "IT aligned with informatics priorities"],
  ];
  for (let i = 0; i < 5; i++) {
    const x = 0.6 + i * 2.48;
    await circleIcon(s, x + 0.72, 1.55, 0.85, meck[i][0], i % 2 ? HEX.dk2 : HEX.accent1, "meck_" + i);
    s.addText(meck[i][1], { x, y: 2.55, w: 2.3, h: 0.45, fontSize: 17, bold: true, color: C.text1, align: "center", margin: 0, isTextBox: true, objectName: "meck_head_" + i });
    s.addText(meck[i][2], { x, y: 3.0, w: 2.3, h: 0.8, fontSize: 13, color: C.text2, align: "center", margin: 0, valign: "top", isTextBox: true, objectName: "meck_body_" + i });
  }
  card(s, 0.6, 4.2, 12.1, 2.0, "bigshots_card", C.background2);
  s.addText([
    { text: "The first visible win: Big Shots 2018", options: { bold: true, fontSize: 18, color: C.text1, breakLine: true } },
    { text: "A real-time dashboard at a school-immunization event planned for 500+ clients let incident command open a second vaccination area during a morning surge. The event ended on time with no added staff hours, and leadership saw what timely data could do.", options: { fontSize: 15, color: C.text2 } },
  ], { x: 0.9, y: 4.35, w: 11.5, h: 1.7, margin: 0, valign: "middle", isTextBox: true, objectName: "bigshots_text" });
  s.addText("Sources: Harris & Ong, NC Medical Journal 80(4), 2019; Ong & Dulin, NACCHO360 community data governance plan, 2020.", { x: 0.6, y: 6.35, w: 12.1, h: 0.35, fontSize: 10, color: C.accent6, margin: 0, isTextBox: true, objectName: "meck_src" });
  notes(s, "Mecklenburg County Public Health rebuilt its informatics program in late 2017 around these five components. The companion governance plan added owner and steward roles and five governance domains: leadership and communication, data management and technology, legal and ethics, sustainability and value, and workforce development. Jonathan Ong, Mecklenburg's Public Health Data Director, has offered to share their experience with the FCBOH team.");

  // =====================================================================
  // 7 & 8. Endpoint diagram
  pres.addSection({ title: "The endpoint" });
  // base geometry (inches) relative to origin; width 12.13, height 5.58
  const G = {
    gov: [0, 0, 12.13, 0.65],
    srcX: 0, colW: 3.4, rowY: (i) => 1.0 + i * 0.78, rowH: 0.66,
    store: [3.9, 1.0, 4.33, 3.78],
    inX: 4.15, inW: 3.83, inY: (j) => 1.45 + j * 0.80, inH: 0.68,
    prodX: 8.73,
    people: [0, 4.98, 12.13, 0.6],
  };
  const srcs = [["FCBOH clinical", "Visual HealthNet extract"], ["Program and case data", "systems found in inventory"], ["Georgia DPH", "SendSS, GRITS, OASIS"], ["Community data", "Neighborhood Nexus, CARES"], ["Partners", "hospitals, universities, HIV Elimination"]];
  const inner = [["Ingestion and quality", "standing feeds, checks"], ["Person index", "links people across feeds"], ["Curated data model", "dimensional, documented"], ["Catalog and dictionary", "what exists, who owns it"]];
  const prods = [["CHA and CHIP tracking", "indicators refresh"], ["PI/QA scorecards", "monthly, by program"], ["Public dashboards", "goal-linked, e.g. HIV"], ["PHAB evidence", "a routine output"], ["Governed AI pilots", "under written policy"]];

  function drawEndpoint(slide, ox, oy, k, subs, nameSize, subSize) {
    const X = (v) => ox + v * k, Y = (v) => oy + v * k, L = (v) => v * k;
    const box = (x, y, w, h, name, sub, opts, objName) => {
      slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X(x), y: Y(y), w: L(w), h: L(h), rectRadius: 0.06, fill: { color: opts.fill }, line: { color: opts.line, width: opts.lw || 0.75 }, objectName: objName + "_box" });
      const runs = [{ text: name, options: { bold: true, fontSize: nameSize, color: opts.ink, breakLine: !!(subs && sub) } }];
      if (subs && sub) runs.push({ text: sub, options: { fontSize: subSize, color: opts.sub } });
      slide.addText(runs, { x: X(x) + 0.12, y: Y(y), w: L(w) - 0.22, h: L(h), margin: 0, valign: "middle", align: opts.align || "left", isTextBox: true, objectName: objName + "_text" });
    };
    const arrow = (x1, y1, x2, y2, objName) => {
      const horiz = y1 === y2;
      slide.addShape(pres.shapes.LINE, { x: X(Math.min(x1, x2)), y: Y(Math.min(y1, y2)), w: horiz ? L(Math.abs(x2 - x1)) : 0, h: horiz ? 0 : L(Math.abs(y2 - y1)), line: { color: HEX.accent6, width: 1.25, endArrowType: "triangle" }, flipV: !horiz && y2 < y1, objectName: objName });
    };
    const plain = { fill: C.background1, line: C.accent6, ink: C.text1, sub: C.text2 };
    // L1 governance
    box(G.gov[0], G.gov[1], G.gov[2], G.gov[3], "Data Governance Council", "District Health Director sponsors · data leader chairs · stewards own each domain", { fill: C.text2, line: C.text2, ink: C.background1, sub: C.background2, align: "center" }, "L1_gov");
    arrow(6.065, 0.65, 6.065, 1.0, "L1_gov_arrow");
    if (subs) slide.addText("decides access, quality, sharing", { x: X(6.2), y: Y(0.66), w: L(2.6), h: L(0.32), fontSize: subSize, italic: true, color: C.accent6, margin: 0, valign: "middle", isTextBox: true, objectName: "L1_gov_label" });
    // L2 sources
    if (subs) slide.addText("SOURCES", { x: X(0), y: Y(0.66), w: L(3.4), h: L(0.32), fontSize: 11, bold: true, charSpacing: 2, color: C.accent6, margin: 0, valign: "middle", isTextBox: true, objectName: "L2_src_head" });
    srcs.forEach((r, i) => { box(G.srcX, G.rowY(i), G.colW, G.rowH, r[0], r[1], plain, "L2_src_" + i); arrow(3.4, G.rowY(i) + G.rowH / 2, 3.9, G.rowY(i) + G.rowH / 2, "L2_src_arrow_" + i); });
    // L3 store
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: X(G.store[0]), y: Y(G.store[1]), w: L(G.store[2]), h: L(G.store[3]), rectRadius: 0.08, fill: { color: C.accent1, transparency: 85 }, line: { color: C.accent1, width: 2 }, objectName: "L3_store_box" });
    slide.addText("Analytic store (cloud)", { x: X(G.store[0]), y: Y(1.05), w: L(G.store[2]), h: L(0.38), fontSize: nameSize + 1, bold: true, color: C.text1, align: "center", margin: 0, valign: "middle", isTextBox: true, objectName: "L3_store_title" });
    inner.forEach((r, j) => box(G.inX, G.inY(j), G.inW, G.inH, r[0], r[1], plain, "L3_store_in_" + j));
    // L4 products
    if (subs) slide.addText("PRODUCTS", { x: X(8.73), y: Y(0.66), w: L(3.4), h: L(0.32), fontSize: 11, bold: true, charSpacing: 2, color: C.accent6, margin: 0, valign: "middle", isTextBox: true, objectName: "L4_prod_head" });
    prods.forEach((r, i) => { arrow(8.23, G.rowY(i) + G.rowH / 2, 8.73, G.rowY(i) + G.rowH / 2, "L4_prod_arrow_" + i); box(G.prodX, G.rowY(i), G.colW, G.rowH, r[0], r[1], plain, "L4_prod_" + i); });
    // L5 people
    arrow(6.065, 4.98, 6.065, 4.78, "L5_people_arrow");
    box(G.people[0], G.people[1], G.people[2], G.people[3], "People and policy", "4–6 FTE informatics team · data champions in each division · sharing agreements · data classification · AI policy", { fill: C.background2, line: C.background2, ink: C.text1, sub: C.text2, align: "center" }, "L5_people");
  }

  // 7. build slide
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "The endpoint" });
  s.addText("The endpoint: governance over one analytic store", { placeholder: "title" });
  drawEndpoint(s, 0.6, 1.25, 1, true, 13, 10.5);
  notes(s, "Click through in five builds. 1) The Data Governance Council sits on top: it decides access, quality and sharing. 2) Five kinds of data flow in, starting with FCBOH's own clinical data from Visual HealthNet. 3) They land in one right-sized cloud store with quality checks, a person index, a documented model and a catalog. 4) Five routine products come out. 5) A small team and written policies keep it running. Platform choice (likely Microsoft, already slated for vendor sessions) and who holds the cloud tenant, FCBOH or DPH, get decided in Phase 4.");

  // 8. walkthrough slide
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "The endpoint" });
  s.addText("How each part works", { placeholder: "title" });
  const k = 0.72, ox = 0.6, oy = 1.45;
  drawEndpoint(s, ox, oy, k, false, 11, 9);
  s.addText("Click to walk through each part", { x: 9.75, y: 3.2, w: 3.0, h: 0.5, fontSize: 13, italic: true, color: C.accent6, align: "center", margin: 0, isTextBox: true, objectName: "walk_hint" });
  const hl = [
    [G.gov, "Governance", "A chartered council decides what FCBOH collects, shares and publishes. Named stewards own each priority domain."],
    [[0, 1.0, 3.4, 3.78], "Sources", "A standing Visual HealthNet extract replaces per-report purchases, alongside Georgia DPH, community and partner data."],
    [G.store, "Analytic store", "Quality checks, a person index that links records, a documented data model, and a catalog of what exists and who owns it."],
    [[8.73, 1.0, 3.4, 3.78], "Products", "CHA and CHIP tracking, PI/QA scorecards, public dashboards, PHAB evidence and governed AI pilots, produced routinely."],
    [G.people, "People and policy", "A 4–6 FTE team on stable funding, data champions in each division, and written policies for sharing, classification and AI."],
  ];
  hl.forEach((h, i) => {
    const pad = 0.07;
    const r = h[0];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ox + r[0] * k - pad, y: oy + r[1] * k - pad, w: r[2] * k + 2 * pad, h: r[3] * k + 2 * pad, rectRadius: 0.08, fill: { color: C.accent2, transparency: 82 }, line: { color: C.accent2, width: 3 }, objectName: `H${i + 1}_frame` });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.75, y: 1.45, w: 3.0, h: 4.0, rectRadius: 0.1, fill: { color: C.text1 }, line: { type: "none" }, shadow: shadow(), objectName: `H${i + 1}_card` });
    s.addText([
      { text: `${i + 1} / 5`, options: { fontSize: 12, bold: true, color: C.accent2, breakLine: true } },
      { text: h[1], options: { fontSize: 22, bold: true, color: C.background1, breakLine: true } },
      { text: " ", options: { fontSize: 8, breakLine: true } },
      { text: h[2], options: { fontSize: 15, color: C.background2 } },
    ], { x: 10.0, y: 1.65, w: 2.5, h: 3.6, margin: 0, valign: "top", isTextBox: true, objectName: `H${i + 1}_text` });
  });
  notes(s, "Each click highlights one part of the endpoint and explains it on the right. Use this slide to ask leadership, part by part: does this match how you want FCBOH to work, and what would get in the way?");

  // =====================================================================
  // 9. Gap table
  pres.addSection({ title: "Getting there" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Getting there" });
  s.addText("From today to the endpoint", { placeholder: "title" });
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk2 }, fontSize: 14 } });
  const rows = [
    ["Decision rights", "Not yet formalized", "Chartered council; data leader on the executive team", "D5"],
    ["Own clinical data", "Reports bought one at a time from VHN", "Standing extract FCBOH controls", "D2"],
    ["Analytic platform", "Not yet in place", "Right-sized cloud store with a person index", "D5"],
    ["CHA and CHIP", "Periodic contracted project (2020)", "Indicators refresh from the platform", "D7"],
    ["PI/QA and PHAB", "Dashboards planned; evidence assembled by hand", "Monthly scorecards; evidence as routine output", "D6, D7"],
    ["Workforce", "To be confirmed in interviews", "4–6 FTE team plus division data champions", "D5"],
    ["AI", "No written policy yet", "Policy in force; 1–2 governed pilots", "D3"],
  ];
  const tableRows = [[hdr("Area"), hdr("Today"), hdr("Endpoint (mid-2029)"), hdr("Designed in")]].concat(
    rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: 14, bold: j === 0, color: j === 2 ? HEX.dk2 : HEX.dk1, fill: { color: i % 2 ? HEX.lt1 : HEX.lt2 } } })))
  );
  s.addTable(tableRows, { x: 0.6, y: 1.45, w: 12.1, colW: [2.2, 3.6, 4.7, 1.6], rowH: 0.62, border: { type: "solid", pt: 0.5, color: "D5E0E3" }, valign: "middle", margin: [0.04, 0.12, 0.04, 0.12], objectName: "gap_table" });
  s.addText("D2 EMR data access assessment · D3 AI opportunity assessment · D5 strategy, governance and roadmap · D6 clinical operations measurement plan · D7 CHA and accreditation readiness", { x: 0.6, y: 6.5, w: 12.1, h: 0.35, fontSize: 10, color: C.accent6, margin: 0, isTextBox: true, objectName: "gap_key" });
  notes(s, "Every gap maps to a deliverable in the current engagement. The engagement designs the answer to each; funding and building them is FCBOH's work after April 2027. Today column is a working hypothesis until interviews confirm it.");

  // =====================================================================
  // 10. Timeline
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Getting there" });
  s.addText("The engagement designs it; FCBOH builds it", { placeholder: "title" });
  const ax0 = 3.3, ax1 = 12.7, wx = (w) => ax0 + (w / 26) * (ax1 - ax0);
  const months = [["Oct", 0], ["Nov", 4.43], ["Dec", 8.71], ["Jan", 13.14], ["Feb", 17.57], ["Mar", 21.57], ["Apr", 26]];
  months.forEach(([m, w], i) => {
    s.addShape(pres.shapes.LINE, { x: wx(w), y: 1.75, w: 0, h: 3.55, line: { color: "D5E0E3", width: 0.75 }, objectName: "tl_grid_" + i });
    s.addText(m, { x: wx(w) - 0.4, y: 1.35, w: 0.8, h: 0.35, fontSize: 12, color: C.accent6, align: "center", margin: 0, isTextBox: true, objectName: "tl_month_" + i });
  });
  const phases = [["Discovery", 1, 8], ["Analysis and synthesis", 7, 12], ["Day 90 findings package", 11, 13], ["Strategy and recommendations", 14, 21], ["Finalization and handoff", 22, 26]];
  phases.forEach(([n, a, b], i) => {
    const y = 1.9 + i * 0.62;
    s.addText(n, { x: 0.6, y, w: 2.6, h: 0.45, fontSize: 14, bold: true, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: "tl_phase_name_" + i });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: wx(a - 1), y: y + 0.05, w: wx(b) - wx(a - 1), h: 0.36, rectRadius: 0.12, fill: { color: i === 2 ? C.accent2 : C.accent1, transparency: i === 2 ? 0 : 15 }, line: { type: "none" }, objectName: "tl_phase_bar_" + i });
  });
  const ms = [["Kickoff", 2, "Oct 14"], ["Interim readout", 6, "Nov 11"], ["Executive briefing", 12.86, "Dec 30"], ["Draft strategy", 18, "Feb 3"], ["Transition briefing", 26, "Mar 31"]];
  ms.forEach(([n, w, d], i) => {
    const x = wx(w);
    s.addShape(pres.shapes.DIAMOND, { x: x - 0.14, y: 5.05, w: 0.28, h: 0.28, fill: { color: i === 2 || i === 4 ? C.accent2 : C.text2 }, line: { type: "none" }, objectName: "tl_ms_" + i });
    s.addText([{ text: n, options: { bold: true, breakLine: true } }, { text: d, options: { color: C.accent6 } }], { x: i === 4 ? x - 1.56 : x - 0.85, y: 5.38, w: 1.7, h: 0.6, fontSize: 12, color: C.text1, align: i === 4 ? "right" : "center", margin: 0, isTextBox: true, objectName: "tl_ms_label_" + i });
  });
  s.addText("Milestones", { x: 0.6, y: 4.97, w: 2.6, h: 0.45, fontSize: 14, bold: true, color: C.text1, margin: 0, valign: "middle", isTextBox: true, objectName: "tl_ms_head" });
  card(s, 0.6, 6.12, 7.4, 0.68, "tl_band_a", C.background2);
  s.addText("Oct 2026–Apr 2027: assess, design, decide (Deliverables 1–8)", { x: 0.8, y: 6.12, w: 7.1, h: 0.68, fontSize: 14, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true, objectName: "tl_band_a_text" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y: 6.12, w: 4.5, h: 0.68, rectRadius: 0.08, fill: { color: C.text2 }, line: { type: "none" }, objectName: "tl_band_b" });
  s.addText("After Apr 2027: FCBOH builds toward the endpoint", { x: 8.4, y: 6.12, w: 4.2, h: 0.68, fontSize: 14, bold: true, color: C.background1, margin: 0, valign: "middle", isTextBox: true, objectName: "tl_band_b_text" });
  notes(s, "Dates assume an October 1, 2026 effective date and shift day-for-day. The Day 90 package (Deliverables 1 to 4) lands with the on-site executive briefing around December 30; the Month 6 package (Deliverables 5 to 8) with the transition briefing. By April 2027 leadership should have an approved endpoint, a governance charter, a target architecture and a funded first-year plan.");


  // =====================================================================
  // 11. Three working demos
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Getting there" });
  s.addText("Three working demos, built for this conversation", { placeholder: "title" });
  const demos = [
    ["clinical.jpg", "Clinical Services Dashboard", "Access, quality, program outcomes and client experience across FCBOH's eight health centers. Structure and names are FCBOH's; numbers are synthetic.", "Needs the engagement: definitions, a standing clinical extract, a place to join data"],
    ["hiv.jpg", "HIV in Fulton: progress against EHE goals", "Diagnose, treat, prevent, respond, modeled on Mecklenburg's CHAMPS. Fulton's real indicators from AHEAD, AIDSVu and Georgia DPH.", "Runs on public data today"],
    ["neighborhoods.jpg", "Community Health Profiles", "326 tracts, 18 indicators, life expectancy and FCBOH health centers on one map. The CHA as a refreshable product.", "Runs on public data today"],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + i * 4.1, D = demos[i];
    card(s, x, 1.4, 3.9, 5.3, "demo_card_" + i);
    s.addImage({ path: D[0], x: x + 0.2, y: 1.6, w: 3.5, h: 2.09, altText: D[1], objectName: "demo_img_" + i });
    s.addText(D[1], { x: x + 0.25, y: 3.8, w: 3.4, h: 0.6, fontSize: 15, bold: true, color: C.text1, margin: 0, valign: "top", isTextBox: true, objectName: "demo_head_" + i });
    s.addText(D[2], { x: x + 0.25, y: 4.4, w: 3.4, h: 1.5, fontSize: 12.5, color: C.text2, margin: 0, valign: "top", isTextBox: true, objectName: "demo_body_" + i });
    s.addText(D[3], { x: x + 0.25, y: 6.0, w: 3.4, h: 0.55, fontSize: 11.5, bold: true, color: i === 0 ? C.accent5 : C.accent1, margin: 0, valign: "top", isTextBox: true, objectName: "demo_tag_" + i });
  }
  notes(s, "Switch to the browser for these: fcboh.dulinconsulting.app/demos (or the Vercel URL). Show the HIV page first because every number on it is real and public, then the neighborhood map, then the clinical dashboard with the caveat that its numbers are synthetic. The point to land: two of three already run on public data; the clinical one is exactly what the governance and data-access work unlocks.");

  // =====================================================================
  // 12. Decisions
  pres.addSection({ title: "Next steps" });
  s = pres.addSlide({ masterName: "CLOSING_DARK", sectionTitle: "Next steps" });
  s.addText("Decisions to start now", { placeholder: "title" });
  const dec = [
    ["Confirm the PHAB target", "Application date, and whether Version 2022 or the July 2026 refresh applies."],
    ["Open the DPH and university conversations", "Terms for Fulton data from SendSS, GRITS and OASIS; which Atlanta school becomes the analytic partner."],
    ["Name a sponsor and interim data lead", "They co-own the governance charter draft."],
    ["Schedule the peer session", "Mecklenburg's Public Health Data Director, proposed for December."],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.8 + i * 3.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: 2.8, h: 3.6, rectRadius: 0.1, fill: { color: C.text2 }, line: { type: "none" }, objectName: "dec_card_" + i });
    s.addText(String(i + 1), { x: x + 0.25, y: 2.3, w: 0.8, h: 0.8, fontSize: 36, bold: true, color: C.accent2, margin: 0, isTextBox: true, objectName: "dec_num_" + i });
    s.addText(dec[i][0], { x: x + 0.25, y: 3.15, w: 2.3, h: 1.0, fontSize: 18, bold: true, color: C.background1, margin: 0, valign: "top", isTextBox: true, objectName: "dec_head_" + i });
    s.addText(dec[i][1], { x: x + 0.25, y: 4.2, w: 2.3, h: 1.3, fontSize: 14, color: C.background2, margin: 0, valign: "top", isTextBox: true, objectName: "dec_body_" + i });
  }
  s.addText("Discussion: what in this picture does not fit FCBOH?", { x: 0.8, y: 6.15, w: 11.7, h: 0.5, fontSize: 18, italic: true, color: C.accent2, margin: 0, isTextBox: true, objectName: "dec_q" });
  notes(s, "Close by asking for these four decisions. Each unblocks Phase 1 or Phase 4 work. Invite leadership to name what in the endpoint does not fit FCBOH; that feedback shapes the Day 90 package.");

  // =====================================================================
  // 13. Sources
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Next steps" });
  s.addText("Sources and links", { placeholder: "title" });
  const L = (t, url) => ({ text: t, options: { hyperlink: { url }, color: C.accent1, breakLine: true } });
  const H = (t) => ({ text: t, options: { bold: true, color: C.text1, breakLine: true, paraSpaceBefore: 6 } });
  const col1 = [
    H("Federal direction and funding"),
    L("CDC Public Health Data Strategy, 2026 milestones", "https://www.cdc.gov/public-health-data-strategy/php/about/phds-milestones.html"),
    L("One CDC Data Platform", "https://www.cdc.gov/data-modernization/php/one-cdc-data-platform/index.html"),
    L("CDC Public Health Infrastructure Grant (PHIG)", "https://www.cdc.gov/infrastructure-phig/about/index.html"),
    L("Georgetown litigation tracker: Colorado et al. v. HHS", "https://litigationtracker.law.georgetown.edu/litigation/state-of-colorado-et-al-v-u-s-department-of-health-and-human-services/"),
    L("GPB: Georgia DPH affected by CDC/HHS cuts (April 2025)", "https://www.gpb.org/news/2025/04/02/georgias-public-health-department-impacted-by-cuts-cdc-health-and-human-services"),
    L("HTI-2 withdrawal, Federal Register (Dec. 29, 2025)", "https://www.federalregister.gov/documents/2025/12/29/2025-23890/health-data-technology-and-interoperability-patient-engagement-information-sharing-and-public-health"),
    L("PHAB Standards and Measures", "https://phaboard.org/accreditation-recognition/standards-measures/"),
    L("PHII: governance in data modernization", "https://phii.org/the-importance-of-governance-in-data-modernization/"),
    H("Peer health departments"),
    L("NYC DOHMH: Modernizing data, two-year lookback", "https://www.nyc.gov/assets/doh/downloads/pdf/data/modernizing-data-two-year-lookback.pdf"),
    L("Chicago DPH citywide COVID data hub, JMIR (2022)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9518711/"),
    L("Chicago Health Atlas moves to UIC (2021)", "https://today.uic.edu/chicagos-health-database-moves-to-uic/"),
    L("Pew: Seattle & King County data infrastructure (2025)", "https://www.pew.org/en/research-and-analysis/articles/2025/07/02/data-underpins-so-much-of-public-health"),
    L("Pew: Los Angeles County data modernization (2026)", "https://www.pew.org/en/research-and-analysis/articles/2026/04/28/los-angeles-county-works-to-modernize-its-public-health-data-infrastructure"),
    L("Washington DOH Data Strategy (2026)", "https://doh.wa.gov/sites/default/files/2026-05/730053-DataStrategy.pdf"),
    L("Utah DHHS data modernization", "https://dhhs.utah.gov/data-modernization/"),
    L("Minnesota local public health data modernization charter", "https://www.health.mn.gov/communities/practice/schsac/workgroups/docs/lphdatamodernizationcharter.pdf"),
  ];
  const col2 = [
    H("Mecklenburg County and APHI"),
    L("Harris & Ong, Public Health 3.0 at Mecklenburg County Public Health, NC Medical Journal 80(4), 2019", "https://ncmedicaljournal.com/article/55118-public-health-3-0-at-mecklenburg-county-public-health"),
    L("Ong & Dulin, Community data governance plan, NACCHO360 (2020)", "https://www.naccho.org/"),
    L("CHAMPS: Mecklenburg HIV data site (APHI)", "https://hivmeckco.org/data/Treat"),
    L("Academy for Population Health Innovation, UNC Charlotte", "https://aphi.charlotte.edu/"),
    L("Mecklenburg County Community Resource Centers", "https://dcr.mecknc.gov/crc"),
    L("RWJF Data Across Sectors for Health (DASH): CIC-START awardees, incl. UNC Charlotte (2018–19)", "https://dashconnect.org/awardees/cic-awardees"),
    H("Georgia and Fulton County"),
    L("Georgia DPH: promoting interoperability (SendSS, GRITS)", "https://dph.georgia.gov/about-dph/other-offices-and-general-information/promoting-interoperability"),
    L("OASIS, Georgia DPH", "https://oasis.state.ga.us/OASIS-FAQ.html"),
    L("FCBOH 2020 Community Health Assessment", "https://fultoncountyboh.com/wp-content/uploads/2022/09/FCBOH_2020-CHA-Report_web.pdf"),
    L("FCBOH Strategic Plan 2023–2025", "http://fultoncountyboh.com/wp-content/uploads/2023/08/Strategic-Planning-Guide-2023-2025-1.pdf"),
    L("DPH release: Plescia named Fulton health director (Oct. 2025)", "https://dph.georgia.gov/press-releases/2025-10-15/dph-news-release-health-director-named-fulton-county-public-health"),
    L("Healthbeat: Fulton HIV program layoffs (May 2025)", "https://www.healthbeat.org/atlanta/2025/05/21/hiv-layoffs-fulton-county-health-department/"),
    L("Georgia Health Policy Center, Georgia State University", "https://ghpc.gsu.edu/"),
    H("Demo data"),
    L("AHEAD: America's HIV Epidemic Analysis Dashboard (HHS)", "https://ahead.hiv.gov/"),
    L("AIDSVu (Emory Rollins School of Public Health)", "https://aidsvu.org/"),
    L("CDC PLACES: local data for better health (2025 release)", "https://www.cdc.gov/places/"),
    L("NCHS U.S. Small-area Life Expectancy Estimates (USALEEP)", "https://www.cdc.gov/nchs/nvss/usaleep/usaleep.html"),
    L("Demos: fcboh.dulinconsulting.app/demos", "https://fcboh.dulinconsulting.app/demos/"),
  ];
  s.addText(col1, { x: 0.6, y: 1.25, w: 5.9, h: 5.6, fontSize: 11.5, color: C.text2, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 3, objectName: "src_col1" });
  s.addText(col2, { x: 6.8, y: 1.25, w: 5.9, h: 5.6, fontSize: 11.5, color: C.text2, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 3, objectName: "src_col2" });
  s.addText("Links are live in slideshow mode. Harvard Business School case 515-060 (Carolinas HealthCare System analytics) and the Fulton County contract documents are not linked.", { x: 0.6, y: 6.6, w: 12.1, h: 0.3, fontSize: 9.5, italic: true, color: C.accent6, margin: 0, isTextBox: true, objectName: "src_note" });
  notes(s, "Reference slide; not presented. Every public figure in the deck traces to one of these. Team photos: Rashaud Senior from Avance Care's provider page; Jonathan Ong from his LinkedIn profile.");

  await pres.writeFile({ fileName: "FCBOH_Data_Modernization_Endpoint.pptx" });
  await applyTheme("FCBOH_Data_Modernization_Endpoint.pptx", THEME);
  console.log("written");
})();
