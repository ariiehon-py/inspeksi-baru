// js/autofill.js — Helper to automatically populate form with test data
import { state } from './state.js';
import { addUnit } from './units.js';
import {
    APAR_CHECKLIST, FIRE_ALARM_CHECKLIST,
    JALUR_EVAKUASI_CHECKLIST, PINTU_DARURAT_CHECKLIST,
    TANGGA_DARURAT_CHECKLIST
} from './constants.js';
import { setSectionRecommendation } from './editor.js';
import { renderPhotoPreviews } from './photos.js';
import { showToast } from './ui.js';
import { showStep } from './navigation.js';

// Sample lightweight SVG data URLs for test inspection photos
const SAMPLE_PHOTO_APAR = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%23dc2626'/%3E%3Ctext x='50%25' y='45%25' fill='white' font-family='sans-serif' font-weight='bold' font-size='14' text-anchor='middle'%3E%F0%9F%A7%AF APAR%3C/text%3E%3Ctext x='50%25' y='70%25' fill='%23fee2e2' font-family='sans-serif' font-size='10' text-anchor='middle'%3EDokumentasi Temuan%3C/text%3E%3C/svg%3E";
const SAMPLE_PHOTO_SIGN = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%2316a34a'/%3E%3Ctext x='50%25' y='45%25' fill='white' font-family='sans-serif' font-weight='bold' font-size='14' text-anchor='middle'%3E%F0%9F%9A%AA EXIT%3C/text%3E%3Ctext x='50%25' y='70%25' fill='%23dcfce7' font-family='sans-serif' font-size='10' text-anchor='middle'%3ERute Evakuasi%3C/text%3E%3C/svg%3E";

