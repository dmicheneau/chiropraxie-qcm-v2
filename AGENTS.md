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
# Exécuter tous les tests
bun test

# Tests en mode watch
bun test:watch

# Exécuter un seul fichier de test
bun test src/components/Quiz.test.tsx

# Tests correspondant à un pattern
bun test --grep "Quiz component"

# Tests avec couverture
bun test:coverage

# Tests E2E Playwright
bun test:e2e
```

---

## Stack Technologique

### Core
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Bun** | latest | Runtime & package manager |
| **React** | 18.x | Framework UI |
| **Vite** | 5.x | Build tool |
| **TypeScript** | 5.x | Langage |

### State & Data
| Technologie | Usage |
|-------------|-------|
| **Zustand** | State management global |
| **TanStack Query** | Cache & data fetching |
| **Dexie.js** | IndexedDB wrapper (stockage local) |
| **Zod** | Validation schemas |

### UI & Styling
| Technologie | Usage |
|-------------|-------|
| **Tailwind CSS** | Utility-first CSS |
| **daisyUI** | Composants UI (10 thèmes prédéfinis) |
| **Lucide React** | Icônes |
| **Chart.js** | Graphiques statistiques |
| **Framer Motion** | Animations (optionnel) |

### IA & Imports
| Technologie | Usage |
|-------------|-------|
| **Ollama** | IA locale (mistral:7b-instruct) |
| **pdf.js** | Extraction texte PDF |
| **Tesseract.js** | OCR images |

### Internationalisation
| Technologie | Usage |
|-------------|-------|
| **i18next** | Framework i18n |
| **react-i18next** | Bindings React |

### Testing
| Technologie | Usage |
|-------------|-------|
| **Vitest** | Tests unitaires |
| **Testing Library** | Tests composants React |
| **Playwright** | Tests E2E |

### PWA
| Technologie | Usage |
|-------------|-------|
| **vite-plugin-pwa** | Service Worker & manifest |
| **Workbox** | Stratégies cache offline |

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
      stream: false
    })
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
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
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
    logger: progress => console.log(progress)
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
  id: string           // 'A', 'B', 'C', 'D'
  text: string
}

// Question enrichie V2
interface Question {
  id: string                          // UUID
  type: QuestionType
  text: string                        // Texte de la question
  choices?: Choice[]                  // Options (QCM)
  correctAnswer: string | string[]    // ID(s) de la/les bonne(s) réponse(s)
  explanation?: string                // Explication de la réponse
  theme: string                       // Ex: "Anatomie"
  subtheme?: string                   // Ex: "Système nerveux"
  difficulty: Difficulty
  tags: string[]                      // Recherche avancée
  source: QuestionSource
  sourceUrl?: string                  // Traçabilité
  aiPrompt?: string                   // Si généré par IA
  createdAt: string                   // ISO date
  updatedAt: string
  metadata?: {
    qualityScore?: number             // 0-100
    timesUsed?: number
    successRate?: number              // 0-1
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
  nextReview?: string                 // Spaced repetition
  easeFactor: number                  // Algorithme SM-2 (défaut: 2.5)
  interval: number                    // Jours jusqu'à prochaine révision
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
| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `QuizCard.tsx`, `ThemeSelector.tsx` |
| Hooks | camelCase + use | `useQuiz.ts`, `useTimer.ts` |
| Stores | camelCase + Store | `quizStore.ts`, `bankStore.ts` |
| Utilitaires | camelCase | `formatScore.ts`, `shuffleArray.ts` |
| Types | PascalCase | `Question.ts`, `QuizState.ts` |
| Tests | source + .test | `QuizCard.test.tsx`, `useQuiz.test.ts` |

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
  choices: z.array(z.object({
    id: z.string(),
    text: z.string()
  })).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  theme: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard'])
})

function validateQuestion(data: unknown): Question {
  return QuestionSchema.parse(data)
}
```

---

## Thèmes UI (10 prédéfinis)

L'application propose 10 thèmes visuels. Le thème par défaut est **Toulouse**.

| # | Thème | Description |
|---|-------|-------------|
| 1 | **toulouse** | Rouge/Violet/Or - Couleurs de Toulouse |
| 2 | **nocturne** | Dark élégant - Bleu nuit/Argent |
| 3 | **clown** | Coloré ludique - Multicolore vif |
| 4 | **azure** | Bleu professionnel - Style Microsoft |
| 5 | **forest** | Vert nature - Apaisant |
| 6 | **sunset** | Orange/Rose - Coucher de soleil |
| 7 | **ocean** | Bleu turquoise - Frais |
| 8 | **medical** | Blanc/Bleu clair - Clean médical |
| 9 | **lavande** | Violet doux - Zen |
| 10 | **cupcake** | Rose pastel - Fun |

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

**Disponibles (désactivés)**: Vitest, Playwright, Semgrep - activer dans `.opencode/opencode.json` si besoin

---

## Workflow de développement

1. **Avant de commencer**: Vérifier MemoAI pour learnings passés pertinents
2. **Planifier**: Créer todos pour tâches complexes (3+ étapes)
3. **TDD encouragé**: Écrire tests d'abord pour nouvelles features
4. **Type-check**: Exécuter `bun type-check` avant commit
5. **Tests**: Exécuter `bun test` avant push
6. **Documentation**: Mettre à jour si changements significatifs
7. **MemoAI**: Enregistrer learnings importants pour référence future

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

*Dernière mise à jour: 2026-01-23*  
*Version: 2.0*  
*Statut: Planification complète - Prêt pour Phase 0*
