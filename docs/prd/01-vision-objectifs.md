# 01 - Vision & Objectifs

## Vision produit

**Chiropraxie QCM V2** est une application web PWA moderne pour la révision en chiropraxie via des questionnaires à choix multiples (QCM). Elle permet aux étudiants et professionnels de réviser efficacement, avec une expérience ludique et une intelligence artificielle locale pour enrichir automatiquement les contenus.

### Mission

> Fournir un outil de révision intelligent, gratuit et respectueux de la vie privée, qui s'améliore automatiquement grâce à l'IA locale.

### Proposition de valeur

1. **Gratuit et sans compte** - Pas d'inscription, pas de frais récurrents
2. **100% offline** - Fonctionne sans connexion internet
3. **IA locale** - Génération de questions sans envoyer de données au cloud
4. **Import facile** - Récupérer des contenus depuis Quizlet, PDF, images
5. **Analyse intelligente** - Détection automatique de doublons, enrichissement des métadonnées
6. **Interface ludique** - 10 thèmes visuels, streaks de motivation

---

## Objectifs V2

### Objectifs principaux

| # | Objectif | Mesure de succès |
|---|----------|------------------|
| 1 | **Offline-first** | Application fonctionne 100% sans internet |
| 2 | **IA locale** | Génération de questions via Ollama |
| 3 | **Import Quizlet** | Importer un set Quizlet en < 2 minutes |
| 4 | **Interface ludique** | 10 thèmes visuels disponibles |
| 5 | **Zéro coût** | Pas de backend cloud, pas de frais |

### Objectifs secondaires

| # | Objectif | Mesure de succès |
|---|----------|------------------|
| 6 | **Workflow d'analyse** | Détection doublons > 90% précision |
| 7 | **Enrichissement IA** | Tags automatiques sur 80%+ des questions |
| 8 | **Spaced repetition** | Algorithme SM-2 implémenté |
| 9 | **Streaks** | Suivi jours consécutifs de révision |
| 10 | **PWA installable** | Score Lighthouse PWA > 90 |

---

## Comparaison V1 vs V2

| Aspect | V1 (Python) | V2 (React/PWA) |
|--------|-------------|----------------|
| **Installation** | Python requis | Navigateur web uniquement |
| **Plateforme** | Desktop (script) | Web + Mobile + Desktop (PWA) |
| **Backend** | Serveur Python local | Aucun (100% client-side) |
| **Stockage** | Fichiers JSON locaux | IndexedDB (Dexie.js) |
| **Interface** | HTML basique | React + daisyUI (10 thèmes) |
| **IA** | Aucune | Ollama local (mistral:7b) |
| **Import** | Manuel (Markdown) | Automatisé (Quizlet, PDF, images) |
| **Progression** | Aucune | Spaced repetition + streaks |
| **Analyse qualité** | Aucune | IA (doublons, cohérence, tags) |
| **Partage** | Fichiers directs | Export/Import JSON |
| **Offline** | Oui (local) | Oui (PWA + Service Worker) |
| **Langue UI** | Français | Français |

---

## Contraintes

### Contraintes techniques

| Contrainte | Impact | Décision |
|------------|--------|----------|
| **Budget zéro** | Pas de serveur cloud | Architecture 100% client-side |
| **Offline obligatoire** | Pas d'API externes requises | Stockage IndexedDB, IA locale |
| **Quizlet bloque scraping** | HTTP 403 sur fetch | Workflow copy-paste |
| **IA locale requiert Ollama** | Installation utilisateur | Documentation claire, mode dégradé |

### Contraintes produit

| Contrainte | Impact | Décision |
|------------|--------|----------|
| **Mode anonyme** | Pas de sync entre appareils | Export/Import JSON manuel |
| **Français uniquement** | Pas d'i18n multilingue | Interface et contenus en français |
| **Pas de migration V1** | Données V1 non compatibles | Nouveau workflow d'import |

---

## Justification non-migration V1

### Pourquoi ne pas migrer les données V1 ?

1. **Modèle de données différent**
   - V1: Questions simples (texte, choix, réponse)
   - V2: Questions enrichies (tags, difficulté, source, explication, score qualité)

