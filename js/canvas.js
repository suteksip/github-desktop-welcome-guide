class Canvas {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.textArea = document.getElementById('modal-canvas-text');
            this.exportButton = document.getElementById('export-canvas');
            if (this.exportButton) {
                this.setupEventListeners();
            }
        });
    }

    setupEventListeners() {
        this.exportButton.addEventListener('click', () => this.exportToJson());
    }

    // Get the current canvas text content
    getContent() {
        return this.textArea ? this.textArea.value.trim() : '';
    }

    // Set the canvas text content
    setContent(content) {
        if (this.textArea) {
            this.textArea.value = content;
        }
    }

    // Add text to the canvas
    appendContent(content) {
        const currentContent = this.getContent();
        const separator = currentContent ? '\n\n' : '';
        this.setContent(currentContent + separator + content);
    }

    // Export canvas content and related notes as JSON
    exportToJson() {
        try {
            const content = this.getContent();
            if (!content) {
                throw new Error('Canvas is empty');
            }

            // Create export data structure
            const exportData = {
                canvasContent: content,
                timestamp: new Date().toISOString(),
                relatedNotes: [],
                hashtags: extractHashtags(content),
                keywords: extractKeywords(content)
            };

            // Find related notes based on content
            noteModel.notes.forEach(note => {
                const hasCommonHashtags = note.hashtags.some(tag => 
                    exportData.hashtags.includes(tag)
                );
                const hasCommonKeywords = note.keywords.some(keyword => 
                    exportData.keywords.includes(keyword)
                );

                if (hasCommonHashtags || hasCommonKeywords) {
                    exportData.relatedNotes.push({
                        id: note.id,
                        content: note.content,
                        source: note.source,
                        date: note.date,
                        hashtags: note.hashtags
                    });
                }
            });

            // Create and download the JSON file
            const blob = new Blob(
                [JSON.stringify(exportData, null, 2)], 
                { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `notes-export-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Clear the canvas after successful export
            if (confirm('Export successful. Would you like to clear the canvas?')) {
                this.setContent('');
            }
        } catch (error) {
            logError(error);
            alert('Failed to export: ' + error.message);
        }
    }
}

// Create a global instance
window.canvas = new Canvas();
