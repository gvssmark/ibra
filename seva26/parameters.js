// ============================================================
// parameters.js
// Central configuration for the Seva Data Entry App
// All dates are in Indian format: DD/MM/YYYY
// Generated via admin.html on 9/17/2026, 4:47:37 AM
// ============================================================

const PARAMETERS = {

  // Current Seva Year
  sevaYear: 2026,

  // Master switch — when false, the data entry form should be disabled
  // app-wide (e.g. show a "Data entry closed" message instead of the form)
  dataEntryOpen: true,

  // Overall Seva period (informational / used for validation)
  sevaStartDate: "10/10/2026",
  sevaEndDate: "10/10/2026",

  // Minimum number of clear days required between today and a seva date for
  // that date to be enterable — gives enough lead time to make arrangements.
  // A seva date D can be picked as long as (D - today) >= minGapDays, and
  // D falls within [sevaStartDate, sevaEndDate]. Entry closes automatically
  // once even the last seva date (sevaEndDate) is closer than this many days
  // away, and reopens the moment this number is lowered (e.g. to let in
  // latecomers as the seva period nears its end) or the picture changes.
  minGapDays: 5,

  // WhatsApp number for notifications (country code + number, no '+', no spaces)
  whatsappNumber: "919989036183",

  // Google Apps Script Web App URL — handles WRITING new entries to the sheet
  scriptURL: "https://script.google.com/macros/s/AKfycbytzFhmFLKbTpwiMhtvPUGyi26GTFg2i9cIPkbLQKrEfRd4Mb-ezKptfrf7nm-fSzUM/exec",

  // Separate Apps Script Web App URL — handles READING/listing existing rows
  // (used for the "view existing data as cards" feature). Generic endpoint;
  // sheetid & sheetname are passed as query params (built below).
  readScriptURL: "https://script.google.com/macros/s/AKfycbwo-TtPn3DAjHSPCXDwPFerT36QyfPPvUTi7uQEvcmjJso_aWpaKefUsgx_vpJOowHUgg/exec",

  // Google Sheet details
  sheetId: "1wcfB0Qh421w0Qrd05IN5ftXYe-k5qKl280rhXg6mzZU",
  sheetName: "Data",

  // Column headers in the "Data" sheet, in exact order
  sheetHeaders: [
      "sevaYear",
      "sevaDate",
      "sponsorName",
      "sponsorMobile",
      "sponsorGotra",
      "coSponsorName",
      "coSponsorGotra",
      "pitru1Name",
      "pitru1Gotra",
      "pitru1Relation",
      "pitru2Name",
      "pitru2Gotra",
      "pitru2Relation"
  ],

  // Dropdown options for the Relation fields (pitru1Relation / pitru2Relation)
  relationOptions: [
      "Father",
      "Paternal Grand Father",
      "Maternal Grand Father",
      "Mother",
      "Paternal Grand Mother",
      "Maternal Grand Mother",
      "Elder Brother",
      "Elder Brother's Wife",
      "Younger Brother",
      "Younger Brother's Wife",
      "Elder Sister",
      "Elder Sister's Husband",
      "Younger Sister",
      "Younger Sister's Husband",
      "Wife",
      "Husband",
      "Son",
      "Son's Wife",
      "Daughter",
      "Daughter's Husband",
      "Friend",
      "Anyother Specify"
  ],

  // Indian mobile numbers: 10 digits, starting with 6, 7, 8 or 9
  mobileNumberRegex: /^[6-9]\d{9}$/,

  // Date display/entry format used throughout the app
  dateFormat: "DD/MM/YYYY"
};

// Fully-built URL for fetching existing rows (cards view), using this
// app's own sheetId/sheetName against the generic read endpoint.
PARAMETERS.readDataURL =
  `${PARAMETERS.readScriptURL}?sheetid=${PARAMETERS.sheetId}&sheetname=${PARAMETERS.sheetName}`;

