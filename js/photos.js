// js/photos.js — Photo Compress, Download, Upload & Preview
import { state } from './state.js';
import { showToast } from './ui.js';

export function compressPhoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                if (w > 600) { h = (600 / w) * h; w = 600; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const base64 = canvas.toDataURL('image/jpeg', 0.6);
                resolve(base64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

export function autoDownloadPhoto(base64, filename) {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function handlePhotoUpload(e) {
    const input = e.target;
    const file = input.files[0];
    const key = input.getAttribute('data-key');
    if (!file || !key) return;

    try {
        const base64 = await compressPhoto(file);
        
        // Auto-download to phone for backup
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        autoDownloadPhoto(base64, `inspeksi_${dateStr}_${key}_${Date.now()}.jpg`);
        
        if (!state.photoDataMap[key]) state.photoDataMap[key] = [];
        const photoObj = { base64, file, id: Date.now() };
        state.photoDataMap[key].push(photoObj);
        
        renderPhotoPreviews(key);
        
    } catch (err) {
        showToast('Gagal memproses foto', 'error');
    }
    
    // reset input
    input.value = '';
}

export function renderPhotoPreviews(key) {
    const container = document.getElementById(`preview_${key}`);
    if (!container) return;
    
    const photos = state.photoDataMap[key] || [];
    container.innerHTML = photos.map((p, idx) => `
        <div class="relative inline-block border rounded p-1">
            <img src="${p.base64 || p.url}" class="h-16 w-16 object-cover rounded">
            <button type="button" onclick="removePhoto('${key}', ${idx})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

window.removePhoto = function(key, idx) {
    if (state.photoDataMap[key]) {
        state.photoDataMap[key].splice(idx, 1);
        renderPhotoPreviews(key);
    }
};
