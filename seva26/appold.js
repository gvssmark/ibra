// ============================================================
// app.js — Seva Data Entry App logic
// Depends on PARAMETERS and its helper functions from parameters.js
// ============================================================

let allRecords = [];       // cached, sorted list of records for the View Entries tab
let recordsLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initStatusBanner();
  initTabs();
  populateRelationSelect('pitru1Relation');
  populateRelationSelect('pitru2Relation');
  wireOtherRelationFields();
  wireForm();
  wireSearch();
});

// ---------------------------------------------------------------
// Header / status
// ---------------------------------------------------------------
function initHeader() {
  document.getElementById('sevaYearDisplay').textContent = PARAMETERS.sevaYear;
  document.getElementById('sevaYearHidden').value = PARAMETERS.sevaYear;
}

function initStatusBanner() {
  const banner = document.getElementById('statusBanner');
  const range = getAllowedDateRange();
  const dateInput = document.getElementById('sevaDate');
  const submitBtn = document.getElementById('submitBtn');

  if (range) {
    banner.className = 'status-banner open';
    banner.textContent =
      `Data entry is open for ${range.slot.slotName} (Seva ${range.slot.sevaStartDate} – ${range.slot.sevaEndDate}).`;
    dateInput.min = range.minISO;
    dateInput.max = range.maxISO;
    dateInput.disabled = false;
    submitBtn.disabled = false;
  } else {
    banner.className = 'status-banner closed';
    banner.textContent = 'Data entry is currently closed. Please check back during the next open window.';
    dateInput.disabled = true;
    submitBtn.disabled = true;
  }
}

// ---------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      const target = document.getElementById(btn.dataset.target);
      target.classList.add('active');

      if (btn.dataset.target === 'viewEntriesView' && !recordsLoaded) {
        loadRecords();
      }
    });
  });
}

// ---------------------------------------------------------------
// Relation dropdowns
// ---------------------------------------------------------------
function populateRelationSelect(selectId) {
  const select = document.getElementById(selectId);
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Select relation --';
  select.appendChild(blank);

  PARAMETERS.relationOptions.forEach((rel) => {
    const opt = document.createElement('option');
    opt.value = rel;
    opt.textContent = rel;
    select.appendChild(opt);
  });
}

function wireOtherRelationFields() {
  ['pitru1', 'pitru2'].forEach((prefix) => {
    const select = document.getElementById(`${prefix}Relation`);
    const otherWrap = document.getElementById(`${prefix}OtherWrap`);
    select.addEventListener('change', () => {
      otherWrap.style.display = select.value === 'Anyother Specify' ? 'block' : 'none';
    });
  });
}

