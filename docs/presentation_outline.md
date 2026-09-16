# Trame de présentation — Détecteur Web d'Hameçonnage Assisté par IA

Durée ciblée : 10–15 minutes

1. Introduction (1 min)
   - Présentation rapide du projet et de l'équipe
   - Problématique : phishing et enjeux pour la sécurité

2. Objectifs du projet (1 min)
   - Détecter URL et messages suspects
   - Fournir un score et des explications compréhensibles

3. Architecture globale (2 min)
   - Trois composants : Frontend (SPA), Backend (Express), AI Service (FastAPI)
   - Reverse proxy et terminaison TLS : Nginx
   - Présentation du dépôt et du Docker Compose

4. Démonstration live (4–5 min)
   - Cas 1 : Analyse d'une URL phishing (montrer score, explications)
   - Cas 2 : Analyse d'un message phishing vs message légitime
   - Montrer l'historique des analyses

5. Détails techniques (2–3 min)
   - Modèles utilisés : RandomForest (URL), TF-IDF + LogisticRegression (messages) — fallback rule-based si pas de modèle
   - Extraction de features URL (longueur, sous-domaines, présence d'IP, mots-clés)
   - Explicabilité : règles + explications textuelles
   - Sécurité : Helmet, Rate Limiting, validation d'entrées

6. Déploiement & tests (1 min)
   - Docker Compose pour orchestrer Nginx, Backend, AI Service
   - Commandes pour lancer et vérifier (`docker-compose up --build`)

7. Limites et axes d'amélioration (1 min)
   - Jeu de données et qualité des modèles
   - Ajouter interprétabilité (SHAP), monitoring, CI/CD

8. Questions (1–2 min)

Annexes disponibles : README, scripts d'entraînement (`training/`), notebooks et rapports d'évaluation.
