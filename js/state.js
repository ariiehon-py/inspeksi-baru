// js/state.js — Shared Application State
export const state = {
    currentView: 'dashboard',
    currentStep: 'data-umum',
    currentDocId: null,
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
