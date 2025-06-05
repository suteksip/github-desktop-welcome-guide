class Navigation {
    constructor() {
        this.totalElement = document.getElementById('total-notes');
        this.connectedElement = document.getElementById('connected-notes');
        this.unconnectedElement = document.getElementById('unconnected-notes');
    }

    updateCounters() {
        const stats = noteModel.getStats();
        
        this.totalElement.textContent = stats.total;
        this.connectedElement.textContent = stats.connected;
        this.unconnectedElement.textContent = stats.unconnected;
    }

    // Initialize the navigation counters
    initialize() {
        this.updateCounters();
    }
}

// Create a global instance
const navigation = new Navigation();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    navigation.initialize();
});