export function autoFillTestData() {
    // 1. Data Umum
    const inputTanggal = document.getElementById('input-tanggal');
    if (inputTanggal) inputTanggal.value = new Date().toISOString().split('T')[0];

    // Check 2 surveyors for realistic multi-surveyor test
    const checkboxes = document.querySelectorAll('input[name="surveyor_checkbox"]');
    if (checkboxes.length >= 2) {
        checkboxes[0].checked = true;
        checkboxes[1].checked = true;
    }
    const countEl = document.getElementById('surveyor-selected-count');
    if (countEl) countEl.textContent = '2 surveyor dipilih';


    const selectFakultas = document.getElementById('select-fakultas');
    if (selectFakultas && selectFakultas.options.length > 1) {
        selectFakultas.selectedIndex = 1; // Fakultas Kedokteran
    }

    const inputLokasi = document.getElementById('input-lokasi');
    if (inputLokasi) inputLokasi.value = 'Gedung Utama Lantai 3, Sayap Barat';

    // 2. APAR Unit (if none exists, add 1)
    if (state.aparCounter - state.deletedApars.size === 0) {
        state.aparCounter++;
        addUnit('apar', state.aparCounter, APAR_CHECKLIST);
    }
    const aIdx = state.aparCounter;
    const aparNomor = document.getElementById(`apar_${aIdx}_nomor`);
    if (aparNomor) aparNomor.value = 'APAR-01/GD-A3';
    const aparLokasi = document.getElementById(`apar_${aIdx}_lokasi`);
    if (aparLokasi) aparLokasi.value = 'Koridor Depan Ruang 301';
    const aparMedia = document.getElementById(`apar_${aIdx}_media`);
    if (aparMedia) aparMedia.value = 'Dry Chemical Powder';
    const aparKapasitas = document.getElementById(`apar_${aIdx}_kapasitas`);
    if (aparKapasitas) aparKapasitas.value = '6';
    const aparTglProduksi = document.getElementById(`apar_${aIdx}_tgl_produksi`);
    if (aparTglProduksi) aparTglProduksi.value = '2023';
    const aparTglKadaluarsa = document.getElementById(`apar_${aIdx}_tgl_kadaluarsa`);
    if (aparTglKadaluarsa) aparTglKadaluarsa.value = '2028-12-31';

    // Fill APAR checklist radios and attach sample photo to item 2 and item 5
    APAR_CHECKLIST.forEach((item, idx) => {
        const itemIdx = idx + 1;
        const isSesuai = (itemIdx !== 2 && itemIdx !== 5);
        const val = isSesuai ? 'sesuai' : 'tidak_sesuai';
        const radio = document.querySelector(`input[name="apar_${aIdx}_item_${itemIdx}_status"][value="${val}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ketInput = document.getElementById(`apar_${aIdx}_item_${itemIdx}_keterangan`);
        if (ketInput) {
            ketInput.value = isSesuai ? item.keteranganSesuai : item.keteranganTidakSesuai;
        }

        // Attach sample photo to item 2 & 5
        const photoKey = `apar_${aIdx}_item_${itemIdx}_foto`;
        if (itemIdx === 2 || itemIdx === 5) {
            if (!state.photoDataMap[photoKey]) state.photoDataMap[photoKey] = [];
            state.photoDataMap[photoKey] = [{ base64: SAMPLE_PHOTO_APAR, id: Date.now() + itemIdx }];
            renderPhotoPreviews(photoKey);
        }
    });

    // Set APAR recommendation with embedded photo
    setSectionRecommendation('apar', '<p>1. <strong>Tanda Lokasi APAR</strong> perlu segera dipasang kembali pada ketinggian 125 cm dari lantai.</p><p>2. Tabung APAR perlu dibersihkan secara berkala agar bebas dari debu koridor.</p>');

    // 3. Fire Alarm Unit
    if (state.fireAlarmCounter - state.deletedFireAlarms.size === 0) {
        state.fireAlarmCounter++;
        addUnit('fire-alarm', state.fireAlarmCounter, FIRE_ALARM_CHECKLIST);
    }
    const faIdx = state.fireAlarmCounter;
    const faLokasi = document.getElementById(`fa_${faIdx}_lokasi`);
    if (faLokasi) faLokasi.value = 'Panel Kontrol Utama Lantai 3';
    FIRE_ALARM_CHECKLIST.forEach((item, idx) => {
        const itemIdx = idx + 1;
        const radio = document.querySelector(`input[name="fa_${faIdx}_item_${itemIdx}_status"][value="sesuai"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ket = document.getElementById(`fa_${faIdx}_item_${itemIdx}_keterangan`);
        if (ket) ket.value = item.keteranganSesuai;
    });

    // 4. Jalur Evakuasi Unit
    if (state.jalurEvakuasiCounter - state.deletedJalurEvakuasis.size === 0) {
        state.jalurEvakuasiCounter++;
        addUnit('jalur-evakuasi', state.jalurEvakuasiCounter, JALUR_EVAKUASI_CHECKLIST);
    }
    const jeIdx = state.jalurEvakuasiCounter;
    const jeLokasi = document.getElementById(`je_${jeIdx}_lokasi`);
    if (jeLokasi) jeLokasi.value = 'Koridor Utama dan Rute Tangga';
    JALUR_EVAKUASI_CHECKLIST.forEach((item, idx) => {
        const itemIdx = idx + 1;
        const radio = document.querySelector(`input[name="je_${jeIdx}_item_${itemIdx}_status"][value="sesuai"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ket = document.getElementById(`je_${jeIdx}_item_${itemIdx}_keterangan`);
        if (ket) ket.value = item.keteranganSesuai;

        // Sample photo for Jalur Evakuasi item 2
        if (itemIdx === 2) {
            const photoKey = `je_${jeIdx}_item_${itemIdx}_foto`;
            if (!state.photoDataMap[photoKey]) state.photoDataMap[photoKey] = [];
            state.photoDataMap[photoKey] = [{ base64: SAMPLE_PHOTO_SIGN, id: Date.now() + 99 }];
            renderPhotoPreviews(photoKey);
        }
    });

    // 5. Pintu Darurat Unit
    if (state.pintuDaruratCounter - state.deletedPintuDarurats.size === 0) {
        state.pintuDaruratCounter++;
        addUnit('pintu-darurat', state.pintuDaruratCounter, PINTU_DARURAT_CHECKLIST);
    }
    const pdIdx = state.pintuDaruratCounter;
    const pdLokasi = document.getElementById(`pd_${pdIdx}_lokasi`);
    if (pdLokasi) pdLokasi.value = 'Pintu Darurat Sisi Timur Lt. 3';
    PINTU_DARURAT_CHECKLIST.forEach((item, idx) => {
        const itemIdx = idx + 1;
        const radio = document.querySelector(`input[name="pd_${pdIdx}_item_${itemIdx}_status"][value="sesuai"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ket = document.getElementById(`pd_${pdIdx}_item_${itemIdx}_keterangan`);
        if (ket) ket.value = item.keteranganSesuai;
    });

    // 6. Tangga Darurat Unit
    if (state.tanggaDaruratCounter - state.deletedTanggaDarurats.size === 0) {
        state.tanggaDaruratCounter++;
        addUnit('tangga-darurat', state.tanggaDaruratCounter, TANGGA_DARURAT_CHECKLIST);
    }
    const tdIdx = state.tanggaDaruratCounter;
    const tdLokasi = document.getElementById(`td_${tdIdx}_lokasi`);
    if (tdLokasi) tdLokasi.value = 'Tangga Darurat Utama Gedung A';
    TANGGA_DARURAT_CHECKLIST.forEach((item, idx) => {
        const itemIdx = idx + 1;
        const radio = document.querySelector(`input[name="td_${tdIdx}_item_${itemIdx}_status"][value="sesuai"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ket = document.getElementById(`td_${tdIdx}_item_${itemIdx}_keterangan`);
        if (ket) ket.value = item.keteranganSesuai;
    });

    // Set Proteksi Pasif recommendation (unified for Fire Alarm, Jalur Evakuasi, Pintu & Tangga Darurat)
    setSectionRecommendation('pasif', '<p>1. <strong>Fire Alarm:</strong> Panel alarm dalam kondisi normal. Lakukan pengetesan berkala (alarm bell test) setiap 3 bulan sekali.</p><p>2. <strong>Jalur Evakuasi & Pintu Darurat:</strong> Rambu EXIT pada pintu darurat menyala terang. Handle pintu berfungsi normal tanpa hambatan.</p><p>3. <strong>Tangga Darurat:</strong> Area tangga darurat bersih dan bebas dari tumpukan barang yang menghalangi pergerakan evakuasi.</p>');

    // Go to Review step directly so user can immediately preview
    showStep('review');

    showToast('✨ Form & foto uji coba berhasil diisi! Silakan klik Preview / Download PDF.', 'success');
}
