import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
from urllib.parse import urlparse
import re

def extract_url_features(url: str) -> dict:
    """Extract features from URL for training"""
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
        print(f"Error extracting features from {url}: {e}")
        # Return default features if parsing fails
        features = {key: 0 for key in [
            'url_length', 'domain_length', 'path_length', 'dot_count',
            'dash_count', 'underscore_count', 'percent_count', 'question_count',
            'ampersand_count', 'equals_count', 'subdomain_count', 'has_ip',
            'is_https', 'has_port', 'suspicious_word_count'
        ]}
        features['url_length'] = len(url)
    
    return features

def create_sample_dataset():
    """Create a sample dataset for demonstration"""
    # Legitimate URLs
    legitimate_urls = [
        "https://www.google.com",
        "https://www.facebook.com",
        "https://www.amazon.com",
        "https://github.com/user/repo",
        "https://stackoverflow.com/questions",
        "https://www.linkedin.com",
        "https://www.twitter.com",
        "https://www.microsoft.com",
        "https://docs.python.org",
        "https://developer.mozilla.org",
        "https://www.wikipedia.org",
        "https://www.reddit.com",
        "https://www.youtube.com",
        "https://www.netflix.com",
        "https://www.spotify.com"
    ]
    
    # Phishing URLs (simulated)
    phishing_urls = [
        "http://secure-login-facebook.com",
        "http://verify-account-paypal.com",
        "http://192.168.1.1/login",
        "http://apple-id-verify.com",
        "http://bank-of-america-secure.com",
        "http://amazon-verify-account.com",
        "http://google-account-recovery.com",
        "http://microsoft-secure-login.com",
        "http://netflix-verify-account.com",
        "http://spotify-premium-free.com",
        "http://linkedin-verify-account.com",
        "http://twitter-secure-login.com",
        "http://github-verify-account.com",
        "http://stack-overflow-verify.com",
        "http://wikipedia-donate-now.com"
    ]
    
    # Create DataFrame
    data = []
    
    for url in legitimate_urls:
        features = extract_url_features(url)
        features['label'] = 0  # 0 = legitimate
        features['url'] = url
        data.append(features)
    
    for url in phishing_urls:
        features = extract_url_features(url)
        features['label'] = 1  # 1 = phishing
        features['url'] = url
        data.append(features)
    
    df = pd.DataFrame(data)
    
    # Save to CSV
    os.makedirs('../datasets', exist_ok=True)
    df.to_csv('../datasets/urls.csv', index=False)
    print(f"✅ Sample dataset created with {len(df)} URLs")
    print(f"   - Legitimate: {len(legitimate_urls)}")
    print(f"   - Phishing: {len(phishing_urls)}")
    
    return df

def train_url_model():
    """Train Random Forest model for URL detection"""
    
    # Check if dataset exists, if not create sample
    dataset_path = '../datasets/urls.csv'
    if not os.path.exists(dataset_path):
        print("⚠️ Dataset not found, creating sample dataset...")
        df = create_sample_dataset()
    else:
        df = pd.read_csv(dataset_path)
        print(f"✅ Dataset loaded: {len(df)} URLs")
    
    # Feature columns
    feature_columns = [
        'url_length', 'domain_length', 'path_length', 'dot_count',
        'dash_count', 'underscore_count', 'percent_count', 'question_count',
        'ampersand_count', 'equals_count', 'subdomain_count', 'has_ip',
        'is_https', 'has_port', 'suspicious_word_count'
    ]
    
    # Prepare data
    X = df[feature_columns]
    y = df['label']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Random Forest
    print("🤖 Training Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = rf_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n📊 Model Evaluation:")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🔍 Feature Importance:")
    print(feature_importance)
    
    # Save model
    os.makedirs('../models', exist_ok=True)
    model_path = '../models/url_model.pkl'
    joblib.dump(rf_model, model_path)
    print(f"\n✅ Model saved to {model_path}")
    
    return rf_model

if __name__ == "__main__":
    print("🚀 Starting URL model training...")
    print("=" * 50)
    model = train_url_model()
    print("=" * 50)
    print("✅ Training completed successfully!")
