// js/auth.js — Pure Stealth PIN Lock
const CORRECT_PIN = '19542026';
const STORAGE_KEY = 'unair_k3_auth_unlocked';

let currentInput = '';
let isChecking = false;

export function initPinLock() {
    const lockScreen = document.getElementById('pin-lock-overlay');
    if (!lockScreen) return;

    const isUnlocked = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (isUnlocked) {
        lockScreen.style.display = 'none';
    } else {
        lockScreen.style.display = 'flex';
        renderDots();
    }

    // Keyboard listener
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
    }
}

function handleClear() {
    if (isChecking) return;
    currentInput = '';
    renderDots();
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
    const lockCard = document.getElementById('pin-lock-card');
    const dots = document.querySelectorAll('.pin-dot');

    if (currentInput === CORRECT_PIN) {
        sessionStorage.setItem(STORAGE_KEY, 'true');

        setTimeout(() => {
            const lockScreen = document.getElementById('pin-lock-overlay');
            if (lockScreen) {
                lockScreen.style.opacity = '0';
                lockScreen.style.transition = 'opacity 0.25s ease';
                setTimeout(() => {
                    lockScreen.style.display = 'none';
                    lockScreen.style.opacity = '1';
                    currentInput = '';
                    renderDots();
                    isChecking = false;
                }, 250);
            }
        }, 300);

    } else {
        if (lockCard) {
            lockCard.classList.remove('pin-shake');
            void lockCard.offsetWidth;
            lockCard.classList.add('pin-shake');
        }

        dots.forEach(d => d.classList.add('error'));

        setTimeout(() => {
            dots.forEach(d => d.classList.remove('error'));
            currentInput = '';
            renderDots();
            isChecking = false;
        }, 550);
    }
}

export function lockApp() {
    sessionStorage.removeItem(STORAGE_KEY);
    currentInput = '';
    renderDots();
    const lockScreen = document.getElementById('pin-lock-overlay');
    if (lockScreen) {
        lockScreen.style.display = 'flex';
    }
}