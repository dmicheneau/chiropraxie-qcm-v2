# 03 - Phases d'Implémentation

## Vue d'ensemble

L'implémentation de Chiropraxie QCM V2 est organisée en **6 phases progressives**, chacune produisant un livrable fonctionnel. Cette approche permet de valider les fonctionnalités core avant d'ajouter de la complexité.

```
Phase 0    Phase 1      Phase 2       Phase 3        Phase 4         Phase 5       Phase 6
 Setup   MVP Core   Import Quizlet  IA + Analyse   Imports avancés  Gamification  Polissage
  ████     ████████     ██████        ████████        ██████          ██████        ████
 1 sem    3-4 sem      2-3 sem        3-4 sem        2-3 sem         2-3 sem       2 sem
  
                                    ▲                               ▲
                                    │                               │
                               MILESTONE 3                     MILESTONE 4
                            (Feature core)                  (Feature complete)
```

---

## Phase 0: Setup & Fondations (1 semaine)

### Objectifs
- Initialiser le projet avec la stack complète
- Configurer l'environnement de développement
- Mettre en place les outils de qualité (lint, tests, CI)

### Tâches

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 0.1 | Initialiser projet Vite + React + TypeScript | Critique | 0.5j |
| 0.2 | Configurer Tailwind CSS + daisyUI | Critique | 0.5j |
| 0.3 | Configurer ESLint + Prettier | Haute | 0.25j |
| 0.4 | Setup Vitest + Testing Library | Haute | 0.5j |
| 0.5 | Setup Playwright (base) | Moyenne | 0.25j |
| 0.6 | Configurer vite-plugin-pwa (manifest, icons) | Haute | 0.5j |
| 0.7 | Initialiser Dexie.js (schéma IndexedDB) | Critique | 0.5j |
| 0.8 | Configurer Zustand (stores vides) | Haute | 0.25j |
| 0.9 | Setup i18next avec fichier fr.json | Moyenne | 0.25j |
| 0.10 | Structure dossiers selon architecture | Haute | 0.25j |
| 0.11 | Créer thème "toulouse" (thème par défaut) | Haute | 0.5j |
| 0.12 | README avec instructions dev | Moyenne | 0.25j |

### Livrables
- [ ] Projet qui démarre (`bun dev`)
- [ ] PWA installable (manifest basique)
- [ ] IndexedDB initialisée
- [ ] Thème Toulouse appliqué
- [ ] Tests passent (`bun test`)
- [ ] Lint propre (`bun lint`)

### Critères d'acceptance
- `bun dev` lance l'app sans erreur
- L'app s'affiche avec le thème Toulouse
- Le manifest PWA est détecté par le navigateur
- IndexedDB crée les tables au premier chargement

---

## Phase 1: MVP Core (3-4 semaines)

### Objectifs
- Quiz fonctionnel avec questions embarquées
- Navigation complète entre pages
- Stockage local de la progression

### User Stories

#### US-1.1: Page d'accueil
> En tant qu'utilisateur, je veux voir un dashboard avec mes statistiques et un bouton pour démarrer un quiz.

**Acceptance:**
- Affiche streak actuel (ou "Commencez votre streak!")
- Bouton "Démarrer un quiz" visible
- Affiche nombre total de questions disponibles

#### US-1.2: Configuration du quiz
> En tant qu'utilisateur, je veux configurer mon quiz (thème, nombre de questions) avant de commencer.

**Acceptance:**
- Sélectionner un thème ou "Tous les thèmes"
- Choisir nombre de questions (10, 20, 30, 50)
- Choisir difficulté (Toutes, Facile, Moyen, Difficile)
- Option mélanger les questions (défaut: oui)

#### US-1.3: Répondre à une question
> En tant qu'utilisateur, je veux voir une question et sélectionner ma réponse.

**Acceptance:**
- Question affichée clairement
- 4 choix visibles (A, B, C, D)
- Sélection d'un choix le met en surbrillance
- Bouton "Valider" pour confirmer

#### US-1.4: Voir le résultat
> En tant qu'utilisateur, je veux voir si ma réponse est correcte et comprendre pourquoi.

**Acceptance:**
- Après validation: vert (correct) ou rouge (incorrect)
- La bonne réponse est indiquée
- Explication affichée si disponible
- Bouton "Question suivante"

#### US-1.5: Fin de quiz
> En tant qu'utilisateur, je veux voir mon score final et mes statistiques.