// Given a "DD/MM/YYYY" string, returns the equivalent local Date object
// (midnight). Shared by the date-range functions below.
function ddmmyyyyToDateObj(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// Returns a Date object representing the current moment in India Standard
// Time (IST, UTC+5:30), constructed the same way ddmmyyyyToDateObj() builds
// dates (a "local" Date from plain year/month/day/... numbers) so date-only
// comparisons stay correct no matter what timezone the viewer's browser is in.
function getISTNow() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istShifted = new Date(Date.now() + IST_OFFSET_MS);
  // istShifted's UTC fields now represent IST wall-clock time; rebuild a
  // plain local Date from those numbers.
  return new Date(
    istShifted.getUTCFullYear(),
    istShifted.getUTCMonth(),
    istShifted.getUTCDate(),
    istShifted.getUTCHours(),
    istShifted.getUTCMinutes(),
    istShifted.getUTCSeconds()
  );
}

// Converts a "DD/MM/YYYY" string to "YYYY-MM-DD" (the format <input type="date">
// requires for its value/min/max attributes).
function toISODate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Same as toISODate() but for a Date object rather than a "DD/MM/YYYY" string.
function dateObjToISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Determines the allowed date-picker range right now: based on PARAMETERS.dataEntryOpen
// (master switch) AND PARAMETERS.minGapDays (the minimum lead time required between
// today and a seva date). The earliest pickable date is "today + minGapDays",
// clamped to not go before the overall seva start date. The latest pickable date
// is always the overall seva end date. If even the last seva date no longer has
// enough lead time, entry is closed. Lowering minGapDays (e.g. from 5 to 2) or
// moving today forward both recompute this live — there is no separate "reopen"
// step, just redeploying parameters.js with the new value.
// Returns { minISO, maxISO } if entry is open, otherwise null (closed).
function getAllowedDateRange(now = getISTNow()) {
  if (!PARAMETERS.dataEntryOpen) return null;

  const overallStart = ddmmyyyyToDateObj(PARAMETERS.sevaStartDate);
  const overallEnd = ddmmyyyyToDateObj(PARAMETERS.sevaEndDate);

  const earliestPickable = new Date(now);
  earliestPickable.setHours(0, 0, 0, 0);
  earliestPickable.setDate(earliestPickable.getDate() + PARAMETERS.minGapDays);

  const effectiveMin = earliestPickable > overallStart ? earliestPickable : overallStart;
  if (effectiveMin > overallEnd) return null; // no valid dates remain — closed

  return {
    minISO: dateObjToISO(effectiveMin),
    maxISO: toISODate(PARAMETERS.sevaEndDate)
  };
}

// Converts one row returned by readScriptURL (a plain array of cell values,
// in sheetHeaders order) into a keyed record, e.g. { sevaYear: 2026, sevaDate: "01/10/2026", ... }
function rowArrayToRecord(rowArray) {
  const record = {};
  PARAMETERS.sheetHeaders.forEach((header, idx) => {
    let value = rowArray[idx];
    if (header === "sevaDate") {
      value = normalizeSheetDateValue(value);
    }
    record[header] = value;
  });
  return record;
}

// Google Sheets sometimes auto-converts an incoming "DD/MM/YYYY" text value into
// an actual Date-type cell; when the read script serializes that cell back to
// JSON, it comes through as a raw UTC ISO timestamp (e.g. "2026-10-02T18:30:00.000Z")
// instead of the original text. This detects that case and recovers the intended
// DD/MM/YYYY by shifting to IST before reading the calendar date (the sheet's
// stored moment represents IST midnight, not UTC midnight). Plain "DD/MM/YYYY"
// strings pass through unchanged.
function normalizeSheetDateValue(value) {
  if (typeof value !== "string") return value;
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
  if (!isoMatch) return value;

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const shifted = new Date(new Date(value).getTime() + IST_OFFSET_MS);
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = shifted.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Export for use in app.js (if using ES modules); otherwise PARAMETERS
// is simply available as a global when this file is loaded via <script> tag.
if (typeof module !== "undefined" && module.exports) {
  module.exports = PARAMETERS;
}
