// js/checklist.js — Checklist Data, Score Calculation, Event Binding
import {
    APAR_CHECKLIST, FIRE_ALARM_CHECKLIST,
    JALUR_EVAKUASI_CHECKLIST, PINTU_DARURAT_CHECKLIST,
    TANGGA_DARURAT_CHECKLIST
} from './constants.js';

export function getChecklistData(type) {
    if (type === 'apar') return APAR_CHECKLIST;
    if (type === 'fire-alarm') return FIRE_ALARM_CHECKLIST;
    if (type === 'jalur-evakuasi') return JALUR_EVAKUASI_CHECKLIST;
    if (type === 'pintu-darurat') return PINTU_DARURAT_CHECKLIST;
    if (type === 'tangga-darurat') return TANGGA_DARURAT_CHECKLIST;
    return [];
}

export function calculateScore(typePrefix, unitIdx, unitTypeRaw) {
    const checklist = getChecklistData(unitTypeRaw);
    let sesuai = 0, total = 0;
    checklist.forEach((item, i) => {
        const itemIdx = i + 1;
        const radio = document.querySelector(`input[name="${typePrefix}_${unitIdx}_item_${itemIdx}_status"]:checked`);
        if (radio) {
            total++;
            if (radio.value === 'sesuai') sesuai++;
        }
    });
    return total === 0 ? 0 : Math.round((sesuai / total) * 100);
}

export function calculateOverallScore(data) {
    let totalScore = 0;
    let count = 0;
    
    const addScores = (units) => {
        if(units) {
            units.forEach(u => { totalScore += u.score; count++; });
        }
    };
    addScores(data.aparUnits);
    addScores(data.fireAlarmUnits);
    addScores(data.jalurEvakuasiUnits);
    addScores(data.pintuDaruratUnits);
    addScores(data.tanggaDaruratUnits);
    
    return count === 0 ? 0 : Math.round(totalScore / count);
}

export function bindChecklistEvents() {
    document.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.name.includes('_status')) {
            const radioName = e.target.name;
            const keteranganId = radioName.replace('_status', '_keterangan');
            const keteranganEl = document.getElementById(keteranganId);
            const unitTypeRaw = e.target.getAttribute('data-type');
            
            // Extract item index
            const match = radioName.match(/_item_(\d+)_/);
            if (match && keteranganEl) {
                const itemIdx = parseInt(match[1]) - 1;
                const checklist = getChecklistData(unitTypeRaw);
                const itemData = checklist[itemIdx];
                
                if (itemData) {
                    const isSesuai = e.target.value === 'sesuai';
                    keteranganEl.value = isSesuai ? itemData.keteranganSesuai : itemData.keteranganTidakSesuai;
                }
            }
            
            // Update score
            // Radio name format: typePrefix_idx_item_i_status
            const parts = radioName.split('_');
            if(parts.length >= 2) {
                const typePrefix = parts[0];
                const unitIdx = parts[1];
                let unitType = 'apar';
                if(typePrefix === 'fa') unitType = 'fire-alarm';
                if(typePrefix === 'je') unitType = 'jalur-evakuasi';
                if(typePrefix === 'pd') unitType = 'pintu-darurat';
                if(typePrefix === 'td') unitType = 'tangga-darurat';
                
                const score = calculateScore(typePrefix, unitIdx, unitTypeRaw);
                const scoreBadge = document.getElementById(`${typePrefix}_${unitIdx}_score`);
                if(scoreBadge) scoreBadge.innerText = score;
            }
        }
    });
}