**Acceptance:**
- Score affiché (X/Y - pourcentage)
- Liste des questions avec indicateur correct/incorrect
- Option revoir les questions ratées
- Bouton "Nouveau quiz"

#### US-1.6: Page Statistiques
> En tant qu'utilisateur, je veux voir ma progression globale.

**Acceptance:**
- Graphique évolution du score (7 derniers jours)
- Score moyen par thème
- Questions les plus ratées
- Streak actuel et record

#### US-1.7: Page Paramètres
> En tant qu'utilisateur, je veux personnaliser mon expérience.

**Acceptance:**
- Sélecteur de thème (10 thèmes)
- Nombre de questions par défaut
- Toggle: afficher explications automatiquement
- Bouton: exporter mes données

### Tâches techniques

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 1.1 | Créer layout principal (Header, Navigation, Footer) | Critique | 1j |
| 1.2 | Implémenter routing (react-router-dom) | Critique | 0.5j |
| 1.3 | Créer composants UI de base (Button, Card, Modal) | Critique | 1.5j |
| 1.4 | Créer page Home avec dashboard | Haute | 1j |
| 1.5 | Créer composant QuizCard | Critique | 1j |
| 1.6 | Créer composant ChoiceButton | Critique | 0.5j |
| 1.7 | Implémenter quiz flow (start → questions → results) | Critique | 2j |
| 1.8 | Créer page Results avec score | Haute | 1j |
| 1.9 | Implémenter quizStore (Zustand) | Critique | 1j |
| 1.10 | Implémenter progressStore | Haute | 1j |
| 1.11 | Créer banque de questions embarquée (50+ questions) | Haute | 1j |
| 1.12 | Créer page Stats avec graphiques | Moyenne | 1.5j |
| 1.13 | Créer page Settings | Moyenne | 1j |
| 1.14 | Implémenter settingsStore | Moyenne | 0.5j |
| 1.15 | Persistence IndexedDB (progress, sessions) | Haute | 1j |
| 1.16 | Animations transitions (Framer Motion) | Basse | 0.5j |
| 1.17 | Tests composants principaux | Haute | 1.5j |

### Données embarquées

Pour la Phase 1, inclure une banque de ~50 questions de démonstration:

```typescript
// data/defaultBank.ts
export const defaultBank: QuestionBank = {
  id: 'default-v2',
  name: 'Banque de démonstration',
  description: 'Questions de base pour découvrir l\'application',
  isDefault: true,
  questions: [
    // ~50 questions variées couvrant différents thèmes
  ]
}
```

### Livrables
- [ ] Navigation complète (Home, Quiz, Stats, Settings)
- [ ] Quiz jouable de bout en bout
- [ ] Progression sauvegardée localement
- [ ] 10 thèmes visuels fonctionnels
- [ ] Page statistiques avec graphiques

### Critères d'acceptance
- Quiz fonctionne 100% offline
- Score calculé correctement
- Progression persiste après refresh
- Tous les thèmes s'affichent correctement
- Tests unitaires passent (>80% coverage composants)

---

## Phase 2: Import Quizlet (2-3 semaines)

### Objectifs
- Permettre l'import de contenus depuis Quizlet via copy-paste
- Parser différents formats de flashcards
- Transformer en questions QCM

### User Stories

#### US-2.1: Copier depuis Quizlet
> En tant qu'utilisateur, je veux copier le contenu d'un set Quizlet et le coller dans l'app.

**Acceptance:**
- Zone de texte "Collez votre contenu ici"
- Instructions claires pour copier depuis Quizlet
- Bouton "Analyser"

#### US-2.2: Prévisualiser l'import
> En tant qu'utilisateur, je veux voir les flashcards détectées avant de les convertir.

**Acceptance:**
- Liste des paires terme/définition détectées
- Nombre de cartes trouvées
- Possibilité d'éditer/supprimer avant conversion

#### US-2.3: Convertir en QCM
> En tant qu'utilisateur, je veux transformer les flashcards en questions QCM.

**Acceptance:**
- Choix du type de conversion:
  - Terme → Question, Définition → Bonne réponse
  - Définition → Question, Terme → Bonne réponse
- Génération automatique des mauvaises réponses (autres termes du set)
- Prévisualisation des QCM générés

#### US-2.4: Valider et sauvegarder
> En tant qu'utilisateur, je veux ajouter les questions converties à ma banque.

