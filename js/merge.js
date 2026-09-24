// js/merge.js — Gabung 2 Project jadi 1 (Non-destruktif)
import { db, firebase } from './config.js';
import { state, generateProjectNumber } from './state.js';
import { showToast, showLoadingModal, hideLoadingModal } from './ui.js';
import { loadRiwayat } from './riwayat.js';
import { restoreFormFromData } from './form.js';
import { showView } from './navigation.js';

function generateGabProjectNumber() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const timeSuffix = Date.now().toString(36).slice(-2).toUpperCase();
    return `PRJ-GAB-${rand}${timeSuffix}`;
}

function unionSurveyors(...datas) {
    const set = new Set();
    const add = (src) => {
        if (Array.isArray(src)) src.forEach(s => { if (s && s.trim()) set.add(s.trim()); });
        else if (typeof src === 'string' && src.trim()) src.split(/,\s*|\n|;/).map(s=>s.trim()).filter(Boolean).forEach(s=>set.add(s));
    };
    datas.forEach(d => { add(d?.surveyors); add(d?.surveyor); });
    return Array.from(set);
}

// Remap units + photoDataMap for one type — support N projects
function mergeUnitsWithPhotos(sources, prefix) {
    // sources: [{units, photoMap}]
    const allUnits = [];
    const newPhotoMap = {};
    let newId = 0;
    sources.forEach(src => {
        (src.units || []).forEach(u => {
            newId++;
            const oldId = u.id;
            const newUnit = JSON.parse(JSON.stringify(u));
            newUnit.id = newId;
            (newUnit.checklist || []).forEach((item, idx) => {
                const itemIdx = idx + 1;
                const oldKey = `${prefix}_${oldId}_item_${itemIdx}_foto`;
                const newKey = `${prefix}_${newId}_item_${itemIdx}_foto`;
                item.fotoKey = newKey;
                if (src.photoMap[oldKey] && src.photoMap[oldKey].length > 0) {
                    if (!newPhotoMap[newKey]) newPhotoMap[newKey] = [];
                    const arr = Array.isArray(src.photoMap[oldKey]) ? src.photoMap[oldKey] : [];
                    newPhotoMap[newKey] = newPhotoMap[newKey].concat(JSON.parse(JSON.stringify(arr)));
                }
            });
            allUnits.push(newUnit);
        });
    });
    return { units: allUnits, photoMap: newPhotoMap, count: newId };
}

export async function mergeTwoProjects(...ids) {
    // support merge N projects: mergeTwoProjects(idA, idB) atau mergeTwoProjects([id1,id2,id3])
    let list = ids;
    if (list.length === 1 && Array.isArray(list[0])) list = list[0];
    list = [...new Set(list.filter(Boolean))];
    if (list.length < 2) {
        showToast('Pilih minimal 2 project untuk digabung', 'error');
        return;
    }
    // wrapper ke mergeMultiple
    return mergeMultipleProjects(list);
}

