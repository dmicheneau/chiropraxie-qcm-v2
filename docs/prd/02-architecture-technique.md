# 02 - Architecture Technique

## Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NAVIGATEUR WEB                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                         APPLICATION PWA                            │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                      REACT 18 + VITE                         │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │  │
│  │  │  │   PAGES     │  │ COMPONENTS  │  │     FEATURES        │  │  │  │
│  │  │  │  - Home     │  │  - UI       │  │  - Quiz             │  │  │  │
│  │  │  │  - Quiz     │  │  - Quiz     │  │  - Bank             │  │  │  │
│  │  │  │  - Import   │  │  - Layout   │  │  - Import           │  │  │  │
│  │  │  │  - Stats    │  │             │  │  - AI               │  │  │  │
│  │  │  │  - Settings │  │             │  │  - Progress         │  │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    STATE MANAGEMENT                          │  │  │
│  │  │         Zustand (global) + TanStack Query (cache)           │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                      SERVICES                                │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │  │
│  │  │  │  Database   │  │   Ollama    │  │     Import          │  │  │  │
│  │  │  │  (Dexie.js) │  │   Client    │  │     Parsers         │  │  │  │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │  │  │
│  │  └─────────┼────────────────┼────────────────────┼─────────────┘  │  │
│  └────────────┼────────────────┼────────────────────┼────────────────┘  │
│               │                │                    │                    │
│  ┌────────────▼────────────────┼────────────────────▼────────────────┐  │
│  │        IndexedDB            │           Web APIs                   │  │
│  │  (Stockage persistant)      │    (File, Clipboard, etc.)         │  │
│  └─────────────────────────────┼─────────────────────────────────────┘  │
│               │                │                                         │
│  ┌────────────▼────────────────┼─────────────────────────────────────┐  │
│  │                      SERVICE WORKER                                │  │
│  │                 (Workbox - Cache offline)                          │  │
│  └─────────────────────────────┼─────────────────────────────────────┘  │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   OLLAMA LOCAL         │
                    │   localhost:11434      │
                    │   mistral:7b-instruct  │
                    └────────────────────────┘
```

---

## Stack technologique

### Core

| Technologie | Version | Justification |
|-------------|---------|---------------|
| **Bun** | latest | Runtime rapide, package manager intégré |
| **React** | 18.x | Écosystème mature, hooks, concurrent features |
| **Vite** | 5.x | Build ultra-rapide, HMR, plugins PWA |
| **TypeScript** | 5.x | Type safety, meilleure DX, maintenabilité |

### State Management

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Zustand** | State global | Léger (< 1KB), simple, TypeScript natif |
| **TanStack Query** | Cache & async | Gestion cache intelligente, offline support |

### Stockage

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Dexie.js** | IndexedDB wrapper | API Promise, requêtes complexes, TypeScript |
| **Service Worker** | Cache offline | Workbox intégré via vite-plugin-pwa |

### UI

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Tailwind CSS** | Styling | Utility-first, rapide, tree-shaking |
| **daisyUI** | Composants | Thèmes prédéfinis, accessible, léger |
| **Lucide React** | Icônes | Moderne, tree-shakable, cohérent |
| **Chart.js** | Graphiques | Léger, responsive, nombreux types |
| **Framer Motion** | Animations | Performant, API déclarative (optionnel) |

### IA & Imports

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Ollama** | IA locale | Privacy, gratuit, modèles open source |
| **pdf.js** | Extraction PDF | Mozilla, fiable, web-native |
| **Tesseract.js** | OCR images | WASM, français supporté |

### Validation

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Zod** | Schémas validation | TypeScript inference, composable |

### Internationalisation

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **i18next** | Framework i18n | Mature, plugins nombreux |
| **react-i18next** | Bindings React | Hooks, suspense support |

### Testing

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **Vitest** | Tests unitaires | Compatible Vite, rapide |
| **Testing Library** | Tests composants | Best practices React |
| **Playwright** | Tests E2E | Multi-navigateurs, fiable |

### PWA

| Technologie | Usage | Justification |
|-------------|-------|---------------|
| **vite-plugin-pwa** | Service Worker | Intégration Vite native |
| **Workbox** | Stratégies cache | Google, battle-tested |

---

## Modèle de données

### Question

```typescript
interface Question {
  // Identifiant unique
  id: string                          // UUID v4
  