**Acceptance:**
- Sélectionner/désélectionner des questions
- Choisir le thème et sous-thème
- Choisir la difficulté par défaut
- Bouton "Ajouter à ma banque"
- Confirmation du nombre ajouté

### Formats supportés

```
Format 1: Tabulation (export Quizlet standard)
Terme1    Définition1
Terme2    Définition2

Format 2: Pipe
Terme1 | Définition1
Terme2 | Définition2

Format 3: Double newline
Terme1
Définition1

Terme2
Définition2

Format 4: Numéroté
1. Terme1 - Définition1
2. Terme2 - Définition2
```

### Tâches techniques

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 2.1 | Créer page Import avec onglets (Quizlet, PDF, Image, Texte) | Critique | 1j |
| 2.2 | Implémenter parser multi-format Quizlet | Critique | 2j |
| 2.3 | Créer composant FlashcardPreview | Haute | 1j |
| 2.4 | Implémenter conversion flashcard → QCM | Critique | 2j |
| 2.5 | Générateur de mauvaises réponses (shuffle autres termes) | Haute | 1j |
| 2.6 | Créer composant QuestionPreview | Haute | 1j |
| 2.7 | Implémenter bankStore (ajout questions) | Critique | 1j |
| 2.8 | Validation Zod pour questions importées | Haute | 0.5j |
| 2.9 | Persistence banques personnalisées | Haute | 1j |
| 2.10 | Tests parsers avec différents formats | Haute | 1j |

### Livrables
- [ ] Page Import avec workflow complet
- [ ] Parsing 4 formats Quizlet
- [ ] Conversion flashcards → QCM
- [ ] Questions ajoutées à la banque locale

### Critères d'acceptance
- Import 100 flashcards < 30 secondes
- Détection format automatique
- 0 perte de données à l'import
- Questions importées jouables immédiatement

---

## Phase 3: IA + Workflow d'Analyse (3-4 semaines)

### Objectifs
- Intégrer Ollama pour génération de questions
- Implémenter le workflow d'analyse qualité
- Enrichissement automatique des métadonnées

### User Stories

#### US-3.1: Générer questions depuis texte
> En tant qu'utilisateur, je veux coller du texte et générer des QCM avec l'IA.

**Acceptance:**
- Zone texte libre (notes de cours, paragraphes)
- Choix nombre de questions à générer (5, 10, 15, 20)
- Indicateur de progression "Génération en cours..."
- Timeout et message d'erreur si Ollama non disponible

#### US-3.2: Prévisualiser et éditer
> En tant qu'utilisateur, je veux voir et modifier les questions générées.

**Acceptance:**
- Questions affichées une par une
- Édition du texte, choix, bonne réponse
- Bouton "Régénérer cette question"
- Score de confiance IA affiché

#### US-3.3: Détecter les doublons
> En tant qu'utilisateur, je veux être alerté si une question existe déjà.

**Acceptance:**
- Comparaison avec banque existante
- Indicateur "Similaire à..." si match > 80%
- Option "Ignorer" ou "Remplacer"

#### US-3.4: Tags automatiques
> En tant qu'utilisateur, je veux que l'IA suggère des tags pour chaque question.

**Acceptance:**
- 3-5 tags suggérés par question
- Possibilité d'ajouter/supprimer des tags
- Tags réutilisés pour recherche

#### US-3.5: Analyse qualité
> En tant qu'utilisateur, je veux voir un score de qualité pour chaque question.

**Acceptance:**
- Score 0-100 affiché
- Icône couleur (vert > 80, jaune 50-80, rouge < 50)
- Détails: cohérence, clarté, difficulté

### Architecture IA

```
┌────────────────────────────────────────────────────────────────┐
│                        TEXTE SOURCE                             │
│               (notes, paragraphes, copier-coller)               │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     GÉNÉRATION IA (Ollama)                      │
│                    mistral:7b-instruct                          │
│  Prompt: "Génère N QCM en français sur ce texte..."            │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    PARSING RÉPONSE IA                           │
│          Extraction JSON des questions générées                 │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   ANALYSE QUALITÉ                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Cohérence  │  │  Doublons   │  │  Score qualité          │ │
│  │   (0-100)   │  │  (similitude│  │  (agrégé)               │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  ENRICHISSEMENT                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Tags auto   │  │ Difficulté  │  │  Explication            │ │
│  │  (IA)       │  │  (analyse)  │  │  (IA)                   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│               VALIDATION HUMAINE                                │
│  Prévisualisation → Édition → Confirmation                      │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   BANQUE DE QUESTIONS                           │
│                     (IndexedDB)                                 │
└────────────────────────────────────────────────────────────────┘
```

