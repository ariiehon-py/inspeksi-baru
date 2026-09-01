// js/preview.js — Report Preview & PDF Generation
// Uses window.print() identical to the reference project mechanics
import { collectFormData } from './form.js';
import { showToast } from './ui.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
}

/**
 * Build the report HTML — reusable by preview AND print.
 * @param {object} data - from collectFormData()
 */
function buildReportHTML(data) {
    const tdBase = `border: 1px solid #000; padding: 6px;`;

    // Format multiple surveyors
    let surveyorDisplay = '-';
    let surveyorList = [];
    if (Array.isArray(data.surveyors) && data.surveyors.length > 0) {
        surveyorList = data.surveyors;
    } else if (typeof data.surveyor === 'string' && data.surveyor.trim() !== '') {
        surveyorList = data.surveyor.split(/,\s*|\n|;/).map(s => s.trim()).filter(Boolean);
    }

    if (surveyorList.length === 1) {
        surveyorDisplay = surveyorList[0];
    } else if (surveyorList.length > 1) {
        surveyorDisplay = surveyorList.map((s, idx) => `${idx + 1}. ${s}`).join('<br>');
    }

    // ── Header / Identitas ────────────────────────────────────────────────
    let html = `
<style>
  .rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .rpt-table th, .rpt-table td { border: 1px solid #000; padding: 6px; }
  .rpt-table th { text-align: center; }
  .page-break { page-break-after: always; margin-bottom: 24px; }
  ol { list-style-type: decimal; padding-left: 20px; }
  ul { list-style-type: disc; padding-left: 20px; }
  li { margin-bottom: 4px; }
  img { max-width: 100%; height: auto; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
</style>
<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; line-height: 1.5;">

  <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 16px;">
    <h1 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0;">
      Laporan Hasil Inspeksi K3 Proteksi Kebakaran
    </h1>
    <p style="font-size: 12pt; margin: 4px 0 0;">Universitas Airlangga</p>
  </div>

  <table class="rpt-table" style="margin-bottom: 20px;">
    <tr>
      <td style="${tdBase} width: 30%; font-weight: bold;">Tanggal Inspeksi</td>
      <td style="${tdBase}">${formatDate(data.tanggal)}</td>
    </tr>
    <tr>
      <td style="${tdBase} font-weight: bold;">Surveyor / Tim Pemeriksa</td>
      <td style="${tdBase}">${surveyorDisplay}</td>
    </tr>
    <tr>
      <td style="${tdBase} font-weight: bold;">Fakultas / Unit Kerja</td>
      <td style="${tdBase}">${data.fakultas || '-'}</td>
    </tr>
    <tr>
      <td style="${tdBase} font-weight: bold;">Lokasi / Gedung</td>
      <td style="${tdBase}">${data.lokasi || '-'}</td>
    </tr>
  </table>`;

    // ── I. Proteksi Aktif — APAR ─────────────────────────────────────────
    html += `
  <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 3px; margin: 20px 0 12px;">
    I. Proteksi Aktif
  </h2>`;

    const aparUnits = data.aparUnits || [];
    if (aparUnits.length === 0) {
        html += buildEmptyRow('APAR (Alat Pemadam Api Ringan)', 'APAR');
    } else {
        aparUnits.forEach((u) => {
            const checklist = u.checklist || [];
            const sesuaiCount = checklist.filter(c => c.status === 'sesuai').length;
            const total = checklist.length;
            const pct = total > 0 ? Math.round((sesuaiCount / total) * 100) + '%' : '0%';

            html += `
  <div class="page-break">
    <table class="rpt-table">
      <tr>
        <td colspan="2" style="${tdBase} text-align: center; font-weight: bold;">FORM HASIL INSPEKSI APAR</td>
      </tr>
      <tr>
        <td style="${tdBase} width: 35%; font-weight: bold;">Nomor APAR</td>
        <td style="${tdBase}">${u.nomor || 'N/A'}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Lokasi</td>
        <td style="${tdBase}">${u.lokasi || '-'}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Media APAR</td>
        <td style="${tdBase}">${u.media || 'N/A'}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Kapasitas</td>
        <td style="${tdBase}">${u.kapasitas ? u.kapasitas + ' kg' : 'N/A'}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Tahun Produksi Tabung APAR</td>
        <td style="${tdBase}">${u.tglProduksi || 'N/A'}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Tanggal Inspeksi</td>
        <td style="${tdBase}">${formatDate(data.tanggal)}</td>
      </tr>
      <tr>
        <td style="${tdBase} font-weight: bold;">Tanggal Kadaluarsa</td>
        <td style="${tdBase}">${u.tglKadaluarsa || 'N/A'}</td>
      </tr>
    </table>

    <table class="rpt-table">
      <tr>
        <th style="${tdBase} width: 5%;" rowspan="2">No</th>
        <th style="${tdBase} width: 35%;" rowspan="2">Bagian</th>
        <th style="${tdBase}" colspan="2">Kesesuaian APAR</th>
        <th style="${tdBase} width: 28%;" rowspan="2">Keterangan</th>
        <th style="${tdBase} width: 14%;" rowspan="2">Dokumentasi</th>
      </tr>
      <tr>
        <th style="${tdBase} width: 9%;">Sesuai</th>
        <th style="${tdBase} width: 9%;">Tidak Sesuai</th>
      </tr>`;

            checklist.forEach((item, idx) => {
                const isSesuai = item.status === 'sesuai';
                const isTidak = item.status === 'tidak_sesuai';
                const fotoHtml = buildFotoHtml(item, data.photoDataMap);
                html += `
      <tr>
        <td style="${tdBase} text-align: center;">${idx + 1}.</td>
        <td style="${tdBase}">${item.label || '-'}</td>
        <td style="${tdBase} text-align: center;">${isSesuai ? '✓' : ''}</td>
        <td style="${tdBase} text-align: center;">${isTidak ? '✓' : ''}</td>
        <td style="${tdBase}">${item.keterangan || '-'}</td>
        <td style="${tdBase} text-align: center;">${fotoHtml}</td>
      </tr>`;
            });

            html += `
      <tr>
        <td colspan="2" style="${tdBase} font-weight: bold;">Persentase Kesesuaian Pemasangan APAR</td>
        <td colspan="4" style="${tdBase} font-weight: bold;">${pct} (${sesuaiCount} dari ${total} item sesuai)</td>
      </tr>
    </table>
  </div>`;
        });
    }

    // Rekomendasi APAR
    const rekApar = (data.rekomendasi?.apar || '').replace(/<p[^>]*><br\s*\/?><\/p>/gi, '').trim();
    if (rekApar) {
        html += `
  <div style="margin: 0 0 20px;">
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 8px;">
      Rekomendasi &amp; Tindak Lanjut Proteksi Aktif (APAR):
    </p>
    <div style="padding-left: 16px; line-height: 1.6;">${rekApar}</div>
  </div>`;
    }

    // ── II. Proteksi Pasif ───────────────────────────────────────────────
    html += `
  <h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 3px; margin: 20px 0 12px; page-break-before: always;">
    II. Proteksi Pasif
  </h2>`;

    html += buildPassiveSection('Fire Alarm', data.fireAlarmUnits, 'Fire Alarm', data.photoDataMap);
    html += buildPassiveSection('Jalur Evakuasi &amp; Petunjuk Arah', data.jalurEvakuasiUnits, 'Jalur Evakuasi', data.photoDataMap);
    html += buildPassiveSection('Pintu Darurat', data.pintuDaruratUnits, 'Pintu Darurat', data.photoDataMap);
    html += buildPassiveSection('Tangga Darurat', data.tanggaDaruratUnits, 'Tangga Darurat', data.photoDataMap);

    // Rekomendasi Proteksi Pasif (Gabungan)
    const rekPasif = (data.rekomendasi?.pasif || '').replace(/<p[^>]*><br\s*\/?><\/p>/gi, '').trim();
    if (rekPasif) {
        html += `
  <div style="margin: 12px 0 20px;">
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 8px;">
      Rekomendasi &amp; Tindak Lanjut Proteksi Pasif:
    </p>
    <div style="padding-left: 16px; line-height: 1.6;">${rekPasif}</div>
  </div>`;
    }


    html += `\n</div>`;


    return html;
}

