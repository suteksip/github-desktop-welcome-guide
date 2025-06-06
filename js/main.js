class App {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.noteForm = document.getElementById('modal-note-form');
            this.notesList = document.getElementById('notes-list');
            this.setupEventListeners();
            this.renderNotes();
            
            // Initial graph update
            if (window.graph) {
                window.graph.updateGraph();
            }
        });
    }

    setupEventListeners() {
        // Handle note form submission
        this.noteForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNoteSubmission();
        });

        // Handle note deletion and canvas append
        this.notesList?.addEventListener('click', (e) => {
            const noteElement = e.target.closest('.note-item');
            if (!noteElement) return;

            if (e.target.classList.contains('delete-note')) {
                this.handleNoteDeletion(noteElement.dataset.noteId);
            } else if (e.target.classList.contains('append-to-canvas')) {
                this.handleAppendToCanvas(noteElement.dataset.noteId);
            }
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            const addNoteModal = document.getElementById('addnote-modal');
            const canvasModal = document.getElementById('canvas-modal');
            const fabActions = document.getElementById('fab-actions');

            if (e.target.classList.contains('modal-overlay')) {
                addNoteModal?.classList.add('hidden');
                canvasModal?.classList.add('hidden');
            }

            if (!e.target.closest('#fab-menu') && !e.target.closest('#fab-actions')) {
                fabActions?.classList.add('hidden');
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const addNoteModal = document.getElementById('addnote-modal');
                const canvasModal = document.getElementById('canvas-modal');
                const fabActions = document.getElementById('fab-actions');
                
                addNoteModal?.classList.add('hidden');
                canvasModal?.classList.add('hidden');
                fabActions?.classList.add('hidden');
            }
        });

        // FAB Menu toggle
        const fabMenu = document.getElementById('fab-menu');
        const fabActions = document.getElementById('fab-actions');
        fabMenu?.addEventListener('click', () => {
            fabActions?.classList.toggle('hidden');
        });

        // Open Add Note modal
        const openAddNoteBtn = document.getElementById('open-addnote-modal');
        openAddNoteBtn?.addEventListener('click', () => {
            const addNoteModal = document.getElementById('addnote-modal');
            fabActions?.classList.add('hidden');
            addNoteModal?.classList.remove('hidden');
            document.getElementById('modal-note-content').value = '';
            document.getElementById('modal-note-source').value = '';
        });

        // Open Canvas modal
        const openCanvasBtn = document.getElementById('open-canvas-modal');
        openCanvasBtn?.addEventListener('click', () => {
            const canvasModal = document.getElementById('canvas-modal');
            const modalCanvasText = document.getElementById('modal-canvas-text');
            fabActions?.classList.add('hidden');
            if (window.canvas && modalCanvasText) {
                modalCanvasText.value = window.canvas.getContent();
            }
            canvasModal?.classList.remove('hidden');
        });

        // Close modals
        const closeAddNoteBtn = document.getElementById('close-addnote-modal');
        const closeCanvasBtn = document.getElementById('close-canvas-modal');
        
        closeAddNoteBtn?.addEventListener('click', () => {
            const addNoteModal = document.getElementById('addnote-modal');
            addNoteModal?.classList.add('hidden');
        });

        closeCanvasBtn?.addEventListener('click', () => {
            const canvasModal = document.getElementById('canvas-modal');
            canvasModal?.classList.add('hidden');
        });

        // Handle canvas export
        const exportCanvasBtn = document.getElementById('export-canvas');
        exportCanvasBtn?.addEventListener('click', () => {
            this.handleCanvasExport();
        });
    }

    handleNoteSubmission() {
        const content = document.getElementById('modal-note-content')?.value || '';
        const source = document.getElementById('modal-note-source')?.value || '';

        try {
            noteModel.addNote(content, source);
            
            // Clear form
            if (document.getElementById('modal-note-content')) {
                document.getElementById('modal-note-content').value = '';
            }
            if (document.getElementById('modal-note-source')) {
                document.getElementById('modal-note-source').value = '';
            }
            document.getElementById('addnote-modal')?.classList.add('hidden');

            // Update UI
            this.renderNotes();
            navigation.updateCounters();
            
            // Update graph
            if (window.graph) {
                window.graph.updateGraph();
            }

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    handleNoteDeletion(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            noteModel.deleteNote(noteId);
            this.renderNotes();
            navigation.updateCounters();
            
            // Update graph
            if (window.graph) {
                window.graph.updateGraph();
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
            document.getElementById('canvas-modal')?.classList.remove('hidden');
        }
    }

    handleCanvasExport() {
        try {
            const modalCanvasText = document.getElementById('modal-canvas-text');
            if (window.canvas && modalCanvasText) {
                window.canvas.setContent(modalCanvasText.value);
                window.canvas.exportToJson();
                document.getElementById('canvas-modal')?.classList.add('hidden');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to export canvas: ' + error.message);
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

// Initialize the application
window.appInstance = new App();