### Tâches techniques

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 3.1 | Créer service Ollama (vérification santé, génération) | Critique | 1j |
| 3.2 | Créer hook useOllama avec gestion erreurs | Critique | 1j |
| 3.3 | Concevoir prompts pour génération QCM français | Critique | 1.5j |
| 3.4 | Parser réponses IA (extraction JSON) | Critique | 1j |
| 3.5 | Implémenter page/onglet "Générer avec IA" | Haute | 1.5j |
| 3.6 | Créer indicateur de progression génération | Haute | 0.5j |
| 3.7 | Implémenter détection doublons (Jaccard/Levenshtein) | Haute | 1.5j |
| 3.8 | Implémenter scoring qualité | Haute | 1j |
| 3.9 | Implémenter génération tags automatiques | Moyenne | 1j |
| 3.10 | Implémenter estimation difficulté | Moyenne | 0.5j |
| 3.11 | Créer composant QualityScore | Haute | 0.5j |
| 3.12 | Créer composant DuplicateWarning | Haute | 0.5j |
| 3.13 | Mode dégradé si Ollama non disponible | Haute | 0.5j |
| 3.14 | Paramètres Ollama dans Settings | Moyenne | 0.5j |
| 3.15 | Tests service Ollama (mocks) | Haute | 1j |

### Prompts IA

```typescript
// Prompt génération de questions
const GENERATE_PROMPT = `
Tu es un expert en création de QCM pédagogiques en français.
Génère exactement {count} questions à choix multiples basées sur ce texte.

RÈGLES:
1. Chaque question doit avoir exactement 4 choix (A, B, C, D)
2. Une seule bonne réponse par question
3. Les mauvaises réponses doivent être plausibles
4. Inclure une explication courte pour chaque question
5. Varier la difficulté (facile, moyen, difficile)

FORMAT DE SORTIE (JSON):
{
  "questions": [
    {
      "text": "Question ici",
      "choices": [
        {"id": "A", "text": "Choix A"},
        {"id": "B", "text": "Choix B"},
        {"id": "C", "text": "Choix C"},
        {"id": "D", "text": "Choix D"}
      ],
      "correctAnswer": "A",
      "explanation": "Explication courte",
      "difficulty": "medium",
      "tags": ["tag1", "tag2"]
    }
  ]
}

TEXTE SOURCE:
{sourceText}
`
```

### Livrables
- [ ] Génération IA fonctionnelle
- [ ] Détection doublons opérationnelle
- [ ] Scoring qualité affiché
- [ ] Tags automatiques
- [ ] Mode dégradé sans Ollama

### Critères d'acceptance
- Génération 10 questions < 2 minutes
- Précision doublons > 90%
- Message clair si Ollama non disponible
- Questions générées valides (Zod)

---

## Phase 4: Imports Avancés (2-3 semaines)

### Objectifs
- Import depuis fichiers PDF
- Import depuis images (OCR)
- Export/Import JSON pour partage

### User Stories

#### US-4.1: Import PDF
> En tant qu'utilisateur, je veux importer un cours PDF et générer des questions.

**Acceptance:**
- Upload fichier PDF
- Extraction texte automatique
- Prévisualisation du texte extrait
- Génération IA des questions

#### US-4.2: Import Image (OCR)
> En tant qu'utilisateur, je veux prendre en photo mes notes et les importer.

**Acceptance:**
- Upload image (photo, scan)
- OCR avec Tesseract.js
- Prévisualisation du texte extrait
- Édition possible avant génération

#### US-4.3: Export banque
> En tant qu'utilisateur, je veux exporter ma banque de questions.

**Acceptance:**
- Bouton "Exporter en JSON"
- Téléchargement fichier `.json`
- Format lisible et documenté

#### US-4.4: Import banque
> En tant qu'utilisateur, je veux importer une banque partagée par un camarade.

**Acceptance:**
- Upload fichier JSON
- Validation du format
- Prévisualisation des questions
- Choix: fusionner ou remplacer

