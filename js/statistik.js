// js/statistik.js — Statistics View
import { db } from './config.js';
import { calculateOverallScore } from './checklist.js';

export async function loadStatistik() {
    const container = document.getElementById('statistik-container');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i></div>';
    
    try {
        const snapshot = await db.collection('reports').where('status', '==', 'final').get();
        const fakultasScores = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!fakultasScores[data.fakultas]) {
                fakultasScores[data.fakultas] = { total: 0, count: 0 };
            }
            const score = calculateOverallScore(data);
            fakultasScores[data.fakultas].total += score;
            fakultasScores[data.fakultas].count++;
        });
        
        container.innerHTML = '';
        if (Object.keys(fakultasScores).length === 0) {
             container.innerHTML = '<p class="text-center text-gray-500">Belum ada data statistik.</p>';
             return;
        }

        for (const [fakultas, scores] of Object.entries(fakultasScores)) {
            const avg = Math.round(scores.total / scores.count);
            const colorClass = avg >= 80 ? 'bg-green-500' : (avg >= 60 ? 'bg-yellow-500' : 'bg-red-500');
            container.innerHTML += `
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="font-medium">${fakultas}</span>
                        <span class="font-bold">${avg}% (${scores.count} lap.)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="${colorClass} h-2.5 rounded-full" style="width: ${avg}%"></div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `<div class="text-center text-red-500">${error.message}</div>`;
    }
}
