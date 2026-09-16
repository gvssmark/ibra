// ============================================================
// admin.js — Parameters editing utility
// Reads the currently-loaded PARAMETERS (from parameters.js) to prefill
// the form, lets the user add/remove/edit slots, and generates a fresh
// parameters.js file to download.
// ============================================================

let slotCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  prefillGeneralFields();
  (PARAMETERS.slots || []).forEach((slot) => addSlotCard(slot));

  document.getElementById('addSlotBtn').addEventListener('click', () => addSlotCard());
  document.getElementById('generateBtn').addEventListener('click', generateParametersFile);
  document.getElementById('downloadBtn').addEventListener('click', downloadParametersFile);
});

// ---------------------------------------------------------------
// Prefill
// ---------------------------------------------------------------
function prefillGeneralFields() {
  document.getElementById('sevaYear').value = PARAMETERS.sevaYear;
  document.getElementById('dataEntryOpen').checked = !!PARAMETERS.dataEntryOpen;
  document.getElementById('sevaStartDate').value = ddmmyyyyToISO(PARAMETERS.sevaStartDate);
  document.getElementById('sevaEndDate').value = ddmmyyyyToISO(PARAMETERS.sevaEndDate);
  document.getElementById('whatsappNumber').value = PARAMETERS.whatsappNumber;
  document.getElementById('scriptURL').value = PARAMETERS.scriptURL;
  document.getElementById('readScriptURL').value = PARAMETERS.readScriptURL;
  document.getElementById('sheetId').value = PARAMETERS.sheetId;
  document.getElementById('sheetName').value = PARAMETERS.sheetName;
}

// ---------------------------------------------------------------
// Slot cards
// ---------------------------------------------------------------
function addSlotCard(slot) {
  slotCount += 1;
  const id = slotCount;

  const card = document.createElement('div');
  card.className = 'slot-card';
  card.dataset.slotCardId = id;

  card.innerHTML = `
    <div class="slot-header">
      <input type="text" class="slotName" value="${slot ? slot.slotName : `Slot ${id}`}">
      <button type="button" class="btn-remove-slot">Remove</button>
    </div>
    <div class="field">
      <label>Seva Start Date</label>
      <input type="date" class="sevaStartDate" value="${slot ? ddmmyyyyToISO(slot.sevaStartDate) : ''}">
    </div>
    <div class="field">
      <label>Seva End Date</label>
      <input type="date" class="sevaEndDate" value="${slot ? ddmmyyyyToISO(slot.sevaEndDate) : ''}">
    </div>
    <div class="field">
      <label>Data Entry Start Date</label>
      <input type="date" class="dataEntryStartDate" value="${slot ? ddmmyyyyToISO(slot.dataEntryStartDate) : ''}">
    </div>
    <div class="field">
      <label>Data Entry End Date</label>
      <input type="date" class="dataEntryEndDate" value="${slot ? ddmmyyyyToISO(slot.dataEntryEndDate) : ''}">
    </div>
    <div class="gapNote"></div>
  `;

  card.querySelector('.btn-remove-slot').addEventListener('click', () => {
    card.remove();
  });

  card.querySelectorAll('input[type="date"]').forEach((input) => {
    input.addEventListener('change', () => updateGapNote(card));
  });

  document.getElementById('slotsContainer').appendChild(card);
  updateGapNote(card);
}

function updateGapNote(card) {
  const noteEl = card.querySelector('.gapNote');
  const entryEndISO = card.querySelector('.dataEntryEndDate').value;
  const sevaStartISO = card.querySelector('.sevaStartDate').value;

  if (!entryEndISO || !sevaStartISO) {
    noteEl.innerHTML = '';
    return;
  }

  const entryEnd = new Date(entryEndISO);
  const sevaStart = new Date(sevaStartISO);
  const diffDays = Math.round((sevaStart - entryEnd) / (1000 * 60 * 60 * 24));

  if (diffDays >= 5) {
    noteEl.innerHTML = `<span class="gap-note ok">${diffDays} clear day(s) before Seva start — OK</span>`;
  } else {
    noteEl.innerHTML = `<span class="gap-note warn">Only ${diffDays} clear day(s) before Seva start — fewer than 5</span>`;
  }
}

