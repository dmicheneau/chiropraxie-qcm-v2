# Agent Guidelines for chiropraxie-qcm-v2

Ce document fournit les directives pour les agents IA travaillant sur ce projet.

## Vue d'ensemble du projet

**chiropraxie-qcm-v2** est une application web de quiz (QCM) pour la révision en chiropraxie. Il s'agit d'une réécriture complète (V2) de l'application Python originale, reconstruite avec des technologies web modernes et une approche offline-first avec IA locale.

**Type de projet**: Application web PWA (système de quiz/QCM)  
**Version originale**: Serveur Python local avec frontend HTML  
**Objectifs V2**: Implémentation TypeScript/React avec IA locale (Ollama), workflow d'analyse intelligent, interface ludique

---

## Commandes Build, Lint & Test

### Installation

```bash
# Installer les dépendances
bun install

# Serveur de développement
bun dev

# Build production
bun build

# Preview build production
bun preview
```

### Linting & Formatage

```bash
# Exécuter ESLint
bun lint

# Corriger automatiquement les erreurs de lint
bun lint:fix

# Formater le code avec Prettier
bun format

# Vérification des types TypeScript
bun type-check
```

### Tests

```bash
# IMPORTANT: Utiliser "bun run test" et non "bun test"
# "bun test" utilise le test runner natif de Bun (incompatible avec jsdom)
# "bun run test" exécute vitest via le script package.json

# Exécuter tous les tests (vitest)
bun run test

# Tests en mode watch
bun run test:watch

# Exécuter un seul fichier de test
bun run test -- src/tests/components/Quiz.test.tsx

# Tests avec couverture
bun run test:coverage

# Tests E2E Playwright
bun run test:e2e
```

---

## Stack Technologique

### Core

| Technologie    | Version | Usage                     |
| -------------- | ------- | ------------------------- |
| **Bun**        | latest  | Runtime & package manager |
| **React**      | 18.x    | Framework UI              |
| **Vite**       | 5.x     | Build tool                |
| **TypeScript** | 5.x     | Langage                   |

### State & Data

| Technologie        | Usage                              |
| ------------------ | ---------------------------------- |
| **Zustand**        | State management global            |
| **TanStack Query** | Cache & data fetching              |
| **Dexie.js**       | IndexedDB wrapper (stockage local) |
| **Zod**            | Validation schemas                 |

### UI & Styling

| Technologie       | Usage                                |
| ----------------- | ------------------------------------ |
| **Tailwind CSS**  | Utility-first CSS                    |
| **daisyUI**       | Composants UI (10 thèmes prédéfinis) |
| **Lucide React**  | Icônes                               |
| **Chart.js**      | Graphiques statistiques              |
| **Framer Motion** | Animations (optionnel)               |

### IA & Imports

| Technologie      | Usage                           |
| ---------------- | ------------------------------- |
| **Ollama**       | IA locale (mistral:7b-instruct) |
| **pdf.js**       | Extraction texte PDF            |
| **Tesseract.js** | OCR images                      |

### Internationalisation

| Technologie       | Usage          |
| ----------------- | -------------- |
| **i18next**       | Framework i18n |
| **react-i18next** | Bindings React |

### Testing

| Technologie         | Usage                  |
| ------------------- | ---------------------- |
| **Vitest**          | Tests unitaires        |
| **Testing Library** | Tests composants React |
| **Playwright**      | Tests E2E              |

### PWA

| Technologie         | Usage                     |
| ------------------- | ------------------------- |
| **vite-plugin-pwa** | Service Worker & manifest |
| **Workbox**         | Stratégies cache offline  |

---

## Architecture Offline-First

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (PWA)                      │
│  React 18 + Vite + TypeScript + Tailwind + daisyUI     │
├─────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                      │
│          Zustand (global) + TanStack Query              │
├─────────────────────────────────────────────────────────┤
│                   STOCKAGE LOCAL                         │
│         Dexie.js (IndexedDB) + Service Worker           │
├─────────────────────────────────────────────────────────┤
│                   INTÉGRATIONS                           │
│  Ollama (localhost:11434) - mistral:7b-instruct        │
│  pdf.js (import PDF) | Tesseract.js (OCR images)       │
│  i18next (français)                                     │
└─────────────────────────────────────────────────────────┘

    PAS DE BACKEND CLOUD - Tout est local
    Export/Import JSON pour partage manuel