  // Contenu de la question
  type: 'single_choice' | 'multiple_choice' | 'true_false'
  text: string                        // Texte de la question
  choices?: Choice[]                  // Options pour QCM
  correctAnswer: string | string[]    // ID(s) bonne(s) réponse(s)
  explanation?: string                // Explication pédagogique
  
  // Classification
  theme: string                       // Ex: "Anatomie"
  subtheme?: string                   // Ex: "Système nerveux"
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]                      // Mots-clés pour recherche
  
  // Traçabilité
  source: QuestionSource
  sourceUrl?: string                  // URL origine si applicable
  aiPrompt?: string                   // Prompt utilisé si IA
  
  // Métadonnées
  createdAt: string                   // ISO 8601
  updatedAt: string
  metadata?: {
    qualityScore?: number             // 0-100 (analyse IA)
    timesUsed?: number                // Nombre d'utilisations
    successRate?: number              // 0-1 taux de réussite
    flagCount?: number                // Signalements
  }
}

interface Choice {
  id: string                          // 'A', 'B', 'C', 'D'
  text: string
}

type QuestionSource = 
  | 'manual' 
  | 'quizlet' 
  | 'ai_generated' 
  | 'pdf_import' 
  | 'image_import'
```

### QuestionBank

```typescript
interface QuestionBank {
  id: string
  name: string
  description: string
  questions: Question[]
  isDefault: boolean                  // Banque embarquée par défaut
  
  createdAt: string
  updatedAt: string
  
  metadata: {
    totalQuestions: number
    themes: string[]                  // Liste thèmes uniques
    subthemes: string[]               // Liste sous-thèmes
    sources: Record<QuestionSource, number>
    averageQuality?: number           // Score qualité moyen
  }
}
```

### UserProgress

```typescript
interface UserProgress {
  questionId: string
  
  // Statistiques
  attempts: number
  correctAttempts: number
  lastAttempted: string               // ISO 8601
  
  // Spaced Repetition (SM-2)
  nextReview?: string                 // Date prochaine révision
  easeFactor: number                  // Défaut: 2.5
  interval: number                    // Jours jusqu'à révision
  repetitions: number                 // Nombre de répétitions réussies
}
```

### QuizSession

```typescript
interface QuizSession {
  id: string
  bankId: string
  theme?: string                      // Filtre thème (optionnel)
  
  questionIds: string[]               // Questions du quiz
  answers: Record<string, string | string[]>
  
  startedAt: string
  completedAt?: string
  
  score?: number                      // 0-100
  duration?: number                   // Secondes
}
```

### UserSettings

```typescript
interface UserSettings {
  theme: ThemeName                    // 'toulouse', 'nocturne', etc.
  questionsPerQuiz: number            // Défaut: 20
  shuffleQuestions: boolean           // Défaut: true
  shuffleChoices: boolean             // Défaut: true
  showExplanations: boolean           // Défaut: true
  enableStreaks: boolean              // Défaut: true
  
  ollamaModel: string                 // Défaut: 'mistral:7b-instruct'
  ollamaEndpoint: string              // Défaut: 'http://localhost:11434'
}

type ThemeName = 
  | 'toulouse' 
  | 'nocturne' 
  | 'clown' 
  | 'azure' 
  | 'forest' 
  | 'sunset' 
  | 'ocean' 
  | 'medical' 
  | 'lavande' 
  | 'cupcake'
```

### Streak

```typescript
interface Streak {
  currentStreak: number               // Jours consécutifs
  longestStreak: number               // Record personnel
  lastActivityDate: string            // ISO 8601 (date only)
  totalDaysActive: number             // Total jours avec activité
}
```

---

## Schéma IndexedDB (Dexie.js)

```typescript
import Dexie, { Table } from 'dexie'

class AppDatabase extends Dexie {
  questions!: Table<Question>
  banks!: Table<QuestionBank>
  progress!: Table<UserProgress>
  sessions!: Table<QuizSession>
  settings!: Table<UserSettings>
  
