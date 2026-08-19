// js/editor.js — Rich Text Recommendation Editor with Word-like Image Adjustments
import { compressPhoto } from './photos.js';
import { showToast } from './ui.js';

// Helper to format text inside active contenteditable
export function formatDoc(cmd, value = null) {
    document.execCommand(cmd, false, value);
}

// Generate the HTML toolbar and editable canvas for a section
export function renderRecommendationEditor(sectionId, title = 'Rekomendasi & Tindak Lanjut Perbaikan', subtitle = 'Tulis rekomendasi teknis, sisipkan foto temuan, dan atur tata letak gambar seperti di dokumen Word.') {
    return `
    <div class="recommendation-editor-box mt-6 pt-5 border-t border-gray-200" data-section="${sectionId}">
        <div class="flex items-center justify-between mb-2">
            <div>
                <h4 class="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <i class="fa-solid fa-pen-to-square text-green-700"></i>
                    ${title}
                </h4>
                <p class="text-[11px] text-gray-500">${subtitle}</p>
            </div>
        </div>

        <!-- Word-like Toolbar -->
        <div class="editor-toolbar bg-gray-50 border border-gray-300 rounded-t p-1.5 flex flex-wrap items-center gap-1 text-xs">
            <!-- Text Styles -->
            <button type="button" data-cmd="bold" title="Tebal (Ctrl+B)" class="editor-btn font-bold px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <b>B</b>
            </button>
            <button type="button" data-cmd="italic" title="Miring (Ctrl+I)" class="editor-btn italic px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i>I</i>
            </button>
            <button type="button" data-cmd="underline" title="Garis Bawah (Ctrl+U)" class="editor-btn underline px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <u>U</u>
            </button>

            <span class="w-[1px] h-4 bg-gray-300 mx-1"></span>

            <!-- Headings / Paragraph -->
            <select data-cmd="formatBlock" class="editor-select text-xs bg-white border border-gray-300 rounded px-1.5 py-1 outline-none">
                <option value="p">Normal (Teks)</option>
                <option value="h3">Judul Bagian (H3)</option>
                <option value="h4">Sub Judul (H4)</option>
                <option value="blockquote">Kutipan / Catatan</option>
            </select>

            <span class="w-[1px] h-4 bg-gray-300 mx-1"></span>

            <!-- Alignment -->
            <button type="button" data-cmd="justifyLeft" title="Rata Kiri" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-align-left"></i>
            </button>
            <button type="button" data-cmd="justifyCenter" title="Rata Tengah" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-align-center"></i>
            </button>
            <button type="button" data-cmd="justifyRight" title="Rata Kanan" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-align-right"></i>
            </button>
            <button type="button" data-cmd="justifyFull" title="Rata Kanan-Kiri" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-align-justify"></i>
            </button>

            <span class="w-[1px] h-4 bg-gray-300 mx-1"></span>

            <!-- Lists -->
            <button type="button" data-cmd="insertUnorderedList" title="Daftar Poin (Bullets)" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-list-ul"></i>
            </button>
            <button type="button" data-cmd="insertOrderedList" title="Daftar Nomor (Numbered)" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 border border-transparent">
                <i class="fa-solid fa-list-ol"></i>
            </button>

            <span class="w-[1px] h-4 bg-gray-300 mx-1"></span>

            <!-- Image Insertion -->
            <label class="btn btn-secondary text-xs py-1 px-2.5 cursor-pointer bg-white hover:bg-gray-100 border-gray-300">
                <i class="fa-solid fa-image text-green-700 mr-1"></i> Sisipkan Gambar
                <input type="file" multiple accept="image/*" class="hidden editor-img-upload" data-section="${sectionId}">
            </label>

            <!-- Clear Format -->
            <button type="button" data-cmd="removeFormat" title="Hapus Format" class="editor-btn px-2 py-1 rounded hover:bg-gray-200 text-gray-500 ml-auto border border-transparent">
                <i class="fa-solid fa-eraser"></i>
            </button>
        </div>

        <!-- Editable Area Canvas -->
        <div id="editor-rekomendasi-${sectionId}" class="rich-editor-canvas bg-white border border-t-0 border-gray-300 rounded-b p-4 min-h-[160px] text-sm text-gray-800 focus:outline-none overflow-auto" contenteditable="true" placeholder="Tuliskan rekomendasi teknis perbaikan di sini... (Klik toolbar di atas untuk format teks atau tambah foto)"></div>
    </div>
    `;
}