```

### Principes clés

1. **Offline-first**: L'application fonctionne sans connexion internet
2. **Zéro backend**: Pas de serveur cloud, pas de coûts récurrents
3. **IA locale**: Ollama pour génération de questions (privacy totale)
4. **PWA installable**: Fonctionne comme une app native
5. **Export/Import**: Partage via fichiers JSON

---

## Intégration IA (Ollama)

### Modèle recommandé

```bash
# Installation Ollama
curl -fsSL https://ollama.com/install.sh | sh  # macOS/Linux
# Windows: télécharger depuis ollama.com

# Modèle principal (français natif, 4.1GB)
ollama pull mistral:7b-instruct

# Alternatives pour hardware limité
ollama pull llama3.2:3b      # 2GB - plus rapide
ollama pull phi3:mini        # 2.3GB - léger
ollama pull gemma2:2b        # 1.6GB - ultra-léger
```

### API Ollama

```typescript
// Endpoint principal
const OLLAMA_API = 'http://localhost:11434/api/generate'

// Exemple appel
async function generateWithOllama(prompt: string): Promise<string> {
  const response = await fetch(OLLAMA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral:7b-instruct',
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error('Ollama non disponible. Vérifiez que Ollama est démarré.')
  }

  const data = await response.json()
  return data.response
}
```

### Gestion des erreurs Ollama

```typescript
// Vérifier si Ollama est disponible
async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    return response.ok
  } catch {
    return false
  }
}

// Message utilisateur si Ollama non démarré
const OLLAMA_ERROR_MESSAGE = `
Ollama n'est pas démarré. Pour utiliser l'IA:
1. Ouvrez un terminal
2. Exécutez: ollama serve
3. Réessayez
`
```

---

## Guidelines Import

### Import Quizlet (Copy-Paste)

```typescript
// Format attendu (copié depuis Quizlet)
// Terme<TAB>Définition ou Terme | Définition

function parseQuizletContent(text: string): FlashCard[] {
  const lines = text.trim().split('\n')
  return lines
    .filter(line => line.trim())
    .map(line => {
      const [term, definition] = line.split(/\t|\|/).map(s => s.trim())
      return { term, definition }
    })
    .filter(card => card.term && card.definition)
}
```

### Import PDF

```typescript
import * as pdfjsLib from 'pdfjs-dist'

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText
}
```

### Import Images (OCR)

```typescript
import Tesseract from 'tesseract.js'

async function extractTextFromImage(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, 'fra', {
    logger: progress => console.log(progress),
  })
  return result.data.text
}
```

---

## Modèle de données

```typescript
// Types de questions supportés
type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false'

// Difficulté
type Difficulty = 'easy' | 'medium' | 'hard'

// Source de la question
type QuestionSource = 'manual' | 'quizlet' | 'ai_generated' | 'pdf_import' | 'image_import'

// Choix de réponse
interface Choice {
  id: string // 'A', 'B', 'C', 'D'
  text: string
}

// Question enrichie V2
interface Question {
  id: string // UUID
  type: QuestionType
  text: string // Texte de la question
  choices?: Choice[] // Options (QCM)
  correctAnswer: string | string[] // ID(s) de la/les bonne(s) réponse(s)
  explanation?: string // Explication de la réponse
  theme: string // Ex: "Anatomie"
  subtheme?: string // Ex: "Système nerveux"
  difficulty: Difficulty
  tags: string[] // Recherche avancée
  source: QuestionSource
  sourceUrl?: string // Traçabilité
  aiPrompt?: string // Si généré par IA
  createdAt: string // ISO date
  updatedAt: string
  metadata?: {
    qualityScore?: number // 0-100
    timesUsed?: number
    successRate?: number // 0-1
  }
}

