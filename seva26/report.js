// ============================================================
// report.js — Seva Hoarding Report (PDF export)
// Depends on PARAMETERS (parameters.js) and TELUGU_FONT_BASE64 (telugu-font.js)
// ============================================================

let allRecords = [];
let teluguFontReady = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadTeluguFont();
  await loadRecords();
  document.getElementById('generateBtn').addEventListener('click', generatePDF);
});

// ---------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------
async function loadTeluguFont() {
  try {
    const font = new FontFace(
      'NotoTelugu',
      `url(data:font/truetype;charset=utf-8;base64,${TELUGU_FONT_BASE64})`
    );
    await font.load();
    document.fonts.add(font);
    teluguFontReady = true;
  } catch (err) {
    teluguFontReady = false;
  }
}

function containsTelugu(text) {
  return /[\u0C00-\u0C7F]/.test(String(text || ''));
}

// ---------------------------------------------------------------
// Load + sort entries
// ---------------------------------------------------------------
async function loadRecords() {
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'Loading entries…';

  try {
    const res = await fetch(PARAMETERS.readDataURL);
    const rows = await res.json(); // array of arrays

    const dataRows = rows.filter((row) => row.length > 0 && !isNaN(Number(row[0])));
    const records = dataRows.map(rowArrayToRecord);

    records.sort((a, b) => parseDDMMYYYY(a.sevaDate) - parseDDMMYYYY(b.sevaDate));

    allRecords = records;
    renderPreview(records);
    statusEl.textContent = `${records.length} entr${records.length === 1 ? 'y' : 'ies'} loaded, sorted by Seva date.`;
    document.getElementById('generateBtn').disabled = records.length === 0;
  } catch (err) {
    statusEl.textContent = 'Could not load entries. Please try again later.';
  }
}

function parseDDMMYYYY(ddmmyyyy) {
  const [d, m, y] = String(ddmmyyyy).split('/').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function pitruLabel(name, relation) {
  if (!name) return '';
  return relation ? `${name} (${relation})` : name;
}

// ---------------------------------------------------------------
// On-page preview (plain HTML — browser shapes Telugu correctly here too)
// ---------------------------------------------------------------
function renderPreview(records) {
  const tbody = document.getElementById('previewBody');
  tbody.innerHTML = '';

  records.forEach((rec) => {
    const tr = document.createElement('tr');
    const cells = [
      rec.sevaDate,
      rec.sponsorName,
      pitruLabel(rec.pitru1Name, rec.pitru1Relation),
      pitruLabel(rec.pitru2Name, rec.pitru2Relation)
    ];
    cells.forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text || '—';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------

// Renders a text string to a PNG data URL using the Telugu-capable font,
// via the browser's own canvas text engine (which applies real OpenType
// shaping — conjuncts, vowel repositioning — unlike jsPDF's built-in text
// renderer). Rendered at 3x scale for crisper output when placed into the PDF.
function renderTextToImage(text, fontSizePx = 15, scale = 3) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scaledFontSize = fontSizePx * scale;
  const padding = 4 * scale;

  ctx.font = `${scaledFontSize}px "NotoTelugu"`;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width) + padding * 2;
  canvas.height = Math.ceil(scaledFontSize * 1.5);

  // Resizing the canvas clears context state, so the font must be re-applied.
  ctx.font = `${scaledFontSize}px "NotoTelugu"`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.fillText(text, padding, canvas.height / 2);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width / scale,   // logical (unscaled) size, for PDF layout math
    height: canvas.height / scale
  };
}

async function generatePDF() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = 'Generating…';

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.setTextColor(139, 30, 63);
    doc.text(`Seva Sponsorship — ${PARAMETERS.sevaYear}`, 40, 40);

    const head = [['Seva Date', 'Sponsor', 'Pitru 1', 'Pitru 2']];
    const body = allRecords.map((rec) => [
      rec.sevaDate,
      rec.sponsorName,
      pitruLabel(rec.pitru1Name, rec.pitru1Relation),
      pitruLabel(rec.pitru2Name, rec.pitru2Relation)
    ]);

    doc.autoTable({
      head,
      body,
      startY: 60,
      styles: { fontSize: 11, cellPadding: 6, valign: 'middle' },
      headStyles: { fillColor: [139, 30, 63], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 233, 208] },
      didParseCell: (data) => {
        if (data.section === 'body' && teluguFontReady && containsTelugu(data.cell.raw)) {
          // Blank the text AutoTable would otherwise draw (incorrectly) —
          // the real content is drawn as a shaped image in didDrawCell below.
          data.cell.text = [];
        }
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || !teluguFontReady) return;
        const raw = data.cell.raw;
        if (!containsTelugu(raw)) return;

        const { dataUrl, width, height } = renderTextToImage(String(raw));
        const maxW = data.cell.width - 8;
        const maxH = data.cell.height - 8;
        const scale = Math.min(maxW / width, maxH / height, 1);
        const drawW = width * scale;
        const drawH = height * scale;
        const x = data.cell.x + (data.cell.width - drawW) / 2;
        const y = data.cell.y + (data.cell.height - drawH) / 2;
        doc.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
      }
    });

    doc.save(`seva-hoarding-report-${PARAMETERS.sevaYear}.pdf`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Download PDF';
  }
}
