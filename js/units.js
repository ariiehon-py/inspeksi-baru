// js/units.js — Dynamic Inspection Unit Management
import { state } from './state.js';
import {
    APAR_CHECKLIST, FIRE_ALARM_CHECKLIST,
    JALUR_EVAKUASI_CHECKLIST, PINTU_DARURAT_CHECKLIST,
    TANGGA_DARURAT_CHECKLIST
} from './constants.js';
import { handlePhotoUpload } from './photos.js';

export function bindAddUnitButtons() {
    document.getElementById('btn-add-apar')?.addEventListener('click', () => {
        state.aparCounter++;
        addUnit('apar', state.aparCounter, APAR_CHECKLIST);
    });
    document.getElementById('btn-add-fire-alarm')?.addEventListener('click', () => {
        state.fireAlarmCounter++;
        addUnit('fire-alarm', state.fireAlarmCounter, FIRE_ALARM_CHECKLIST);
    });
    document.getElementById('btn-add-jalur-evakuasi')?.addEventListener('click', () => {
        state.jalurEvakuasiCounter++;
        addUnit('jalur-evakuasi', state.jalurEvakuasiCounter, JALUR_EVAKUASI_CHECKLIST);
    });
    document.getElementById('btn-add-pintu-darurat')?.addEventListener('click', () => {
        state.pintuDaruratCounter++;
        addUnit('pintu-darurat', state.pintuDaruratCounter, PINTU_DARURAT_CHECKLIST);
    });
    document.getElementById('btn-add-tangga-darurat')?.addEventListener('click', () => {
        state.tanggaDaruratCounter++;
        addUnit('tangga-darurat', state.tanggaDaruratCounter, TANGGA_DARURAT_CHECKLIST);
    });
}

export function removeUnit(type, idx) {
    const card = document.getElementById(`${type}_card_${idx}`);
    if (card) {
        card.remove();
        if (type === 'apar') state.deletedApars.add(idx);
        else if (type === 'fire-alarm') state.deletedFireAlarms.add(idx);
        else if (type === 'jalur-evakuasi') state.deletedJalurEvakuasis.add(idx);
        else if (type === 'pintu-darurat') state.deletedPintuDarurats.add(idx);
        else if (type === 'tangga-darurat') state.deletedTanggaDarurats.add(idx);
    }
}

export function addUnit(type, idx, checklist) {
    const container = document.getElementById(`${type}-units-container`);
    if (!container) return;

    let typePrefix = type === 'fire-alarm' ? 'fa' : 
                     type === 'jalur-evakuasi' ? 'je' : 
                     type === 'pintu-darurat' ? 'pd' : 
                     type === 'tangga-darurat' ? 'td' : 'apar';
    let prefix = `${typePrefix}_${idx}`;
    const card = document.createElement('div');
    card.id = `${type}_card_${idx}`;
    card.className = 'bg-white rounded border border-gray-200 p-4 sm:p-5 mb-4 unit-card';

    let unitTitle = type.replace('-', ' ').toUpperCase() + ` #${idx}`;

    let extraFields = '';
    if (type === 'apar') {
        extraFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nomor APAR</label>
                    <input type="text" id="${prefix}_nomor" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Lokasi Spesifik</label>
                    <input type="text" id="${prefix}_lokasi" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Media</label>
                    <select id="${prefix}_media" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none bg-white">
                        <option value="">Pilih Media</option>
                        <option value="Powder">Dry Chemical Powder</option>
                        <option value="CO2">CO2</option>
                        <option value="Foam">Foam</option>
                        <option value="Water">Water</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Kapasitas (Kg)</label>
                    <input type="number" id="${prefix}_kapasitas" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Tgl Produksi</label>
                    <input type="date" id="${prefix}_tgl_produksi" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Tgl Kadaluarsa</label>
                    <input type="date" id="${prefix}_tgl_kadaluarsa" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
            </div>
        `;
    } else {
        extraFields = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Lokasi Spesifik</label>
                    <input type="text" id="${prefix}_lokasi" class="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-green-600 focus:outline-none">
                </div>
            </div>
        `;
    }

    let checklistHtml = checklist.map((item, i) => {
        let itemIndex = i + 1;
        return `
            <div class="bg-white p-3.5 rounded border border-gray-200 mb-3 checklist-item-card">
                <div class="flex items-start justify-between gap-3 mb-2">
                    <p class="font-semibold text-sm text-gray-900">${itemIndex}. ${item.label}</p>
                    <div class="flex items-center gap-4 shrink-0">
                        <label class="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                            <input type="radio" name="${prefix}_item_${itemIndex}_status" value="sesuai" data-type="${type}" class="form-radio text-green-600 accent-green-600">
                            <span class="text-green-700">Sesuai</span>
                        </label>
                        <label class="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                            <input type="radio" name="${prefix}_item_${itemIndex}_status" value="tidak_sesuai" data-type="${type}" class="form-radio text-red-600 accent-red-600">
                            <span class="text-red-700">Tidak Sesuai</span>
                        </label>
                    </div>
                </div>
                <div class="mb-2">
                    <textarea id="${prefix}_item_${itemIndex}_keterangan" rows="2" placeholder="Catatan/Keterangan..." class="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:border-gray-400 outline-none"></textarea>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <label class="btn btn-secondary text-xs py-1.5 px-3 cursor-pointer bg-white hover:bg-gray-50 border-gray-300">
                            <i class="fa-solid fa-camera mr-1 text-[#025511]"></i> Ambil / Upload Foto
                            <input type="file" id="${prefix}_item_${itemIndex}_foto" accept="image/*" multiple class="hidden photo-upload-input" data-key="${prefix}_item_${itemIndex}_foto">
                        </label>
                        <span class="text-[10px] text-gray-500">Kamera atau Galeri • bisa banyak file, tanpa batas</span>
                    </div>
                    <div id="preview_${prefix}_item_${itemIndex}_foto" class="flex flex-wrap gap-2 mt-2"></div>
                </div>
            </div>
        `;
    }).join('');

    card.innerHTML = `
        <div class="flex justify-between items-center pb-3 border-b border-gray-200 mb-4 unit-header">
            <h3 class="text-base font-bold text-gray-900">${unitTitle}</h3>
            <button type="button" onclick="removeUnit('${type}', ${idx})" class="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded transition">
                <i class="fas fa-trash mr-1"></i> Hapus Unit
            </button>
        </div>
        ${extraFields}
        <div class="checklist-container mb-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Checklist Pemeriksaan</h4>
            ${checklistHtml}
        </div>
        <div class="flex justify-end border-t border-gray-200 pt-3 mt-3">
            <div class="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-800">Kesesuaian: <span id="${prefix}_score" class="font-black">0</span>%</div>
        </div>
    `;

    container.appendChild(card);

    // Bind file inputs for this unit
    card.querySelectorAll('.photo-upload-input').forEach(input => {
        input.addEventListener('change', handlePhotoUpload);
    });
}

// Expose to window for inline onclick handler in dynamic HTML
window.removeUnit = removeUnit;
