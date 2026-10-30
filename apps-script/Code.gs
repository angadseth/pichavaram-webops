/**
 * Web Ops recruitment backend. Runs inside pichavaram-webad@ds.study.iitm.ac.in, so that account
 * owns the responses Sheet and sends the mails.
 *
 * One-time setup:
 *   1. Run setup()        -> creates the "Web Ops Recruitment 2026" Sheet in this account's Drive.
 *   2. Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone -> copy the /exec URL.
 *   3. Run sendTest()     -> sends the announcement to TEST_TO only.
 *   4. Run sendAll()      -> sends to the "Recipients" tab in BCC batches; run it again the next day
 *                            if the daily quota stops it, it carries on from where it stopped.
 */

const SITE = "https://angadseth.github.io/pichavaram-webops/";
const TEST_TO = "24f2004141@ds.study.iitm.ac.in";
const SUBJECT = "Pichavaram Web Ops is hiring. Show us what you've built.";
const SENDER_NAME = "Angad Jangir · Pichavaram Web Ops";
const FIELDS = ["name", "email", "degree", "level", "skills", "work", "proud", "linkedin", "hours", "phone", "extra"];
const HEADERS = ["Submitted at", "Name", "Email", "Degree", "Level", "Skills", "Work / links", "Proud of", "LinkedIn", "Hours / week", "WhatsApp", "Anything else"];
const BATCH = 90;   // BCC recipients per mail

function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss;
  const id = props.getProperty("SHEET_ID");
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    ss = SpreadsheetApp.create("Web Ops Recruitment 2026 · Pichavaram");
    props.setProperty("SHEET_ID", ss.getId());
  }
  const sh = ss.getSheets()[0].setName("Responses");
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight("bold").setBackground("#1f5c43").setFontColor("#ffffff");
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, HEADERS.length, 180);
  sh.setColumnWidth(7, 320);
  sh.setColumnWidth(8, 320);
  if (!ss.getSheetByName("Recipients")) ss.insertSheet("Recipients").getRange("A1").setValue("email");
  Logger.log("Sheet: " + ss.getUrl());
}

function sheet_(name) {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")).getSheetByName(name);
}

// The site posts its answers here.
function doPost(e) {
  const p = (e && e.parameter) || {};
  const email = String(p.email || "").trim().toLowerCase();
  if (!/@[a-z]{2}\.study\.iitm\.ac\.in$/.test(email)) return json_({ ok: false, error: "email" });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // Text that starts with = + - @ is stored as text, not run as a formula.
    const clean = v => { v = String(v || "").slice(0, 4000); return /^[=+\-@]/.test(v) ? "'" + v : v; };
    sheet_("Responses").appendRow([new Date()].concat(FIELDS.map(f => clean(f === "email" ? email : p[f]))));
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, service: "pichavaram-webops" });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function mailBody_() {
  const html = UrlFetchApp.fetch(SITE + "mail.html").getContentText();
  return html.replace(/{{FORM_URL}}/g, SITE).replace(/{{CREST_URL}}/g, SITE + "assets/crest.png");
}

function plainBody_() {
  return [
    "Hi everyone,",
    "",
    "We're putting together the Web Ops team for Pichavaram: the house website, the tools behind our meetups and events, automations, and whatever else needs building.",
    "",
    "No cover letter, no long intro. If you've built anything before, drop the link in the form straight away.",
    "",
    "Form: " + SITE,
    "Last date: 15 November. Kindly fill it fast.",
    "",
    "Angad Jangir",
    "Web Admin, Pichavaram House"
  ].join("\n");
}

function sendTest() {
  GmailApp.sendEmail(TEST_TO, "[Test] " + SUBJECT, plainBody_(), { htmlBody: mailBody_(), name: SENDER_NAME });
  Logger.log("Test mail sent to " + TEST_TO + ". Quota left today: " + MailApp.getRemainingDailyQuota());
}

function sendAll() {
  const props = PropertiesService.getScriptProperties();
  const list = sheet_("Recipients").getRange("A2:A").getValues().map(r => String(r[0]).trim().toLowerCase()).filter(x => /@/.test(x));
  let done = Number(props.getProperty("SENT_UPTO") || 0);
  const html = mailBody_(), text = plainBody_();
  while (done < list.length) {
    const chunk = list.slice(done, done + BATCH);
    if (MailApp.getRemainingDailyQuota() < chunk.length + 1) {
      Logger.log("Daily quota reached. Sent " + done + " of " + list.length + ". Run sendAll() again tomorrow.");
      return;
    }
    GmailApp.sendEmail(Session.getActiveUser().getEmail(), SUBJECT, text, { htmlBody: html, name: SENDER_NAME, bcc: chunk.join(",") });
    done += chunk.length;
    props.setProperty("SENT_UPTO", String(done));
  }
  Logger.log("All done: " + done + " recipients.");
}
