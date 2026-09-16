const express = require('express');
const router = express.Router();
const axios = require('axios');
const { validateUrl } = require('../middleware/validation');
const { strictLimiter } = require('../middleware/rateLimiter');
const { logSecurityEvent } = require('../middleware/security');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Apply strict rate limiting to URL analysis
router.post('/url', strictLimiter, validateUrl, async (req, res) => {
    try {
        const { url } = req.body;
        
        logSecurityEvent('URL_ANALYSIS_REQUEST', { url, ip: req.ip });
        
        // Try to forward request to AI service
        let result;
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/predict/url`, {
                url: url
            }, {
                timeout: 10000 // 10 second timeout
            });
            result = response.data;
        } catch (aiError) {
            console.log('AI service unavailable, using demo mode:', aiError.message);
            // Demo mode - simulate AI analysis
            result = simulateUrlAnalysis(url);
        }
        
        logSecurityEvent('URL_ANALYSIS_RESULT', { 
            url, 
            is_phishing: result.is_phishing, 
            score: result.score 
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Error analyzing URL:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'Service IA non disponible',
                message: 'Le service d\'analyse n\'est pas accessible'
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Délai d\'attente dépassé',
                message: 'L\'analyse a pris trop de temps'
            });
        }
        
        res.status(500).json({
            error: 'Erreur lors de l\'analyse',
            message: error.message
        });
    }
});

// Demo mode - simulate AI analysis for URLs with XAI
function simulateUrlAnalysis(url) {
    const suspiciousPatterns = [
        { pattern: /apple-support/i, weight: 35, description: 'Imitation Apple Support' },
        { pattern: /paypal-secure/i, weight: 40, description: 'Imitation PayPal sécurisé' },
        { pattern: /paypal-verification/i, weight: 45, description: 'Imitation PayPal vérification' },
        { pattern: /netflix-account/i, weight: 35, description: 'Imitation Netflix compte' },
        { pattern: /amazon-update/i, weight: 35, description: 'Imitation Amazon mise à jour' },
        { pattern: /microsoft-security/i, weight: 35, description: 'Imitation Microsoft sécurité' },
        { pattern: /-security\./i, weight: 30, description: 'Mot "security" dans le domaine' },
        { pattern: /-support\./i, weight: 30, description: 'Mot "support" dans le domaine' },
        { pattern: /-verify\./i, weight: 35, description: 'Mot "verify" dans le domaine' },
        { pattern: /-verification\./i, weight: 40, description: 'Mot "verification" dans le domaine' },
        { pattern: /\.xyz$/i, weight: 25, description: 'TLD .xyz (souvent utilisé pour phishing)' },
        { pattern: /\.top$/i, weight: 25, description: 'TLD .top (souvent utilisé pour phishing)' },
        { pattern: /\.info$/i, weight: 20, description: 'TLD .info (risque élevé)' },
        { pattern: /\.net$/i, weight: 10, description: 'TLD .net (risque modéré)' },
        { pattern: /login\.php/i, weight: 20, description: 'Fichier login.php suspect' },
        { pattern: /signin/i, weight: 15, description: 'Mot "signin" dans l\'URL' },
        { pattern: /account/i, weight: 15, description: 'Mot "account" dans l\'URL' }
    ];
    
    let score = 5; // Base score for legitimate URLs
    const explanations = [];
    
    // Check for suspicious patterns with weighted scores
    suspiciousPatterns.forEach(({ pattern, weight, description }) => {
        if (pattern.test(url)) {
            score += weight;
            explanations.push(description);
        }
    });
    
    // Check for IP address
    if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)) {
        score += 40;
        explanations.push('Adresse IP directe détectée (très suspect)');
    }
    
    // Check for long subdomains
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 3) {
        score += 20;
        explanations.push('Nombre élevé de sous-domaines');
    }
    
    // Check for special characters
    if (/[^\w\.\-]/.test(domain)) {
        score += 25;
        explanations.push('Caractères spéciaux dans le domaine');
    }
    
    // Check for multiple hyphens
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount > 2) {
        score += 15;
        explanations.push('Multiples tirets dans le domaine');
    }
    
    // Check for very long domain names
    if (domain.length > 30) {
        score += 10;
        explanations.push('Nom de domaine anormalement long');
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // XAI: Classify threat level based on score
    let riskLevel, indicatorColor, recommendedAction;
    
    if (score <= 25) {
        riskLevel = "FAIBLE";
        indicatorColor = "#10b981"; // Vert
        recommendedAction = "URL / Message probablement sûr.";
    } else if (score <= 50) {
        riskLevel = "MODÉRÉ";
        indicatorColor = "#f59e0b"; // Orange
        recommendedAction = "Prudence recommandée. Vérifiez l'expéditeur ou le domaine.";
    } else if (score <= 75) {
        riskLevel = "ÉLEVÉ";
        indicatorColor = "#f97316"; // Orange foncé
        recommendedAction = "Vérification stricte recommandée. Ne saisissez pas d'identifiants.";
    } else {
        riskLevel = "CRITIQUE";
        indicatorColor = "#e63956"; // Rouge néon
        recommendedAction = "Menace d'hameçonnage avérée. Évitez toute interaction.";
    }
    
    if (score <= 25 && explanations.length === 0) {
        explanations.push('Domaine semble légitime');
    }
    
    return {
        is_phishing: score >= 40,
        score: score,
        risk_level: riskLevel,
        indicator_color: indicatorColor,
        recommended_action: recommendedAction,
        explanations: explanations
    };
}

module.exports = router;
