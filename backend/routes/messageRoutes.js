const express = require('express');
const router = express.Router();
const axios = require('axios');
const { validateMessage } = require('../middleware/validation');
const { moderateLimiter } = require('../middleware/rateLimiter');
const { logSecurityEvent } = require('../middleware/security');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Apply moderate rate limiting to message analysis
router.post('/message', moderateLimiter, validateMessage, async (req, res) => {
    try {
        const { message } = req.body;
        
        logSecurityEvent('MESSAGE_ANALYSIS_REQUEST', { 
            message_length: message.length, 
            ip: req.ip 
        });
        
        // Try to forward request to AI service
        let result;
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/predict/message`, {
                message: message
            }, {
                timeout: 15000 // 15 second timeout for message analysis
            });
            result = response.data;
        } catch (aiError) {
            console.log('AI service unavailable, using demo mode for message:', aiError.message);
            // Demo mode - simulate AI analysis for messages
            result = simulateMessageAnalysis(message);
        }
        
        logSecurityEvent('MESSAGE_ANALYSIS_RESULT', { 
            is_phishing: result.is_phishing, 
            score: result.score 
        });
        
        res.json(result);
        
    } catch (error) {
        console.error('Error analyzing message:', error.message);
        
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

// Demo mode - simulate AI analysis for messages with XAI
function simulateMessageAnalysis(message) {
    const suspiciousKeywords = [
        /urgent/i,
        /suspendu/i,
        /vérifier/i,
        /mettre à jour/i,
        /immédiat/i,
        /sécurité/i,
        /compte/i,
        /banque/i,
        /mot de passe/i,
        /carte/i,
        /bit\.ly/i,
        /tinyurl/i,
        /cliquer ici/i,
        /confirmer/i,
        /expir/i
    ];
    
    let score = 10;
    const explanations = [];
    
    // Check for suspicious keywords
    suspiciousKeywords.forEach(keyword => {
        if (keyword.test(message)) {
            score += 12;
            explanations.push(`Mot-clé suspect détecté: ${keyword}`);
        }
    });
    
    // Check for URLs in message
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = message.match(urlPattern);
    if (urls && urls.length > 0) {
        score += 15;
        explanations.push('URL(s) détectée(s) dans le message');
        urls.forEach(url => {
            if (/\.xyz|\.top|\.info/i.test(url)) {
                score += 10;
                explanations.push(`URL suspecte détectée: ${url}`);
            }
        });
    }
    
    // Check for excessive uppercase
    const uppercaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (uppercaseRatio > 0.5) {
        score += 10;
        explanations.push('Taux élevé de majuscules (tentative d\'urgence)');
    }
    
    // Check for special characters patterns
    if (/[^\w\sàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ.,!?;:'"-]/.test(message)) {
        score += 8;
        explanations.push('Caractères spéciaux inhabituels');
    }
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    // XAI: Classify threat level based on score
    let riskLevel, indicatorColor, recommendedAction;
    
    if (score <= 30) {
        riskLevel = "FAIBLE";
        indicatorColor = "#10b981"; // Vert
        recommendedAction = "Message probablement sûr.";
    } else if (score <= 60) {
        riskLevel = "MODÉRÉ";
        indicatorColor = "#f59e0b"; // Orange
        recommendedAction = "Prudence recommandée. Vérifiez l'expéditeur.";
    } else if (score <= 80) {
        riskLevel = "ÉLEVÉ";
        indicatorColor = "#f97316"; // Orange foncé
        recommendedAction = "Vérification stricte recommandée. Ne cliquez pas sur les liens.";
    } else {
        riskLevel = "CRITIQUE";
        indicatorColor = "#e63956"; // Rouge néon
        recommendedAction = "Tentative d'hameçonnage probable. Supprimez le message.";
    }
    
    if (score <= 30) {
        explanations.push('Message semble légitime');
    }
    
    return {
        is_phishing: score >= 50,
        score: score,
        risk_level: riskLevel,
        indicator_color: indicatorColor,
        recommended_action: recommendedAction,
        explanations: explanations
    };
}

module.exports = router;
