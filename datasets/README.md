# Guide d'Acquisition des Datasets pour le Projet

Ce guide explique comment obtenir les datasets publics de référence pour rendre le projet scientifiquement crédible devant le jury.

## 🎯 Objectif

Pour un projet de Master 1 MSI, il est impératif d'utiliser des datasets reconnus académiquement plutôt que des données synthétiques. Cela permet de :

- Justifier la provenance des données devant le jury
- Obtenir des métriques d'évaluation réalistes
- Démontrer la rigueur scientifique du projet

## 📊 Datasets Recommandés

### 1. Dataset URLs (Phishing vs Légitime)

#### Option A: ISCX-URL2016 (Université du Nouveau-Brunswick)
- **Source**: https://www.unb.ca/cic/datasets/url-2016.html
- **Volume**: ~42,000 URLs
- **Composition**: URLs légitimes (Alexa Top) + URLs de phishing (PhishTank)
- **Format**: CSV avec colonnes: url, label
- **Avantages**: Dataset académique reconnu, équilibré

#### Option B: Phishing Websites Dataset (UCI Machine Learning Repository)
- **Source**: https://archive.ics.uci.edu/ml/datasets/phishing+websites
- **Volume**: ~11,000 URLs
- **Composition**: URLs avec 30 features + label
- **Format**: CSV avec features pré-extraites
- **Avantages**: Features déjà calculés, prêt à l'emploi

#### Option C: Kaggle Phishing Dataset
- **Source**: https://www.kaggle.com/datasets
- **Recherche**: "phishing url dataset"
- **Volume**: Variable (5,000 - 50,000 URLs)
- **Format**: CSV
- **Avantages**: Facile à télécharger, communauté active

### 2. Dataset Messages (SMS & Email Phishing)

#### Option A: SMS Spam Collection Dataset (UCI Repository)
- **Source**: https://archive.ics.uci.edu/ml/datasets/sms+spam+collection
- **Volume**: ~5,574 messages
- **Composition**: Messages SMS étiquetés ham/spam
- **Format**: TSV (tab-separated values)
- **Avantages**: Dataset classique, bien documenté

#### Option B: CEAS 2008 / Enron Phishing Corpus
- **Source**: https://www.cs.cmu.edu/~enron/
- **Volume**: ~10,000 emails
- **Composition**: Emails légitimes + emails de phishing
- **Format**: Divers (TXT, EML)
- **Avantages**: Dataset réel d'entreprise

#### Option C: Kaggle Spam/Phishing Datasets
- **Source**: https://www.kaggle.com/datasets
- **Recherche**: "spam sms dataset" ou "email phishing dataset"
- **Volume**: Variable (1,000 - 20,000 messages)
- **Format**: CSV
- **Avantages**: Plusieurs options disponibles

## 📥 Procédure de Téléchargement

### Étape 1: Télécharger les datasets

```bash
# Créer le répertoire datasets (déjà créé)
cd datasets

# Exemple pour UCI SMS Spam Collection
wget https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip
unzip smsspamcollection.zip

# Exemple pour Kaggle (nécessite compte Kaggle)
# Télécharger manuellement depuis le site web
```

### Étape 2: Formater les données

Le script d'évaluation attend des fichiers CSV avec le format suivant :

**urls.csv:**
```csv
url,label
https://google.com,0
http://paypal-security-update.xyz/login,1
```

**messages.csv:**
```csv
text,label
Bonjour, voici le document demandé,0
URGENT: Votre compte est bloqué, cliquez ici,1
```

### Étape 3: Conversion si nécessaire

Si le dataset est dans un format différent, utilisez ce script de conversion :

```python
import pandas as pd

# Exemple pour SMS Spam Collection (TSV vers CSV)
df = pd.read_csv('SMSSpamCollection', sep='\t', header=None, names=['label', 'text'])
df['label'] = df['label'].map({'ham': 0, 'spam': 1})
df.to_csv('messages.csv', index=False)

# Exemple pour dataset avec features multiples
# Ne garder que URL et label
df = pd.read_csv('original_dataset.csv')
df = df[['url', 'label']]
df.to_csv('urls.csv', index=False)
```

## 🔧 Format Attendu par le Script d'Évaluation

### urls.csv
- **Colonnes requises**: `url`, `label`
- **label**: 0 = légitime, 1 = phishing
- **Volume recommandé**: 10,000 - 20,000 lignes

### messages.csv
- **Colonnes requises**: `text`, `label`
- **label**: 0 = légitime, 1 = phishing/spam
- **Volume recommandé**: 5,000 - 10,000 lignes

## ⚠️ Points Importants pour la Défense

1. **Justification de la provenance**: Soyez prêt à expliquer d'où viennent vos données
2. **Équilibre des classes**: Vérifiez que les datasets ne sont pas trop déséquilibrés
3. **Nettoyage des données**: Documentez les étapes de prétraitement
4. **Licence d'utilisation**: Vérifiez que les datasets sont libres d'utilisation académique

## 📚 Références Académiques

Citez ces sources dans votre rapport :

1. **ISCX-URL2016**: "A Dataset for Phishing Detection using Machine Learning" - Université du Nouveau-Brunswick
2. **UCI SMS Spam**: "The SMS Spam Collection" - UCI Machine Learning Repository
3. **PhishTank**: https://www.phishtank.com/ - Source de données de phishing

## 🚀 Après Téléchargement

Une fois les datasets téléchargés et formatés :

```bash
# Lancer l'évaluation complète
cd training
python evaluate_models.py
```

Cela générera :
- Modèles entraînés sur données réelles
- Rapports de classification (precision, recall, F1-score)
- Matrices de confusion (graphiques)
- Courbes ROC (graphiques)

Ces éléments seront essentiels pour votre défense devant le jury.
