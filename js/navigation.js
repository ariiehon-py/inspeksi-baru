// js/navigation.js — View Switching & Step Navigation
import { state } from './state.js';
import { STEPS } from './constants.js';

// Callback registries — app.js will register callbacks to avoid circular deps
const viewChangeCallbacks = [];
const stepChangeCallbacks = [];

export function onViewChange(cb) { viewChangeCallbacks.push(cb); }
export function onStepChange(cb) { stepChangeCallbacks.push(cb); }

export function showView(viewName) {
    document.querySelectorAll('[id^="view-"]').forEach(v => {
        if(v.id === 'view-' + viewName) {
            v.style.display = 'block';
        } else {
            v.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active', 'text-primary-600'));
    document.querySelectorAll(`.nav-item[data-view="${viewName}"]`).forEach(n => {
        n.classList.add('active', 'text-primary-600');
    });
    
    state.currentView = viewName;
    window.scrollTo(0, 0);
    
    viewChangeCallbacks.forEach(cb => cb(viewName));
}

export function showStep(stepName, pushHistory = true) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active', 'block'));
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    
    const stepEl = document.querySelector(`.form-step[data-step="${stepName}"]`);
    if(stepEl) {
        stepEl.classList.add('active', 'block');
        stepEl.style.display = 'block';
    }
    
    // Update step indicator pills
    document.querySelectorAll('.step-indicator').forEach((ind) => {
        const indStep = ind.getAttribute('data-step');
        if (indStep === stepName) {
            ind.classList.add('active');
        } else {
            ind.classList.remove('active');
        }
    });
    
    // Show/hide prev/next buttons
    const stepIndex = STEPS.indexOf(stepName);
    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    if(prevBtn) prevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-flex';
    if(nextBtn) nextBtn.style.display = stepIndex === STEPS.length - 1 ? 'none' : 'inline-flex';
    
    state.currentStep = stepName;
    if (pushHistory) history.pushState({ view: 'form', step: stepName }, '', '#form/' + stepName);
    
    stepChangeCallbacks.forEach(cb => cb(stepName));
    window.scrollTo(0, 0);
}

export function bindNavigation(resetFormFn) {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            showView(view);
        });
    });

    const startNewInspection = () => {
        if (resetFormFn) resetFormFn();
        showView('form');
    };

    document.getElementById('btn-new-inspection')?.addEventListener('click', startNewInspection);
    document.getElementById('btn-new-inspection-header')?.addEventListener('click', startNewInspection);
    document.getElementById('btn-dashboard-to-riwayat')?.addEventListener('click', () => {
        showView('riwayat');
    });

    document.getElementById('btn-riwayat')?.addEventListener('click', () => {
        showView('riwayat');
    });
}

export function bindStepNavigation() {
    document.getElementById('btn-prev-step')?.addEventListener('click', () => {
        const idx = STEPS.indexOf(state.currentStep);
        if (idx > 0) showStep(STEPS[idx - 1]);
    });

    document.getElementById('btn-next-step')?.addEventListener('click', () => {
        const idx = STEPS.indexOf(state.currentStep);
        if (idx < STEPS.length - 1) showStep(STEPS[idx + 1]);
    });

    // Click on step indicators to jump directly to any step
    document.querySelectorAll('.step-indicator[data-step]').forEach(ind => {
        ind.style.cursor = 'pointer';
        ind.addEventListener('click', () => {
            const targetStep = ind.getAttribute('data-step');
            if (targetStep && targetStep !== state.currentStep) {
                showStep(targetStep);
            }
        });
    });

    window.addEventListener('popstate', (e) => {
        if (e.state) {
            if (e.state.view === 'form' && e.state.step) {
                showView('form');
                showStep(e.state.step, false);
            } else if (e.state.view) {
                showView(e.state.view);
            }
        } else {
            showView('dashboard');
        }
    });
}
