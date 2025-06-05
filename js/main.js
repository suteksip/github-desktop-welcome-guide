class App {
    constructor() {
        this.noteForm = document.getElementById('note-form');
        this.noteContent = document.getElementById('note-content');
        this.noteSource = document.getElementById('note-source');
        this.notesList = document.getElementById('notes-list');
        this.setupEventListeners();
        this.renderNotes();
    }

    setupEventListeners() {
        // Handle note form submission
        this.noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNoteSubmission();
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
        try {
            const content = this.noteContent.value;
            const source = this.noteSource.value;

            const note = noteModel.addNote(content, source);
            
            // Clear form
            this.noteContent.value = '';
            this.noteSource.value = '';

            // Update UI
            this.renderNotes();
            navigation.updateCounters();
            if (window.graph && typeof graph.updateGraph === 'function') {
                graph.updateGraph();
            }

        } catch (error) {
            logError(error);
            alert(error.message);
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
        if (note) {
            canvas.appendContent(note.content);
        }
    }

    createNoteElement(note) {
        const div = document.createElement('div');
        div.className = 'note-item bg-white p-4 rounded-lg shadow-sm border border-gray-200';
        div.dataset.noteId = note.id;

        const content = document.createElement('div');
        content.className = 'mb-2';
        content.textContent = note.content;

        const metadata = document.createElement('div');
        metadata.className = 'text-sm text-gray-500 mb-2';
        metadata.innerHTML = `
            <div>Date: ${formatDate(note.date)}</div>
            ${note.source ? `<div>Source: ${note.source}</div>` : ''}
            ${note.hashtags.length ? `<div>Tags: ${note.hashtags.join(' ')}</div>` : ''}
        `;

        const connections = document.createElement('div');
        connections.className = 'text-sm text-gray-500 mb-2';
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
            <button class="append-to-canvas px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                Add to Canvas
            </button>
            <button class="delete-note px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
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
        this.notesList.innerHTML = '';
        const notes = noteModel.notes;
        
        if (notes.length === 0) {
            this.notesList.innerHTML = `
                <div class="text-gray-500 text-center py-8">
                    No notes yet. Add your first note above!
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