// ---------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------
function ddmmyyyyToISO(ddmmyyyy) {
  if (!ddmmyyyy) return '';
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isoToDDMMYYYY(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------
// Generate parameters.js
// ---------------------------------------------------------------
function collectSlotsFromForm() {
  const cards = document.querySelectorAll('#slotsContainer .slot-card');
  return Array.from(cards).map((card, idx) => ({
    slotId: idx + 1,
    slotName: card.querySelector('.slotName').value,
    sevaStartDate: isoToDDMMYYYY(card.querySelector('.sevaStartDate').value),
    sevaEndDate: isoToDDMMYYYY(card.querySelector('.sevaEndDate').value),
    dataEntryStartDate: isoToDDMMYYYY(card.querySelector('.dataEntryStartDate').value),
    dataEntryEndDate: isoToDDMMYYYY(card.querySelector('.dataEntryEndDate').value)
  }));
}

function generateParametersFile() {
  const sevaYear = Number(document.getElementById('sevaYear').value);
  const dataEntryOpen = document.getElementById('dataEntryOpen').checked;
  const sevaStartDate = isoToDDMMYYYY(document.getElementById('sevaStartDate').value);
  const sevaEndDate = isoToDDMMYYYY(document.getElementById('sevaEndDate').value);
  const whatsappNumber = document.getElementById('whatsappNumber').value.trim();
  const scriptURL = document.getElementById('scriptURL').value.trim();
  const readScriptURL = document.getElementById('readScriptURL').value.trim();
  const sheetId = document.getElementById('sheetId').value.trim();
  const sheetName = document.getElementById('sheetName').value.trim();
  const slots = collectSlotsFromForm();

  const slotsBlock = slots.map((s) => `    {
      slotId: ${s.slotId},
      slotName: "${s.slotName}",
      sevaStartDate: "${s.sevaStartDate}",
      sevaEndDate: "${s.sevaEndDate}",
      dataEntryStartDate: "${s.dataEntryStartDate}",
      dataEntryEndDate: "${s.dataEntryEndDate}"
    }`).join(',\n');

  // sheetHeaders, relationOptions, mobileNumberRegex and dateFormat are
  // structural (they describe the sheet schema and dropdown choices) and
  // don't change year to year, so they are carried over unchanged here.
  const code = `// ============================================================
// parameters.js
// Central configuration for the Seva Data Entry App
// All dates are in Indian format: DD/MM/YYYY
// Generated via admin.html on ${new Date().toLocaleString()}
// ============================================================

const PARAMETERS = {

  // Current Seva Year
  sevaYear: ${sevaYear},

  // Master switch — when false, the data entry form should be disabled
  // app-wide (e.g. show a "Data entry closed" message instead of the form)
  dataEntryOpen: ${dataEntryOpen},

  // Overall Seva period (informational / used for validation)
  sevaStartDate: "${sevaStartDate}",
  sevaEndDate: "${sevaEndDate}",

  // Slot-wise Seva date ranges and their corresponding data-entry windows.
  // A slot's data entry is considered open when today's date falls between
  // its dataEntryStartDate and dataEntryEndDate (inclusive).
  slots: [
${slotsBlock}
  ],

  // WhatsApp number for notifications (country code + number, no '+', no spaces)
  whatsappNumber: "${whatsappNumber}",

  // Google Apps Script Web App URL — handles WRITING new entries to the sheet
  scriptURL: "${scriptURL}",

  // Separate Apps Script Web App URL — handles READING/listing existing rows
  // (used for the "view existing data as cards" feature). Generic endpoint;
  // sheetid & sheetname are passed as query params (built below).
  readScriptURL: "${readScriptURL}",

  // Google Sheet details
  sheetId: "${sheetId}",
  sheetName: "${sheetName}",

  // Column headers in the "Data" sheet, in exact order
  sheetHeaders: ${JSON.stringify(PARAMETERS.sheetHeaders, null, 4).replace(/\n/g, '\n  ')},

  // Dropdown options for the Relation fields (pitru1Relation / pitru2Relation)
  relationOptions: ${JSON.stringify(PARAMETERS.relationOptions, null, 4).replace(/\n/g, '\n  ')},

  // Indian mobile numbers: 10 digits, starting with 6, 7, 8 or 9
  mobileNumberRegex: /^[6-9]\\d{9}$/,

  // Date display/entry format used throughout the app
  dateFormat: "DD/MM/YYYY"
};

// Fully-built URL for fetching existing rows (cards view), using this
// app's own sheetId/sheetName against the generic read endpoint.
PARAMETERS.readDataURL =
  \`\${PARAMETERS.readScriptURL}?sheetid=\${PARAMETERS.sheetId}&sheetname=\${PARAMETERS.sheetName}\`;

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

// Returns a Date object representing the current moment in India Standard
// Time (IST, UTC+5:30), constructed the same way slot boundary dates are
// (a "local" Date built from plain year/month/day/... numbers) so date-only
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

// Returns the slot whose DATA ENTRY window (dataEntryStartDate..dataEntryEndDate)
// contains "now" (defaults to the current moment in IST), or null if no slot's
// entry window is currently open. Used to figure out which slot's data entry
// is active right now.
function getCurrentOpenSlot(now = getISTNow()) {
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
  return \`\${y}-\${String(m).padStart(2, "0")}-\${String(d).padStart(2, "0")}\`;
}

// Determines the allowed date-picker range right now: based on PARAMETERS.dataEntryOpen
// (master switch) AND whichever slot's data-entry window currently contains today
// in IST. The minimum is that slot's own seva start date, but the maximum is always
// the OVERALL seva end date (not the slot's own end) — so once a slot's window opens,
// any remaining seva date through the end of the whole seva period can be picked.
// Returns { slot, minISO, maxISO } if entry is open for some slot, otherwise null
// (meaning: no valid dates to pick — show a "data entry closed" message instead).
function getAllowedDateRange(now = getISTNow()) {
  if (!PARAMETERS.dataEntryOpen) return null;
  const slot = getCurrentOpenSlot(now);
  if (!slot) return null;
  return {
    slot,
    minISO: toISODate(slot.sevaStartDate),
    maxISO: toISODate(PARAMETERS.sevaEndDate)
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
`;

  document.getElementById('outputCode').value = code;
  document.getElementById('outputSection').style.display = 'block';
  document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });
}

function downloadParametersFile() {
  const code = document.getElementById('outputCode').value;
  if (!code) return;
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'parameters.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
