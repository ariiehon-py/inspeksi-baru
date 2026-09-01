// js/firestore.js — Firestore Save Operations
import { db, storage, firebase } from './config.js';
import { state, generateProjectNumber } from './state.js';
import { collectFormData } from './form.js';
import { showToast, showLoadingModal, updateLoadingProgress, hideLoadingModal } from './ui.js';
import { showView } from './navigation.js';

let autoSaveTimer = null;
let isAutoSaving = false;

export function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        // Only auto-save if at least gedung info is partially filled
        const fakultas = document.getElementById('select-fakultas')?.value || '';
        const lokasi = document.getElementById('input-lokasi')?.value || '';
        const tanggal = document.getElementById('input-tanggal')?.value || '';
        const hasSurveyor = document.querySelectorAll('input[name="surveyor_checkbox"]:checked').length > 0;
        // Minimal trigger: any of these fields has value — sesuai permintaan: pertama kali masukin data gedung langsung kesimpen
        if (fakultas || lokasi || tanggal || hasSurveyor) {
            // Jangan auto-save jika sedang dalam proses save manual
            if (!isAutoSaving) {
                saveToFirestore('draf', { silent: true });
            }
        }
    }, 900);
}

export function bindAutoSaveListeners() {
    const tanggalEl = document.getElementById('input-tanggal');
    const fakultasEl = document.getElementById('select-fakultas');
    const lokasiEl = document.getElementById('input-lokasi');

    const handler = () => scheduleAutoSave();
    tanggalEl?.addEventListener('change', handler);
    tanggalEl?.addEventListener('input', handler);
    fakultasEl?.addEventListener('change', handler);
    lokasiEl?.addEventListener('input', handler);
    lokasiEl?.addEventListener('change', handler);

    // Surveyor checkboxes (delegated, because dynamic custom surveyors exist)
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[name="surveyor_checkbox"]')) {
            scheduleAutoSave();
        }
    });

    // Rich text editors: debounce input events
    const aparEditor = document.getElementById('editor-rekomendasi-apar');
    const pasifEditor = document.getElementById('editor-rekomendasi-pasif');
    aparEditor?.addEventListener('input', handler);
    pasifEditor?.addEventListener('input', handler);

    // Also trigger when user adds custom surveyor via button
    document.getElementById('btn-add-custom-surveyor')?.addEventListener('click', () => {
        setTimeout(handler, 300);
    });
}

