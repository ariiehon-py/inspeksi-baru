// js/riwayat.js — History View & Rekap Download
import { db } from './config.js';
import { state, generateProjectNumber } from './state.js';
import { calculateOverallScore } from './checklist.js';
import { restoreFormFromData } from './form.js';
import { showView } from './navigation.js';
import { showToast, showLoadingModal, hideLoadingModal } from './ui.js';

export function bindFilterRiwayat() {
    document.getElementById('filter-fakultas')?.addEventListener('change', () => {
        loadRiwayat();
    });
}

// Cache & debounce untuk biar loading gak lama terus
let _riwayatCache = null;
let _riwayatCacheTime = 0;
let _riwayatFetching = null;
const RIWAYAT_CACHE_MS = 30000; // 30 detik

function fetchWithTimeout(promise, ms = 8000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout - koneksi Firestore lambat, coba refresh')), ms))
    ]);
}

export async function loadRiwayat(force = false) {
    const container = document.getElementById('riwayat-list');
    const dashboardContainer = document.getElementById('dashboard-riwayat-list');
    
    // Pakai cache kalau masih fresh dan bukan force (biar gak fetch tiap pindah view)
    if (!force && _riwayatCache && (Date.now() - _riwayatCacheTime < RIWAYAT_CACHE_MS)) {
        try { renderRiwayatDocs(_riwayatCache, container, dashboardContainer); return; } catch {}
    }
    // Cegah double fetch barengan
    if (_riwayatFetching) {
        try { await _riwayatFetching; } catch {}
        if (_riwayatCache) { renderRiwayatDocs(_riwayatCache, container, dashboardContainer); return; }
    }

    if (container) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400 col-span-full"><i class="fas fa-spinner fa-spin text-2xl"></i><p class="text-xs mt-2">Memuat riwayat...</p><button onclick="window.loadRiwayat && window.loadRiwayat(true)" class="mt-3 text-xs px-3 py-1 border border-gray-300 bg-white hover:bg-gray-50">Refresh</button></div>';
    }
    if (dashboardContainer) {
        dashboardContainer.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p class="text-xs">Memuat riwayat...</p></div>';
    }
    
    const doFetch = async () => {
        // limit 50 biar gak download semua kalau data sudah ratusan, dan sudah dibersihkan base64 jadi ringan
        try {
            const snap = await fetchWithTimeout(db.collection('reports').orderBy('updatedAt', 'desc').limit(50).get(), 8000);
            return snap;
        } catch (e) {
            // fallback kalau index belum ada atau timeout di orderBy
            const snap2 = await fetchWithTimeout(db.collection('reports').limit(50).get(), 8000);
            return snap2;
        }
    };

    // Retry 2x kalau timeout
    let snapshot = null;
    let lastErr = null;
    _riwayatFetching = (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                snapshot = await doFetch();
                lastErr = null;
                break;
            } catch (e) {
                lastErr = e;
                if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
            }
        }
        if (lastErr) throw lastErr;
        return snapshot;
    })();

    try {
        snapshot = await _riwayatFetching;
        _riwayatFetching = null;
        if (snapshot) {
            _riwayatCache = snapshot;
            _riwayatCacheTime = Date.now();
            renderRiwayatDocs(snapshot, container, dashboardContainer);
            return;
        }
    } catch (error) {
        _riwayatFetching = null;
        const retryHtml = (msg) => `<div class="text-center py-8 text-amber-600 col-span-full"><p class="text-sm">${msg}</p><button onclick="window.loadRiwayat && window.loadRiwayat(true)" class="mt-3 text-xs px-4 py-1.5 bg-[#025511] text-white hover:bg-[#013b0c]">Coba Lagi</button><p class="text-[11px] text-gray-400 mt-1">Koneksi lambat, tidak perlu refresh halaman</p></div>`;
        const errorHtml = retryHtml(`Gagal memuat: ${error.message}`);
        if (container) container.innerHTML = errorHtml;
        if (dashboardContainer) dashboardContainer.innerHTML = retryHtml(`Gagal memuat riwayat`);
        return;
    }
}
window.loadRiwayat = loadRiwayat;

