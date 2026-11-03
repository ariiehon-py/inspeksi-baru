// js/legacy.js — Konverter file backup LAMA (format v1 "datar") ke format v2
// Format v1: key datar seperti `apar_1_item_0_status`, `firealarm_1_lokasi`, `aparCount`, `report_id`
// Format v2: object terstruktur `aparUnits[]`, `photoDataMap`, `counters`, `deleted`
import {
    FAKULTAS_LIST, SURVEYORS,
    APAR_CHECKLIST, FIRE_ALARM_CHECKLIST,
    JALUR_EVAKUASI_CHECKLIST, PINTU_DARURAT_CHECKLIST,
    TANGGA_DARURAT_CHECKLIST
} from './constants.js';

// Mapping prefix lama -> struktur baru
const PASSIVE_TYPES = [
    { legacy: 'firealarm',    prefix: 'fa', countKey: 'firealarmCount',    delKey: 'deletedFirealarms',    counterKey: 'fireAlarmCounter',     deletedKey: 'fireAlarms',     arr: 'fireAlarmUnits',     checklist: FIRE_ALARM_CHECKLIST,     label: 'Fire Alarm' },
    { legacy: 'evakuasi',     prefix: 'je', countKey: 'evakuasiCount',     delKey: 'deletedEvakuasis',     counterKey: 'jalurEvakuasiCounter', deletedKey: 'jalurEvakuasis', arr: 'jalurEvakuasiUnits', checklist: JALUR_EVAKUASI_CHECKLIST, label: 'Jalur Evakuasi' },
    { legacy: 'pintudarurat', prefix: 'pd', countKey: 'pintudaruratCount', delKey: 'deletedPintudarurats', counterKey: 'pintuDaruratCounter',  deletedKey: 'pintuDarurats',  arr: 'pintuDaruratUnits',  checklist: PINTU_DARURAT_CHECKLIST,  label: 'Pintu Darurat' },
    { legacy: 'tanggadarurat',prefix: 'td', countKey: 'tanggadaruratCount',delKey: 'deletedTanggaDarurats',counterKey: 'tanggaDaruratCounter', deletedKey: 'tanggaDarurats', arr: 'tanggaDaruratUnits', checklist: TANGGA_DARURAT_CHECKLIST, label: 'Tangga Darurat' },
];

// Deteksi format lama: tidak punya `aparUnits` tapi punya `aparCount` / key `apar_N_...`
export function isLegacyBackup(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (Array.isArray(data.aparUnits)) return false; // format baru (v2)
    return typeof data.aparCount === 'number' || Object.keys(data).some(k => /^apar_\d+_/.test(k));
}

function isBlankHtml(html) {
    if (!html) return true;
    return String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// "Sesuai" / "Tidak Sesuai" (v1) -> "sesuai" / "tidak_sesuai" (v2)
function mapStatus(value) {
    if (!value) return '';
    const s = String(value).trim().toLowerCase().replace(/\s+/g, '_');
    if (s === 'sesuai') return 'sesuai';
    if (s === 'tidak_sesuai' || s === 'tidaksesuai') return 'tidak_sesuai';
    return '';
}

// Nilai `type="month"` (v1) -> `type="date"` (v2)
function mapDate(value, isMonth) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (isMonth && /^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
    return v;
}

// "Fakultas Ekonomi dan Bisnis (FEB)" -> "Fakultas Ekonomi dan Bisnis"
function mapFakultas(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    let hit = FAKULTAS_LIST.find(f => f.toLowerCase() === lower);
    if (hit) return hit;
    const noParen = raw.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
    hit = FAKULTAS_LIST.find(f => f.toLowerCase() === noParen);
    if (hit) return hit;
    hit = FAKULTAS_LIST.find(f => f.toLowerCase().includes(noParen) || noParen.includes(f.toLowerCase()));
    return hit || raw; // kalau tidak ada padanan, pakai nilai apa adanya (option dibuatkan)
}

// Pastikan select fakultas punya option untuk nilai hasil konversi
function ensureFakultasOption(value) {
    if (!value) return;
    const sel = document.getElementById('select-fakultas');
    if (!sel) return;
    const exists = Array.from(sel.options || []).some(o => o.value === value);
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = value;
        sel.appendChild(opt);
    }
}

