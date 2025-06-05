class Graph {
    constructor() {
        this.canvas = document.getElementById('graph-view');
        if (!this.canvas) {
            console.error('Graph canvas element not found on this page.');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.nodes = new Map(); // Map of note id to position
        this.isVisible = true;
        this.initializeCanvas();
        this.setupEventListeners();
    }

    initializeCanvas() {
        const updateSize = () => {
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = 600; // Increased fixed height for better visibility
                this.canvas.style.height = '600px'; // Ensure the canvas style height matches
                this.canvas.style.display = 'block'; // Make sure canvas is visible
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
    }

    setupEventListeners() {
        // Handle click events on the canvas
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Check if a node was clicked
            this.nodes.forEach((position, noteId) => {
                const distance = Math.sqrt(
                    Math.pow(position.x - x, 2) + 
                    Math.pow(position.y - y, 2)
                );
                
                if (distance < 10) { // Node radius + some padding
                    this.highlightNode(noteId);
                }
            });
        });
    }

    drawNode(x, y, note, isHighlighted = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2); // Increased node size for better visibility
        this.ctx.fillStyle = isHighlighted ? '#4F46E5' : '#6B7280';
        this.ctx.fill();

        // Draw note preview
        this.ctx.font = '14px Inter'; // Increased font size
        this.ctx.fillStyle = '#374151';
        const preview = note.content.substring(0, 20) + (note.content.length > 20 ? '...' : '');
        this.ctx.fillText(preview, x + 15, y + 5);

        // Draw hashtags if any
        if (note.hashtags.length > 0) {
            this.ctx.font = '12px Inter';
            this.ctx.fillStyle = '#6B7280';
            this.ctx.fillText(note.hashtags.join(' '), x + 15, y + 25);
        }
    }

    drawEdge(startX, startY, endX, endY) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = '#E5E7EB';
        this.ctx.lineWidth = 2; // Increased line width for better visibility
        this.ctx.stroke();
    }

    highlightNode(noteId) {
        this.updateGraph(noteId);
    }

    updateGraph(highlightedNoteId = null) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const notes = noteModel.notes;
        if (notes.length === 0) {
            // Display a friendly message when no notes exist
            this.ctx.font = '16px Inter';
            this.ctx.fillStyle = '#9CA3AF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("No notes available", this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // Position nodes
        this.nodes.clear();
        const padding = 100; // Increased padding for better spacing
        const availableWidth = this.canvas.width - padding * 2;
        const availableHeight = this.canvas.height - padding * 2;

        // Calculate positions
        notes.forEach((note, index) => {
            const angle = (index / notes.length) * Math.PI * 2;
            const radius = Math.min(availableWidth, availableHeight) / 3;
            const x = padding + availableWidth/2 + radius * Math.cos(angle);
            const y = padding + availableHeight/2 + radius * Math.sin(angle);
            this.nodes.set(note.id, { x, y });
        });

        // Draw edges first
        notes.forEach(note => {
            const startPos = this.nodes.get(note.id);
            note.connections.forEach(connectedId => {
                const endPos = this.nodes.get(connectedId);
                if (startPos && endPos) {
                    this.drawEdge(startPos.x, startPos.y, endPos.x, endPos.y);
                }
            });
        });

        // Draw nodes on top
        notes.forEach(note => {
            const pos = this.nodes.get(note.id);
            if (pos) {
                this.drawNode(
                    pos.x, 
                    pos.y, 
                    note, 
                    note.id === highlightedNoteId
                );
            }
        });
    }
}

// Create a global instance only if the canvas exists
if (document.getElementById('graph-view')) {
    const graph = new Graph();
    // Update the graph once the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        graph.updateGraph();
    });
}