function renderRiwayatDocs(snapshot, container, dashboardContainer) {
    try {
        if (snapshot.empty) {
            const emptyHtml = '<div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"><i class="fa-solid fa-folder-open text-3xl mb-2"></i><p class="text-sm">Belum ada laporan tersimpan</p></div>';
            if (container) container.innerHTML = emptyHtml;
            if (dashboardContainer) dashboardContainer.innerHTML = emptyHtml;
            return;
        }

        const filterFakultas = document.getElementById('filter-fakultas')?.value;
        let docs = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Tampilkan semua status: final, draf/draft, dan data lama tanpa status — agar riwayat selalu update
            const status = data.status || 'draf';
            const isVisible = (status === 'final' || status === 'draf' || status === 'draft');
            if (isVisible) {
                if (!filterFakultas || data.fakultas === filterFakultas) {
                    docs.push({ id: doc.id, data });
                }
            }
        });

        // Sort descending by updatedAt / createdAt / tanggal in client memory
        docs.sort((a, b) => {
            const getTime = (d) => {
                if (d.updatedAt?.toMillis) return d.updatedAt.toMillis();
                if (d.createdAt?.toMillis) return d.createdAt.toMillis();
                return new Date(d.tanggal || 0).getTime();
            };
            return getTime(b.data) - getTime(a.data);
        });

        if (docs.length === 0) {
            const emptyHtml = '<div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"><i class="fa-solid fa-folder-open text-3xl mb-2"></i><p class="text-sm">Belum ada laporan tersimpan</p></div>';
            if (container) container.innerHTML = emptyHtml;
            if (dashboardContainer) dashboardContainer.innerHTML = emptyHtml;
            return;
        }

        // Migrasi: beri nomor project untuk dokumen lama yang belum punya
        const missing = docs.filter(({ data }) => !data.projectNumber);
        if (missing.length > 0) {
            missing.forEach(({ id }) => {
                const newNum = generateProjectNumber();
                // Update Firestore tanpa blocking UI; local data langsung di-set agar tampil
                db.collection('reports').doc(id).update({ projectNumber: newNum }).catch(() => {});
                const target = docs.find(d => d.id === id);
                if (target) target.data.projectNumber = newNum;
            });
        }
        
        if (container) container.innerHTML = '';
        if (dashboardContainer) dashboardContainer.innerHTML = '';
        
        let count = 0;
        docs.forEach(({ id, data }) => {
            const score = calculateOverallScore(data);
            const status = data.status || 'draf';
            const isDraft = (status === 'draf' || status === 'draft');
            const statusBadge = isDraft
                ? '<span class="inline-block px-1.5 py-0.5 border border-amber-300 bg-amber-50 text-amber-700 text-[10px] font-bold">DRAF</span>'
                : '<span class="inline-block px-1.5 py-0.5 border border-green-300 bg-green-50 text-[#025511] text-[10px] font-bold">FINAL</span>';
            count++;
            
            // Riwayat page card (Grid layout, clean professional card with action buttons)
            if (container) {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 border border-gray-200 hover:border-gray-400 transition-all flex flex-col justify-between';
                const projNum = data.projectNumber || '-';
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start gap-2 mb-2">
                            <span class="inline-block px-1.5 py-0.5 border border-gray-300 bg-gray-50 text-gray-700 text-[10px] font-bold">${data.tanggal || '-'}</span>
                            <div class="text-right shrink-0 flex items-center gap-1.5">
                                ${statusBadge}
                                <span class="text-base font-bold ${score >= 80 ? 'text-[#025511]' : (score >= 60 ? 'text-amber-700' : 'text-red-700')}">${score}%</span>
                            </div>
                        </div>
                        <p class="text-[11px] font-mono font-bold text-[#025511] bg-green-50 border border-green-200 inline-block px-1.5 py-0.5 mb-1.5"><i class="fa-solid fa-hashtag mr-1"></i>${projNum}</p>
                        <h4 class="font-bold text-gray-900 text-sm leading-snug mb-1.5">${data.fakultas || 'Tanpa Fakultas'}</h4>
                        <p class="text-xs text-gray-600 truncate mb-0.5"><i class="fa-solid fa-location-dot text-gray-400 mr-1.5"></i>${data.lokasi || '-'}</p>
                        <p class="text-xs text-gray-500 truncate mb-3"><i class="fa-solid fa-users text-gray-400 mr-1.5"></i>${data.surveyor || '-'}</p>
                    </div>

                    <div class="pt-2.5 border-t border-gray-100 flex items-center gap-2">
                        <button type="button" class="btn-open-report btn btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">
                            <i class="fa-solid fa-pen-to-square text-gray-600"></i>
                            <span>Buka Laporan</span>
                        </button>
                        <button type="button" class="btn-delete-report px-2.5 py-1.5 border border-gray-300 bg-white text-gray-500 hover:text-red-600 hover:border-red-400 transition text-xs" title="Hapus Laporan">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;

                // Open report click
                card.querySelector('.btn-open-report')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.currentDocId = id;
                    restoreFormFromData(data);
                    showView('form');
                });

                // Delete report click
                card.querySelector('.btn-delete-report')?.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const confirmDelete = confirm(`Hapus laporan inspeksi "${data.fakultas || 'ini'}" (${data.tanggal || ''}) secara permanen?`);
                    if (!confirmDelete) return;

                    showLoadingModal('Menghapus laporan...');
                    try {
                        await db.collection('reports').doc(id).delete();
                        hideLoadingModal();
                        showToast('Laporan berhasil dihapus', 'success');
                        loadRiwayat();
                    } catch (err) {
                        hideLoadingModal();
                        console.error('Error deleting report:', err);
                        showToast('Gagal menghapus: ' + err.message, 'error');
                    }
                });

                container.appendChild(card);
            }

            // Dashboard list card (Compact list layout, up to 6 items)
            if (dashboardContainer && count <= 6) {
                const dashCard = document.createElement('div');
                dashCard.className = 'p-3 border border-gray-200 hover:border-gray-400 bg-white flex items-center justify-between transition-all';
                const dashBadge = isDraft
                    ? '<span class="text-[9px] font-bold px-1 py-0.5 border bg-amber-50 text-amber-700 border-amber-200">DRAF</span>'
                    : '<span class="text-[9px] font-bold px-1 py-0.5 border bg-green-50 text-[#025511] border-green-200">FINAL</span>';
                const shortProj = data.projectNumber ? `<span class="text-[9px] font-mono font-bold text-[#025511]">${data.projectNumber}</span>` : '';
                dashCard.innerHTML = `
                    <div class="min-w-0 pr-3 cursor-pointer flex-1">
                        <h4 class="font-bold text-gray-900 text-xs sm:text-sm truncate">${data.fakultas || 'Tanpa Fakultas'} ${dashBadge}</h4>
                        <p class="text-[11px] text-gray-500 truncate">${shortProj ? shortProj + ' &bull; ' : ''}${data.tanggal || '-'} &bull; ${data.lokasi || '-'}</p>
                    </div>
                    <div class="shrink-0 flex items-center gap-3">
                        <div class="text-right">
                            <span class="font-bold text-sm ${score >= 80 ? 'text-[#025511]' : (score >= 60 ? 'text-amber-700' : 'text-red-700')}">${score}%</span>
                            <span class="text-[10px] text-gray-400 block -mt-0.5">Kesesuaian</span>
                        </div>
                        <button type="button" class="btn-dash-open p-1.5 text-gray-500 hover:text-gray-900" title="Buka">
                            <i class="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                        <button type="button" class="btn-dash-delete p-1.5 text-gray-400 hover:text-red-600" title="Hapus">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                `;

                dashCard.querySelector('.cursor-pointer')?.addEventListener('click', () => {
                    state.currentDocId = id;
                    restoreFormFromData(data);
                    showView('form');
                });
                dashCard.querySelector('.btn-dash-open')?.addEventListener('click', () => {
                    state.currentDocId = id;
                    restoreFormFromData(data);
                    showView('form');
                });
                dashCard.querySelector('.btn-dash-delete')?.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const confirmDelete = confirm(`Hapus laporan inspeksi "${data.fakultas || 'ini'}" (${data.tanggal || ''})?`);
                    if (!confirmDelete) return;

                    showLoadingModal('Menghapus laporan...');
                    try {
                        await db.collection('reports').doc(id).delete();
                        hideLoadingModal();
                        showToast('Laporan berhasil dihapus', 'success');
                        loadRiwayat();
                    } catch (err) {
                        hideLoadingModal();
                        console.error('Error deleting report:', err);
                        showToast('Gagal menghapus: ' + err.message, 'error');
                    }
                });

                dashboardContainer.appendChild(dashCard);
            }
        });
    } catch (error) {
        const errorHtml = `<div class="text-center py-8 text-red-500 col-span-full"><p>Gagal memuat data: ${error.message}</p></div>`;
        if (container) container.innerHTML = errorHtml;
        if (dashboardContainer) dashboardContainer.innerHTML = errorHtml;
    }
}