// Global active image tracking for floating context menu
let selectedImage = null;

// Bind all events for rich text editors
export function initEditors() {
    // Toolbar button clicks
    document.querySelectorAll('.editor-toolbar').forEach(toolbar => {
        toolbar.querySelectorAll('.editor-btn[data-cmd]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.getAttribute('data-cmd');
                const section = btn.closest('.recommendation-editor-box')?.getAttribute('data-section');
                const canvas = document.getElementById(`editor-rekomendasi-${section}`);
                if (canvas) canvas.focus();
                formatDoc(cmd);
            });
        });

        // Dropdown block format
        toolbar.querySelector('.editor-select')?.addEventListener('change', (e) => {
            const val = e.target.value;
            const section = e.target.closest('.recommendation-editor-box')?.getAttribute('data-section');
            const canvas = document.getElementById(`editor-rekomendasi-${section}`);
            if (canvas) canvas.focus();
            formatDoc('formatBlock', `<${val}>`);
        });

        // Image upload into editor
        toolbar.querySelector('.editor-img-upload')?.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            const section = e.target.getAttribute('data-section');
            const canvas = document.getElementById(`editor-rekomendasi-${section}`);
            if (!files.length || !canvas) return;

            canvas.focus();

            for (const file of files) {
                try {
                    const base64 = await compressPhoto(file);
                    insertImageToEditor(canvas, base64);
                } catch (err) {
                    showToast('Gagal memproses gambar: ' + err.message, 'error');
                }
            }
            e.target.value = '';
        });
    });

    // Delegated click on editor images to show image control tools
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.rich-editor-canvas img');
        const popover = document.getElementById('editor-image-controls');

        if (img) {
            selectedImage = img;
            showImageControlPopover(img);
        } else if (!e.target.closest('#editor-image-controls')) {
            if (popover) popover.style.display = 'none';
            selectedImage = null;
        }
    });

    createImageControlPopover();
}

function insertImageToEditor(canvas, base64) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-img-wrapper inline-block my-2 mx-1 relative group cursor-pointer text-center';
    wrapper.innerHTML = `
        <img src="${base64}" class="editor-inserted-img rounded border border-gray-300 max-w-full h-auto transition-all" style="width: 50%; display: inline-block;" alt="Foto Rekomendasi">
        <div class="text-[10px] text-gray-400 mt-0.5 italic">(Klik foto untuk atur posisi/ukuran)</div>
    `;
    
    // Insert at cursor or append
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvas.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.insertNode(wrapper);
        range.collapse(false);
    } else {
        canvas.appendChild(wrapper);
    }
    // Add a trailing newline
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    canvas.appendChild(p);
}