### Tâches techniques

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 4.1 | Intégrer pdf.js pour extraction texte | Critique | 1.5j |
| 4.2 | Créer onglet Import PDF | Haute | 1j |
| 4.3 | Intégrer Tesseract.js pour OCR | Haute | 1.5j |
| 4.4 | Créer onglet Import Image | Haute | 1j |
| 4.5 | Optimiser OCR (prétraitement image) | Moyenne | 1j |
| 4.6 | Créer service export JSON | Critique | 0.5j |
| 4.7 | Créer service import JSON avec validation | Critique | 1j |
| 4.8 | UI export dans Settings | Haute | 0.5j |
| 4.9 | UI import JSON dans page Import | Haute | 1j |
| 4.10 | Gestion conflits (fusion/remplacement) | Haute | 1j |
| 4.11 | Tests imports (fixtures PDF, images) | Haute | 1j |

### Formats d'export/import

```typescript
// Format JSON d'export
interface ExportFormat {
  version: '2.0'
  exportedAt: string  // ISO 8601
  banks: QuestionBank[]
  metadata: {
    totalQuestions: number
    themes: string[]
  }
}
```

### Livrables
- [ ] Import PDF fonctionnel
- [ ] Import images (OCR) fonctionnel
- [ ] Export JSON opérationnel
- [ ] Import JSON avec gestion conflits

### Critères d'acceptance
- PDF < 20 pages traité en < 30s
- OCR image < 5s
- Export/Import sans perte de données
- Validation format JSON stricte

---

## Phase 5: Gamification & Spaced Repetition (2-3 semaines)

### Objectifs
- Système de streaks motivant
- Algorithme de révision espacée (SM-2)
- Suggestions "À réviser aujourd'hui"

### User Stories

#### US-5.1: Suivi du streak
> En tant qu'utilisateur, je veux voir mon streak de jours consécutifs.

**Acceptance:**
- Compteur visible sur Home
- Notification visuelle quand streak augmente
- Record personnel affiché

#### US-5.2: Révision espacée
> En tant qu'utilisateur, je veux que l'app me suggère les questions à réviser.

**Acceptance:**
- Section "À réviser aujourd'hui" sur Home
- Nombre de questions à réviser
- Basé sur algorithme SM-2
- Questions les plus anciennes en priorité

#### US-5.3: Mode révision
> En tant qu'utilisateur, je veux un mode de révision ciblé.

**Acceptance:**
- Bouton "Réviser maintenant"
- Quiz avec uniquement les questions dues
- Mise à jour des intervalles après réponse

#### US-5.4: Protection du streak
> En tant qu'utilisateur, je veux être prévenu si je risque de perdre mon streak.

**Acceptance:**
- Notification/badge si pas d'activité du jour
- Affichage heure depuis dernière activité

### Algorithme SM-2

```typescript
interface SM2Result {
  interval: number      // Jours jusqu'à prochaine révision
  easeFactor: number    // Facteur de facilité (min: 1.3)
  repetitions: number   // Nombre de répétitions consécutives réussies
}

function calculateSM2(
  quality: number,     // 0-5 (0-2: échec, 3: correct difficile, 4: correct, 5: parfait)
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  if (quality < 3) {
    // Échec: reset
    return {
      interval: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      repetitions: 0
    }
  }
  
  // Succès
  const newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  let newInterval: number
  if (repetitions === 0) {
    newInterval = 1
  } else if (repetitions === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEF)
  }
  
  return {
    interval: newInterval,
    easeFactor: Math.max(1.3, newEF),
    repetitions: repetitions + 1
  }
}
```

### Tâches techniques

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 5.1 | Implémenter streakStore | Critique | 0.5j |
| 5.2 | Créer composant StreakBadge | Haute | 0.5j |
| 5.3 | Logique de calcul/reset streak | Critique | 0.5j |
| 5.4 | Implémenter algorithme SM-2 | Critique | 1j |
| 5.5 | Intégrer SM-2 dans progressStore | Haute | 1j |
| 5.6 | Créer section "À réviser" sur Home | Haute | 1j |
| 5.7 | Créer mode Quiz révision | Haute | 1.5j |
| 5.8 | Animation célébration nouveau streak | Basse | 0.5j |
| 5.9 | Badge notification streak en danger | Moyenne | 0.5j |
| 5.10 | Tests unitaires SM-2 | Haute | 0.5j |
| 5.11 | Statistiques révision dans Stats | Moyenne | 1j |

