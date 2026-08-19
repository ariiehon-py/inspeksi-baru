// js/auth.js — Tasteful PIN Lock System for UNAIR K3
const CORRECT_PIN = '19542026';
const STORAGE_KEY = 'unair_k3_auth_unlocked';

const ERROR_MESSAGES = [
    'PIN salah. Pastikan kamu anggota tim inspeksi K3.',
    'Akses ditolak. Periksa kembali PIN otorisasi tim.',
    'Belum tepat. Coba ketik kembali dengan teliti.',
    'PIN tidak cocok. Hubungi koordinator tim jika lupa.'
];

let currentInput = '';
let isChecking = false;

export function initPinLock() {
    const lockScreen = document.getElementById('pin-lock-overlay');
    if (!lockScreen) return;

    // Check if already unlocked in this browser session
    const isUnlocked = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (isUnlocked) {
        lockScreen.style.display = 'none';
    } else {
        lockScreen.style.display = 'flex';
        renderDots();
    }

    // Keyboard input listener
    window.addEventListener('keydown', (e) => {
        if (lockScreen.style.display === 'none') return;
        
        if (e.key >= '0' && e.key <= '9') {
            handleDigit(e.key);
        } else if (e.key === 'Backspace') {
            handleBackspace();
        } else if (e.key === 'Escape') {
            handleClear();
        }
    });

    // Numpad button click listener
    const numpad = document.getElementById('pin-numpad');
    if (numpad) {
        numpad.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-key]');
            if (!btn) return;
            const key = btn.getAttribute('data-key');
            if (key === 'clear') {
                handleClear();
            } else if (key === 'backspace') {
                handleBackspace();
            } else {
                handleDigit(key);
            }
        });
    }

    // Lock button in sidebar
    const btnLock = document.getElementById('btn-lock-app');
    if (btnLock) {
        btnLock.addEventListener('click', lockApp);
    }
    
    // Lock button in mobile header
    const btnLockMobile = document.getElementById('btn-lock-app-mobile');
    if (btnLockMobile) {
        btnLockMobile.addEventListener('click', lockApp);
    }
}

function handleDigit(digit) {
    if (isChecking) return;
    if (currentInput.length >= 8) return;
    
    currentInput += digit;
    renderDots();

    if (currentInput.length === 8) {
        verifyPin();
    }
}

function handleBackspace() {
    if (isChecking) return;
    if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        renderDots();
        clearError();
    }
}

function handleClear() {
    if (isChecking) return;
    currentInput = '';
    renderDots();
    clearError();
}

function renderDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
        if (idx < currentInput.length) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function verifyPin() {
    isChecking = true;
    const msgEl = document.getElementById('pin-status-message');
    const lockCard = document.getElementById('pin-lock-card');

    if (currentInput === CORRECT_PIN) {
        // Success
        if (msgEl) {
            msgEl.className = 'text-xs font-semibold text-[#025511] mt-3 h-5 transition-all';
            msgEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-[#025511]"></i> Akses diterima. Membuka sistem...';
        }
        
        sessionStorage.setItem(STORAGE_KEY, 'true');

        setTimeout(() => {
            const lockScreen = document.getElementById('pin-lock-overlay');
            if (lockScreen) {
                lockScreen.style.opacity = '0';
                lockScreen.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    lockScreen.style.display = 'none';
                    lockScreen.style.opacity = '1';
                    currentInput = '';
                    renderDots();
                    isChecking = false;
                }, 300);
            }
        }, 450);

    } else {
        // Error
        if (lockCard) {
            lockCard.classList.remove('pin-shake');
            void lockCard.offsetWidth; // trigger reflow
            lockCard.classList.add('pin-shake');
        }

        const randomMsg = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
        if (msgEl) {
            msgEl.className = 'text-xs font-semibold text-red-600 mt-3 h-5 transition-all';
            msgEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ${randomMsg}`;
        }

        // Highlight dots in red briefly
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach(d => d.classList.add('error'));

        setTimeout(() => {
            dots.forEach(d => d.classList.remove('error'));
            currentInput = '';
            renderDots();
            isChecking = false;
        }, 700);
    }
}

function clearError() {
    const msgEl = document.getElementById('pin-status-message');
    if (msgEl) {
        msgEl.className = 'text-xs text-gray-500 mt-3 h-5';
        msgEl.textContent = 'Ketik PIN 8-digit atau gunakan tombol di bawah';
    }
}

export function lockApp() {
    sessionStorage.removeItem(STORAGE_KEY);
    currentInput = '';
    renderDots();
    clearError();
    const lockScreen = document.getElementById('pin-lock-overlay');
    if (lockScreen) {
        lockScreen.style.display = 'flex';
    }
}