// "Ngakan Komang Nadha Santika, Daninda Aisya Putri" -> ["Ngakan Komang Nadha Santika", "Daninda Aisya Putri"]
// Aman untuk nama surveyor yang mengandung koma ("Dr. X, S.Sos., M.Kes.")
function mapSurveyors(value) {
    const raw = String(value || '').trim();
    if (!raw) return [];
    const exactAll = SURVEYORS.find(s => s.toLowerCase() === raw.toLowerCase());
    if (exactAll) return [exactAll];

    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const result = [];
    let buf = '';
    for (const part of parts) {
        const cand = buf ? `${buf}, ${part}` : part;
        const candLower = cand.toLowerCase();
        const exact = SURVEYORS.find(s => s.toLowerCase() === candLower);
        const isPrefixOfLonger = SURVEYORS.some(s => s.length > cand.length && s.toLowerCase().startsWith(candLower));
        if (exact && !isPrefixOfLonger) {
            result.push(exact);
            buf = '';
        } else if (SURVEYORS.some(s => s.toLowerCase().startsWith(candLower))) {
            buf = cand; // kemungkinan masih sebagian dari nama panjang
        } else {
            if (buf) { result.push(buf); buf = ''; }
            result.push(part);
        }
    }
    if (buf) result.push(buf);
    return result;
}

// foto v1 (`apar_1_item_0_foto_base64` = array/string base64) -> photoDataMap v2
function toPhotoArray(value) {
    if (!value) return null;
    const arr = Array.isArray(value) ? value : [value];
    const list = arr.filter(x => typeof x === 'string' && x.startsWith('data:image'));
    if (!list.length) return null;
    return list.map((base64, i) => ({
        base64,
        id: Date.now() + i + Math.floor(Math.random() * 100000)
    }));
}

function maxIndexFromKeys(data, regex) {
    let max = 0;
    Object.keys(data).forEach(k => {
        const m = k.match(regex);
        if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    });
    return max;
}

function toNumberSet(value) {
    if (!Array.isArray(value)) return new Set();
    return new Set(value.map(n => parseInt(n, 10)).filter(n => !isNaN(n)));
}

// Gabungkan beberapa bagian teks (kesimpulan + rekomendasi per section) jadi 1 HTML
function buildHtml(parts) {
    const nonBlank = parts.filter(p => !isBlankHtml(p.html));
    if (!nonBlank.length) return '';
    if (nonBlank.length === 1) return nonBlank[0].html;
    return nonBlank.map(p => `<p><strong>${p.label}</strong></p>${p.html}`).join('<br>');
}

