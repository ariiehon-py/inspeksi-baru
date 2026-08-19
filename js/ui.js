// js/ui.js — UI Helpers (Toast, Modal, Select Population)
import { SURVEYORS, FAKULTAS_LIST } from './constants.js';

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const colorText = type === 'success' ? 'text-green-500' : (type === 'error' ? 'text-red-500' : 'text-yellow-500');
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle');
    
    toast.className = `bg-white border-l-4 ${type==='success' ? 'border-green-500' : 'border-red-500'} shadow-md rounded p-4 mb-2 flex items-center gap-3 transition-opacity duration-300 z-50`;
    toast.innerHTML = `
        <i class="fas ${icon} ${colorText} text-xl"></i>
        <span class="text-gray-800 text-sm font-medium">${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 300); 
    }, 4000);
}

export function showLoadingModal(text) {
    const txtEl = document.getElementById('loading-text');
    if(txtEl) txtEl.textContent = text;
    
    const prgEl = document.getElementById('loading-progress');
    if(prgEl) prgEl.textContent = '';
    
    document.getElementById('modal-loading')?.classList.remove('hidden');
}

export function updateLoadingProgress(text) {
    const prgEl = document.getElementById('loading-progress');
    if(prgEl) prgEl.textContent = text;
}

export function hideLoadingModal() {
    document.getElementById('modal-loading')?.classList.add('hidden');
}

export function populateSurveyors() {
    const container = document.getElementById('surveyor-checkboxes-container');
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5" id="surveyor-checkbox-grid">
            ${SURVEYORS.map((s, idx) => `
                <label class="flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer border border-gray-100 hover:border-gray-300 text-xs text-gray-800 transition-colors">
                    <input type="checkbox" name="surveyor_checkbox" value="${s}" class="surveyor-checkbox accent-[#025511] w-4 h-4 shrink-0">
                    <span class="truncate">${s}</span>
                </label>
            `).join('')}
        </div>
    `;

    const updateCount = () => {
        const checked = container.querySelectorAll('.surveyor-checkbox:checked');
        const countEl = document.getElementById('surveyor-selected-count');
        if (countEl) {
            countEl.textContent = `${checked.length} surveyor dipilih`;
        }
    };

    container.querySelectorAll('.surveyor-checkbox').forEach(cb => {
        cb.addEventListener('change', updateCount);
    });

    // Custom surveyor input addition
    const addBtn = document.getElementById('btn-add-custom-surveyor');
    const input = document.getElementById('input-custom-surveyor');

    const handleAddCustom = () => {
        const val = input?.value.trim();
        if (!val) return;

        const grid = document.getElementById('surveyor-checkbox-grid');
        if (grid) {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer border border-[#025511] bg-green-50/30 text-xs text-gray-900 transition-colors';
            label.innerHTML = `
                <input type="checkbox" name="surveyor_checkbox" value="${val}" checked class="surveyor-checkbox accent-[#025511] w-4 h-4 shrink-0">
                <span class="truncate font-semibold">${val} (Kustom)</span>
            `;
            label.querySelector('.surveyor-checkbox').addEventListener('change', updateCount);
            grid.prepend(label);
            updateCount();
            input.value = '';
            showToast(`Surveyor "${val}" ditambahkan & dipilih`, 'success');
        }
    };

    addBtn?.addEventListener('click', handleAddCustom);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustom();
        }
    });
}

export function populateSelects() {
    populateSurveyors();
    
    const fakultasSelect = document.getElementById('select-fakultas');
    if (fakultasSelect) {
        fakultasSelect.innerHTML = '<option value="">-- Pilih Fakultas/Unit --</option>' + 
            FAKULTAS_LIST.map(f => `<option value="${f}">${f}</option>`).join('');
    }
    
    const filterFakultas = document.getElementById('filter-fakultas');
    if (filterFakultas) {
        filterFakultas.innerHTML = '<option value="">Semua Fakultas</option>' + 
            FAKULTAS_LIST.map(f => `<option value="${f}">${f}</option>`).join('');
    }
}