async function mergeMultipleProjects(idList) {
    showLoadingModal(`Menggabungkan ${idList.length} project...`);
    try {
        const docs = await Promise.all(idList.map(id => db.collection('reports').doc(id).get()));
        const missing = docs.findIndex(d => !d.exists);
        if (missing !== -1) {
            hideLoadingModal();
            showToast('Salah satu project tidak ditemukan', 'error');
            return;
        }
        const datas = docs.map(d => d.data());
        const newProjectNumber = generateGabProjectNumber();
        const newDocId = db.collection('reports').doc().id;

        // Surveyors union N
        const surveyors = unionSurveyors(...datas);
        const surveyorString = surveyors.join(', ');

        // Tanggal: pakai yang terbaru
        let tanggal = datas[0]?.tanggal || '';
        datas.forEach(d => { if (d.tanggal && d.tanggal > tanggal) tanggal = d.tanggal; });

        // Fakultas & Lokasi: pakai data pertama, kumpulkan warning jika ada yang beda
        let fakultas = datas[0]?.fakultas || '';
        let lokasi = datas[0]?.lokasi || '';
        // cari fakultas/lokasi yang paling sering muncul sebagai acuan, tapi pakai yang pertama untuk simpel
        if (!fakultas) fakultas = datas.find(d=>d.fakultas)?.fakultas || '';
        if (!lokasi) lokasi = datas.find(d=>d.lokasi)?.lokasi || '';
        let lokasiWarning = '';
        const fakSet = new Set(datas.map(d=>d.fakultas).filter(Boolean));
        if (fakSet.size > 1) lokasiWarning += `<p style="color:#b45309;font-size:11px;"><b>Catatan Gabung:</b> Fakultas berbeda — ${[...fakSet].join(' vs ')}. Dipakai: ${fakultas}</p>`;
        const lokSet = new Set(datas.map(d=>d.lokasi).filter(Boolean));
        if (lokSet.size > 1) lokasiWarning += `<p style="color:#b45309;font-size:11px;"><b>Catatan Gabung:</b> Lokasi berbeda — ${[...lokSet].join(' vs ')}. Dipakai: ${lokasi}</p>`;

        // Rekomendasi gabung N
        const rekomApars = datas.map((d,i)=> (d.rekomendasi?.apar||'').trim()).filter(Boolean);
        let rekomApar = rekomApars.length ? rekomApars.map((r,i)=> i===0? r : `<hr style="margin:12px 0;border:1px dashed #ccc;"><p style="font-size:11px;color:#065f46;font-weight:bold;">Gabungan dari ${datas[i].projectNumber || idList[i]}:</p>${r}`).join('') : '';
        if (lokasiWarning) rekomApar = rekomApar ? `${rekomApar}${lokasiWarning}` : lokasiWarning;
        const rekomPasifs = datas.map(d=> (d.rekomendasi?.pasif || d.rekomendasi?.tanggaDarurat || '').trim()).filter(Boolean);
        let rekomPasif = rekomPasifs.length ? rekomPasifs.map((r,i)=> {
            // cari index asli datas yang punya rekomendasi ini
            const idx = datas.findIndex(dd => (dd.rekomendasi?.pasif||dd.rekomendasi?.tanggaDarurat||'').trim()===r);
            return i===0? r : `<hr style="margin:12px 0;border:1px dashed #ccc;"><p style="font-size:11px;color:#065f46;font-weight:bold;">Gabungan dari ${datas[idx].projectNumber || idList[idx]}:</p>${r}`;
        }).join('') : '';

        // Merge units + photoMaps per type — N sources
        const mkSources = (key) => datas.map(d => ({ units: d[key]||[], photoMap: d.photoDataMap||{} }));
        const mergedApar = mergeUnitsWithPhotos(mkSources('aparUnits'), 'apar');
        const mergedFA = mergeUnitsWithPhotos(mkSources('fireAlarmUnits'), 'fa');
        const mergedJE = mergeUnitsWithPhotos(mkSources('jalurEvakuasiUnits'), 'je');
        const mergedPD = mergeUnitsWithPhotos(mkSources('pintuDaruratUnits'), 'pd');
        const mergedTD = mergeUnitsWithPhotos(mkSources('tanggaDaruratUnits'), 'td');

        // Combine photoMaps from all types (they are disjoint keys, so just merge)
        const combinedPhotoMap = {
            ...mergedApar.photoMap,
            ...mergedFA.photoMap,
            ...mergedJE.photoMap,
            ...mergedPD.photoMap,
            ...mergedTD.photoMap
        };
        // Also carry any photoMap entries that are not tied to units (edge case, e.g., rekomendasi images already handled)
        // For any leftover keys not in merged sets, copy as is (e.g., if photoMap had orphan keys)
        const allOldKeys = new Set([...Object.keys(dataA.photoDataMap||{}), ...Object.keys(dataB.photoDataMap||{})]);
        // Already covered by merge per type; but if there are keys not matching pattern, preserve with prefix merged-?
        // We skip orphan to keep clean

        const mergedData = {
            projectNumber: newProjectNumber,
            tanggal: tanggal,
            surveyor: surveyorString,
            surveyors: surveyors,
            fakultas: fakultas,
            lokasi: lokasi,
            aparUnits: mergedApar.units,
            fireAlarmUnits: mergedFA.units,
            jalurEvakuasiUnits: mergedJE.units,
            pintuDaruratUnits: mergedPD.units,
            tanggaDaruratUnits: mergedTD.units,
            rekomendasi: {
                apar: rekomApar,
                pasif: rekomPasif
            },
            photoDataMap: combinedPhotoMap,
            counters: {
                aparCounter: mergedApar.count,
                fireAlarmCounter: mergedFA.count,
                jalurEvakuasiCounter: mergedJE.count,
                pintuDaruratCounter: mergedPD.count,
                tanggaDaruratCounter: mergedTD.count
            },
            deleted: {
                apars: [],
                fireAlarms: [],
                jalurEvakuasis: [],
                pintuDarurats: [],
                tanggaDarurats: []
            },
            status: 'draf',
            mergedFrom: idList,
            mergedFromNumbers: datas.map((d,i)=> d.projectNumber || idList[i]),
            mergedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // 1. Save new doc
        await db.collection('reports').doc(newDocId).set(mergedData);

        // 2. Mark sources as merged (non-destructive) — untuk N project
        const mark = {
            mergedInto: newProjectNumber,
            mergedIntoDocId: newDocId,
            mergedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await Promise.all(idList.map(id => db.collection('reports').doc(id).set(mark, { merge: true })));
        // juga tulis preview untuk semua yang digabung biar riwayat ringan tetap update
        try {
            const previewMark = { mergedInto: newProjectNumber, mergedIntoDocId: newDocId };
            await Promise.all(idList.map(id => db.collection('reports_preview').doc(id).set(previewMark, { merge: true }).catch(()=>{})));
        } catch {}

        hideLoadingModal();
        showToast(`Berhasil gabung! Project baru ${newProjectNumber} dibuat. ${idList.length} project lama ditandai.`, 'success');

        // Refresh riwayat
        await loadRiwayat(true);

        // Optional: tanya user mau buka hasil gabungan?
        setTimeout(() => {
            if (confirm(`Project gabungan ${newProjectNumber} berhasil dibuat.\nBuka hasil gabungan sekarang?`)) {
                // Load mergedData directly tanpa fetch ulang
                state.currentDocId = newDocId;
                // Need to fetch fresh to get serverTimestamp resolved? Use mergedData locally with newDocId
                // For simplicity, restore from mergedData (timestamps will be serverTimestamp placeholder, tapi tidak masalah untuk form)
                const localData = { ...mergedData, projectNumber: newProjectNumber };
                // Replace FieldValue placeholders with actual dates for form display
                localData.createdAt = new Date();
                localData.updatedAt = new Date();
                // Remove FieldValue objects for restore (restore expects plain)
                restoreFormFromData(localData);
                state.currentDocId = newDocId;
                state.currentProjectNumber = newProjectNumber;
                const el = document.getElementById('project-number-display');
                if (el) el.textContent = newProjectNumber;
                const inp = document.getElementById('input-project-number');
                if (inp) inp.value = newProjectNumber;
                showView('form');
            }
        }, 400);

        return { newDocId, newProjectNumber };
    } catch (e) {
        console.error(e);
        hideLoadingModal();
        showToast('Gagal menggabungkan: ' + e.message, 'error');
        throw e;
    }
}

// UI helpers for modal
let _mergeSelection = new Set();

export function openMergeModal() {
    const modal = document.getElementById('modal-merge');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        _mergeSelection.clear();
        updateMergeModalState();
        loadMergeChoices();
    }
}
export function closeMergeModal() {
    const modal = document.getElementById('modal-merge');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    _mergeSelection.clear();
}

async function loadMergeChoices() {
    const listEl = document.getElementById('merge-choices-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin"></i><p class="text-xs mt-2">Memuat daftar project...</p></div>';
    try {
        const snap = await db.collection('reports').orderBy('updatedAt', 'desc').limit(50).get().catch(async () => {
            return await db.collection('reports').limit(50).get();
        });
        const docs = [];
        snap.forEach(doc => {
            const d = doc.data();
            const status = d.status || 'draf';
            docs.push({ id: doc.id, data: d });
        });
        // sort client by updatedAt
        docs.sort((a,b)=>{
            const getT = (d)=> d.updatedAt?.toMillis ? d.updatedAt.toMillis() : (d.createdAt?.toMillis ? d.createdAt.toMillis() : 0);
            return getT(b.data) - getT(a.data);
        });
        if (docs.length < 2) {
            listEl.innerHTML = '<div class="text-center py-8 text-gray-400 text-sm">Butuh minimal 2 project untuk digabung.</div>';
            return;
        }
        listEl.innerHTML = docs.map(({id, data})=>{
            const isMergedSource = !!data.mergedInto;
            const scoreBadge = data.mergedInto ? `<span class="text-[9px] font-bold px-1 py-0.5 border bg-purple-50 text-purple-700 border-purple-200">SUDAH DIGABUNG → ${data.mergedInto}</span>` : '';
            const proj = data.projectNumber || id.slice(0,6);
            const info = `${data.fakultas||'-'} • ${data.lokasi||'-'} • ${data.tanggal||'-'}`;
            const countInfo = `APAR:${(data.aparUnits||[]).length} FA:${(data.fireAlarmUnits||[]).length} JE:${(data.jalurEvakuasiUnits||[]).length} PD:${(data.pintuDaruratUnits||[]).length} TD:${(data.tanggaDaruratUnits||[]).length}`;
            return `
            <label class="flex items-start gap-3 p-3 border ${isMergedSource ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200 bg-white'} hover:border-[#025511] cursor-pointer transition" data-merge-id="${id}">
                <input type="checkbox" class="merge-checkbox mt-1 accent-[#025511] w-4 h-4 shrink-0" value="${id}" ${isMergedSource ? 'title="Sudah pernah digabung, tetap bisa dipilih lagi"' : ''}>
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                        <span class="text-[11px] font-mono font-bold text-[#025511] bg-green-50 border border-green-200 px-1.5 py-0.5">${proj}</span>
                        <span class="text-[11px] px-1.5 py-0.5 border ${ (data.status==='final'?'bg-green-50 text-[#025511] border-green-200':'bg-amber-50 text-amber-700 border-amber-200')} font-bold">${(data.status||'draf').toUpperCase()}</span>
                        ${scoreBadge}
                    </div>
                    <p class="text-xs font-bold text-gray-900 truncate">${data.fakultas||'Tanpa Fakultas'}</p>
                    <p class="text-[11px] text-gray-500 truncate">${info}</p>
                    <p class="text-[11px] text-gray-400">${countInfo} • Surveyor: ${(data.surveyor||'-').slice(0,60)}</p>
                </div>
            </label>`;
        }).join('');

        // bind checkboxes — TANPA BATAS, bisa pilih sebanyak-banyaknya
        listEl.querySelectorAll('.merge-checkbox').forEach(cb=>{
            cb.addEventListener('change', (e)=>{
                const id = e.target.value;
                if (e.target.checked) _mergeSelection.add(id);
                else _mergeSelection.delete(id);
                updateMergeModalState();
            });
        });
    } catch (e) {
        listEl.innerHTML = `<div class="text-center py-6 text-red-500 text-xs">Gagal memuat: ${e.message}</div>`;
    }
}

function updateMergeModalState() {
    const countEl = document.getElementById('merge-selected-count');
    const btn = document.getElementById('btn-confirm-merge');
    const hint = document.getElementById('merge-hint');
    if (countEl) countEl.textContent = `${_mergeSelection.size} dipilih (min 2)`;
    const ok = _mergeSelection.size >= 2;
    if (btn) {
        btn.disabled = !ok;
        btn.classList.toggle('opacity-40', !ok);
        btn.classList.toggle('cursor-not-allowed', !ok);
        btn.innerHTML = ok ? `<i class="fa-solid fa-code-merge mr-1"></i> Gabung ${_mergeSelection.size} Project` : `<i class="fa-solid fa-code-merge mr-1"></i> Gabung Jadi 1`;
    }
    if (hint) {
        if (ok) hint.textContent = `Siap gabung ${ _mergeSelection.size} project — akan buat PRJ-GAB-XXXX baru, semua lama tetap ada & ditandai.`;
        else if (_mergeSelection.size === 1) hint.textContent = 'Pilih 1 lagi (minimal 2) untuk digabung.';
        else hint.textContent = 'Pilih minimal 2 project, tanpa batas maksimal.';
    }
}

export function bindMergeButtons() {
    document.getElementById('btn-open-merge')?.addEventListener('click', openMergeModal);
    document.getElementById('btn-close-merge')?.addEventListener('click', closeMergeModal);
    document.getElementById('btn-cancel-merge')?.addEventListener('click', closeMergeModal);
    document.getElementById('modal-merge')?.addEventListener('click', (e)=>{
        if (e.target.id === 'modal-merge') closeMergeModal();
    });
    document.getElementById('btn-confirm-merge')?.addEventListener('click', async ()=>{
        if (_mergeSelection.size < 2) return;
        const ids = Array.from(_mergeSelection);
        try {
            const snaps = await Promise.all(ids.map(id=> db.collection('reports').doc(id).get()));
            const faks = new Set(snaps.map(s=>s.data()?.fakultas).filter(Boolean));
            const loks = new Set(snaps.map(s=>s.data()?.lokasi).filter(Boolean));
            if (faks.size>1 || loks.size>1) {
                const detail = snaps.map(s=> `${s.data()?.projectNumber||s.id}: ${s.data()?.fakultas} - ${s.data()?.lokasi}`).join('\n');
                const ok = confirm(`Perhatian: Fakultas/Lokasi beda:\n${detail}\n\nTetap gabung ${ids.length} project? (Fakultas & Lokasi pakai project pertama)`);
                if (!ok) return;
            }
            closeMergeModal();
            await mergeTwoProjects(ids);
        } catch (e) { console.error(e); }
    });
}

window.openMergeModal = openMergeModal;
window.closeMergeModal = closeMergeModal;