2. **Workflow différent**
   - V1: Banque statique (fichiers Markdown)
   - V2: Banque vivante (analyse IA, enrichissement continu)

3. **Format incompatible**
   - V1: Markdown custom avec parsing fragile
   - V2: JSON structuré avec validation Zod

4. **Qualité variable**
   - V1: Questions non validées, possibles doublons
   - V2: Workflow d'analyse qualité systématique

### Solution recommandée

Plutôt que migrer, **réimporter via le workflow V2** :

1. Exporter les questions V1 en texte brut
2. Utiliser l'import "texte libre" de V2
3. Laisser l'IA analyser, détecter doublons, enrichir
4. Valider manuellement avant ajout final

Avantage : toutes les questions passent par le pipeline qualité V2.

---

## Public cible

### Utilisateurs primaires

**Étudiants en chiropraxie**
- Besoins: réviser efficacement, suivre progression
- Contexte: études sur plusieurs années, nombreuses matières
- Motivation: réussir examens, mémoriser long terme

### Utilisateurs secondaires

**Professionnels en exercice**
- Besoins: maintenir connaissances à jour
- Contexte: formation continue, révisions ponctuelles
- Motivation: excellence professionnelle

**Formateurs**
- Besoins: créer et partager des QCM
- Contexte: enseignement, évaluations
- Motivation: outils pédagogiques modernes

---

## Cas d'usage principaux

### UC-1: Révision quotidienne

> En tant qu'étudiant, je veux réviser 20 questions par jour pour maintenir mon streak et mémoriser sur le long terme.

**Flow:**
1. Ouvrir l'application
2. Voir "À réviser aujourd'hui" (spaced repetition)
3. Répondre aux questions
4. Voir score et streak mis à jour

### UC-2: Import depuis Quizlet

> En tant qu'étudiant, je veux importer un set Quizlet de mon cours pour l'ajouter à ma banque personnelle.

**Flow:**
1. Ouvrir Quizlet, copier le contenu du set
2. Coller dans l'interface d'import
3. Prévisualiser les questions générées
4. Valider et ajouter à la banque

### UC-3: Génération IA depuis cours

> En tant qu'étudiant, je veux générer des QCM depuis mes notes de cours PDF pour réviser le contenu.

**Flow:**
1. Uploader le PDF
2. Extraction texte automatique
3. IA génère N questions
4. Prévisualiser, éditer si nécessaire
5. Ajouter à la banque

### UC-4: Révision par thème

> En tant qu'étudiant, je veux réviser uniquement le thème "Anatomie" avant mon examen.

**Flow:**
1. Sélectionner thème "Anatomie"
2. Configurer quiz (nombre, difficulté)
3. Répondre aux questions
4. Voir résultats détaillés par sous-thème

### UC-5: Partage entre étudiants

> En tant qu'étudiant, je veux partager ma banque de questions avec un camarade.

**Flow:**
1. Exporter banque en JSON
2. Envoyer fichier (email, clé USB, cloud personnel)
3. Camarade importe le JSON
4. Questions ajoutées à sa banque locale

---

## Hors scope (V2)

Les fonctionnalités suivantes sont explicitement **hors scope** pour la V2 :

- ❌ Backend cloud / API
- ❌ Authentification / comptes utilisateur
- ❌ Synchronisation multi-appareils automatique
- ❌ Badges / XP / niveaux (gamification avancée)
- ❌ Leaderboards / classements
- ❌ Mode multijoueur
- ❌ Application mobile native (React Native)
- ❌ Interface multilingue
- ❌ Monétisation

Ces fonctionnalités pourront être considérées pour une V3 future.

---

## Métriques de succès

### Métriques techniques

| Métrique | Cible |
|----------|-------|
| Score Lighthouse Performance | > 90 |
| Score Lighthouse PWA | > 90 |
| Time to Interactive | < 3s |
| Bundle size | < 500KB gzip |
| Couverture tests | > 80% |

### Métriques produit

| Métrique | Cible |
|----------|-------|
| Temps import Quizlet | < 2 min |
| Précision détection doublons | > 90% |
| Génération IA (par question) | < 10s |
| Taux d'erreur IA | < 20% |

---

*Suivant: [02 - Architecture Technique](02-architecture-technique.md)*