// Floating Image Control Popover (Word-like image adjustment)
function createImageControlPopover() {
    if (document.getElementById('editor-image-controls')) return;

    const popover = document.createElement('div');
    popover.id = 'editor-image-controls';
    popover.className = 'fixed z-50 bg-white border border-gray-300 shadow-xl rounded p-2 flex items-center gap-1 text-xs text-gray-700 hidden';
    popover.innerHTML = `
        <div class="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase">Ukuran:</span>
            <button type="button" class="img-btn-size px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-size="25%">25%</button>
            <button type="button" class="img-btn-size px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-size="50%">50%</button>
            <button type="button" class="img-btn-size px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-size="75%">75%</button>
            <button type="button" class="img-btn-size px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-size="100%">100%</button>
        </div>
        <div class="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase">Posisi:</span>
            <button type="button" class="img-btn-align px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-align="left" title="Rata Kiri"><i class="fa-solid fa-align-left"></i></button>
            <button type="button" class="img-btn-align px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-align="center" title="Rata Tengah"><i class="fa-solid fa-align-center"></i></button>
            <button type="button" class="img-btn-align px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-align="right" title="Rata Kanan"><i class="fa-solid fa-align-right"></i></button>
            <button type="button" class="img-btn-align px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-align="float-left" title="Float Kiri (Wrap Text)"><i class="fa-solid fa-indent"></i> Wrap L</button>
            <button type="button" class="img-btn-align px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-100" data-align="float-right" title="Float Kanan (Wrap Text)"><i class="fa-solid fa-outdent"></i> Wrap R</button>
        </div>
        <button type="button" id="img-btn-delete" class="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-0.5 rounded border border-red-200" title="Hapus Foto">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    document.body.appendChild(popover);

    // Event listeners for size
    popover.querySelectorAll('.img-btn-size').forEach(b => {
        b.addEventListener('click', () => {
            if (!selectedImage) return;
            const size = b.getAttribute('data-size');
            selectedImage.style.width = size;
            showImageControlPopover(selectedImage);
        });
    });

    // Event listeners for alignment
    popover.querySelectorAll('.img-btn-align').forEach(b => {
        b.addEventListener('click', () => {
            if (!selectedImage) return;
            const align = b.getAttribute('data-align');
            const wrapper = selectedImage.closest('.editor-img-wrapper') || selectedImage;

            if (align === 'left') {
                wrapper.style.float = 'none';
                wrapper.style.display = 'block';
                wrapper.style.margin = '10px auto 10px 0';
                wrapper.style.textAlign = 'left';
            } else if (align === 'center') {
                wrapper.style.float = 'none';
                wrapper.style.display = 'block';
                wrapper.style.margin = '10px auto';
                wrapper.style.textAlign = 'center';
            } else if (align === 'right') {
                wrapper.style.float = 'none';
                wrapper.style.display = 'block';
                wrapper.style.margin = '10px 0 10px auto';
                wrapper.style.textAlign = 'right';
            } else if (align === 'float-left') {
                wrapper.style.float = 'left';
                wrapper.style.display = 'inline-block';
                wrapper.style.margin = '6px 14px 6px 0';
            } else if (align === 'float-right') {
                wrapper.style.float = 'right';
                wrapper.style.display = 'inline-block';
                wrapper.style.margin = '6px 0 6px 14px';
            }
            showImageControlPopover(selectedImage);
        });
    });

    // Delete image
    document.getElementById('img-btn-delete')?.addEventListener('click', () => {
        if (!selectedImage) return;
        const wrapper = selectedImage.closest('.editor-img-wrapper');
        if (wrapper) wrapper.remove();
        else selectedImage.remove();
        popover.style.display = 'none';
        selectedImage = null;
    });
}

function showImageControlPopover(img) {
    const popover = document.getElementById('editor-image-controls');
    if (!popover) return;
    const rect = img.getBoundingClientRect();
    popover.style.display = 'flex';
    popover.style.top = `${Math.max(10, rect.top - 48 + window.scrollY)}px`;
    popover.style.left = `${Math.max(10, rect.left + window.scrollX)}px`;
}

// Get rich text content of a section
export function getSectionRecommendation(sectionId) {
    const canvas = document.getElementById(`editor-rekomendasi-${sectionId}`);
    return canvas ? canvas.innerHTML.trim() : '';
}

// Set rich text content of a section
export function setSectionRecommendation(sectionId, htmlContent) {
    const canvas = document.getElementById(`editor-rekomendasi-${sectionId}`);
    if (canvas) {
        canvas.innerHTML = htmlContent || '';
    }
}
