// js/firestore.js — Firestore Save Operations
import { db, storage, firebase } from './config.js';
import { state } from './state.js';
import { collectFormData } from './form.js';
import { showToast, showLoadingModal, updateLoadingProgress, hideLoadingModal } from './ui.js';
import { showView } from './navigation.js';

export async function saveToFirestore(status) {
    showLoadingModal('Menyimpan data...');
    
    try {
        const formData = collectFormData();
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
        
        // Clean photoDataMap for Firestore (remove DOM File objects which Firestore cannot serialize)
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
        
        if (state.currentDocId) {
            await db.collection('reports').doc(state.currentDocId).set(formData, { merge: true });
        } else {
            await db.collection('reports').doc(docIdToUse).set(formData);
            state.currentDocId = docIdToUse;
        }
        
        hideLoadingModal();
        showToast('Data berhasil disimpan!', 'success');
        
        if(status === 'final') {
            showView('riwayat');
        }
        
    } catch (error) {
        console.error(error);
        hideLoadingModal();
        showToast('Gagal menyimpan: ' + error.message, 'error');
    }
}