// Banque de questions
interface QuestionBank {
  id: string
  name: string
  description: string
  questions: Question[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
  metadata: {
    totalQuestions: number
    themes: string[]
    sources: Record<QuestionSource, number>
  }
}

// Progression utilisateur (anonyme, locale)
interface UserProgress {
  questionId: string
  attempts: number
  correctAttempts: number
  lastAttempted: string
  nextReview?: string // Spaced repetition
  easeFactor: number // Algorithme SM-2 (défaut: 2.5)
  interval: number // Jours jusqu'à prochaine révision
}

// Session de quiz
interface QuizSession {
  id: string
  bankId: string
  theme?: string
  questionsIds: string[]
  answers: Record<string, string | string[]>
  startedAt: string
  completedAt?: string
  score?: number
}
```

---

## Workflow d'Analyse et Apprentissage

```
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌──────────┐    ┌────────┐
│  IMPORT  │ → │  ANALYSE   │ → │ ENRICHISSEMENT│ → │ VALIDATION│ → │ BANQUE │
│ (Quizlet,│    │ QUALITÉ IA │    │ AUTO (IA)     │    │ HUMAINE   │    │ VIVANTE│
│ PDF, txt)│    │            │    │               │    │           │    │        │
└──────────┘    └────────────┘    └──────────────┘    └──────────┘    └────────┘
```

### Analyse qualité (Phase 3)

- **Détection doublons**: Similarity matching texte (Jaccard, Levenshtein)
- **Validation cohérence**: IA vérifie que réponses correspondent à la question
- **Calcul difficulté**: Analyse complexité vocabulaire et concepts
- **Score qualité**: Note globale 0-100

### Enrichissement automatique (Phase 3)

- **Tags automatiques**: IA extrait concepts clés
- **Sous-thèmes suggérés**: Hiérarchie automatique
- **Explications générées**: IA génère explication de la réponse
- **Questions similaires**: Suggestions pour révision

### Validation collaborative (Phase 5)

- **Flag questions**: Signaler problèmes (locale, anonyme)
- **Vote qualité**: Simple (pouce haut/bas)
- **Historique**: Track modifications

---

## Structure du projet

```
chiropraxie-qcm-v2/
├── src/
│   ├── components/          # Composants UI réutilisables
│   │   ├── ui/              # Composants de base (Button, Card, Modal)
│   │   ├── quiz/            # Composants quiz (QuizCard, Timer, Results)
│   │   └── layout/          # Layout (Header, Footer, Navigation)
│   ├── pages/               # Pages/Vues principales
│   │   ├── Home.tsx
│   │   ├── Quiz.tsx
│   │   ├── Import.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   ├── features/            # Modules fonctionnels
│   │   ├── quiz/            # Logique quiz, state, hooks
│   │   ├── bank/            # Gestion banque de questions
│   │   ├── import/          # Parsers (Quizlet, PDF, images)
│   │   ├── ai/              # Intégration Ollama
│   │   └── progress/        # Suivi progression, spaced repetition
│   ├── services/            # Services (database, ollama)
│   │   ├── db.ts            # Dexie.js configuration
│   │   ├── ollama.ts        # API Ollama
│   │   └── export.ts        # Export/Import JSON
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── utils/               # Fonctions utilitaires
│   ├── types/               # Définitions TypeScript
│   ├── i18n/                # Traductions (français)
│   ├── styles/              # Styles globaux
│   ├── themes/              # Configuration 10 thèmes daisyUI
│   └── main.tsx             # Point d'entrée
├── public/                  # Assets statiques
├── docs/                    # Documentation
│   └── prd/                 # Product Requirements Document
├── tests/                   # Tests
│   ├── unit/
│   └── e2e/
└── data/                    # Données embarquées (banque par défaut)
```

---

## Conventions de code

### Nommage des fichiers

| Type        | Convention        | Exemple                                |
| ----------- | ----------------- | -------------------------------------- |
| Composants  | PascalCase        | `QuizCard.tsx`, `ThemeSelector.tsx`    |
| Hooks       | camelCase + use   | `useQuiz.ts`, `useTimer.ts`            |
| Stores      | camelCase + Store | `quizStore.ts`, `bankStore.ts`         |
| Utilitaires | camelCase         | `formatScore.ts`, `shuffleArray.ts`    |
| Types       | PascalCase        | `Question.ts`, `QuizState.ts`          |
| Tests       | source + .test    | `QuizCard.test.tsx`, `useQuiz.test.ts` |

### Ordre des imports

```typescript
// 1. Dépendances externes
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// 2. Modules internes (imports absolus @/)
import { Question, QuizConfig } from '@/types'
import { shuffleArray } from '@/utils'
import { QuizCard } from '@/components'
import { useQuizStore } from '@/stores'

// 3. Imports relatifs
import { useQuizState } from './useQuizState'
import styles from './Quiz.module.css'
```

### TypeScript

```typescript
// FAIRE: Types explicites pour paramètres et retours
function calculateScore(answers: Answer[], questions: Question[]): number {
  return answers.filter(a => a.isCorrect).length
}

// ÉVITER: Types implicites any
function calculateScore(answers, questions) {
  return answers.filter(a => a.isCorrect).length
}

// Interfaces pour objets, types pour unions
interface QuizConfig {
  theme: string
  count: number
  shuffle: boolean
}

type QuizStatus = 'idle' | 'active' | 'paused' | 'completed'
```

### Composants React

```typescript
// Props typées avec interface
interface QuizCardProps {
  question: Question
  onAnswer: (answer: Answer) => void
  disabled?: boolean
}

// Composant fonctionnel avec destructuration
export function QuizCard({
  question,
  onAnswer,
  disabled = false
}: QuizCardProps) {
  const { t } = useTranslation()

  return (
    <div className="card bg-base-100 shadow-xl">
      {/* ... */}
    </div>
  )
}
```

### Gestion d'erreurs

```typescript
// Try-catch pour opérations async
async function loadQuestionBank(bankId: string): Promise<QuestionBank> {
  try {
    const bank = await db.banks.get(bankId)
    if (!bank) {
      throw new Error(`Banque non trouvée: ${bankId}`)
    }
    return bank
  } catch (error) {
    console.error('Erreur chargement banque:', error)
    throw new Error('Impossible de charger la banque. Veuillez réessayer.')
  }
}

// Validation avec Zod aux frontières
import { z } from 'zod'

const QuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
  text: z.string().min(10),
  choices: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      })
    )
    .optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  theme: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

