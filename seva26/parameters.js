// ============================================================
// parameters.js
// Central configuration for the Seva Data Entry App
// All dates are in Indian format: DD/MM/YYYY
// ============================================================

const PARAMETERS = {

  // Current Seva Year
  sevaYear: 2026,

  // Master switch — when false, the data entry form should be disabled
  // app-wide (e.g. show a "Data entry closed" message instead of the form)
  dataEntryOpen: true,

  // Overall Seva period (informational / used for validation)
  sevaStartDate: "01/10/2026",
  sevaEndDate: "15/10/2026",

  // Slot-wise Seva date ranges and their corresponding data-entry windows.
  // A slot's data entry is considered open when today's date falls between
  // its dataEntryStartDate and dataEntryEndDate (inclusive).
  slots: [
    {
      slotId: 1,
      slotName: "Slot 1",
      sevaStartDate: "01/10/2026",
      sevaEndDate: "07/10/2026",
      dataEntryStartDate: "15/09/2026",
      dataEntryEndDate: "25/09/2026"
    },
    {
      slotId: 2,
      slotName: "Slot 2",
      sevaStartDate: "08/10/2026",
      sevaEndDate: "15/10/2026",
      dataEntryStartDate: "26/09/2026",
      dataEntryEndDate: "03/10/2026"
    },
    {
      slotId: 3,
      slotName: "Slot 3",
      sevaStartDate: "15/10/2026",
      sevaEndDate: "15/10/2026",
      dataEntryStartDate: "11/10/2026",
      dataEntryEndDate: "13/10/2026"
    }
  ],

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
  // NOTE: "sponsorMobile" is a new column — add it to the actual Google Sheet's
  // header row (between sponsorName and sponsorGotra) before going live.
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
    "Father in Law",
    "Mother in Law",
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

// Given a sevaDate string in "DD/MM/YYYY" format, returns the matching
// slot object from PARAMETERS.slots (the slot whose sevaStartDate/sevaEndDate
// range contains that date), or null if the date falls outside all slots.
function getSlotForDate(sevaDateStr) {
  const toDate = (ddmmyyyy) => {
    const [d, m, y] = ddmmyyyy.split("/").map(Number);
    return new Date(y, m - 1, d);
  };
  const picked = toDate(sevaDateStr);
  return (
    PARAMETERS.slots.find((slot) => {
      const start = toDate(slot.sevaStartDate);
      const end = toDate(slot.sevaEndDate);
      return picked >= start && picked <= end;
    }) || null
  );
}

// Returns the slot whose DATA ENTRY window (dataEntryStartDate..dataEntryEndDate)
// contains "now" (defaults to today), or null if no slot's entry window is
// currently open. Used to figure out which slot's data entry is active right now.
function getCurrentOpenSlot(now = new Date()) {
  const toDate = (ddmmyyyy) => {
    const [d, m, y] = ddmmyyyy.split("/").map(Number);
    return new Date(y, m - 1, d);
  };
  return (
    PARAMETERS.slots.find((slot) => {
      const start = toDate(slot.dataEntryStartDate);
      const end = toDate(slot.dataEntryEndDate);
      end.setHours(23, 59, 59, 999); // include the whole end day
      return now >= start && now <= end;
    }) || null
  );
}

// Converts a "DD/MM/YYYY" string to "YYYY-MM-DD" (the format <input type="date">
// requires for its value/min/max attributes).
function toISODate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split("/").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Determines the allowed date-picker range right now: based on PARAMETERS.dataEntryOpen
// (master switch) AND whichever slot's data-entry window currently contains today.
// Returns { slot, minISO, maxISO } if entry is open for some slot, otherwise null
// (meaning: no valid dates to pick — show a "data entry closed" message instead).
function getAllowedDateRange(now = new Date()) {
  if (!PARAMETERS.dataEntryOpen) return null;
  const slot = getCurrentOpenSlot(now);
  if (!slot) return null;
  return {
    slot,
    minISO: toISODate(slot.sevaStartDate),
    maxISO: toISODate(slot.sevaEndDate)
  };
}

// Converts one row returned by readScriptURL (a plain array of cell values,
// in sheetHeaders order) into a keyed record, e.g. { sevaYear: 2026, sevaDate: "01/10/2026", ... }
function rowArrayToRecord(rowArray) {
  const record = {};
  PARAMETERS.sheetHeaders.forEach((header, idx) => {
    record[header] = rowArray[idx];
  });
  return record;
}

// Export for use in app.js (if using ES modules); otherwise PARAMETERS
// is simply available as a global when this file is loaded via <script> tag.
if (typeof module !== "undefined" && module.exports) {
  module.exports = PARAMETERS;
}
