// js/form.js — Form Data Operations
import { state, resetState, generateProjectNumber } from './state.js';
import {
    APAR_CHECKLIST, FIRE_ALARM_CHECKLIST,
    JALUR_EVAKUASI_CHECKLIST, PINTU_DARURAT_CHECKLIST,
    TANGGA_DARURAT_CHECKLIST
} from './constants.js';
import { getChecklistData, calculateScore } from './checklist.js';
import { addUnit } from './units.js';
import { renderPhotoPreviews } from './photos.js';
import { showStep, showView } from './navigation.js';
import { getSectionRecommendation, setSectionRecommendation } from './editor.js';

export function collectFormData() {
    // Collect all checked surveyors
    const surveyorCheckboxes = document.querySelectorAll('input[name="surveyor_checkbox"]:checked');
    const surveyors = Array.from(surveyorCheckboxes).map(cb => cb.value.trim()).filter(Boolean);
    const surveyorString = surveyors.join(', ');

    const data = {
        projectNumber: state.currentProjectNumber || document.getElementById('input-project-number')?.value || document.getElementById('project-number-display')?.textContent || '',
        tanggal: document.getElementById('input-tanggal')?.value || '',
        surveyor: surveyorString,
        surveyors: surveyors,
        fakultas: document.getElementById('select-fakultas')?.value || '',
        lokasi: document.getElementById('input-lokasi')?.value || '',
        aparUnits: [],
        fireAlarmUnits: [],
        jalurEvakuasiUnits: [],
        pintuDaruratUnits: [],
        tanggaDaruratUnits: [],
        rekomendasi: {
            apar: getSectionRecommendation('apar'),
            pasif: getSectionRecommendation('pasif'),
        },
        photoDataMap: state.photoDataMap || {},
    };
    
    // Collect APAR — pakai urutan DOM (hasil reorder di panel) biar sesuai yang diatur user
    const aparContainer = document.getElementById('apar-units-container');
    if (aparContainer) {
        const cards = Array.from(aparContainer.querySelectorAll('.unit-card'));
        for (const card of cards) {
            const i = parseInt(card.dataset.unitId || card.id.split('_')[2] || '0', 10);
            if (!i || state.deletedApars.has(i)) continue;
            const prefix = `apar_${i}`;
            const unit = {
                id: i,
                nomor: document.getElementById(`${prefix}_nomor`)?.value || '',
                lokasi: document.getElementById(`${prefix}_lokasi`)?.value || '',
                media: document.getElementById(`${prefix}_media`)?.value || '',
                kapasitas: document.getElementById(`${prefix}_kapasitas`)?.value || '',
                tglProduksi: document.getElementById(`${prefix}_tgl_produksi`)?.value || '',
                tglKadaluarsa: document.getElementById(`${prefix}_tgl_kadaluarsa`)?.value || '',
                checklist: [],
            };
            APAR_CHECKLIST.forEach((item, idx) => {
                const itemIdx = idx + 1;
                const radio = document.querySelector(`input[name="${prefix}_item_${itemIdx}_status"]:checked`);
                unit.checklist.push({
                    label: item.label,
                    status: radio ? radio.value : '',
                    keterangan: document.getElementById(`${prefix}_item_${itemIdx}_keterangan`)?.value || '',
                    fotoUrls: [],
                    fotoKey: `${prefix}_item_${itemIdx}_foto`
                });
            });
            unit.score = calculateScore('apar', i, 'apar');
            data.aparUnits.push(unit);
        }
    } else {
        // fallback lama kalau container tidak ada
        for (let i = 1; i <= state.aparCounter; i++) {
            if (state.deletedApars.has(i)) continue;
            const prefix = `apar_${i}`;
            const unit = {
                id: i,
                nomor: document.getElementById(`${prefix}_nomor`)?.value || '',
                lokasi: document.getElementById(`${prefix}_lokasi`)?.value || '',
                media: document.getElementById(`${prefix}_media`)?.value || '',
                kapasitas: document.getElementById(`${prefix}_kapasitas`)?.value || '',
                tglProduksi: document.getElementById(`${prefix}_tgl_produksi`)?.value || '',
                tglKadaluarsa: document.getElementById(`${prefix}_tgl_kadaluarsa`)?.value || '',
                checklist: [],
            };
            APAR_CHECKLIST.forEach((item, idx) => {
                const itemIdx = idx + 1;
                const radio = document.querySelector(`input[name="${prefix}_item_${itemIdx}_status"]:checked`);
                unit.checklist.push({
                    label: item.label,
                    status: radio ? radio.value : '',
                    keterangan: document.getElementById(`${prefix}_item_${itemIdx}_keterangan`)?.value || '',
                    fotoUrls: [],
                    fotoKey: `${prefix}_item_${itemIdx}_foto`
                });
            });
            unit.score = calculateScore('apar', i, 'apar');
            data.aparUnits.push(unit);
        }
    }
    
    // Collect Others (Helper)
    const collectPassive = (counter, deletedSet, type, arrName, typePrefix) => {
        for (let i = 1; i <= counter; i++) {
            if (deletedSet.has(i)) continue;
            const prefix = `${typePrefix}_${i}`;
            const unit = {
                id: i,
                lokasi: document.getElementById(`${prefix}_lokasi`)?.value || '',
                checklist: [],
            };
            const checklistData = getChecklistData(type);
            checklistData.forEach((item, idx) => {
                const itemIdx = idx + 1;
                const radio = document.querySelector(`input[name="${prefix}_item_${itemIdx}_status"]:checked`);
                unit.checklist.push({
                    label: item.label,
                    status: radio ? radio.value : '',
                    keterangan: document.getElementById(`${prefix}_item_${itemIdx}_keterangan`)?.value || '',
                    fotoUrls: [],
                    fotoKey: `${prefix}_item_${itemIdx}_foto`
                });
            });
            unit.score = calculateScore(typePrefix, i, type);
            data[arrName].push(unit);
        }
    };

    collectPassive(state.fireAlarmCounter, state.deletedFireAlarms, 'fire-alarm', 'fireAlarmUnits', 'fa');
    collectPassive(state.jalurEvakuasiCounter, state.deletedJalurEvakuasis, 'jalur-evakuasi', 'jalurEvakuasiUnits', 'je');
    collectPassive(state.pintuDaruratCounter, state.deletedPintuDarurats, 'pintu-darurat', 'pintuDaruratUnits', 'pd');
    collectPassive(state.tanggaDaruratCounter, state.deletedTanggaDarurats, 'tangga-darurat', 'tanggaDaruratUnits', 'td');
    
    return data;
}

