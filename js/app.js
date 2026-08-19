// js/app.js — Main Orchestrator
// This file imports all modules and wires them together.
// It handles cross-module event registration and DOMContentLoaded setup.

import { populateSelects, showToast } from './ui.js';
import { bindNavigation, bindStepNavigation, showView, onViewChange, onStepChange } from './navigation.js';
import { bindAddUnitButtons } from './units.js';
import { bindChecklistEvents } from './checklist.js';
import { bindBackupButtons } from './backup.js';
import { bindFilterRiwayat, loadRiwayat, downloadRekap } from './riwayat.js';
import { saveToFirestore } from './firestore.js';
import { validateForm, populateReviewSummary, resetForm } from './form.js';
import { generatePreview, downloadPDF } from './preview.js';
import { renderRecommendationEditor, initEditors } from './editor.js';
import { autoFillTestData } from './autofill.js';
import { initPinLock } from './auth.js';

// ─── Cross-module Callbacks ────────────────────────────────────────────
// These registrations avoid circular dependencies between modules.

onViewChange((viewName) => {
    if (viewName === 'riwayat' || viewName === 'dashboard') {
        loadRiwayat();
    }
});

onStepChange((stepName) => {
    if (stepName === 'review') populateReviewSummary();
});

// ─── Action Buttons Binding ────────────────────────────────────────────

function bindActionButtons() {
    // Save draft from review tab
    document.getElementById('btn-simpan-draf')?.addEventListener('click', () => {
        saveToFirestore('draf');
    });

    // Save draft from any section bottom button
    document.querySelectorAll('.btn-save-section').forEach(btn => {
        btn.addEventListener('click', () => {
            saveToFirestore('draf');
        });
    });

    // Auto-fill test data button
    document.getElementById('btn-autofill-test')?.addEventListener('click', () => {
        autoFillTestData();
    });

    document.getElementById('btn-simpan-final')?.addEventListener('click', () => {
        const errors = validateForm();
        if (errors.length > 0) {
            showToast(errors.join('<br>'), 'error');
            return;
        }
        saveToFirestore('final');
    });

    document.getElementById('btn-preview')?.addEventListener('click', () => {
        generatePreview();
        document.getElementById('modal-preview')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-preview')?.addEventListener('click', () => {
        document.getElementById('modal-preview')?.classList.add('hidden');
    });

    // Close modal on backdrop click
    document.getElementById('modal-preview')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.add('hidden');
        }
    });

    // Modal download PDF button (in modal header)
    document.getElementById('btn-download-pdf')?.addEventListener('click', () => {
        downloadPDF();
    });

    // Direct download PDF buttons (form top header & review action bar — generate then print)
    const triggerDownloadPDF = () => {
        generatePreview();
        downloadPDF();
    };
    document.getElementById('btn-direct-download-pdf')?.addEventListener('click', triggerDownloadPDF);
    document.getElementById('btn-quick-download-pdf')?.addEventListener('click', triggerDownloadPDF);
}

function bindDownloadRekap() {
    document.getElementById('btn-download-rekap')?.addEventListener('click', downloadRekap);
}

// ─── Application Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Set default date
    const dateInput = document.getElementById('input-tanggal');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Populate dropdown selects
    populateSelects();

    // Render Recommendation WYSIWYG Editors (APAR & Proteksi Pasif)
    const aparContainer = document.getElementById('recommendation-editor-apar-container');
    if (aparContainer) {
        aparContainer.innerHTML = renderRecommendationEditor(
            'apar', 
            'Rekomendasi & Tindak Lanjut APAR (Proteksi Aktif)', 
            'Tulis rekomendasi teknis perbaikan untuk APAR, sisipkan foto temuan, dan atur tata letak gambar.'
        );
    }

    const pasifContainer = document.getElementById('recommendation-editor-pasif-container');
    if (pasifContainer) {
        pasifContainer.innerHTML = renderRecommendationEditor(
            'pasif', 
            'Rekomendasi & Tindak Lanjut Proteksi Pasif', 
            'Tulis rekomendasi teknis perbaikan untuk keseluruhan proteksi pasif (Fire Alarm, Jalur Evakuasi, Pintu & Tangga Darurat), sisipkan foto temuan, dan atur tata letak gambar.'
        );
    }

    initEditors();

    // Bind all event listeners
    bindNavigation(resetForm);
    bindStepNavigation();
    bindAddUnitButtons();
    bindActionButtons();
    bindBackupButtons();
    bindFilterRiwayat();
    bindChecklistEvents();
    bindDownloadRekap();

    // Show dashboard as default view
    showView('dashboard');

    // Initialize Security PIN Lock
    initPinLock();
});
