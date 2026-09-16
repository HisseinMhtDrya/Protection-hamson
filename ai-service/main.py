from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import joblib
import os
from urllib.parse import urlparse
import re

app = FastAPI(title="Phishing Detection AI Service", version="1.0.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Model paths
URL_MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "url_model.pkl")
MESSAGE_MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "message_model.pkl")
MESSAGE_VECTORIZER_PATH = os.path.join(BASE_DIR, "..", "models", "message_vectorizer.pkl")

URL_FEATURE_COLUMNS = [
    'url_length', 'domain_length', 'path_length', 'dot_count',
    'dash_count', 'underscore_count', 'percent_count', 'question_count',
    'ampersand_count', 'equals_count', 'subdomain_count', 'has_ip',
    'is_https', 'has_port', 'suspicious_word_count'
]

# Load models (will be None until trained)
url_model = None
message_pipeline = None  # Changed to pipeline for TF-IDF + Logistic Regression

class URLRequest(BaseModel):
    url: str

class MessageRequest(BaseModel):
    message: str

class AnalysisResponse(BaseModel):
    is_phishing: bool
    score: float
    explanations: List[str]

def extract_url_features(url: str) -> dict:
    """Extract features from URL for analysis"""
    features = {}
    
    try:
        parsed = urlparse(url)
        
        # Length features
        features['url_length'] = len(url)
        features['domain_length'] = len(parsed.netloc)
        features['path_length'] = len(parsed.path)
        
        # Count special characters
        features['dot_count'] = url.count('.')
        features['dash_count'] = url.count('-')
        features['underscore_count'] = url.count('_')
        features['percent_count'] = url.count('%')
        features['question_count'] = url.count('?')
        features['ampersand_count'] = url.count('&')
        features['equals_count'] = url.count('=')
        
        # Subdomain count
        domain_parts = parsed.netloc.split('.')
        features['subdomain_count'] = max(0, len(domain_parts) - 2)
        
        # Has IP address
        ip_pattern = r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'
        features['has_ip'] = 1 if re.search(ip_pattern, url) else 0
        
        # HTTPS
        features['is_https'] = 1 if parsed.scheme == 'https' else 0
        
        # Has port
        features['has_port'] = 1 if ':' in parsed.netloc else 0
        
        # Suspicious keywords
        suspicious_words = ['login', 'signin', 'account', 'verify', 'update', 
                           'secure', 'bank', 'paypal', 'confirm', 'password']
        features['suspicious_word_count'] = sum(1 for word in suspicious_words 
                                               if word in url.lower())
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        # Return default features if parsing fails
        features = {key: 0 for key in [
            'url_length', 'domain_length', 'path_length', 'dot_count',
            'dash_count', 'underscore_count', 'percent_count', 'question_count',
            'ampersand_count', 'equals_count', 'subdomain_count', 'has_ip',
            'is_https', 'has_port', 'suspicious_word_count'
        ]}
        features['url_length'] = len(url)
    
    return features

def generate_url_explanations(features: dict, score: float) -> List[str]:
    """Generate human-readable explanations for URL analysis"""
    explanations = []
    
    if features['has_ip']:
        explanations.append("Adresse IP détectée dans l'URL")
    
    if features['url_length'] > 75:
        explanations.append("URL anormalement longue")
    
    if features['subdomain_count'] > 3:
        explanations.append("Trop de sous-domaines")
    
    if features['suspicious_word_count'] > 0:
        explanations.append("Présence de mots suspects")
    
    if features['dash_count'] > 5:
        explanations.append("Nombre élevé de tirets")
    
    if not features['is_https']:
        explanations.append("Pas de chiffrement HTTPS")
    
    if features['has_port']:
        explanations.append("Port spécifié dans l'URL")
    
    if features['percent_count'] > 3:
        explanations.append("Nombre élevé de caractères encodés")
    
    return explanations

@app.on_event("startup")
async def load_models():
    """Load trained models on startup"""
    global url_model, message_pipeline
    
    if os.path.exists(URL_MODEL_PATH):
        try:
            url_model = joblib.load(URL_MODEL_PATH)
            print("✅ URL model loaded successfully")
        except Exception as e:
            print(f"❌ Error loading URL model: {e}")
    else:
        print("⚠️ URL model not found - using fallback analysis")
    
    if os.path.exists(MESSAGE_MODEL_PATH):
        try:
            message_pipeline = joblib.load(MESSAGE_MODEL_PATH)
            print("✅ Message pipeline loaded successfully")
        except Exception as e:
            print(f"❌ Error loading message model: {e}")
    else:
        print("⚠️ Message model not found - using fallback analysis")

