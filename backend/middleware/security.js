// Security middleware for additional checks

const suspiciousKeywords = [
    'password', 'login', 'signin', 'account', 'verify', 
    'update', 'secure', 'bank', 'paypal', 'confirm',
    'urgent', 'immediate', 'suspended', 'blocked'
];

function checkSuspiciousContent(text) {
    const lowerText = text.toLowerCase();
    const found = suspiciousKeywords.filter(keyword => lowerText.includes(keyword));
    return found;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '')
        .trim();
}

function logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
}

module.exports = {
    checkSuspiciousContent,
    sanitizeInput,
    logSecurityEvent
};