export async function downloadRekap() {
    showLoadingModal('Menyiapkan rekap...');
    
    try {
        const snapshot = await db.collection('reports').get();
        if (snapshot.empty) {
            hideLoadingModal();
            showToast('Tidak ada data untuk direkap.', 'warning');
            return;
        }

        const filterFakultas = document.getElementById('filter-fakultas')?.value;
        let docs = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'final') {
                if (!filterFakultas || data.fakultas === filterFakultas) {
                    docs.push(data);
                }
            }
        });

        // Sort descending
        docs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.tanggal || 0).getTime());
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.tanggal || 0).getTime());
            return timeB - timeA;
        });

        if (docs.length === 0) {
            hideLoadingModal();
            showToast('Tidak ada data untuk direkap.', 'warning');
            return;
        }

        // Build combined HTML for all reports
        let combinedHtml = '<div style="font-family: Plus Jakarta Sans, sans-serif;">';
        let reportIndex = 0;

        docs.forEach(data => {
            reportIndex++;
            const score = calculateOverallScore(data);

            if (reportIndex > 1) {
                combinedHtml += '<div style="page-break-before: always;"></div>';
            }

            combinedHtml += `
                <div style="padding: 20px;">
                    <h1 style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 16px;">Laporan Inspeksi K3 Proteksi Kebakaran</h1>
                    <h2 style="font-size: 14px; text-align: center; margin-bottom: 24px; color: #666;">${data.fakultas}</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px;">
                        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold; width: 25%;">Tanggal</td><td style="border: 1px solid #ccc; padding: 6px;">${data.tanggal}</td></tr>
                        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Surveyor</td><td style="border: 1px solid #ccc; padding: 6px;">${data.surveyor}</td></tr>
                        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Lokasi</td><td style="border: 1px solid #ccc; padding: 6px;">${data.lokasi}</td></tr>
                        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Score</td><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">${score}%</td></tr>
                    </table>`;

            const addRekapSection = (title, units, emptyLabel) => {
                let s = `<h3 style="font-size: 12pt; font-weight: bold; margin: 12px 0 4px; border-bottom: 1px solid #000000; padding-bottom: 2px; color: #000000;">${title}</h3>`;
                if (units && units.length > 0) {
                    units.forEach(u => {
                        s += `<p style="font-weight: bold; font-size: 11pt; margin: 6px 0 2px; color: #000000;">Unit #${u.id} - ${u.lokasi || '-'} (Kesesuaian: ${u.score}%)</p>`;
                        s += '<table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 6px; border: 1px solid #000000; color: #000000;">';
                        s += '<tr style="background: #f0f0f0;"><th style="border: 1px solid #000000; padding: 4px; text-align: left; color: #000000; width: 50%;">Item Pemeriksaan</th><th style="border: 1px solid #000000; padding: 4px; width: 18%; text-align: center; color: #000000;">Status</th><th style="border: 1px solid #000000; padding: 4px; text-align: left; color: #000000;">Keterangan</th></tr>';
                        u.checklist?.forEach(item => {
                            const st = item.status === 'sesuai' ? 'Sesuai' : (item.status === 'tidak_sesuai' ? 'Tidak Sesuai' : '-');
                            s += `<tr><td style="border: 1px solid #000000; padding: 4px; color: #000000;">${item.label}</td><td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: ${item.status === 'tidak_sesuai' ? 'bold' : 'normal'}; color: #000000;">${st}</td><td style="border: 1px solid #000000; padding: 4px; color: #000000;">${item.keterangan || '-'}</td></tr>`;
                        });
                        s += '</table>';
                    });
                } else {
                    s += '<table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 6px; border: 1px solid #000000; color: #000000;">';
                    s += `<tr style="background: #f0f0f0;"><td style="border: 1px solid #000000; padding: 4px; font-weight: bold; width: 50%; color: #000000;">${title}</td><td style="border: 1px solid #000000; padding: 4px; text-align: center; font-weight: bold; color: #000000; width: 18%;">Tidak Sesuai</td><td style="border: 1px solid #000000; padding: 4px; color: #000000; font-style: italic;">Tidak terdapat ${emptyLabel || title} di lokasi ini</td></tr>`;
                    s += '</table>';
                }
                return s;
            };

            // 1. Proteksi Aktif
            combinedHtml += `<h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 16px; margin-bottom: 4px; color: #000000; border-bottom: 2px solid #000000; padding-bottom: 2px;">I. Proteksi Aktif</h2>`;
            combinedHtml += addRekapSection('APAR', data.aparUnits, 'APAR');
            if (data.rekomendasi?.apar) {
                combinedHtml += `<div style="border: 1px solid #000000; padding: 6px 10px; margin: 8px 0 12px; font-size: 11pt; color: #000000;"><p style="font-weight: bold; text-decoration: underline; margin: 0 0 4px; color: #000000;">Rekomendasi Proteksi Aktif (APAR):</p><div style="margin-top: 2px; color: #000000;">${data.rekomendasi.apar}</div></div>`;
            }

            // 2. Proteksi Pasif
            combinedHtml += `<h2 style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 16px; margin-bottom: 4px; color: #000000; border-bottom: 2px solid #000000; padding-bottom: 2px;">II. Proteksi Pasif</h2>`;
            combinedHtml += addRekapSection('Fire Alarm', data.fireAlarmUnits, 'Fire Alarm');
            combinedHtml += addRekapSection('Jalur Evakuasi', data.jalurEvakuasiUnits, 'Jalur Evakuasi');
            combinedHtml += addRekapSection('Pintu Darurat', data.pintuDaruratUnits, 'Pintu Darurat');
            combinedHtml += addRekapSection('Tangga Darurat', data.tanggaDaruratUnits, 'Tangga Darurat');
            if (data.rekomendasi?.pasif) {
                combinedHtml += `<div style="border: 1px solid #000000; padding: 6px 10px; margin: 8px 0 12px; font-size: 11pt; color: #000000;"><p style="font-weight: bold; text-decoration: underline; margin: 0 0 4px; color: #000000;">Rekomendasi Proteksi Pasif:</p><div style="margin-top: 2px; color: #000000;">${data.rekomendasi.pasif}</div></div>`;
            }

            combinedHtml += '</div>';
        });

        combinedHtml += '</div>';

        // Generate PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = combinedHtml;
        document.body.appendChild(tempDiv);

        const fakultasLabel = filterFakultas || 'Semua_Fakultas';
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Rekap_Inspeksi_K3_${fakultasLabel}_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.9 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };
        const html2pdf = window.html2pdf;
        await html2pdf().set(opt).from(tempDiv).save();
        document.body.removeChild(tempDiv);

        hideLoadingModal();
        showToast(`Rekap ${reportIndex} laporan berhasil diunduh!`, 'success');

    } catch (error) {
        console.error(error);
        hideLoadingModal();
        showToast('Gagal membuat rekap: ' + error.message, 'error');
    }
}