  constructor() {
    super('chiropraxie-qcm-v2')
    
    this.version(1).stores({
      questions: 'id, theme, subtheme, difficulty, source, createdAt',
      banks: 'id, name, isDefault, createdAt',
      progress: 'questionId, nextReview',
      sessions: 'id, bankId, startedAt',
      settings: 'id'  // Singleton (id = 'user')
    })
  }
}

export const db = new AppDatabase()
```

---

## Choix Ollama

### Pourquoi Ollama ?

| Critère | Ollama | Alternative cloud (OpenAI) |
|---------|--------|---------------------------|
| **Coût** | Gratuit | ~$0.002/1K tokens |
| **Privacy** | 100% local | Données envoyées au cloud |
| **Offline** | Oui | Non |
| **Latence** | Variable (CPU/GPU) | ~1-2s |
| **Setup** | Installation requise | API key |

### Modèle recommandé: mistral:7b-instruct

| Critère | Valeur |
|---------|--------|
| **Taille** | 4.1 GB |
| **RAM requise** | ~8 GB |
| **Qualité français** | Excellente (entreprise française) |
| **Vitesse** | ~10-30s/question (CPU), ~2-5s (GPU) |

### Modèles alternatifs (hardware limité)

| Modèle | Taille | RAM | Qualité | Vitesse |
|--------|--------|-----|---------|---------|
| `llama3.2:3b` | 2 GB | 4 GB | Bonne | Rapide |
| `phi3:mini` | 2.3 GB | 4 GB | Correcte | Très rapide |
| `gemma2:2b` | 1.6 GB | 4 GB | Acceptable | Ultra-rapide |

### API Ollama

```typescript
// Endpoint de génération
const OLLAMA_API = 'http://localhost:11434/api/generate'

// Requête type
interface OllamaRequest {
  model: string           // 'mistral:7b-instruct'
  prompt: string
  stream?: boolean        // false pour réponse complète
  options?: {
    temperature?: number  // 0.0-1.0 (défaut: 0.7)
    num_predict?: number  // Tokens max
  }
}

// Réponse type
interface OllamaResponse {
  model: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  eval_count?: number
}
```

---

## Architecture Service Worker

### Stratégies de cache

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache statique (App Shell)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // API Ollama - Network only (pas de cache)
            urlPattern: /^http:\/\/localhost:11434\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      },
      manifest: {
        name: 'Chiropraxie QCM',
        short_name: 'QCM Chiro',
        theme_color: '#E4003A',
        background_color: '#F5F3F0',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

---

## Structure des dossiers

```
src/
├── components/
│   ├── ui/                    # Composants réutilisables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── quiz/                  # Composants quiz
│   │   ├── QuizCard.tsx
│   │   ├── ChoiceButton.tsx
│   │   ├── Timer.tsx
│   │   ├── Results.tsx
│   │   └── index.ts
│   └── layout/                # Layout
│       ├── Header.tsx
│       ├── Footer.tsx
│       ├── Navigation.tsx
│       └── index.ts
├── pages/
│   ├── Home.tsx
│   ├── Quiz.tsx
│   ├── Import.tsx
│   ├── Stats.tsx
│   └── Settings.tsx
├── features/
│   ├── quiz/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── index.ts
│   ├── bank/
│   ├── import/
│   ├── ai/
│   └── progress/
├── services/
│   ├── db.ts                  # Dexie.js
│   ├── ollama.ts              # Client Ollama
│   └── export.ts              # Export/Import JSON
├── stores/
│   ├── quizStore.ts
│   ├── bankStore.ts
│   └── settingsStore.ts
├── hooks/
│   ├── useQuiz.ts
│   ├── useOllama.ts
│   └── useProgress.ts
├── utils/
│   ├── shuffle.ts
│   ├── similarity.ts
│   └── validation.ts
├── types/
│   ├── question.ts
│   ├── quiz.ts
│   └── index.ts
├── i18n/
│   ├── fr.json
│   └── index.ts
├── themes/
│   └── daisyui.config.ts
├── styles/
│   └── globals.css
└── main.tsx
```

---

*Précédent: [01 - Vision & Objectifs](01-vision-objectifs.md)*  
*Suivant: [03 - Phases d'Implémentation](03-phases-implementation.md)*
