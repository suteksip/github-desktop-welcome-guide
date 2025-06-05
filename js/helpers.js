// Generate a unique identifier for notes
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Extract hashtags from text
function extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
}

// Extract keywords (words longer than 3 characters)
function extractKeywords(text) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
    return [...new Set(words)]; // Remove duplicates
}

// Simple error logging
function logError(error) {
    console.error('Error:', error);
    // You could also add UI error reporting here
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleString();
}
