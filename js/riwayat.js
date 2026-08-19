// js/riwayat.js — History View & Rekap Download
import { db } from './config.js';
import { state } from './state.js';
import { calculateOverallScore } from './checklist.js';
import { restoreFormFromData } from './form.js';
import { showView } from './navigation.js';
import { showToast, showLoadingModal, hideLoadingModal } from './ui.js';

export function bindFilterRiwayat() {
    document.getElementById('filter-fakultas')?.addEventListener('change', () => {
        loadRiwayat();
    });
}

export async function loadRiwayat() {
    const container = document.getElementById('riwayat-list');
    const dashboardContainer = document.getElementById('dashboard-riwayat-list');
    
    if (container) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400 col-span-full"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
    }
    if (dashboardContainer) {
        dashboardContainer.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p class="text-xs">Memuat riwayat...</p></div>';
    }
    
    try {
        // Query reports without complex composite index constraints
        const snapshot = await db.collection('reports').get();
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
            // Filter by final status
            if (data.status === 'final') {
                if (!filterFakultas || data.fakultas === filterFakultas) {
                    docs.push({ id: doc.id, data });
                }
            }
        });

        // Sort descending by date or createdAt in client memory
        docs.sort((a, b) => {
            const timeA = a.data.createdAt?.toMillis ? a.data.createdAt.toMillis() : (new Date(a.data.tanggal || 0).getTime());
            const timeB = b.data.createdAt?.toMillis ? b.data.createdAt.toMillis() : (new Date(b.data.tanggal || 0).getTime());
            return timeB - timeA;
        });

        if (docs.length === 0) {
            const emptyHtml = '<div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"><i class="fa-solid fa-folder-open text-3xl mb-2"></i><p class="text-sm">Belum ada laporan tersimpan</p></div>';
            if (container) container.innerHTML = emptyHtml;
            if (dashboardContainer) dashboardContainer.innerHTML = emptyHtml;
            return;
        }
        
        if (container) container.innerHTML = '';
        if (dashboardContainer) dashboardContainer.innerHTML = '';
        
        let count = 0;
        docs.forEach(({ id, data }) => {
            const score = calculateOverallScore(data);
            count++;
            
            // Riwayat page card (Grid layout, sharp stroke)
            if (container) {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded border border-gray-200 flex justify-between items-center cursor-pointer hover:border-gray-800 transition-all';
                card.innerHTML = `
                    <div class="min-w-0 pr-3">
                        <span class="inline-block px-1.5 py-0.5 border border-gray-300 bg-white text-gray-700 text-[10px] font-bold rounded-sm mb-1">${data.tanggal || '-'}</span>
                        <h4 class="font-bold text-gray-900 text-sm leading-tight truncate">${data.fakultas || 'Tanpa Fakultas'}</h4>
                        <p class="text-xs text-gray-500 mt-1 truncate"><i class="fa-solid fa-location-dot text-gray-400 mr-1"></i>${data.lokasi || '-'}</p>
                        <p class="text-xs text-gray-400 mt-0.5 truncate"><i class="fa-solid fa-user-check text-gray-400 mr-1"></i>${data.surveyor || '-'}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="text-xl font-bold ${score >= 80 ? 'text-green-700' : (score >= 60 ? 'text-amber-600' : 'text-red-600')}">${score}%</div>
                        <span class="text-[9px] uppercase font-bold tracking-wider text-gray-400">Score</span>
                    </div>
                `;
                card.addEventListener('click', () => {
                    state.currentDocId = id;
                    restoreFormFromData(data);
                    showView('form');
                });
                container.appendChild(card);
            }

            // Dashboard list card (Compact list layout, up to 6 items)
            if (dashboardContainer && count <= 6) {
                const dashCard = document.createElement('div');
                dashCard.className = 'p-3 rounded border border-gray-200 hover:border-gray-800 bg-white flex items-center justify-between cursor-pointer transition-all';
                dashCard.innerHTML = `
                    <div class="min-w-0 pr-3">
                        <h4 class="font-bold text-gray-900 text-xs sm:text-sm truncate">${data.fakultas || 'Tanpa Fakultas'}</h4>
                        <p class="text-[11px] text-gray-500 truncate">${data.tanggal || '-'} &bull; ${data.lokasi || '-'}</p>
                    </div>
                    <div class="text-right shrink-0 flex items-center gap-3">
                        <div class="text-right">
                            <span class="font-bold text-sm ${score >= 80 ? 'text-[#025511]' : (score >= 60 ? 'text-amber-700' : 'text-red-700')}">${score}%</span>
                            <span class="text-[10px] text-gray-400 block -mt-0.5">Kesesuaian</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
                    </div>
                `;
                dashCard.addEventListener('click', () => {
                    state.currentDocId = id;
                    restoreFormFromData(data);
                    showView('form');
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
