# 🛡️ PROTECTION HAMSON

## Détecteur Web d’Hameçonnage Assisté par Intelligence Artificielle

<p align="center">
  <strong>Projet universitaire — Réseaux Informatiques & Cybersécurité</strong><br>
  Université de Kinshasa (UNIKIN) — Master 1
</p>

---

## 👨‍🎓 Présentation du travail

**Protection Hamson** est un système web intelligent conçu pour détecter les tentatives d’**hameçonnage (phishing)** à partir d'URLs et de messages.

L'application combine une **interface web**, une **API sécurisée** et un **service d'intelligence artificielle** afin d'analyser les contenus soumis par l'utilisateur et de retourner un résultat accompagné d'un **score de risque et d'une explication**.

### 🎯 Objectif

L'objectif principal est de fournir un outil simple permettant à l'utilisateur de :

* analyser une URL ;
* analyser un message ;
* identifier un contenu potentiellement malveillant ;
* comprendre la raison du résultat obtenu.

---

# 👥 Équipe du projet

| N° | Étudiant                 | Responsabilité                            |
| -- | ------------------------ | ----------------------------------------- |
| 01 | **Hissein Mahamat Drya** | Backend, sécurité & intégration           |
| 02 | **Étudiant 2**           | Détection des URLs & Machine Learning     |
| 03 | **Étudiant 3**           | Détection des messages & Machine Learning |
| 04 | **Étudiant 4**           | Frontend & déploiement                    |

> **Superviseur :** [Nom du superviseur]
> **Faculté :** Faculté des Sciences Informatiques
> **Spécialité :** Réseaux & Cybersécurité
> **Niveau :** Master 1

---

# 🖥️ Aperçu de l'application

### Page d'accueil

<p align="center">
  <img src="docs/images/home.png" width="850">
</p>

### Analyse d'une URL

<p align="center">
  <img src="docs/images/url-analysis.png" width="850">
</p>

### Analyse d'un message

<p align="center">
  <img src="docs/images/message-analysis.png" width="850">
</p>

### Résultat de l'analyse

<p align="center">
  <img src="docs/images/result.png" width="850">
</p>

> Les captures d'écran présentent les principales fonctionnalités de **Protection Hamson**.

---

# 🏗️ Architecture du système

```text
                         👤 UTILISATEUR
                              │
                              ▼
                    ┌──────────────────┐
                    │   FRONTEND WEB   │
                    │   HTML / CSS / JS│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  BACKEND API     │
                    │ Node.js / Express│
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    SERVICE IA    │
                    │ Python / FastAPI │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    ▼                  ▼
             ┌─────────────┐    ┌──────────────┐
             │ Modèle URL  │    │ Modèle Texte │
             │Random Forest│    │ TF-IDF + LR  │
             └──────┬──────┘    └──────┬───────┘
                    │                  │
                    └────────┬─────────┘
                             ▼
                    📊 SCORE + EXPLICATION
```

---

# ⚙️ Fonctionnalités principales

### 🔗 Détection des URLs

L'utilisateur peut soumettre une URL afin d'obtenir une analyse permettant d'identifier les caractéristiques associées au phishing.

### 💬 Détection des messages

Le système analyse le contenu textuel d'un message afin d'identifier les caractéristiques pouvant indiquer une tentative d'hameçonnage.

### 📊 Résultat

Après l'analyse, l'application présente notamment :

* le résultat de la classification ;
* le niveau de risque ;
* un score ;
* une explication du résultat.

### 🛡️ Sécurité

L'API intègre plusieurs mécanismes de protection :

* validation des entrées ;
* sécurisation des en-têtes HTTP ;
* limitation des requêtes ;
* limitation de la taille des données reçues ;
* journalisation des activités.

---

# 🧠 Modèles utilisés

| Élément analysé | Technologie                  |
| --------------- | ---------------------------- |
| URLs            | Random Forest                |
| Messages        | TF-IDF + Logistic Regression |
| API IA          | Python / FastAPI             |
| API principale  | Node.js / Express            |

---

# 🛠️ Technologies

**Frontend**

`HTML` · `CSS` · `JavaScript`

**Backend**

`Node.js` · `Express.js` · `Zod` · `Helmet`

**Intelligence artificielle**

`Python` · `FastAPI` · `Scikit-learn`

**Infrastructure**

`Docker` · `Nginx` · `HTTPS/TLS`

---

# 📁 Organisation du projet

```text
Protection-hamson/
│
├── frontend/          → Interface utilisateur
├── backend/           → API et sécurité
├── ai-service/        → Service d'intelligence artificielle
├── training/          → Entraînement des modèles
├── datasets/          → Jeux de données
├── models/            → Modèles entraînés
├── reports/           → Résultats et évaluations
├── docs/              → Documentation et captures
├── nginx/             → Configuration serveur
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/HisseinMhtDrya/Protection-hamson.git
cd Protection-hamson
```

### 2. Installer le Backend

```bash
cd backend
npm install
npm start
```

### 3. Installer le service IA

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

L'application peut ensuite être utilisée depuis l'interface web.

---

# 🔬 Évaluation

Le projet comprend également une partie d'évaluation des modèles de Machine Learning.

Les résultats peuvent être présentés à travers :

* Accuracy
* Precision
* Recall
* F1-Score
* ROC-AUC
* Matrice de confusion
* Courbe ROC

Les résultats graphiques sont disponibles dans le dossier :

```text
reports/
```

---

# 🔐 Sécurité du projet

La sécurité constitue une partie importante de **Protection Hamson**.

Le système met notamment en œuvre :

**Helmet** → protection des en-têtes HTTP
**Zod** → validation des données
**Rate Limiting** → limitation des requêtes
**HTTPS/TLS** → sécurisation des communications
**Logs** → traçabilité des analyses

---

# 📌 Contexte académique

Ce projet a été réalisé dans le cadre des travaux pratiques du **Master 1 en Réseaux Informatiques et Cybersécurité**.

Il met en pratique plusieurs domaines :

* Cybersécurité
* Intelligence artificielle
* Machine Learning
* Développement web
* Sécurité des API
* Architecture microservices

---

# 🔮 Perspectives

Les évolutions envisagées comprennent notamment :

* amélioration des modèles de détection ;
* utilisation de datasets plus importants ;
* amélioration de l'explication des résultats ;
* analyse de pièces jointes ;
* ajout d'un tableau de bord ;
* intégration de sources de Threat Intelligence.

---

## 👨‍💻 Auteurs

**Hissein Mahamat Drya & équipe**

**Université de Kinshasa — Faculté des Sciences Informatiques**
**Master 1 — Réseaux & Cybersécurité**

---

<p align="center">
  🛡️ <strong>Protection Hamson</strong><br>
  <em>Détecter • Analyser • Protéger</em>
</p>
