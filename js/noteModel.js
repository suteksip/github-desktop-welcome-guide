class NoteModel {
    constructor() {
        this.notes = [];
        this.loadNotes();
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('notes');
        if (savedNotes) {
            try {
                this.notes = JSON.parse(savedNotes);
            } catch (error) {
                logError('Failed to load notes from storage');
                this.notes = [];
            }
        }
    }

    saveNotes() {
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        } catch (error) {
            logError('Failed to save notes to storage');
        }
    }

    addNote(content, source = '') {
        if (!content.trim()) {
            throw new Error('Note content cannot be empty');
        }

        const note = {
            id: generateUUID(),
            content: content.trim(),
            source: source.trim(),
            date: new Date().toISOString(),
            hashtags: extractHashtags(content),
            keywords: extractKeywords(content),
            connections: []
        };

        this.notes.push(note);
        this.updateConnections(note);
        this.saveNotes();
        return note;
    }

    updateConnections(newNote) {
        this.notes.forEach(existingNote => {
            if (existingNote.id === newNote.id) return;

            const hasCommonHashtags = newNote.hashtags.some(tag => 
                existingNote.hashtags.includes(tag)
            );

            const hasCommonKeywords = newNote.keywords.some(keyword => 
                existingNote.keywords.includes(keyword)
            );

            if (hasCommonHashtags || hasCommonKeywords) {
                newNote.connections.push(existingNote.id);
                existingNote.connections.push(newNote.id);
            }
        });
    }

    getNoteById(id) {
        return this.notes.find(note => note.id === id);
    }

    deleteNote(id) {
        const index = this.notes.findIndex(note => note.id === id);
        if (index !== -1) {
            // Remove connections to this note from other notes
            const noteToDelete = this.notes[index];
            noteToDelete.connections.forEach(connectedId => {
                const connectedNote = this.getNoteById(connectedId);
                if (connectedNote) {
                    connectedNote.connections = connectedNote.connections.filter(id => id !== noteToDelete.id);
                }
            });

            // Remove the note
            this.notes.splice(index, 1);
            this.saveNotes();
        }
    }

    getStats() {
        const total = this.notes.length;
        const connected = this.notes.filter(note => note.connections.length > 0).length;
        return {
            total,
            connected,
            unconnected: total - connected
        };
    }

    manuallyConnect(noteId1, noteId2) {
        const note1 = this.getNoteById(noteId1);
        const note2 = this.getNoteById(noteId2);

        if (note1 && note2) {
            if (!note1.connections.includes(noteId2)) {
                note1.connections.push(noteId2);
            }
            if (!note2.connections.includes(noteId1)) {
                note2.connections.push(noteId1);
            }
            this.saveNotes();
        }
    }
}

// Create a global instance
const noteModel = new NoteModel();