export async function saveToFirestore(status, options = {}) {
    const silent = options.silent === true;
    if (!silent) showLoadingModal('Menyimpan data...');
    else isAutoSaving = true;
    
    try {
        const formData = collectFormData();
        // Pastikan setiap project punya nomor project random; untuk data lama yang belum punya, generate & migrasi
        if (!formData.projectNumber) {
            formData.projectNumber = state.currentProjectNumber || generateProjectNumber();
            state.currentProjectNumber = formData.projectNumber;
            const projEl = document.getElementById('project-number-display');
            if (projEl) projEl.textContent = formData.projectNumber;
            const projInput = document.getElementById('input-project-number');
            if (projInput) projInput.value = formData.projectNumber;
        }
        formData.status = status;
        formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        if (!state.currentDocId) formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Upload photos
        const photoKeys = Object.keys(state.photoDataMap);
        let photoCount = 0;
        let totalPhotos = 0;
        photoKeys.forEach(k => totalPhotos += state.photoDataMap[k].length);
        
        const docIdToUse = state.currentDocId || db.collection('reports').doc().id;
        
        if (totalPhotos > 0) {
            const uploadPromises = photoKeys.map(async (key) => {
                const photos = state.photoDataMap[key];
                const urls = [];
                for (const photo of photos) {
                    if (photo.url) { urls.push(photo.url); continue; } 
                    const ref = storage.ref(`reports/${docIdToUse}/${key}_${Date.now()}.jpg`);
                    // convert base64 to blob
                    const res = await fetch(photo.base64);
                    const blob = await res.blob();
                    await ref.put(blob);
                    const url = await ref.getDownloadURL();
                    urls.push(url);
                    photo.url = url; // cache
                    photoCount++;
                    updateLoadingProgress(`Foto ${photoCount}/${totalPhotos}...`);
                }
                
                // Assign urls to formData
                const injectUrls = (units) => {
                    units.forEach(u => {
                        u.checklist.forEach(item => {
                            if(item.fotoKey === key) item.fotoUrls = urls;
                        });
                    });
                };
                injectUrls(formData.aparUnits);
                injectUrls(formData.fireAlarmUnits);
                injectUrls(formData.jalurEvakuasiUnits);
                injectUrls(formData.pintuDaruratUnits);
                injectUrls(formData.tanggaDaruratUnits);
            });
            await Promise.all(uploadPromises);
        }
        
        // FIX Firestore 1MB limit: upload rekomendasi embedded images dulu lalu clean photoDataMap tanpa base64
        const docIdToUseEarly = state.currentDocId || docIdToUse;
        // Helper: upload semua <img src="data:"> di dalam HTML rekomendasi ke Storage dan replace dengan URL
        const uploadRekomendasiImages = async (html) => {
            if (!html || !html.includes('data:image')) return html;
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const imgs = tmp.querySelectorAll('img');
            for (const img of imgs) {
                const src = img.getAttribute('src') || '';
                if (src.startsWith('data:image')) {
                    try {
                        const ref = storage.ref(`reports/${docIdToUseEarly}/rekom_${Date.now()}_${Math.random().toString(36).slice(2,6)}.jpg`);
                        const res = await fetch(src);
                        const blob = await res.blob();
                        await ref.put(blob);
                        const url = await ref.getDownloadURL();
                        img.setAttribute('src', url);
                    } catch (e) { console.warn('gagal upload rekom img', e); }
                }
            }
            return tmp.innerHTML;
        };
        if (formData.rekomendasi?.apar) {
            formData.rekomendasi.apar = await uploadRekomendasiImages(formData.rekomendasi.apar);
        }
        if (formData.rekomendasi?.pasif) {
            formData.rekomendasi.pasif = await uploadRekomendasiImages(formData.rekomendasi.pasif);
        }

        // Clean photoDataMap untuk Firestore: HAPUS base64 & file, hanya simpan {id, url} agar tidak melebihi 1,048,576 bytes
        const cleanPhotoMap = {};
        Object.keys(state.photoDataMap || {}).forEach(k => {
            cleanPhotoMap[k] = (state.photoDataMap[k] || []).map(p => {
                if (typeof p === 'string') {
                    // jika string adalah http/data, simpan hanya jika http (url)
                    if (p.startsWith('http')) return { url: p, id: Date.now() };
                    return null;
                }
                const item = { id: p.id || Date.now() };
                if (p.url) item.url = p.url;
                // JANGAN simpan base64 ke Firestore — hanya URL (hemat 80-90% size)
                // base64 tetap ada di memory untuk preview lokal sampai ada url
                return item;
            }).filter(Boolean);
        });
        formData.photoDataMap = cleanPhotoMap;

        // Also save counters & deleted sets for backup / edit parity
        formData.counters = {
            aparCounter: state.aparCounter,
            fireAlarmCounter: state.fireAlarmCounter,
            jalurEvakuasiCounter: state.jalurEvakuasiCounter,
            pintuDaruratCounter: state.pintuDaruratCounter,
            tanggaDaruratCounter: state.tanggaDaruratCounter
        };
        formData.deleted = {
            apars: Array.from(state.deletedApars),
            fireAlarms: Array.from(state.deletedFireAlarms),
            jalurEvakuasis: Array.from(state.deletedJalurEvakuasis),
            pintuDarurats: Array.from(state.deletedPintuDarurats),
            tanggaDarurats: Array.from(state.deletedTanggaDarurats)
        };
        
        // Selalu gunakan docId yang sama jika sudah ada — menimpa project yang sama, tidak bikin baru
        // Jika currentDocId sudah ada, update dokumen yang sama (merge)
        if (state.currentDocId) {
            await db.collection('reports').doc(state.currentDocId).set(formData, { merge: true });
        } else {
            await db.collection('reports').doc(docIdToUse).set(formData);
            state.currentDocId = docIdToUse;
        }
        
        if (!silent) hideLoadingModal();
        else isAutoSaving = false;

        if (!silent) {
            showToast(status === 'final' ? 'Data berhasil disimpan sebagai Final!' : 'Draft berhasil disimpan & riwayat diperbarui!', 'success');
        } else {
            // Silent autosave: optional subtle feedback via console, no modal blocking
            console.log('[AutoSave] gedung/draf tersimpan:', state.currentDocId, new Date().toISOString());
        }
        
        if(status === 'final') {
            showView('riwayat');
        }
        
    } catch (error) {
        console.error(error);
        if (!silent) hideLoadingModal();
        else isAutoSaving = false;
        if (!silent) showToast('Gagal menyimpan: ' + error.message, 'error');
        else console.warn('[AutoSave] gagal:', error.message);
    }
}