function validateQuestion(data: unknown): Question {
  return QuestionSchema.parse(data)
}
```

---

## Thèmes UI (10 prédéfinis)

L'application propose 10 thèmes visuels. Le thème par défaut est **Toulouse**.

| #   | Thème        | Description                            |
| --- | ------------ | -------------------------------------- |
| 1   | **toulouse** | Rouge/Violet/Or - Couleurs de Toulouse |
| 2   | **nocturne** | Dark élégant - Bleu nuit/Argent        |
| 3   | **clown**    | Coloré ludique - Multicolore vif       |
| 4   | **azure**    | Bleu professionnel - Style Microsoft   |
| 5   | **forest**   | Vert nature - Apaisant                 |
| 6   | **sunset**   | Orange/Rose - Coucher de soleil        |
| 7   | **ocean**    | Bleu turquoise - Frais                 |
| 8   | **medical**  | Blanc/Bleu clair - Clean médical       |
| 9   | **lavande**  | Violet doux - Zen                      |
| 10  | **cupcake**  | Rose pastel - Fun                      |

Voir `docs/prd/06-ui-ux-specs.md` pour les palettes complètes.

---

## Conventions Git

### Format des commits (Conventional Commits)

```
type(scope): sujet

corps (optionnel)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Exemples**:

```bash
feat(quiz): ajouter timer avec pause
fix(import): corriger parsing Quizlet avec tabulations
docs: mettre à jour AGENTS.md
refactor(ai): extraire service Ollama
test(quiz): ajouter tests composant QuizCard
chore: mettre à jour dépendances
```

### Branches

```
main              # Production stable
develop           # Développement intégration
feature/xxx       # Nouvelles fonctionnalités
fix/xxx           # Corrections bugs
docs/xxx          # Documentation
```

---

## Serveurs MCP disponibles

**Activés**:

- **MemoAI**: Système de mémoire/apprentissage - utiliser pour tracker learnings et patterns
- **Sequential Thinking**: Résolution problèmes complexes - utiliser pour décisions architecturales
- **Browser MCP**: Contrôle navigateur automatisé - utiliser pour tests d'interface, scraping, interactions web

**Disponibles (désactivés)**: Vitest, Playwright, Semgrep - activer dans `.opencode/opencode.json` si besoin

---

## Utilisation des Skills MemoAI et Sequential Thinking

### MemoAI - Système de mémoire du projet

**Quand utiliser MemoAI** :

