// js/state.js — Shared Application State
export function generateProjectNumber() {
    // Format: PRJ-XXXXXX (6 char alphanumeric uppercase, tanpa O/0/I/1 agar jelas)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    // Tambah suffix waktu singkat agar lebih unik antar project
    const timeSuffix = Date.now().toString(36).slice(-2).toUpperCase();
    return `PRJ-${rand}${timeSuffix}`;
}

export const state = {
    currentView: 'dashboard',
    currentStep: 'data-umum',
    currentDocId: null,
    currentProjectNumber: null,
    aparCounter: 0,
    fireAlarmCounter: 0,
    jalurEvakuasiCounter: 0,
    pintuDaruratCounter: 0,
    tanggaDaruratCounter: 0,
    deletedApars: new Set(),
    deletedFireAlarms: new Set(),
    deletedJalurEvakuasis: new Set(),
    deletedPintuDarurats: new Set(),
    deletedTanggaDarurats: new Set(),
    photoDataMap: {},
};

export function resetState() {
    state.currentDocId = null;
    // Generate nomor project baru tiap reset (inspeksi baru) agar tidak bingung antar project
    state.currentProjectNumber = generateProjectNumber();
    // Sync ke input display jika sudah ada di DOM
    const el = document.getElementById('project-number-display');
    if (el) el.textContent = state.currentProjectNumber;
    const input = document.getElementById('input-project-number');
    if (input) input.value = state.currentProjectNumber;
    state.aparCounter = 0;
    state.fireAlarmCounter = 0;
    state.jalurEvakuasiCounter = 0;
    state.pintuDaruratCounter = 0;
    state.tanggaDaruratCounter = 0;
    state.deletedApars = new Set();
    state.deletedFireAlarms = new Set();
    state.deletedJalurEvakuasis = new Set();
    state.deletedPintuDarurats = new Set();
    state.deletedTanggaDarurats = new Set();
    state.photoDataMap = {};
}
