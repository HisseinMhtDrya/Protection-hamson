const rateLimit = require('express-rate-limit');

// Different rate limits for different endpoints
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: 'Trop de tentatives d\'analyse. Veuillez réessayer dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

const moderateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: 'Limite de requêtes atteinte. Veuillez ralentir.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    strictLimiter,
    moderateLimiter
};