- **Au début de chaque session** : Rechercher des learnings pertinents avant de commencer une tâche
- **Après résolution d'un bug** : Enregistrer la cause et la solution pour référence future
- **Lors de décisions techniques** : Documenter les choix architecturaux et leurs raisons
- **Après implémentation** : Enregistrer les patterns, best practices découverts
- **En cas de problème récurrent** : Vérifier si une solution existe déjà dans la mémoire

**Commandes MemoAI disponibles** :

```typescript
// 1. RECHERCHER des learnings passés
memoai_memo_search({
  query: 'ollama integration error handling',
  limit: 5,
  types: ['bug_fix', 'implementation', 'guideline'],
})

// 2. ENREGISTRER un nouveau learning
memoai_memo_record({
  content: 'Fix: Dexie IndexedDB timeout - augmenter pool_size à 20',
  type: 'bug_fix', // bug_fix | implementation | guideline | design_decision | performance | workaround | refactoring | optimization
  context_files: ['src/services/db.ts'],
  tags: ['dexie', 'indexeddb', 'performance'],
})

// 3. OBTENIR des suggestions proactives
memoai_memo_suggest({
  context: 'implementing PDF import with pdf.js',
  limit: 3,
})

// 4. STATISTIQUES de la mémoire
memoai_memo_stats()

// 5. DÉTECTER automatiquement des learnings dans une conversation
memoai_memo_detect({
  text: "J'ai corrigé le timeout en augmentant le pool_size",
  detect_multiple: false,
})
```

**Workflow MemoAI recommandé** :

```
┌──────────────┐
│ Nouvelle     │
│ tâche/bug    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ 1. memo_search()                 │
│    Chercher learnings pertinents │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 2. Travailler sur la tâche       │
│    (lecture code, modifications) │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 3. Résolution/Implémentation     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 4. memo_record()                 │
│    Enregistrer le learning       │
└──────────────────────────────────┘
```

**Exemples concrets** :

```typescript
// Exemple 1: Avant de debugger Ollama
await memoai_memo_search({
  query: 'ollama connection timeout error',
  limit: 3,
})

// Exemple 2: Après avoir fixé un bug Dexie
await memoai_memo_record({
  content:
    "Bug Dexie: Erreur 'DexieError2' au premier lancement. Solution: Ajouter error handler dans db.open() et recréer la DB si corrompue",
  type: 'bug_fix',
  context_files: ['src/services/db.ts'],
  tags: ['dexie', 'indexeddb', 'error-handling'],
})

// Exemple 3: Documenter une décision technique
await memoai_memo_record({
  content:
    'Choix Zustand au lieu de Redux: Plus léger (3KB), moins de boilerplate, parfait pour app offline-first. TanStack Query gère déjà le cache serveur.',
  type: 'design_decision',
  tags: ['state-management', 'zustand', 'architecture'],
})

// Exemple 4: Pattern réutilisable découvert
await memoai_memo_record({
  content:
    'Pattern: Valider données externes avec Zod aux frontières (import Quizlet, PDF). Évite corruptions en profondeur et donne feedback clair utilisateur.',
  type: 'guideline',
  context_files: ['src/services/quizletParser.ts'],
  tags: ['validation', 'zod', 'best-practice'],
})
```

### Sequential Thinking - Résolution de problèmes complexes

**Quand utiliser Sequential Thinking** :

- **Décisions architecturales** : Choix entre plusieurs approches techniques
- **Problèmes complexes multi-étapes** : Debugging difficile, refactoring majeur
- **Analyse de trade-offs** : Comparer avantages/inconvénients de solutions
- **Planification de features** : Décomposer une grosse fonctionnalité
- **Résolution de bugs mystérieux** : Quand la cause n'est pas évidente

**Comment utiliser Sequential Thinking** :

```typescript
// Appel via le tool sequentialthinking_sequentialthinking
sequentialthinking_sequentialthinking({
  thought: 'Je dois choisir entre Zustand et Redux pour le state management',
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  isRevision: false,
})

// Exemple de séquence complète:
// Pensée 1: Identifier le problème
// Pensée 2: Lister les contraintes (offline-first, PWA, performance)
// Pensée 3: Comparer les options (Zustand vs Redux vs Jotai)
// Pensée 4: Analyser les trade-offs
// Pensée 5: Décision finale avec justification
```

**Workflow Sequential Thinking recommandé** :