### Livrables
- [ ] Streaks fonctionnels
- [ ] Révision espacée (SM-2) opérationnelle
- [ ] Mode révision dédié
- [ ] Statistiques de révision

### Critères d'acceptance
- Streak correctement calculé (reset à minuit)
- SM-2 conforme à l'algorithme standard
- Questions dues apparaissent le bon jour
- Animations fluides (60fps)

---

## Phase 6: Polissage & Production (2 semaines)

### Objectifs
- Optimisations performances
- Tests E2E complets
- Documentation utilisateur
- Préparation déploiement

### Tâches

| # | Tâche | Priorité | Durée |
|---|-------|----------|-------|
| 6.1 | Audit Lighthouse (Performance, PWA, A11y) | Critique | 0.5j |
| 6.2 | Optimiser bundle size (tree-shaking, lazy loading) | Haute | 1j |
| 6.3 | Optimiser images/assets | Haute | 0.5j |
| 6.4 | Tests E2E Playwright (flows critiques) | Critique | 2j |
| 6.5 | Tests accessibilité (a11y) | Haute | 0.5j |
| 6.6 | Créer les 9 autres thèmes (nocturne→cupcake) | Haute | 2j |
| 6.7 | Corrections bugs Phase 1-5 | Critique | 1j |
| 6.8 | Documentation utilisateur in-app | Moyenne | 0.5j |
| 6.9 | Onboarding premier lancement | Moyenne | 0.5j |
| 6.10 | Configurer déploiement (Netlify/Vercel) | Haute | 0.5j |
| 6.11 | Tests cross-browser (Chrome, Firefox, Safari) | Haute | 0.5j |
| 6.12 | Test installation PWA (mobile, desktop) | Critique | 0.5j |

### Métriques cibles

| Métrique | Cible | Méthode |
|----------|-------|---------|
| Lighthouse Performance | > 90 | `lighthouse` CLI |
| Lighthouse PWA | > 90 | `lighthouse` CLI |
| Lighthouse Accessibility | > 90 | `lighthouse` CLI |
| First Contentful Paint | < 1.5s | Web Vitals |
| Time to Interactive | < 3s | Web Vitals |
| Bundle size (gzip) | < 500KB | Vite build |
| Test coverage | > 80% | Vitest |
| E2E pass rate | 100% | Playwright |

### Livrables
- [ ] Score Lighthouse > 90 partout
- [ ] Tests E2E passent à 100%
- [ ] 10 thèmes complets
- [ ] PWA installable et fonctionnelle
- [ ] Déploiement configuré

### Critères d'acceptance
- Zéro erreur console en production
- Fonctionne offline après installation
- Installable sur iOS/Android/Desktop
- Tous les tests passent

---

## Dépendances entre phases

```
Phase 0 ───────┐
               │
               ▼
Phase 1 ───────┬───────────────────────────────────┐
               │                                    │
               ▼                                    ▼
Phase 2        ├──────────────────────────► Phase 4 (PDF/Image)
               │                                    │
               ▼                                    │
Phase 3 ───────┴────────────────────────────────────┤
               │                                    │
               └──────────────────┬─────────────────┘
                                  │
                                  ▼
                             Phase 5
                                  │
                                  ▼
                             Phase 6
```

**Dépendances critiques:**
- Phase 1 bloque toutes les autres (fondations)
- Phase 3 (IA) peut démarrer dès Phase 1 terminée
- Phase 4 dépend de Phase 3 (utilise génération IA)
- Phase 5 dépend de Phase 1 (progressStore)
- Phase 6 attend que tout soit stable

---

## Risques par phase

| Phase | Risque | Impact | Mitigation |
|-------|--------|--------|------------|
| 0 | Configuration PWA complexe | Moyen | Documentation vite-plugin-pwa |
| 1 | Scope creep UI | Haut | MVP strict, thèmes Phase 6 |
| 2 | Formats Quizlet variés | Moyen | Tests avec 10+ sets réels |
| 3 | Qualité réponses IA | Haut | Prompts itératifs, validation humaine |
| 4 | OCR français médiocre | Moyen | Prétraitement images, mode dégradé |
| 5 | SM-2 complexe | Faible | Librairie existante si besoin |
| 6 | Cross-browser issues | Moyen | Tests tôt, fallbacks |

---

*Précédent: [02 - Architecture Technique](02-architecture-technique.md)*  
*Suivant: [04 - Workflow d'Analyse](04-workflow-analyse.md)*
