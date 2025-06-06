class Graph {
    constructor() {
        // Initialize properties
        this.canvas = null;
        this.ctx = null;
        this.nodes = new Map();
        this.targetPositions = new Map();
        this.currentPositions = new Map();
        this.isVisible = true;
        this.animationFrame = null;
        this.hoveredNodeId = null;

        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // Listen for dark mode changes
        this.setupDarkModeObserver();
    }

    init() {
        this.canvas = document.getElementById('graph-view');
        if (!this.canvas) {
            console.error('Graph canvas element not found on this page.');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.initializeCanvas();
        this.setupEventListeners();
        this.updateGraph();

        // Force a redraw after a short delay to ensure proper initialization
        setTimeout(() => this.updateGraph(), 100);
    }

    setupDarkModeObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    this.updateGraph();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    initializeCanvas() {
        const updateSize = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `${rect.height}px`;
            this.updateGraph();
        };

        updateSize();
        window.addEventListener('resize', () => {
            cancelAnimationFrame(this.animationFrame);
            updateSize();
        });
    }

    setupEventListeners() {
        if (!this.canvas) return;

        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * window.devicePixelRatio;
            const y = (event.clientY - rect.top) * window.devicePixelRatio;
            
            this.nodes.forEach((position, noteId) => {
                const distance = Math.sqrt(
                    Math.pow(position.x - x, 2) + 
                    Math.pow(position.y - y, 2)
                );
                
                if (distance < 15 * window.devicePixelRatio) {
                    this.highlightNode(noteId);
                }
            });
        });

        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * window.devicePixelRatio;
            const y = (event.clientY - rect.top) * window.devicePixelRatio;
            
            let hoveredNode = null;
            this.nodes.forEach((position, noteId) => {
                const distance = Math.sqrt(
                    Math.pow(position.x - x, 2) + 
                    Math.pow(position.y - y, 2)
                );
                if (distance < 15 * window.devicePixelRatio) {
                    hoveredNode = noteId;
                }
            });

            if (this.hoveredNodeId !== hoveredNode) {
                this.hoveredNodeId = hoveredNode;
                this.updateGraph();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredNodeId = null;
            this.updateGraph();
        });
    }

    drawNode(x, y, note, isHighlighted = false, isHovered = false) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const scale = window.devicePixelRatio;
        
        // Draw node shadow
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10 * scale, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fill();

        // Draw node
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
        
        if (isHighlighted) {
            this.ctx.fillStyle = '#4F46E5';
        } else if (isHovered) {
            this.ctx.fillStyle = '#818CF8';
        } else {
            this.ctx.fillStyle = isDarkMode ? '#6B7280' : '#9CA3AF';
        }
        
        this.ctx.fill();

        // Draw node border
        if (isHovered || isHighlighted) {
            this.ctx.strokeStyle = '#4F46E5';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.stroke();
        }

        // Draw note preview with background
        const preview = note.content.substring(0, 20) + (note.content.length > 20 ? '...' : '');
        this.ctx.font = `${14 * scale}px Inter`;
        
        // Measure text for background
        const textMetrics = this.ctx.measureText(preview);
        const textHeight = 20 * scale;
        const padding = 4 * scale;
        
        // Draw text background
        this.ctx.fillStyle = isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(
            x + 15 * scale - padding,
            y - textHeight/2 - padding,
            textMetrics.width + padding * 2,
            textHeight + padding * 2
        );

        // Draw text
        this.ctx.fillStyle = isDarkMode ? '#E5E7EB' : '#374151';
        this.ctx.fillText(preview, x + 15 * scale, y + 5 * scale);

        // Draw hashtags if any
        if (note.hashtags.length > 0) {
            const tags = note.hashtags.join(' ');
            this.ctx.font = `${12 * scale}px Inter`;
            
            // Draw hashtag background
            const tagMetrics = this.ctx.measureText(tags);
            this.ctx.fillStyle = isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(
                x + 15 * scale - padding,
                y + 15 * scale - padding,
                tagMetrics.width + padding * 2,
                20 * scale + padding * 2
            );

            // Draw hashtags
            this.ctx.fillStyle = isDarkMode ? '#9CA3AF' : '#6B7280';
            this.ctx.fillText(tags, x + 15 * scale, y + 25 * scale);
        }
    }

    drawEdge(startX, startY, endX, endY, isHighlighted = false) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const scale = window.devicePixelRatio;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        
        if (isHighlighted) {
            this.ctx.strokeStyle = '#4F46E5';
            this.ctx.lineWidth = 3 * scale;
        } else {
            this.ctx.strokeStyle = isDarkMode ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)';
            this.ctx.lineWidth = 2 * scale;
        }
        
        this.ctx.stroke();
    }

    highlightNode(noteId) {
        this.updateGraph(noteId);
    }

    updateGraph(highlightedNoteId = null) {
        if (!this.ctx || !this.canvas) return;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const scale = window.devicePixelRatio;
        
        // Clear the canvas with proper scaling
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const notes = noteModel.notes;
        if (notes.length === 0) {
            this.ctx.font = `${16 * scale}px Inter`;
            this.ctx.fillStyle = isDarkMode ? '#6B7280' : '#9CA3AF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                "No notes available",
                this.canvas.width / (2 * scale),
                this.canvas.height / (2 * scale)
            );
            return;
        }

        // Calculate target positions
        this.targetPositions.clear();
        const padding = 100 * scale;
        const availableWidth = this.canvas.width / scale - padding * 2;
        const availableHeight = this.canvas.height / scale - padding * 2;

        notes.forEach((note, index) => {
            const angle = (index / notes.length) * Math.PI * 2;
            const radius = Math.min(availableWidth, availableHeight) / 3;
            const x = (this.canvas.width / scale) / 2 + radius * Math.cos(angle);
            const y = (this.canvas.height / scale) / 2 + radius * Math.sin(angle);
            this.targetPositions.set(note.id, { x, y });

            // Initialize current positions if they don't exist
            if (!this.currentPositions.has(note.id)) {
                this.currentPositions.set(note.id, {
                    x: (this.canvas.width / scale) / 2,
                    y: (this.canvas.height / scale) / 2
                });
            }
        });

        // Animate to target positions
        const animate = () => {
            let needsUpdate = false;
            
            this.nodes.clear();
            this.targetPositions.forEach((target, id) => {
                const current = this.currentPositions.get(id);
                if (current) {
                    // Smooth animation
                    const dx = target.x - current.x;
                    const dy = target.y - current.y;
                    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                        current.x += dx * 0.1;
                        current.y += dy * 0.1;
                        needsUpdate = true;
                    } else {
                        current.x = target.x;
                        current.y = target.y;
                    }
                    this.nodes.set(id, { x: current.x, y: current.y });
                }
            });

            // Draw edges
            notes.forEach(note => {
                const startPos = this.nodes.get(note.id);
                note.connections.forEach(connectedId => {
                    const endPos = this.nodes.get(connectedId);
                    if (startPos && endPos) {
                        const isHighlighted = note.id === highlightedNoteId || 
                                           connectedId === highlightedNoteId;
                        this.drawEdge(
                            startPos.x,
                            startPos.y,
                            endPos.x,
                            endPos.y,
                            isHighlighted
                        );
                    }
                });
            });

            // Draw nodes
            notes.forEach(note => {
                const pos = this.nodes.get(note.id);
                if (pos) {
                    this.drawNode(
                        pos.x,
                        pos.y,
                        note,
                        note.id === highlightedNoteId,
                        note.id === this.hoveredNodeId
                    );
                }
            });

            if (needsUpdate) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        cancelAnimationFrame(this.animationFrame);
        animate();
    }
}

// Create a global instance
window.graph = new Graph();