// ─── Helper: build passive section table ──────────────────────────────────

function buildPassiveSection(title, units, emptyLabel, photoDataMap) {
    const tdBase = `border: 1px solid #000; padding: 6px;`;
    let html = `
  <h3 style="font-size: 12pt; font-weight: bold; margin: 14px 0 6px; border-bottom: 1px solid #000; padding-bottom: 2px;">
    ${title}
  </h3>`;

    if (!units || units.length === 0) {
        return html + buildEmptyRow(title, emptyLabel);
    }

    units.forEach((u) => {
        const checklist = u.checklist || [];
        const sesuaiCount = checklist.filter(c => c.status === 'sesuai').length;
        const total = checklist.length;
        const pct = total > 0 ? Math.round((sesuaiCount / total) * 100) + '%' : '0%';

        html += `
  <div style="margin-bottom: 14px;">
    <p style="font-weight: bold; margin: 0 0 6px;">Unit #${u.id} — Lokasi: ${u.lokasi || '-'}</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
      <tr>
        <th style="${tdBase} width: 5%; text-align: center;" rowspan="2">No</th>
        <th style="${tdBase} width: 40%;" rowspan="2">Bagian</th>
        <th style="${tdBase}" colspan="2">Kesesuaian</th>
        <th style="${tdBase} width: 25%;" rowspan="2">Keterangan</th>
        <th style="${tdBase} width: 12%;" rowspan="2">Dokumentasi</th>
      </tr>
      <tr>
        <th style="${tdBase} width: 9%; text-align: center;">Sesuai</th>
        <th style="${tdBase} width: 9%; text-align: center;">Tidak Sesuai</th>
      </tr>`;

        checklist.forEach((item, idx) => {
            const isSesuai = item.status === 'sesuai';
            const isTidak = item.status === 'tidak_sesuai';
            const fotoHtml = buildFotoHtml(item, photoDataMap);
            html += `
      <tr>
        <td style="${tdBase} text-align: center;">${idx + 1}.</td>
        <td style="${tdBase}">${item.label || '-'}</td>
        <td style="${tdBase} text-align: center;">${isSesuai ? '✓' : ''}</td>
        <td style="${tdBase} text-align: center;">${isTidak ? '✓' : ''}</td>
        <td style="${tdBase}">${item.keterangan || '-'}</td>
        <td style="${tdBase} text-align: center;">${fotoHtml}</td>
      </tr>`;
        });

        html += `
      <tr>
        <td colspan="2" style="${tdBase} font-weight: bold;">Persentase Kesesuaian</td>
        <td colspan="4" style="${tdBase} font-weight: bold;">${pct} (${sesuaiCount} dari ${total} item sesuai)</td>
      </tr>
    </table>
  </div>`;
    });

    return html;
}