```
┌─────────────────────────────────┐
│ Problème complexe identifié     │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Pensée 1: Comprendre le problème│
│ - État actuel                   │
│ - Contraintes                   │
│ - Objectifs                     │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Pensée 2-N: Exploration         │
│ - Solutions possibles           │
│ - Avantages/Inconvénients       │
│ - Révisions si nécessaire       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Dernière pensée: Décision       │
│ - Solution retenue              │
│ - Justification                 │
│ - Plan d'action                 │
└─────────────────────────────────┘
```

**Cas d'usage typiques** :

1. **Choix d'architecture** :

   ```
   Problème: Choisir entre LocalStorage, IndexedDB ou SQLite pour stockage offline
   → Sequential Thinking pour analyser capacités, performance, API, compatibilité
   → Décision: IndexedDB avec Dexie.js
   → Enregistrer dans MemoAI la décision et la justification
   ```

2. **Debugging complexe** :

   ```
   Problème: Tests E2E échouent aléatoirement sur mobile Safari
   → Sequential Thinking pour explorer hypothèses (timing, BottomNav, gestures)
   → Révision après tests infructueux
   → Solution trouvée: evaluate click au lieu de direct click
   → Enregistrer dans MemoAI le bug et la solution
   ```

3. **Refactoring majeur** :
   ```
   Problème: Réorganiser structure des stores Zustand
   → Sequential Thinking pour planifier les étapes sans casser l'existant
   → Identifier dépendances et ordre de migration
   → Décision: Approche graduelle avec feature flags
   ```

**Combiner MemoAI + Sequential Thinking** :

```
AVANT (Sequential Thinking)
   ↓
RECHERCHE MEMOAI (learnings passés)
   ↓
DÉCISION (Sequential Thinking guidé par mémoire)
   ↓
IMPLÉMENTATION
   ↓
ENREGISTREMENT MEMOAI (nouveau learning)
```

**Exemple complet** :

```typescript
// 1. Problème: Implémenter système de thèmes
// Utiliser Sequential Thinking pour analyser

// 2. Rechercher dans MemoAI
const pastLearnings = await memoai_memo_search({
  query: 'theme system CSS Tailwind daisyUI',
  limit: 5,
})

// 3. Décision guidée par learnings + Sequential Thinking
// → Choix: daisyUI avec 10 thèmes custom

// 4. Après implémentation, enregistrer
await memoai_memo_record({
  content:
    "Implémentation système 10 thèmes avec daisyUI. Config dans tailwind.config.js. Stockage préférence dans localStorage via settingsStore. Thème par défaut: 'toulouse'.",
  type: 'implementation',
  context_files: ['tailwind.config.js', 'src/stores/settingsStore.ts'],
  tags: ['theming', 'daisyui', 'ui'],
})
```

### Browser MCP - Automatisation navigateur

**Quand utiliser Browser MCP** :

- **Tests d'interface manuels** : Vérifier le rendu visuel dans le navigateur réel
- **Tests de thèmes** : Valider l'apparence des 10 thèmes daisyUI
- **Tests d'accessibilité** : Utiliser `browser_snapshot` pour analyser l'arbre a11y
- **Debugging d'interface** : Reproduire bugs visuels ou d'interaction
- **Scraping de données** : Extraire des questions depuis des sites web externes
- **Validation PWA** : Tester installation, offline, notifications

**Commandes Browser MCP disponibles** :

```typescript
// 1. NAVIGUER vers une URL
browsermcp_browser_navigate({
  url: 'http://localhost:5173',
})

// 2. CAPTURER snapshot d'accessibilité (structure page)
browsermcp_browser_snapshot()
// Retourne l'arbre d'accessibilité avec refs pour interactions

// 3. CLIQUER sur un élément
browsermcp_browser_click({
  element: 'Button "Démarrer le quiz"',
  ref: 'button-start-quiz', // Référence du snapshot
})

// 4. SURVOLER un élément
browsermcp_browser_hover({
  element: 'Theme selector dropdown',
  ref: 'theme-select',
})

// 5. TAPER du texte
browsermcp_browser_type({
  element: 'Search input',
  ref: 'search-input',
  text: 'anatomie',
  submit: false, // true pour presser Enter après
})

// 6. SÉLECTIONNER option dans dropdown
browsermcp_browser_select_option({
  element: 'Theme dropdown',
  ref: 'theme-select',
  values: ['nocturne'], // Peut être multiple
})

// 7. PRESSER une touche
browsermcp_browser_press_key({
  key: 'Escape', // ou 'ArrowLeft', 'Enter', etc.
})

// 8. ATTENDRE (délai)
browsermcp_browser_wait({
  time: 2, // secondes
})

// 9. CAPTURER screenshot
browsermcp_browser_screenshot()

// 10. RÉCUPÉRER logs console
browsermcp_browser_get_console_logs()

// 11. Navigation arrière/avant
browsermcp_browser_go_back()
browsermcp_browser_go_forward()
```

