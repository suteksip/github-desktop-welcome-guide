class App {
    constructor() {
        // Wait for DOM to be fully loaded before initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Initialize dark mode
        this.setupDarkMode();
        
        // Initialize UI elements
        this.notesList = document.getElementById('notes-list');
        this.fabMenu = document.getElementById('fab-menu');
        this.fabActions = document.getElementById('fab-actions');
        this.addNoteModal = document.getElementById('addnote-modal');
        this.canvasModal = document.getElementById('canvas-modal');
        this.modalNoteForm = document.getElementById('modal-note-form');
        
        // Only setup event listeners if all required elements are found
        if (this.notesList && this.fabMenu && this.fabActions && 
            this.addNoteModal && this.canvasModal && this.modalNoteForm) {
            this.setupEventListeners();
            this.renderNotes();
        } else {
            console.error('Required UI elements not found');
        }
    }

    setupDarkMode() {
        const toggleButton = document.getElementById('dark-mode-toggle');
        const rootElement = document.documentElement;
        const iconPath = document.getElementById('icon-path');

        if (!toggleButton || !iconPath) return;

        // Set initial dark mode state
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'dark') {
            rootElement.classList.add('dark');
            iconPath.setAttribute('d', 'M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07 5.07l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 7a5 5 0 000 10 5 5 0 000-10z');
        }

        // Toggle dark mode
        toggleButton.addEventListener('click', () => {
            rootElement.classList.toggle('dark');
            const isDark = rootElement.classList.contains('dark');
            localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
            iconPath.setAttribute('d', isDark 
                ? 'M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07 5.07l-.7-.7M6.34 6.34l-.7-.7m12.02 12.02l-.7-.7M6.34 17.66l-.7-.7M12 7a5 5 0 000 10 5 5 0 000-10z'
                : 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'
            );
        });
    }

    setupEventListeners() {
        // FAB Menu toggle
        this.fabMenu.addEventListener('click', () => {
            this.fabActions.classList.toggle('hidden');
        });

        // Open Add Note modal
        const openAddNoteBtn = document.getElementById('open-addnote-modal');
        if (openAddNoteBtn) {
            openAddNoteBtn.addEventListener('click', () => {
                this.fabActions.classList.add('hidden');
                this.addNoteModal.classList.remove('hidden');
                document.getElementById('modal-note-content').value = '';
                document.getElementById('modal-note-source').value = '';
            });
        }

        // Open Canvas modal
        const openCanvasBtn = document.getElementById('open-canvas-modal');
        if (openCanvasBtn) {
            openCanvasBtn.addEventListener('click', () => {
                this.fabActions.classList.add('hidden');
                this.canvasModal.classList.remove('hidden');
                const modalCanvasText = document.getElementById('modal-canvas-text');
                if (window.canvas && modalCanvasText) {
                    modalCanvasText.value = window.canvas.getContent();
                }
            });
        }

        // Close modals
        const closeAddNoteBtn = document.getElementById('close-addnote-modal');
        if (closeAddNoteBtn) {
            closeAddNoteBtn.addEventListener('click', () => {
                this.addNoteModal.classList.add('hidden');
            });
        }

        const closeCanvasBtn = document.getElementById('close-canvas-modal');
        if (closeCanvasBtn) {
            closeCanvasBtn.addEventListener('click', () => {
                this.canvasModal.classList.add('hidden');
            });
        }

        // Handle note form submission
        this.modalNoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNoteSubmission();
        });

        // Handle canvas export
        const exportCanvasBtn = document.getElementById('export-canvas');
        if (exportCanvasBtn) {
            exportCanvasBtn.addEventListener('click', () => {
                this.handleCanvasExport();
            });
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.addNoteModal.classList.add('hidden');
                this.canvasModal.classList.add('hidden');
            }
            if (!e.target.closest('#fab-menu') && !e.target.closest('#fab-actions')) {
                this.fabActions.classList.add('hidden');
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.addNoteModal.classList.add('hidden');
                this.canvasModal.classList.add('hidden');
                this.fabActions.classList.add('hidden');
            }
        });

        // Handle note deletion and canvas append
        this.notesList.addEventListener('click', (e) => {
            const noteElement = e.target.closest('.note-item');
            if (!noteElement) return;

            if (e.target.classList.contains('delete-note')) {
                this.handleNoteDeletion(noteElement.dataset.noteId);
            } else if (e.target.classList.contains('append-to-canvas')) {
                this.handleAppendToCanvas(noteElement.dataset.noteId);
            }
        });
    }

    handleNoteSubmission() {
        const content = document.getElementById('modal-note-content')?.value || '';
        const source = document.getElementById('modal-note-source')?.value || '';

        try {
            noteModel.addNote(content, source);
            this.modalNoteForm.reset();
            this.addNoteModal.classList.add('hidden');
            this.renderNotes();
            navigation.updateCounters();
            if (window.graph && typeof graph.updateGraph === 'function') {
                graph.updateGraph();
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    handleCanvasExport() {
        try {
            const modalCanvasText = document.getElementById('modal-canvas-text');
            if (window.canvas && modalCanvasText) {
                window.canvas.setContent(modalCanvasText.value);
                window.canvas.exportToJson();
                this.canvasModal.classList.add('hidden');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to export canvas: ' + error.message);
        }
    }

    handleNoteDeletion(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            noteModel.deleteNote(noteId);
            this.renderNotes();
            navigation.updateCounters();
            if (window.graph && typeof graph.updateGraph === 'function') {
                graph.updateGraph();
            }
        }
    }

    handleAppendToCanvas(noteId) {
        const note = noteModel.getNoteById(noteId);
        if (note && window.canvas) {
            window.canvas.appendContent(note.content);
            const modalCanvasText = document.getElementById('modal-canvas-text');
            if (modalCanvasText) {
                modalCanvasText.value = window.canvas.getContent();
            }
            this.canvasModal.classList.remove('hidden');
        }
    }

    createNoteElement(note) {
        const div = document.createElement('div');
        div.className = 'note-item bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4';
        div.dataset.noteId = note.id;

        const content = document.createElement('div');
        content.className = 'mb-2 text-gray-900 dark:text-gray-100';
        content.textContent = note.content;

        const hashtags = note.hashtags.map(tag => 
            `<span class="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-sm mr-2">${tag}</span>`
        ).join('');

        const metadata = document.createElement('div');
        metadata.className = 'text-sm text-gray-500 dark:text-gray-400 mb-2';
        metadata.innerHTML = `
            <div>Date: ${formatDate(note.date)}</div>
            ${note.source ? `<div>Source: ${note.source}</div>` : ''}
            ${hashtags ? `<div class="mt-2">${hashtags}</div>` : ''}
        `;

        const connections = document.createElement('div');
        connections.className = 'text-sm text-gray-500 dark:text-gray-400 mb-2';
        if (note.connections.length > 0) {
            const connectedNotes = note.connections.map(id => {
                const connectedNote = noteModel.getNoteById(id);
                return connectedNote ? connectedNote.content.substring(0, 30) + '...' : 'Unknown';
            });
            connections.textContent = `Connected to ${note.connections.length} note(s)`;
        }

        const actions = document.createElement('div');
        actions.className = 'flex space-x-2 mt-2';
        actions.innerHTML = `
            <button class="append-to-canvas px-2 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-500">
                Add to Canvas
            </button>
            <button class="delete-note px-2 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800">
                Delete
            </button>
        `;

        div.appendChild(content);
        div.appendChild(metadata);
        div.appendChild(connections);
        div.appendChild(actions);

        return div;
    }

    renderNotes() {
        if (!this.notesList) return;
        
        this.notesList.innerHTML = '';
        const notes = noteModel.notes;
        
        if (notes.length === 0) {
            this.notesList.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    No notes yet. Click the + button to add one!
                </div>
            `;
            return;
        }

        notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            this.notesList.appendChild(noteElement);
        });
    }
}

// Create global instance
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