export function convertLegacyBackup(data) {
    const photoDataMap = {};
    const deletedApars = toNumberSet(data.deletedApars);

    // ── APAR ────────────────────────────────────────────────
    const aparMax = Math.max(maxIndexFromKeys(data, /^apar_(\d+)_/), data.aparCount || 0);
    const aparUnits = [];
    for (let i = 1; i <= aparMax; i++) {
        const hasData = Object.keys(data).some(k => k.startsWith(`apar_${i}_`));
        if (!hasData || deletedApars.has(i)) continue;

        const unit = {
            id: i,
            nomor: data[`apar_${i}_nomor`] || '',
            lokasi: data[`apar_${i}_lokasi`] || '',
            media: data[`apar_${i}_media`] || '',
            kapasitas: data[`apar_${i}_kapasitas`] || '',
            tglProduksi: mapDate(data[`apar_${i}_produksi`], true),
            tglKadaluarsa: mapDate(data[`apar_${i}_kadaluarsa`], false),
            checklist: [],
        };
        APAR_CHECKLIST.forEach((item, idx) => {
            const legacyIdx = idx;     // v1 0-based
            const newIdx = idx + 1;    // v2 1-based
            const fotoKey = `apar_${i}_item_${newIdx}_foto`;
            const photos = toPhotoArray(data[`apar_${i}_item_${legacyIdx}_foto_base64`]);
            if (photos) photoDataMap[fotoKey] = photos;
            unit.checklist.push({
                label: item.label,
                status: mapStatus(data[`apar_${i}_item_${legacyIdx}_status`]),
                keterangan: data[`apar_${i}_item_${legacyIdx}_keterangan`] || '',
                fotoUrls: [],
                fotoKey,
            });
        });
        unit.score = 0;
        aparUnits.push(unit);
    }

    // ── Proteksi Pasif (Fire Alarm, Evakuasi, Pintu & Tangga Darurat) ──
    const dataV2 = {
        fakultas: mapFakultas(data.fakultas),
        tanggal: mapDate(data.tanggal, false),
        lokasi: data.lokasi || '',
        surveyor: '',
        surveyors: [],
        aparUnits,
        rekomendasi: { apar: '', pasif: '' },
        photoDataMap,
        counters: {},
        deleted: {},
    };
    ensureFakultasOption(dataV2.fakultas);

    const surveyors = mapSurveyors(data.surveyor);
    dataV2.surveyors = surveyors;
    dataV2.surveyor = surveyors.join(', ');

    const counters = {
        aparCounter: Math.max(aparMax, data.aparCount || 0, aparUnits.length),
    };
    const deleted = {
        apars: [...deletedApars],
    };

    PASSIVE_TYPES.forEach(t => {
        const deletedSet = toNumberSet(data[t.delKey]);
        const max = Math.max(maxIndexFromKeys(data, new RegExp(`^${t.legacy}_(\\d+)_`)), data[t.countKey] || 0);
        const units = [];
        for (let i = 1; i <= max; i++) {
            const hasData = Object.keys(data).some(k => k.startsWith(`${t.legacy}_${i}_`));
            if (!hasData || deletedSet.has(i)) continue;

            const unit = { id: i, lokasi: data[`${t.legacy}_${i}_lokasi`] || '', checklist: [] };
            t.checklist.forEach((item, idx) => {
                const legacyIdx = idx;
                const newIdx = idx + 1;
                const fotoKey = `${t.prefix}_${i}_item_${newIdx}_foto`;
                const photos = toPhotoArray(data[`${t.legacy}_${i}_item_${legacyIdx}_foto_base64`]);
                if (photos) photoDataMap[fotoKey] = photos;
                unit.checklist.push({
                    label: item.label,
                    status: mapStatus(data[`${t.legacy}_${i}_item_${legacyIdx}_status`]),
                    keterangan: data[`${t.legacy}_${i}_item_${legacyIdx}_keterangan`] || '',
                    fotoUrls: [],
                    fotoKey,
                });
            });
            unit.score = 0;
            units.push(unit);
        }
        dataV2[t.arr] = units;
        counters[t.counterKey] = Math.max(max, data[t.countKey] || 0, units.length);
        deleted[t.deletedKey] = [...deletedSet];
    });

    dataV2.counters = counters;
    dataV2.deleted = deleted;

    // ── Rekomendasi / Kesimpulan ────────────────────────────
    dataV2.rekomendasi.apar = buildHtml([
        { label: 'Kesimpulan APAR', html: data.kesimpulan_apar },
        { label: 'Rekomendasi APAR', html: data.rekomendasi_apar },
    ]);

    const pasifParts = PASSIVE_TYPES.map(t => ({
        label: t.label,
        html: buildHtml([
            { label: `Kesimpulan ${t.label}`, html: data[`kesimpulan_${t.legacy}`] },
            { label: `Rekomendasi ${t.label}`, html: data[`rekomendasi_${t.legacy}`] },
        ]),
    }));

    // Catatan detector (section lama yang sudah tidak ada di form baru) — jangan sampai hilang
    const detectorNotes = Object.keys(data)
        .filter(k => /^detector_\d+_keterangan$/.test(k))
        .map(k => String(data[k] || '').trim())
        .filter(Boolean);
    pasifParts.push({
        label: 'Detector',
        html: buildHtml([
            { label: 'Kesimpulan Detector', html: data.kesimpulan_detector },
            { label: 'Rekomendasi Detector', html: data.rekomendasi_detector },
            {
                label: 'Catatan Detector',
                html: detectorNotes.length
                    ? `<ul>${detectorNotes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
                    : ''
            },
        ]),
    });
    dataV2.rekomendasi.pasif = buildHtml(pasifParts);

    // report_id lama sengaja TIDAK dijadikan currentDocId agar impor tidak menimpa
    // dokumen lama di server secara tidak sengaja.
    return dataV2;
}