export function resetForm() {
    resetState();
    
    document.getElementById('input-tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('select-fakultas').value = '';
    document.getElementById('input-lokasi').value = '';
    // Tampilkan nomor project baru yang sudah di-generate di resetState()
    const projDisplay = document.getElementById('project-number-display');
    if (projDisplay) projDisplay.textContent = state.currentProjectNumber || '';
    const projInput = document.getElementById('input-project-number');
    if (projInput) projInput.value = state.currentProjectNumber || '';
    
    // Uncheck all surveyor checkboxes & reset count
    document.querySelectorAll('input[name="surveyor_checkbox"]').forEach(cb => cb.checked = false);
    const countEl = document.getElementById('surveyor-selected-count');
    if (countEl) countEl.textContent = '0 surveyor dipilih';
    
    document.getElementById('apar-units-container').innerHTML = '';
    document.getElementById('fire-alarm-units-container').innerHTML = '';
    document.getElementById('jalur-evakuasi-units-container').innerHTML = '';
    document.getElementById('pintu-darurat-units-container').innerHTML = '';
    document.getElementById('tangga-darurat-units-container').innerHTML = '';

    setSectionRecommendation('apar', '');
    setSectionRecommendation('pasif', '');
    
    showStep('data-umum');
}

export function validateForm() {
    const errors = [];
    const data = collectFormData();

    if (!data.tanggal) errors.push('Tanggal inspeksi harus diisi');
    if (!data.surveyors || data.surveyors.length === 0) {
        if (!data.surveyor) errors.push('Minimal satu nama surveyor harus dipilih');
    }
    if (!data.fakultas) errors.push('Fakultas harus dipilih');
    if (!data.lokasi) errors.push('Lokasi umum harus diisi');
    
    const hasUnits = (state.aparCounter - state.deletedApars.size) > 0 || 
                     (state.fireAlarmCounter - state.deletedFireAlarms.size) > 0 ||
                     (state.jalurEvakuasiCounter - state.deletedJalurEvakuasis.size) > 0 ||
                     (state.pintuDaruratCounter - state.deletedPintuDarurats.size) > 0 ||
                     (state.tanggaDaruratCounter - state.deletedTanggaDarurats.size) > 0;
    
    if (!hasUnits) errors.push('Minimal satu unit inspeksi harus ditambahkan');
    
    return errors;
}

export function populateReviewSummary() {
    const container = document.getElementById('review-summary');
    if (!container) return;
    const data = collectFormData();
    // Pastikan projectNumber tampil di ringkasan
    if (!data.projectNumber) data.projectNumber = state.currentProjectNumber || '';
    
    let html = `<div class="bg-white p-4 rounded border border-gray-200 mb-4">
        <h3 class="font-bold text-base mb-2 text-gray-900">Informasi Umum</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <p><strong>No. Project:</strong> <span class="font-mono font-bold text-[#025511]">${data.projectNumber || '-'}</span></p>
            <p><strong>Tanggal:</strong> ${data.tanggal || '-'}</p>
            <p><strong>Fakultas:</strong> ${data.fakultas || '-'}</p>
            <p><strong>Lokasi:</strong> ${data.lokasi || '-'}</p>
            <p class="sm:col-span-2"><strong>Surveyor (${data.surveyors?.length || 0}):</strong> ${(data.surveyors && data.surveyors.length > 0) ? data.surveyors.join('; ') : (data.surveyor || '-')}</p>
        </div>
    </div>`;

    const addUnitSummary = (title, units) => {
        let res = `<div class="bg-white p-4 rounded border border-gray-200 mb-4"><h3 class="font-bold text-base mb-2 text-gray-900">${title}</h3>`;
        if (units && units.length > 0) {
            units.forEach(u => {
                res += `<div class="border-b border-gray-100 pb-2 mb-2 text-xs">
                    <p><strong>Unit #${u.id}</strong> - Lokasi: ${u.lokasi || '-'}</p>
                    <p>Score: <span class="text-green-700 font-bold">${u.score}%</span></p>
                </div>`;
            });
        } else {
            res += `<p class="text-xs text-red-600 italic">Tidak terdapat ${title}</p>`;
        }
        res += `</div>`;
        return res;
    };

    html += addUnitSummary('APAR (Proteksi Aktif)', data.aparUnits);
    if (data.rekomendasi?.apar) {
        html += `<div class="bg-white p-4 rounded border border-gray-200 mb-4 text-xs">
            <strong class="text-gray-900"><i class="fa-solid fa-comment-dots mr-1 text-[#025511]"></i> Rekomendasi Proteksi Aktif (APAR):</strong>
            <div class="mt-2 p-2.5 bg-gray-50 rounded border border-gray-200 text-gray-800 overflow-auto max-h-48">${data.rekomendasi.apar}</div>
        </div>`;
    }

    html += `<div class="my-4 border-t-2 border-gray-300 pt-3"><h3 class="font-black text-sm uppercase tracking-wider text-gray-700 mb-3">Proteksi Pasif</h3></div>`;
    html += addUnitSummary('Fire Alarm', data.fireAlarmUnits);
    html += addUnitSummary('Jalur Evakuasi', data.jalurEvakuasiUnits);
    html += addUnitSummary('Pintu Darurat', data.pintuDaruratUnits);
    html += addUnitSummary('Tangga Darurat', data.tanggaDaruratUnits);

    if (data.rekomendasi?.pasif) {
        html += `<div class="bg-white p-4 rounded border border-gray-200 mb-4 text-xs">
            <strong class="text-gray-900"><i class="fa-solid fa-comment-dots mr-1 text-[#025511]"></i> Rekomendasi Proteksi Pasif (Alarm, Evakuasi, Pintu & Tangga Darurat):</strong>
            <div class="mt-2 p-2.5 bg-gray-50 rounded border border-gray-200 text-gray-800 overflow-auto max-h-48">${data.rekomendasi.pasif}</div>
        </div>`;
    }

    container.innerHTML = html;
}

export function restoreFormFromData(data) {
    // Preserve currentDocId & projectNumber across resetForm() which would otherwise clear/regenerate
    const preservedDocId = state.currentDocId;
    const preservedProjectNumber = data.projectNumber || state.currentProjectNumber;
    resetForm();
    if (preservedDocId) state.currentDocId = preservedDocId;
    // Jika data sudah punya nomor project, pakai itu; kalau belum ada, generate baru dan akan dimigrasi saat save
    if (data.projectNumber) {
        state.currentProjectNumber = data.projectNumber;
    } else if (preservedProjectNumber) {
        state.currentProjectNumber = preservedProjectNumber;
    } else {
        state.currentProjectNumber = generateProjectNumber();
    }
    const projDisplay = document.getElementById('project-number-display');
    if (projDisplay) projDisplay.textContent = state.currentProjectNumber;
    const projInput = document.getElementById('input-project-number');
    if (projInput) projInput.value = state.currentProjectNumber;
    
    document.getElementById('input-tanggal').value = data.tanggal || '';
    document.getElementById('select-fakultas').value = data.fakultas || '';
    document.getElementById('input-lokasi').value = data.lokasi || '';
    
    // Restore multiple surveyors
    let surveyorsToCheck = [];
    if (Array.isArray(data.surveyors) && data.surveyors.length > 0) {
        surveyorsToCheck = data.surveyors;
    } else if (typeof data.surveyor === 'string' && data.surveyor.trim() !== '') {
        surveyorsToCheck = data.surveyor.split(/,\s*|\n|;/).map(s => s.trim()).filter(Boolean);
    }

    surveyorsToCheck.forEach(sName => {
        let cb = document.querySelector(`input[name="surveyor_checkbox"][value="${sName}"]`);
        if (cb) {
            cb.checked = true;
        } else {
            // Unlisted surveyor: add to list dynamically
            const grid = document.getElementById('surveyor-checkbox-grid') || document.querySelector('#surveyor-checkboxes-container .grid');
            if (grid) {
                const label = document.createElement('label');
                label.className = 'flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer border border-[#025511] bg-green-50/30 text-xs text-gray-900 transition-colors';
                label.innerHTML = `
                    <input type="checkbox" name="surveyor_checkbox" value="${sName}" checked class="surveyor-checkbox accent-[#025511] w-4 h-4 shrink-0">
                    <span class="truncate font-semibold">${sName} (Kustom)</span>
                `;
                grid.prepend(label);
            }
        }
    });

    const countEl = document.getElementById('surveyor-selected-count');
    if (countEl) {
        const checked = document.querySelectorAll('input[name="surveyor_checkbox"]:checked');
        countEl.textContent = `${checked.length} surveyor dipilih`;
    }
    
    if(data.counters) {
        state.aparCounter = data.counters.aparCounter;
        state.fireAlarmCounter = data.counters.fireAlarmCounter;
        state.jalurEvakuasiCounter = data.counters.jalurEvakuasiCounter;
        state.pintuDaruratCounter = data.counters.pintuDaruratCounter;
        state.tanggaDaruratCounter = data.counters.tanggaDaruratCounter;
    }
    
    if(data.deleted) {
        state.deletedApars = new Set(data.deleted.apars);
        state.deletedFireAlarms = new Set(data.deleted.fireAlarms);
        state.deletedJalurEvakuasis = new Set(data.deleted.jalurEvakuasis);
        state.deletedPintuDarurats = new Set(data.deleted.pintuDarurats);
        state.deletedTanggaDarurats = new Set(data.deleted.tanggaDarurats);
    }
    
    if(data.photoDataMap) {
        state.photoDataMap = data.photoDataMap;
    }

    // Recreate APARs
    data.aparUnits?.forEach(u => {
        addUnit('apar', u.id, APAR_CHECKLIST);
        const prefix = `apar_${u.id}`;
        document.getElementById(`${prefix}_nomor`).value = u.nomor || '';
        document.getElementById(`${prefix}_lokasi`).value = u.lokasi || '';
        document.getElementById(`${prefix}_media`).value = u.media || '';
        document.getElementById(`${prefix}_kapasitas`).value = u.kapasitas || '';
        document.getElementById(`${prefix}_tgl_produksi`).value = u.tglProduksi || '';
        document.getElementById(`${prefix}_tgl_kadaluarsa`).value = u.tglKadaluarsa || '';
        
        u.checklist?.forEach((item, idx) => {
            const itemIdx = idx + 1;
            if(item.status) {
                const radio = document.querySelector(`input[name="${prefix}_item_${itemIdx}_status"][value="${item.status}"]`);
                if(radio) radio.checked = true;
            }
            document.getElementById(`${prefix}_item_${itemIdx}_keterangan`).value = item.keterangan || '';
            renderPhotoPreviews(`${prefix}_item_${itemIdx}_foto`);
        });
        document.getElementById(`${prefix}_score`).innerText = calculateScore('apar', u.id, 'apar');
    });

    // Recreate others helper
    const restorePassive = (units, type, typePrefix) => {
        units?.forEach(u => {
            addUnit(type, u.id, getChecklistData(type));
            const prefix = `${typePrefix}_${u.id}`;
            document.getElementById(`${prefix}_lokasi`).value = u.lokasi || '';
            
            u.checklist?.forEach((item, idx) => {
                const itemIdx = idx + 1;
                if(item.status) {
                    const radio = document.querySelector(`input[name="${prefix}_item_${itemIdx}_status"][value="${item.status}"]`);
                    if(radio) radio.checked = true;
                }
                document.getElementById(`${prefix}_item_${itemIdx}_keterangan`).value = item.keterangan || '';
                renderPhotoPreviews(`${prefix}_item_${itemIdx}_foto`);
            });
            document.getElementById(`${prefix}_score`).innerText = calculateScore(typePrefix, u.id, type);
        });
    };

    restorePassive(data.fireAlarmUnits, 'fire-alarm', 'fa');
    restorePassive(data.jalurEvakuasiUnits, 'jalur-evakuasi', 'je');
    restorePassive(data.pintuDaruratUnits, 'pintu-darurat', 'pd');
    restorePassive(data.tanggaDaruratUnits, 'tangga-darurat', 'td');

    // Restore rich text recommendations (APAR & Proteksi Pasif)
    if (data.rekomendasi) {
        setSectionRecommendation('apar', data.rekomendasi.apar || '');
        setSectionRecommendation('pasif', data.rekomendasi.pasif || data.rekomendasi.tanggaDarurat || '');
    }

    showView('form');
    // refresh APAR navigator setelah restore agar urutan sesuai data
    setTimeout(() => window.updateAparNav?.(), 200);
}
