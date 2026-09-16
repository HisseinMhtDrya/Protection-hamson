import os
import re
from math import log2
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve

os.makedirs('../models', exist_ok=True)
os.makedirs('../reports', exist_ok=True)

# ----------------------------------------------------
# 1. EXTRACTEUR DE CARACTÉRISTIQUES URL
# ----------------------------------------------------
def calculate_entropy(text: str) -> float:
    if not text:
        return 0.0
    prob = [text.count(c) / len(text) for c in set(text)]
    return -sum(p * log2(p) for p in prob)

def extract_url_features(url: str):
    length = len(url)
    entropy = calculate_entropy(url)
    dots = url.count('.')
    hyphens = url.count('-')
    at_symbol = url.count('@')
    ip_pattern = re.compile(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
    has_ip = 1 if ip_pattern.search(url) else 0
    suspicious_words = ['login', 'verify', 'update', 'account', 'banking', 'secure', 'confirm', 'webscr', 'cmd']
    keyword_count = sum(1 for word in suspicious_words if word in url.lower())
    return [length, entropy, dots, hyphens, at_symbol, has_ip, keyword_count]

def plot_confusion_matrix(cm, labels, title, filename):
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title(title)
    plt.ylabel('Classe Réelle')
    plt.xlabel('Classe Prédite')
    plt.tight_layout()
    plt.savefig(f'../reports/{filename}')
    plt.close()

def plot_roc_curve(y_test, y_prob, title, filename):
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, linewidth=2)
    plt.plot([0, 1], [0, 1], 'k--', linewidth=1)
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(title)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f'../reports/{filename}')
    plt.close()

# ----------------------------------------------------
# 2. ENTRAÎNEMENT ET ÉVALUATION MODÈLE URL
# ----------------------------------------------------
print("=== 1. Évaluation Scientifique du Modèle URL (Random Forest) ===")

# Chargement du CSV real : attend colonnes 'url' et 'label' (0=Légitime, 1=Phishing)
# Si fichier absent, fallback sur un échantillon structuré pour validation du code
url_data_path = '../datasets/urls.csv'
if os.path.exists(url_data_path):
    df_urls = pd.read_csv(url_data_path)
    print(f"✅ Dataset URL chargé: {len(df_urls)} échantillons")
else:
    print("[WARN] File '../datasets/urls.csv' introuvable. Génération de données de test...")
    df_urls = pd.DataFrame({
        'url': [
            'https://google.com', 'https://wikipedia.org', 'https://univ-kinshasa.ac.cd',
            'http://paypal-security-update.xyz/login', 'http://192.168.1.1/verify/banking'
        ] * 200,
        'label': [0, 0, 0, 1, 1] * 200
    })
    print(f"⚠️ Dataset de test généré: {len(df_urls)} échantillons")

X_url = np.array([extract_url_features(u) for u in df_urls['url']])
y_url = df_urls['label'].values

X_train_u, X_test_u, y_train_u, y_test_u = train_test_split(X_url, y_url, test_size=0.2, random_state=42, stratify=y_url)

print(f"Training set: {len(X_train_u)} échantillons")
print(f"Test set: {len(X_test_u)} échantillons")

rf_model = RandomForestClassifier(n_estimators=150, random_state=42)
rf_model.fit(X_train_u, y_train_u)

y_pred_u = rf_model.predict(X_test_u)
y_prob_u = rf_model.predict_proba(X_test_u)[:, 1]

print("\n--- RAPPORT DE CLASSIFICATION URL ---")
print(classification_report(y_test_u, y_pred_u, target_names=['Légitime', 'Phishing']))
print(f"ROC-AUC Score : {roc_auc_score(y_test_u, y_prob_u):.4f}")

cm_url = confusion_matrix(y_test_u, y_pred_u)
plot_confusion_matrix(cm_url, ['Légitime', 'Phishing'], 'Matrice de Confusion - Modèle URL (Random Forest)', 'cm_url.png')
plot_roc_curve(y_test_u, y_prob_u, 'Courbe ROC - Modèle URL', 'roc_url.png')

joblib.dump(rf_model, '../models/url_model.pkl')
print("✅ Modèle URL sauvegardé: ../models/url_model.pkl")

# ----------------------------------------------------
# 3. ENTRAÎNEMENT ET ÉVALUATION MODÈLE MESSAGE
# ----------------------------------------------------
print("\n=== 2. Évaluation Scientifique du Modèle Message (TF-IDF + Logistic Regression) ===")

msg_data_path = '../datasets/messages.csv'
if os.path.exists(msg_data_path):
    df_msg = pd.read_csv(msg_data_path)
    print(f"✅ Dataset Message chargé: {len(df_msg)} échantillons")
else:
    print("[WARN] File '../datasets/messages.csv' introuvable. Génération de données de test...")
    df_msg = pd.DataFrame({
        'text': [
            "Bonjour, voici le document demandé pour le cours de sécurité.",
            "URGENT: Votre compte bancaire est bloqué. Cliquez ici pour mettre à jour vos accès."
        ] * 500,
        'label': [0, 1] * 500
    })
    print(f"⚠️ Dataset de test généré: {len(df_msg)} échantillons")

X_train_m, X_test_m, y_train_m, y_test_m = train_test_split(df_msg['message'], df_msg['label'], test_size=0.2, random_state=42, stratify=df_msg['label'])

print(f"Training set: {len(X_train_m)} échantillons")
print(f"Test set: {len(X_test_m)} échantillons")

msg_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), lowercase=True, max_features=5000)),
    ('clf', LogisticRegression(C=1.0))
])

msg_pipeline.fit(X_train_m, y_train_m)

y_pred_m = msg_pipeline.predict(X_test_m)
y_prob_m = msg_pipeline.predict_proba(X_test_m)[:, 1]

print("\n--- RAPPORT DE CLASSIFICATION MESSAGE ---")
print(classification_report(y_test_m, y_pred_m, target_names=['Légitime', 'Phishing']))
print(f"ROC-AUC Score : {roc_auc_score(y_test_m, y_prob_m):.4f}")

cm_msg = confusion_matrix(y_test_m, y_pred_m)
plot_confusion_matrix(cm_msg, ['Légitime', 'Phishing'], 'Matrice de Confusion - Modèle Message (NLP)', 'cm_message.png')
plot_roc_curve(y_test_m, y_prob_m, 'Courbe ROC - Modèle Message', 'roc_message.png')

# Sauvegarder le pipeline complet (TF-IDF + modèle)
joblib.dump(msg_pipeline, '../models/message_model.pkl')
print("✅ Modèle Message sauvegardé: ../models/message_model.pkl")

print("\n-> Entraînement et métriques exportés avec succès dans '../reports/'")
print("-> Rapports générés:")
print("   - cm_url.png (Matrice de confusion URL)")
print("   - roc_url.png (Courbe ROC URL)")
print("   - cm_message.png (Matrice de confusion Message)")
print("   - roc_message.png (Courbe ROC Message)")
