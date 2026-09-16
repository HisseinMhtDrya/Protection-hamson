# 🛡️ Phishing Detector - Protection Hamson

Système de détection de phishing basé sur l'IA utilisant une architecture microservices avec analyse d'URLs et de messages.

## 🏗️ Architecture

```
                    UTILISATEUR
                         │
                       HTTPS
                         │
                         ▼
                  FRONTEND WEB
              HTML / Bootstrap / JS
                         │
                         ▼
                 BACKEND EXPRESS
              🛡️ Helmet
              🚦 Rate Limiting
              ✅ Validation Zod
              📋 Logs
                         │
                         ▼
                  SERVICE IA
              Python + FastAPI
                         │
                         ▼
                MODÈLE MACHINE LEARNING
                   Random Forest
                   TF-IDF + Logistic Regression
                         │
                         ▼
              SCORE + EXPLICATION
```

## 📁 Structure du projet

```
phishing-detector/
│
├── frontend/              # Interface utilisateur
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── backend/              # API Node.js/Express
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   │   ├── urlRoutes.js
│   │   └── messageRoutes.js
│   └── middleware/
│       ├── validation.js
│       ├── security.js
│       └── rateLimiter.js
│
├── ai-service/           # Service IA Python/FastAPI
│   ├── main.py
│   └── requirements.txt
│
├── training/             # Scripts d'entraînement et évaluation
│   ├── train_url_model.py
│   ├── train_message_model.py
│   └── evaluate_models.py
│
├── datasets/             # Données d'entraînement
│   ├── .gitkeep
│   └── README.md        # Guide d'acquisition des datasets
│
├── models/               # Modèles entraînés
│   └── .gitkeep
│
├── reports/              # Rapports d'évaluation
│   ├── cm_url.png
│   ├── roc_url.png
│   ├── cm_message.png
│   └── roc_message.png
│
├── nginx/                # Configuration Nginx
│   ├── nginx.conf
│   └── ssl/             # Certificats SSL
│       └── .gitkeep
│
├── README.md
└── .gitignore
```

## 🚀 Installation

### Prérequis

- Node.js (v18 ou supérieur)
- Python (v3.8 ou supérieur)
- pip
- Nginx (pour le déploiement en production)

### Installation Backend

```bash
cd backend
npm install
```

### Installation AI Service

```bash
cd ai-service
pip install -r requirements.txt
```

### Installation pour l'évaluation (optionnel)

Pour générer les rapports d'évaluation avec graphiques :

```bash
pip install matplotlib seaborn
```

## 📚 Acquisition des Datasets

Pour un projet académique rigoureux, il est recommandé d'utiliser des datasets publics reconnus :

### Datasets Recommandés

**URLs:**
- ISCX-URL2016 (Université du Nouveau-Brunswick)
- Phishing Websites Dataset (UCI Machine Learning Repository)
- Kaggle Phishing URL Datasets

**Messages:**
- SMS Spam Collection Dataset (UCI Repository)
- CEAS 2008 / Enron Phishing Corpus
- Kaggle Spam/Phishing Datasets

### Guide Complet

Consultez `datasets/README.md` pour les instructions détaillées de téléchargement et formatage des datasets.

Les fichiers CSV locaux sont exclus de Git pour éviter de versionner des datasets volumineux. Les modèles entraînés (`models/*.pkl`) et les certificats SSL sont également exclus. Après avoir récupéré les datasets, lancez les scripts d'entraînement avant de démarrer le service IA. En production, fournissez les modèles via un stockage d'artefacts ou un volume persistant.

## 🤖 Entraînement et Évaluation des Modèles

### Option 1: Entraînement rapide (datasets d'exemple)

```bash
cd training
python train_url_model.py
python train_message_model.py
```

### Option 2: Évaluation rigoureuse (recommandé pour le jury)

```bash
cd training
python evaluate_models.py
```

Ce script :
- Entraîne les modèles sur les datasets réels dans `datasets/`
- Génère des métriques complètes (Precision, Recall, F1-Score, ROC-AUC)
- Crée des matrices de confusion et courbes ROC
- Sauvegarde les rapports dans `reports/`

**Format attendu des datasets:**
- `urls.csv`: colonnes `url` et `label` (0=légitime, 1=phishing)
- `messages.csv`: colonnes `text` et `label` (0=légitime, 1=phishing)

Si les datasets n'existent pas, le script générera des données de test pour validation.

## 🏃 Lancement du projet

### 1. Démarrer le service IA

```bash
cd ai-service
python main.py
```

Le service sera disponible sur `http://localhost:8000`

### 2. Démarrer le backend

```bash
cd backend
npm start
```

Le backend sera disponible sur `http://localhost:3000`

### 3. Accéder à l'application

Ouvrez votre navigateur sur `http://localhost:3000`

## 🔐 Sécurité

Le projet implémente plusieurs mesures de sécurité :

- **Helmet**: Headers HTTP sécurisés
- **Rate Limiting**: Protection contre les abus
- **Validation Zod**: Validation des entrées utilisateur
- **Limitation de taille**: Protection contre les payloads volumineux
- **HTTPS**: Configuration Nginx pour TLS 1.3
- **Logs**: Journalisation des analyses

## 📊 Modèles IA

### Modèle URL
- **Algorithme**: Random Forest
- **Features**: Longueur URL, sous-domaines, caractères spéciaux, mots suspects, etc.
- **Performance**: ~83% accuracy (sur dataset d'exemple)

### Modèle Message
- **Algorithme**: Logistic Regression avec TF-IDF
- **Features**: Vecteurs TF-IDF des mots
- **Performance**: ~83% accuracy (sur dataset d'exemple)

## 🔧 Configuration HTTPS / TLS 1.3

### Génération de certificats auto-signés (démo locale)

Pour démontrer TLS 1.3 lors de la soutenance :

```bash
# Générer certificat X.509 et clé privée
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/C=CD/ST=Kinshasa/L=Kinshasa/O=UNIKIN/OU=MSI/CN=localhost"
```

### Vérification TLS 1.3

Ouvrez `https://localhost` dans Chrome/Firefox, puis F12 → Onglet Sécurité :
- **Protocol**: TLS 1.3
- **Cipher suite**: TLS_AES_256_GCM_SHA384
- **Connection**: Secure / Encrypted

### Déploiement en production

1. Copiez `nginx/nginx.conf` dans `/etc/nginx/sites-available/phishing-detector`
2. Créez un lien symbolique vers `sites-enabled`
3. Obtenez un certificat SSL (Let's Encrypt recommandé)
4. Mettez à jour les chemins des certificats dans `nginx.conf`
5. Redémarrez Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 📈 Améliorations futures

- [ ] Ajouter de vrais datasets publics de phishing
- [ ] Implémenter le deep learning pour les messages
- [ ] Ajouter l'analyse de pièces jointes
- [ ] Dashboard d'administration
- [ ] API de batch analysis
- [ ] Intégration avec des services de threat intelligence

## 👥 Équipe

Ce projet est conçu pour être développé par une équipe de 4 étudiants :

- **Étudiant 1**: IA URLs (Dataset, Feature Engineering, Random Forest)
- **Étudiant 2**: IA Messages (Dataset, TF-IDF, Logistic Regression)
- **Étudiant 3**: Backend + Sécurité (Express, Zod, Helmet, Rate Limiting)
- **Étudiant 4**: Frontend + Déploiement (Interface, Dashboard, HTTPS/Nginx)

## 📝 Licence

Projet académique - Université

## 🤝 Contribution

Ce projet est un projet universitaire. Pour toute question, contactez l'équipe enseignante.
