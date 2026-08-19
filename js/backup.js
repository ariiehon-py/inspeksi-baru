// js/backup.js — Backup Export/Import (.inspeksi files)
import { state } from './state.js';
import { collectFormData, restoreFormFromData } from './form.js';
import { showToast } from './ui.js';

export function bindBackupButtons() {
    document.getElementById('btn-backup-export')?.addEventListener('click', exportBackup);
    
    const fileInput = document.getElementById('backup-file-input');
    const triggerImport = () => {
        if(fileInput) fileInput.click();
    };

    // Bind all import backup buttons across the application
    document.getElementById('btn-backup-import')?.addEventListener('click', triggerImport);
    document.getElementById('btn-import-backup-dashboard')?.addEventListener('click', triggerImport);
    document.getElementById('btn-import-backup-banner')?.addEventListener('click', triggerImport);
    document.getElementById('btn-import-backup-form-top')?.addEventListener('click', triggerImport);
    
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) importBackup(file);
        e.target.value = '';
    });
}

export function exportBackup() {
    const data = collectFormData();
    
    // Clean photoDataMap (strip DOM File objects)
    const cleanPhotoMap = {};
    Object.keys(state.photoDataMap || {}).forEach(k => {
        cleanPhotoMap[k] = (state.photoDataMap[k] || []).map(p => {
            if (typeof p === 'string') return p;
            const item = { id: p.id || Date.now() };
            if (p.url) item.url = p.url;
            if (p.base64) item.base64 = p.base64;
            return item;
        });
    });
    data.photoDataMap = cleanPhotoMap;

    data.counters = { aparCounter: state.aparCounter, fireAlarmCounter: state.fireAlarmCounter, jalurEvakuasiCounter: state.jalurEvakuasiCounter, pintuDaruratCounter: state.pintuDaruratCounter, tanggaDaruratCounter: state.tanggaDaruratCounter };
    data.deleted = {
        apars: [...state.deletedApars],
        fireAlarms: [...state.deletedFireAlarms],
        jalurEvakuasis: [...state.deletedJalurEvakuasis],
        pintuDarurats: [...state.deletedPintuDarurats],
        tanggaDarurats: [...state.deletedTanggaDarurats],
    };
    
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspeksi_${data.fakultas || 'backup'}_${new Date().toISOString().slice(0,10)}.inspeksi`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup berhasil di-download!', 'success');
}

export function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            restoreFormFromData(data);
            showToast('Data berhasil di-import!', 'success');
        } catch (err) {
            showToast('File backup tidak valid: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}