**Workflow Browser MCP recommandé** :

```
┌─────────────────────────────────┐
│ Lancer serveur dev (bun dev)    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ browser_navigate()              │
│ Ouvrir http://localhost:5173    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ browser_snapshot()              │
│ Capturer structure page         │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ Interactions (click, type, etc.)│
│ Utiliser refs du snapshot       │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ browser_screenshot()            │
│ Capturer résultat visuel        │
└─────────────────────────────────┘
```

**Cas d'usage typiques** :

1. **Valider tous les thèmes visuellement** :

   ```typescript
   // Naviguer vers l'app
   await browsermcp_browser_navigate({ url: 'http://localhost:5173' })

   // Snapshot pour trouver le sélecteur de thème
   const snapshot = await browsermcp_browser_snapshot()

   // Boucle sur les 10 thèmes
   const themes = [
     'toulouse',
     'nocturne',
     'clown',
     'azure',
     'forest',
     'sunset',
     'ocean',
     'medical',
     'lavande',
     'cupcake',
   ]

   for (const theme of themes) {
     await browsermcp_browser_select_option({
       element: 'Theme selector',
       ref: 'theme-select',
       values: [theme],
     })
     await browsermcp_browser_wait({ time: 0.5 })
     await browsermcp_browser_screenshot() // Capture
   }
   ```

2. **Tester workflow complet quiz** :

   ```typescript
   // 1. Navigation
   await browsermcp_browser_navigate({ url: 'http://localhost:5173' })

   // 2. Snapshot pour identifier éléments
   await browsermcp_browser_snapshot()

   // 3. Démarrer quiz
   await browsermcp_browser_click({
     element: 'Start quiz button',
     ref: 'btn-start',
   })

   // 4. Répondre à une question
   await browsermcp_browser_click({
     element: 'Choice A',
     ref: 'choice-a',
   })

   // 5. Valider
   await browsermcp_browser_click({
     element: 'Submit answer button',
     ref: 'btn-submit',
   })

   // 6. Screenshot résultat
   await browsermcp_browser_screenshot()
   ```

3. **Vérifier accessibilité** :

   ```typescript
   await browsermcp_browser_navigate({ url: 'http://localhost:5173/quiz' })

   // Snapshot retourne arbre a11y complet
   const a11yTree = await browsermcp_browser_snapshot()
   // Vérifier présence de roles, labels, aria-* appropriés
   // Exemples: role="button", aria-label, etc.
   ```

4. **Scraper des questions depuis un site externe** :

   ```typescript
   // Naviguer vers site de questions publiques
   await browsermcp_browser_navigate({
     url: 'https://example.com/chiropraxie-questions',
   })

   // Snapshot pour analyser structure
   const snapshot = await browsermcp_browser_snapshot()

   // Cliquer sur catégorie
   await browsermcp_browser_click({
     element: 'Anatomie category',
     ref: 'cat-anatomie',
   })

   await browsermcp_browser_wait({ time: 1 })

   // Re-snapshot pour obtenir les questions
   const questionsSnapshot = await browsermcp_browser_snapshot()
   // Parser le snapshot pour extraire questions
   ```

5. **Debugger un bug visuel** :
   ```typescript
   // Reproduire état problématique
   await browsermcp_browser_navigate({ url: 'http://localhost:5173/quiz' })
   await browsermcp_browser_click({
     element: 'Theme nocturne',
     ref: 'theme-nocturne',
   })
   await browsermcp_browser_click({
     element: 'Start quiz',
     ref: 'btn-start',
   })
   // Screenshot pour voir le bug
   await browsermcp_browser_screenshot()
   // Logs console pour erreurs JS
   const logs = await browsermcp_browser_get_console_logs()
   ```