@app.get("/")
async def root():
    return {"message": "Phishing Detection AI Service", "status": "running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "url_model_loaded": url_model is not None,
        "message_model_loaded": message_pipeline is not None
    }

def get_url_feature_vector(features: dict) -> list:
    """Build the feature vector in the same order used during training."""
    if hasattr(url_model, 'feature_names_in_'):
        feature_names = list(url_model.feature_names_in_)
        return [features.get(name, 0) for name in feature_names]
    return [features.get(name, 0) for name in URL_FEATURE_COLUMNS]


@app.post("/predict/url", response_model=AnalysisResponse)
async def predict_url(request: URLRequest):
    """Analyze URL for phishing"""
    try:
        features = extract_url_features(request.url)

        if url_model is not None:
            try:
                feature_vector = get_url_feature_vector(features)
                probability = url_model.predict_proba([feature_vector])[0][1]
                is_phishing = url_model.predict([feature_vector])[0] == 1
                score = int(probability * 100)
            except Exception as model_error:
                print(f"⚠️ Model prediction failed, using fallback analysis: {model_error}")
                score = 0
                if features['has_ip']:
                    score += 30
                if features['url_length'] > 75:
                    score += 20
                if features['subdomain_count'] > 3:
                    score += 15
                if features['suspicious_word_count'] > 0:
                    score += 25
                if not features['is_https']:
                    score += 10
                is_phishing = score >= 50
        else:
            # Fallback: rule-based analysis
            score = 0
            if features['has_ip']:
                score += 30
            if features['url_length'] > 75:
                score += 20
            if features['subdomain_count'] > 3:
                score += 15
            if features['suspicious_word_count'] > 0:
                score += 25
            if not features['is_https']:
                score += 10
            is_phishing = score >= 50

        explanations = generate_url_explanations(features, score)

        return AnalysisResponse(
            is_phishing=is_phishing,
            score=score,
            explanations=explanations
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/message", response_model=AnalysisResponse)
async def predict_message(request: MessageRequest):
    """Analyze message for phishing"""
    try:
        # Temporarily use enhanced fallback for better responsiveness
        # The trained model on small dataset gives similar results for all inputs
        # TODO: Enable trained model when using real datasets
        
        # Enhanced fallback: multi-pattern analysis
        score = 0
        explanations = []
        
        # 1. Keyword analysis
        suspicious_keywords = {
            'password': 25, 'login': 20, 'verify': 20, 'urgent': 25,
            'account': 15, 'bank': 20, 'paypal': 25, 'secure': 15,
            'immediate': 20, 'suspended': 25, 'blocked': 25,
            'click': 15, 'update': 15, 'confirm': 20, 'banking': 25
        }
        
        for keyword, weight in suspicious_keywords.items():
            if keyword in request.message.lower():
                score += weight
                explanations.append(f"Mot clé suspect: '{keyword}'")
        
        # 2. Pattern analysis
        import re
        
        # Excessive capitalization
        if sum(1 for c in request.message if c.isupper()) > len(request.message) * 0.5:
            score += 15
            explanations.append("Trop de majuscules")
        
        # Excessive special characters
        special_chars = sum(1 for c in request.message if not c.isalnum() and not c.isspace())
        if special_chars > len(request.message) * 0.3:
            score += 20
            explanations.append("Trop de caractères spéciaux")
        
        # Urgency indicators
        urgency_patterns = [r'!!+', r'\?\?+', r'immédiat', r'tout de suite', r'maintenant']
        for pattern in urgency_patterns:
            if re.search(pattern, request.message, re.IGNORECASE):
                score += 10
                explanations.append("Indicateur d'urgence détecté")
        
        # URL/Link patterns
        if re.search(r'http[s]?://\S+', request.message):
            score += 15
            explanations.append("URL détectée dans le message")
        
        # Money/financial patterns
        financial_patterns = [r'\$\d+', r'€\d+', r'£\d+', r'\d+\s*(dollars|euros|pounds)']
        for pattern in financial_patterns:
            if re.search(pattern, request.message, re.IGNORECASE):
                score += 20
                explanations.append("Référence financière détectée")
        
        # Cap score at 100
        score = min(100, score)
        is_phishing = score >= 50
        
        # If no explanations found, give a generic one
        if not explanations:
            if len(request.message) < 10:
                explanations.append("Message très court - analyse limitée")
            else:
                explanations.append("Aucun motif de phishing évident détecté")
        
        return AnalysisResponse(
            is_phishing=is_phishing,
            score=score,
            explanations=explanations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