// ─── Helper: empty row when no unit data ──────────────────────────────────

function buildEmptyRow(displayTitle, emptyLabel) {
    const tdBase = `border: 1px solid #000; padding: 6px;`;
    return `
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
    <tr>
      <th style="${tdBase} width: 40%;">Fasilitas Proteksi</th>
      <th style="${tdBase} width: 18%; text-align: center;">Status</th>
      <th style="${tdBase}">Keterangan</th>
    </tr>
    <tr>
      <td style="${tdBase} font-weight: bold;">${displayTitle}</td>
      <td style="${tdBase} text-align: center; font-weight: bold;">Tidak Sesuai</td>
      <td style="${tdBase} font-style: italic;">Tidak terdapat ${emptyLabel} di lokasi/gedung ini</td>
    </tr>
  </table>`;
}

// ─── Helper: render foto thumbnails from photoDataMap ─────────────────────

function buildFotoHtml(item, photoDataMap) {
    if (!item.fotoKey) return '';
    
    const sources = [];

    // 1. Try from photoDataMap
    if (photoDataMap && photoDataMap[item.fotoKey]) {
        const raw = photoDataMap[item.fotoKey];
        const arr = Array.isArray(raw) ? raw : [raw];
        arr.forEach(p => {
            if (typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('/'))) {
                sources.push(p);
            } else if (p && typeof p === 'object') {
                if (p.base64) sources.push(p.base64);
                else if (p.url) sources.push(p.url);
            }
        });
    }

    // 2. Try from item.fotoUrls
    if (item.fotoUrls && Array.isArray(item.fotoUrls)) {
        item.fotoUrls.forEach(u => {
            if (typeof u === 'string' && u && !sources.includes(u)) {
                sources.push(u);
            }
        });
    }

    // 3. Fallback to DOM elements for unsaved preview
    if (sources.length === 0) {
        const previewContainer = document.getElementById(`preview_${item.fotoKey}`) || 
                                 document.getElementById(`${item.fotoKey}_preview_container`);
        if (previewContainer) {
            const imgs = previewContainer.querySelectorAll('img');
            imgs.forEach(img => {
                if (img.src && !sources.includes(img.src)) {
                    sources.push(img.src);
                }
            });
        }
    }

    if (sources.length === 0) return '';

    return sources.map(src => 
        `<img src="${src}" alt="Dokumentasi" style="max-height: 80px; max-width: 110px; width: auto; border: 1px solid #999; border-radius: 3px; display: inline-block; margin: 2px; vertical-align: middle;" />`
    ).join('');
}


// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Populate the preview modal with the report HTML.
 */
export function generatePreview() {
    const data = collectFormData();
    const container = document.getElementById('preview-content');
    if (!container) return;
    container.innerHTML = buildReportHTML(data);
}

/**
 * Print / Download PDF using window.print() — identical to reference project.
 * Creates a hidden #print-container, injects full HTML, triggers print dialog.
 * The @media print CSS hides everything else and shows only the print container.
 */
export function downloadPDF() {
    const data = collectFormData();
    const reportHtml = buildReportHTML(data);

    // Inject or reuse print container
    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = reportHtml;

    // Inject global print style once
    if (!document.getElementById('print-style-global')) {
        const style = document.createElement('style');
        style.id = 'print-style-global';
        style.innerHTML = `
            #print-container { display: none; }
            @media print {
                body > *:not(#print-container) { display: none !important; }
                #print-container {
                    display: block !important;
                    width: 100%;
                    background: white;
                    color: black;
                    margin: 0;
                    padding: 0;
                }
                @page {
                    size: A4 portrait;
                    margin: 15mm;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Set PDF filename via document.title (browser uses this as suggested filename)
    const originalTitle = document.title;
    const fakultas = (data.fakultas || 'Inspeksi').replace(/\s+/g, '_');
    const tanggal = data.tanggal || new Date().toISOString().slice(0, 10);
    document.title = `Laporan_Inspeksi_K3_${fakultas}_${tanggal}`;

    // Wait for images to fully load then trigger print
    const images = printContainer.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });

    showToast('Menyiapkan dokumen untuk dicetak...', 'success');

    Promise.all(imagePromises).then(() => {
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 500);
    });
}

