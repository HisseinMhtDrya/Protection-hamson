import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
import re

def create_sample_message_dataset():
    """Create a sample message dataset for demonstration"""
    
    # Legitimate messages
    legitimate_messages = [
        "Hello, just checking in to see how you're doing. Let me know if you need anything!",
        "Your package has been shipped and will arrive tomorrow. Track your order here.",
        "Thank you for your recent purchase. Your receipt is attached.",
        "Meeting reminder: Team standup at 10 AM tomorrow in conference room A.",
        "Your subscription has been renewed successfully. Thank you for your support.",
        "Welcome to our service! Here's your getting started guide.",
        "Your password was changed successfully. If you didn't make this change, contact support.",
        "Your account balance is $150.00. Payment is due on the 15th.",
        "New features available in our app! Update to the latest version.",
        "Thank you for participating in our survey. Here are the results.",
        "Your flight confirmation: AA1234 departing at 2:30 PM from JFK.",
        "Your prescription is ready for pickup at the pharmacy.",
        "Your reservation is confirmed for tonight at 7 PM.",
        "Your insurance claim has been processed. Check your portal for details.",
        "Your utility bill is now available online. Log in to view."
    ]
    
    # Phishing messages
    phishing_messages = [
        "URGENT: Your account will be suspended unless you verify your identity immediately. Click here now.",
        "Your PayPal account has been limited. Verify your information to restore access.",
        "You won a prize! Click here to claim your $1000 reward before it expires.",
        "Security alert: Unusual login detected. Confirm your identity or your account will be locked.",
        "Your bank account has been compromised. Update your credentials immediately.",
        "Verify your Apple ID now or lose access to your account permanently.",
        "Your Netflix subscription will expire today. Update payment information to continue.",
        "Microsoft Security Alert: Your computer is infected. Download our tool now.",
        "Your Amazon order cannot be shipped. Verify your address and payment details.",
        "Your LinkedIn account has been flagged. Confirm your identity to avoid suspension.",
        "Your email storage is full. Click here to upgrade and avoid losing messages.",
        "Your Google account has been hacked. Change your password immediately.",
        "Your credit card has been declined. Update your billing information now.",
        "Your Facebook account will be deleted unless you verify your identity.",
        "Immediate action required: Your account has been compromised. Reset password now."
    ]
    
    # Create DataFrame
    data = []
    
    for message in legitimate_messages:
        data.append({
            'message': message,
            'label': 0  # 0 = legitimate
        })
    
    for message in phishing_messages:
        data.append({
            'message': message,
            'label': 1  # 1 = phishing
        })
    
    df = pd.DataFrame(data)
    
    # Save to CSV
    os.makedirs('../datasets', exist_ok=True)
    df.to_csv('../datasets/messages.csv', index=False)
    print(f"✅ Sample message dataset created with {len(df)} messages")
    print(f"   - Legitimate: {len(legitimate_messages)}")
    print(f"   - Phishing: {len(phishing_messages)}")
    
    return df

def train_message_model():
    """Train TF-IDF + Logistic Regression model for message detection"""
    
    # Check if dataset exists, if not create sample
    dataset_path = '../datasets/messages.csv'
    if not os.path.exists(dataset_path):
        print("⚠️ Dataset not found, creating sample dataset...")
        df = create_sample_message_dataset()
    else:
        df = pd.read_csv(dataset_path)
        print(f"✅ Dataset loaded: {len(df)} messages")
    
    # Prepare data
    X = df['message']
    y = df['label']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # TF-IDF Vectorization
    print("🔤 Creating TF-IDF features...")
    tfidf_vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.9
    )
    
    X_train_tfidf = tfidf_vectorizer.fit_transform(X_train)
    X_test_tfidf = tfidf_vectorizer.transform(X_test)
    
    print(f"Feature matrix shape: {X_train_tfidf.shape}")
    
    # Train Logistic Regression
    print("🤖 Training Logistic Regression model...")
    lr_model = LogisticRegression(
        random_state=42,
        max_iter=1000,
        C=1.0
    )
    
    lr_model.fit(X_train_tfidf, y_train)
    
    # Evaluate
    y_pred = lr_model.predict(X_test_tfidf)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n📊 Model Evaluation:")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Show most important features
    feature_names = tfidf_vectorizer.get_feature_names_out()
    coefficients = lr_model.coef_[0]
    
    # Top phishing indicators (positive coefficients)
    phishing_indicators = sorted(zip(feature_names, coefficients), 
                                 key=lambda x: x[1], reverse=True)[:10]
    
    print("\n🔍 Top Phishing Indicators:")
    for word, coef in phishing_indicators:
        print(f"   {word}: {coef:.4f}")
    
    # Save model and vectorizer
    os.makedirs('../models', exist_ok=True)
    
    model_path = '../models/message_model.pkl'
    vectorizer_path = '../models/message_vectorizer.pkl'
    
    joblib.dump(lr_model, model_path)
    joblib.dump(tfidf_vectorizer, vectorizer_path)
    
    print(f"\n✅ Model saved to {model_path}")
    print(f"✅ Vectorizer saved to {vectorizer_path}")
    
    return lr_model, tfidf_vectorizer

if __name__ == "__main__":
    print("🚀 Starting message model training...")
    print("=" * 50)
    model, vectorizer = train_message_model()
    print("=" * 50)
    print("✅ Training completed successfully!")