**Combiner Browser MCP + MemoAI** :

```
PROBLÈME VISUEL IDENTIFIÉ
   ↓
RECHERCHE MEMOAI (bugs similaires)
   ↓
REPRODUCTION VIA BROWSER MCP
   ↓
SCREENSHOT + CONSOLE LOGS
   ↓
FIX + TEST AVEC BROWSER MCP
   ↓
ENREGISTREMENT MEMOAI (bug + solution)
```

**Notes importantes** :

- **Serveur dev requis** : Browser MCP nécessite que `bun dev` soit actif
- **Refs volatiles** : Les refs du snapshot changent à chaque render, toujours recapturer après interactions importantes
- **Timing** : Utiliser `browser_wait()` après actions qui déclenchent animations/fetch
- **Screenshots** : Utiles pour validation visuelle et documentation
- **Logs console** : Essentiels pour débugger erreurs JS côté client

**Exemples d'intégration dans le workflow** :

```typescript
// Après implémentation feature UI
// 1. Tester manuellement avec Browser MCP
await browsermcp_browser_navigate({ url: 'http://localhost:5173' })
await browsermcp_browser_snapshot()
// ... interactions de test ...
await browsermcp_browser_screenshot()

// 2. Si OK, enregistrer dans MemoAI
await memoai_memo_record({
  content:
    'Feature: Sélecteur de thème avec 10 options. Testé avec Browser MCP, tous les thèmes appliquent correctement les couleurs. Dropdown fonctionne, persistance localStorage OK.',
  type: 'implementation',
  context_files: ['src/components/ThemeSelector.tsx', 'src/stores/settingsStore.ts'],
  tags: ['ui', 'theming', 'browser-tested'],
})
```

---

## Workflow de développement

1. **Avant de commencer**:
   - ✅ Vérifier MemoAI pour learnings passés pertinents (`memo_search`)
   - ✅ Consulter suggestions proactives (`memo_suggest`)
2. **Planifier**:
   - Créer todos pour tâches complexes (3+ étapes)
   - Utiliser Sequential Thinking pour décisions architecturales majeures
3. **TDD encouragé**: Écrire tests d'abord pour nouvelles features

4. **Type-check**: Exécuter `npm type-check` (ou `bun type-check`) avant commit

5. **Tests**: Exécuter `npm test` (ou `bun test`) avant push

6. **Documentation**: Mettre à jour si changements significatifs

7. **Après résolution/implémentation**:
   - ✅ Enregistrer learnings importants dans MemoAI (`memo_record`)
   - ✅ Inclure contexte (fichiers, tags, type de learning)

---

## Checklist de validation

Avant chaque commit/PR, vérifier:

- [ ] Le code suit les guidelines AGENTS.md
- [ ] Le contenu est clair, concis et bien organisé
- [ ] Toutes les règles ci-dessus sont respectées
- [ ] Pas de duplication de code ou contenu
- [ ] Pas de fautes de frappe ou erreurs grammaticales
- [ ] Le langage est cohérent (français pour UI, anglais pour code)
- [ ] Tous les termes techniques sont définis ou expliqués
- [ ] Les tests sont écrits et passent
- [ ] Le type-check passe sans erreur
- [ ] L'application fonctionne offline

---

## Documentation associée

- **PRD complet**: Voir [PRD.md](PRD.md) et `docs/prd/`
- **Vision & Objectifs**: [docs/prd/01-vision-objectifs.md](docs/prd/01-vision-objectifs.md)
- **Architecture**: [docs/prd/02-architecture-technique.md](docs/prd/02-architecture-technique.md)
- **Phases implémentation**: [docs/prd/03-phases-implementation.md](docs/prd/03-phases-implementation.md)
- **Workflow analyse**: [docs/prd/04-workflow-analyse.md](docs/prd/04-workflow-analyse.md)
- **Intégrations**: [docs/prd/05-integrations.md](docs/prd/05-integrations.md)
- **UI/UX Specs**: [docs/prd/06-ui-ux-specs.md](docs/prd/06-ui-ux-specs.md)

---

_Dernière mise à jour: 2026-01-23_  
_Version: 2.0_  
_Statut: Planification complète - Prêt pour Phase 0_