// ---------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------
function wireForm() {
  const form = document.getElementById('sevaForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('formError');
    errorEl.textContent = '';

    const range = getAllowedDateRange();
    if (!range) {
      errorEl.textContent = 'Data entry is currently closed.';
      return;
    }

    const record = buildRecordFromForm();
    const validationError = validateRecord(record);
    if (validationError) {
      errorEl.textContent = validationError;
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    try {
      const payload = {
        spreadsheetId: PARAMETERS.sheetId,
        sheetName: PARAMETERS.sheetName,
        ...record
      };
      await fetch(PARAMETERS.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      // Apps Script (no-cors) never returns a readable response, so we
      // treat "no network error" as success, per the app's design.
      showReport(record);
      form.reset();
      document.getElementById('sevaYearHidden').value = PARAMETERS.sevaYear;
      document.getElementById('pitru1OtherWrap').style.display = 'none';
      document.getElementById('pitru2OtherWrap').style.display = 'none';
      recordsLoaded = false; // force a refresh next time View Entries is opened
    } catch (err) {
      errorEl.textContent = 'Could not submit — please check your connection and try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Seva Details';
    }
  });
}

function buildRecordFromForm() {
  const val = (id) => document.getElementById(id).value.trim();

  const pitru1Relation = val('pitru1Relation') === 'Anyother Specify'
    ? val('pitru1RelationOther') : val('pitru1Relation');
  const pitru2Relation = val('pitru2Relation') === 'Anyother Specify'
    ? val('pitru2RelationOther') : val('pitru2Relation');

  const dateVal = document.getElementById('sevaDate').value; // yyyy-mm-dd
  const sevaDateDDMMYYYY = dateVal ? isoToDDMMYYYY(dateVal) : '';

  return {
    sevaYear: PARAMETERS.sevaYear,
    sevaDate: sevaDateDDMMYYYY,
    sponsorName: val('sponsorName'),
    sponsorMobile: val('sponsorMobile'),
    sponsorGotra: val('sponsorGotra'),
    coSponsorName: val('coSponsorName'),
    coSponsorGotra: val('coSponsorGotra'),
    pitru1Name: val('pitru1Name'),
    pitru1Gotra: val('pitru1Gotra'),
    pitru1Relation: pitru1Relation,
    pitru2Name: val('pitru2Name'),
    pitru2Gotra: val('pitru2Gotra'),
    pitru2Relation: pitru2Relation
  };
}

function validateRecord(record) {
  if (!record.sevaDate) return 'Please pick a Seva date.';
  if (!record.sponsorName) return 'Sponsor name is required.';
  if (!PARAMETERS.mobileNumberRegex.test(record.sponsorMobile)) {
    return 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.';
  }
  if (!record.pitru1Name) return 'Pitru 1 name is required.';
  if (!record.pitru1Relation) return 'Pitru 1 relation is required.';
  return null;
}

function isoToDDMMYYYY(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------
// Report + WhatsApp
// ---------------------------------------------------------------
function showReport(record) {
  const container = document.getElementById('reportContainer');
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'report-card';

  const title = document.createElement('h2');
  title.textContent = 'Seva Confirmed';
  card.appendChild(title);

  const rows = [
    ['Seva Year', record.sevaYear],
    ['Seva Date', record.sevaDate],
    ['Sponsor', record.sponsorName],
    ['Mobile', record.sponsorMobile],
    ['Sponsor Gotra', record.sponsorGotra || '—'],
    ['Co-Sponsor', record.coSponsorName || '—'],
    ['Pitru 1', `${record.pitru1Name} (${record.pitru1Relation})`],
    ['Pitru 2', record.pitru2Name ? `${record.pitru2Name} (${record.pitru2Relation})` : '—']
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.className = 'report-row';
    row.innerHTML = `<span>${label}</span><span></span>`;
    row.querySelector('span:last-child').textContent = value;
    card.appendChild(row);
  });

  const waLink = document.createElement('a');
  waLink.className = 'btn-secondary';
  waLink.textContent = 'Send via WhatsApp';
  waLink.href = buildWhatsAppLink(record);
  waLink.target = '_blank';
  waLink.rel = 'noopener';
  card.appendChild(waLink);

  container.appendChild(card);
}

function buildWhatsAppLink(record) {
  const lines = [
    `Seva Confirmation`,
    `Seva Year: ${record.sevaYear}`,
    `Seva Date: ${record.sevaDate}`,
    `Sponsor: ${record.sponsorName} (${record.sponsorMobile})`,
    record.sponsorGotra ? `Sponsor Gotra: ${record.sponsorGotra}` : null,
    record.coSponsorName ? `Co-Sponsor: ${record.coSponsorName}` : null,
    `Pitru 1: ${record.pitru1Name} (${record.pitru1Relation})`,
    record.pitru2Name ? `Pitru 2: ${record.pitru2Name} (${record.pitru2Relation})` : null,
    `Thank you.`
  ].filter(Boolean).join('\n');

  return `https://wa.me/${PARAMETERS.whatsappNumber}?text=${encodeURIComponent(lines)}`;
}

// ---------------------------------------------------------------
// View Entries — load, sort, search, expand
// ---------------------------------------------------------------
async function loadRecords() {
  const listEl = document.getElementById('recordsList');
  listEl.innerHTML = '<div class="loading-state">Loading entries…</div>';

  try {
    const res = await fetch(PARAMETERS.readDataURL);
    const rows = await res.json(); // array of arrays

    const dataRows = rows.filter((row) => {
      // Skip a header row if present (sevaYear column won't be numeric there)
      return row.length > 0 && !isNaN(Number(row[0]));
    });

    const records = dataRows.map(rowArrayToRecord);

    records.sort((a, b) =>
      String(a.sponsorMobile).localeCompare(String(b.sponsorMobile))
    );

    records.forEach((rec, idx) => { rec._sno = idx + 1; });

    allRecords = records;
    recordsLoaded = true;
    renderRecords(allRecords);
  } catch (err) {
    listEl.innerHTML = '<div class="error-text">Could not load entries. Please try again later.</div>';
  }
}

function renderRecords(records) {
  const listEl = document.getElementById('recordsList');
  listEl.innerHTML = '';

  if (records.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No matching entries found.</div>';
    return;
  }

  records.forEach((rec) => {
    const card = document.createElement('div');
    card.className = 'record-card';

    card.innerHTML = `
      <div class="rc-top">
        <span class="sno">#${rec._sno}</span>
        <span class="mobile">${rec.sponsorMobile}</span>
      </div>
      <div class="row"><span class="lbl">Sponsor:</span>${rec.sponsorName}</div>
      <div class="row"><span class="lbl">Pitru1:</span>${rec.pitru1Name || '—'}${rec.pitru1Relation ? ` (${rec.pitru1Relation})` : ''}</div>
      <div class="row"><span class="lbl">Pitru2:</span>${rec.pitru2Name || '—'}${rec.pitru2Relation ? ` (${rec.pitru2Relation})` : ''}</div>
      <div class="row"><span class="lbl">Seva Date:</span>${rec.sevaDate}</div>
      <div class="detail">
        <div class="row"><span class="lbl">Seva Year:</span>${rec.sevaYear}</div>
        <div class="row"><span class="lbl">Sponsor Gotra:</span>${rec.sponsorGotra || '—'}</div>
        <div class="row"><span class="lbl">Co-Sponsor:</span>${rec.coSponsorName || '—'}</div>
        <div class="row"><span class="lbl">Co-Sponsor Gotra:</span>${rec.coSponsorGotra || '—'}</div>
        <div class="row"><span class="lbl">Pitru1 Gotra:</span>${rec.pitru1Gotra || '—'}</div>
        <div class="row"><span class="lbl">Pitru2 Gotra:</span>${rec.pitru2Gotra || '—'}</div>
      </div>
    `;

    card.addEventListener('click', () => card.classList.toggle('expanded'));
    listEl.appendChild(card);
  });
}

function wireSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      renderRecords(allRecords);
      return;
    }
    const filtered = allRecords.filter((rec) =>
      String(rec.sponsorMobile).toLowerCase().includes(q) ||
      String(rec.sponsorName).toLowerCase().includes(q)
    );
    renderRecords(filtered);
  });
}
