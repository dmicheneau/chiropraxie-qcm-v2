# 08 - Annexes

## Exemples de code TypeScript

### 1. Génération de questions avec Ollama

```typescript
// src/services/ollama/generator.ts

import { ollamaService } from './ollama'
import { PROMPTS } from './prompts'
import { Question, Choice } from '@/types'
import { generateUUID } from '@/utils/uuid'

interface GenerateOptions {
  count: number
  theme: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export async function generateQuestionsFromText(
  sourceText: string,
  options: GenerateOptions
): Promise<Question[]> {
  // 1. Construire le prompt
  const prompt = PROMPTS.generateQuestions(sourceText, options.count)
  
  // 2. Appeler Ollama
  const response = await ollamaService.generate(prompt, {
    temperature: 0.7,
    maxTokens: 2000
  })
  
  // 3. Parser la réponse JSON
  const parsed = parseOllamaResponse(response)
  
  // 4. Transformer en objets Question
  return parsed.questions.map(q => ({
    id: generateUUID(),
    type: 'single_choice' as const,
    text: q.text,
    choices: q.choices.map(c => ({
      id: c.id,
      text: c.text
    })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    theme: options.theme,
    difficulty: q.difficulty || options.difficulty || 'medium',
    tags: q.tags || [],
    source: 'ai_generated' as const,
    aiPrompt: prompt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      qualityScore: undefined, // À calculer après
      timesUsed: 0,
      successRate: undefined
    }
  }))
}

function parseOllamaResponse(response: string): any {
  // Extraire JSON même si entouré de texte
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Réponse IA invalide: pas de JSON trouvé')
  }
  
  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error('Réponse IA invalide: JSON malformé')
  }
}
```

### 2. Détection de doublons avec Jaccard + Levenshtein

```typescript
// src/services/analysis/duplicates.ts

export function checkDuplicate(
  newQuestion: Question,
  existingQuestions: Question[],
  threshold: number = 0.8
): DuplicateCheck {
  let maxSimilarity = 0
  let matchingQuestion: Question | null = null
  
  for (const existing of existingQuestions) {
    const similarity = calculateSimilarity(newQuestion.text, existing.text)
    
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
      matchingQuestion = existing
    }
  }
  
  return {
    isDuplicate: maxSimilarity >= threshold,
    similarity: maxSimilarity,
    matchingQuestionId: matchingQuestion?.id,
    matchingQuestionText: matchingQuestion?.text
  }
}

function calculateSimilarity(text1: string, text2: string): number {
  const jaccard = jaccardSimilarity(text1, text2)
  const levenshtein = levenshteinSimilarity(text1, text2)
  return jaccard * 0.6 + levenshtein * 0.4
}

function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(' '))
  const words2 = new Set(normalizeText(text2).split(' '))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null)
    .map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }
  
  return dp[m][n]
}

function levenshteinSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1)
  const normalized2 = normalizeText(text2)
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  return 1 - (distance / maxLength)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^\w\s]/g, '')          // Supprimer ponctuation
    .replace(/\s+/g, ' ')             // Normaliser espaces
    .trim()
}
```

### 3. Algorithme SM-2 (Spaced Repetition)

```typescript
// src/services/progress/spacedRepetition.ts

export interface SM2Result {
  interval: number      // Jours jusqu'à prochaine révision
  easeFactor: number    // Facteur de facilité (min: 1.3)
  repetitions: number   // Nombre de répétitions consécutives réussies
  nextReview: string    // Date ISO de la prochaine révision
}

/**
 * Algorithme SM-2 (SuperMemo 2)
 * 
 * @param quality - Qualité de la réponse (0-5)
 *   0: Échec total
 *   1: Réponse incorrecte mais rappel
 *   2: Réponse incorrecte mais facile à rappeler
 *   3: Réponse correcte avec difficulté
 *   4: Réponse correcte avec hésitation
 *   5: Réponse correcte parfaite
 * @param repetitions - Nombre de répétitions consécutives réussies
 * @param easeFactor - Facteur de facilité actuel (défaut: 2.5)
 * @param interval - Intervalle actuel en jours
 */
export function calculateSM2(
  quality: number,
  repetitions: number = 0,
  easeFactor: number = 2.5,
  interval: number = 0
): SM2Result {
  // Validation
  quality = Math.max(0, Math.min(5, Math.round(quality)))
  
  // Réponse incorrecte (qualité < 3)
  if (quality < 3) {
    return {
      interval: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      repetitions: 0,
      nextReview: getNextReviewDate(1)
    }
  }
  
  // Réponse correcte
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEF = Math.max(1.3, newEF)
  
  let newInterval: number
  const newRepetitions = repetitions + 1
  
  if (newRepetitions === 1) {
    newInterval = 1
  } else if (newRepetitions === 2) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEF)
  }
  
  return {
    interval: newInterval,
    easeFactor: newEF,
    repetitions: newRepetitions,
    nextReview: getNextReviewDate(newInterval)
  }
}

function getNextReviewDate(intervalDays: number): string {
  const now = new Date()
  now.setDate(now.getDate() + intervalDays)
  return now.toISOString()
}

// Convertir une réponse utilisateur en qualité SM-2
export function answerToQuality(
  isCorrect: boolean,
  timeSpent: number, // millisecondes
  difficultyFeedback?: 'easy' | 'normal' | 'hard'
): number {
  if (!isCorrect) {
    return 0 // Échec total
  }
  
  // Réponse correcte: déterminer qualité selon temps et feedback
  if (difficultyFeedback === 'easy' || timeSpent < 5000) {
    return 5 // Parfait
  } else if (difficultyFeedback === 'normal' || timeSpent < 15000) {
    return 4 // Correct avec légère hésitation
  } else {
    return 3 // Correct avec difficulté
  }
}
```

### 4. Hook personnalisé pour le quiz

```typescript
// src/hooks/useQuiz.ts

import { useState, useCallback, useEffect } from 'react'
import { Question } from '@/types'
import { shuffleArray } from '@/utils/shuffle'
import { db } from '@/services/db'
import { useProgressStore } from '@/stores/progressStore'

interface UseQuizOptions {
  questions: Question[]
  shuffle?: boolean
}

export function useQuiz({ questions, shuffle = true }: UseQuizOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [startTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  
  const { updateProgress } = useProgressStore()
  
  const orderedQuestions = shuffle 
    ? shuffleArray([...questions])
    : questions
  
  const currentQuestion = orderedQuestions[currentIndex]
  const isLastQuestion = currentIndex === orderedQuestions.length - 1
  const isComplete = currentIndex >= orderedQuestions.length
  
  const answer = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }, [])
  
  const next = useCallback(async () => {
    if (!currentQuestion) return
    
    const timeSpent = Date.now() - questionStartTime
    const userAnswer = answers[currentQuestion.id]
    const isCorrect = checkAnswer(currentQuestion, userAnswer)
    
    // Mettre à jour la progression
    await updateProgress(currentQuestion.id, isCorrect, timeSpent)
    
    // Question suivante
    setCurrentIndex(prev => prev + 1)
    setQuestionStartTime(Date.now())
  }, [currentQuestion, answers, questionStartTime, updateProgress])
  
  const previous = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }, [])
  
  const reset = useCallback(() => {
    setCurrentIndex(0)
    setAnswers({})
    setQuestionStartTime(Date.now())
  }, [])
  
  const calculateScore = useCallback(() => {
    let correct = 0
    
    for (const question of orderedQuestions) {
      const userAnswer = answers[question.id]
      if (checkAnswer(question, userAnswer)) {
        correct++
      }
    }
    
    return {
      correct,
      total: orderedQuestions.length,
      percentage: Math.round((correct / orderedQuestions.length) * 100),
      duration: Date.now() - startTime
    }
  }, [orderedQuestions, answers, startTime])
  
  return {
    currentQuestion,
    currentIndex,
    totalQuestions: orderedQuestions.length,
    isLastQuestion,
    isComplete,
    answers,
    answer,
    next,
    previous,
    reset,
    calculateScore
  }
}

function checkAnswer(
  question: Question,
  userAnswer: string | string[] | undefined
): boolean {
  if (!userAnswer) return false
  
  if (question.type === 'multiple_choice') {
    const correct = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer]
    const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
    return correct.length === user.length &&
           correct.every(a => user.includes(a))
  }
  
  return userAnswer === question.correctAnswer
}
```

---

## Exemples de prompts Ollama

### Prompt 1: Génération de questions

```
Tu es un expert en création de QCM pédagogiques pour des étudiants en chiropraxie.
Génère exactement 10 questions à choix multiples basées sur le texte fourni ci-dessous.

RÈGLES STRICTES:
1. Chaque question doit avoir exactement 4 choix (A, B, C, D)
2. Une seule bonne réponse par question
3. Les mauvaises réponses doivent être plausibles mais clairement fausses
4. Inclure une explication pédagogique pour chaque question (2-3 phrases)
5. Varier les niveaux de difficulté (facile, moyen, difficile)
6. Questions en français
7. Retourner UNIQUEMENT du JSON valide sans texte avant/après

FORMAT DE SORTIE (JSON):
{
  "questions": [
    {
      "text": "Quel est le nombre de vertèbres cervicales chez l'homme ?",
      "choices": [
        {"id": "A", "text": "5 vertèbres"},
        {"id": "B", "text": "7 vertèbres"},
        {"id": "C", "text": "10 vertèbres"},
        {"id": "D", "text": "12 vertèbres"}
      ],
      "correctAnswer": "B",
      "explanation": "Le rachis cervical humain est composé de 7 vertèbres, désignées C1 à C7. C'est une constante anatomique chez tous les mammifères.",
      "difficulty": "easy",
      "tags": ["anatomie", "rachis", "vertèbres"]
    }
  ]
}

TEXTE SOURCE:
Le système nerveux central (SNC) comprend l'encéphale et la moelle épinière. L'encéphale est protégé par le crâne, tandis que la moelle épinière est protégée par la colonne vertébrale. Le SNC traite les informations sensorielles et coordonne les réponses motrices.

GÉNÈRE MAINTENANT LES 10 QUESTIONS:
```

### Prompt 2: Génération de tags

```
Analyse cette question de QCM en chiropraxie et suggère 3-5 tags pertinents.

Les tags doivent être:
- Courts (1-3 mots)
- En français
- Spécifiques au domaine médical/chiropraxie
- Utiles pour la recherche et le filtrage

Exemples de bons tags: "anatomie", "système nerveux", "vertèbres cervicales", "manipulation", "contre-indication"

Question à analyser:
"Quelle est la principale contre-indication absolue à une manipulation cervicale ?"

Réponse (JSON uniquement, pas de texte avant/après):
{"tags": ["manipulation", "cervicale", "contre-indication", "sécurité"]}

Maintenant, analyse cette question:
"{{QUESTION_TEXT}}"

Réponse:
```

### Prompt 3: Évaluation de qualité

```
Tu es un expert en évaluation de questions pédagogiques.
Évalue la qualité de cette question de QCM selon les critères suivants:

CRITÈRES:
1. Clarté: La question est-elle claire et sans ambiguïté ?
2. Pertinence: Les choix sont-ils plausibles et distincts ?
3. Pédagogie: La question aide-t-elle à apprendre ?
4. Formulation: La grammaire et syntaxe sont-elles correctes ?

Question:
"{{QUESTION_TEXT}}"

Choix:
A. {{CHOICE_A}}
B. {{CHOICE_B}}
C. {{CHOICE_C}}
D. {{CHOICE_D}}

Bonne réponse: {{CORRECT_ANSWER}}

Retourne un score de 0 à 100 et liste les problèmes éventuels et suggestions d'amélioration.

Réponse (JSON uniquement):
{
  "score": 85,
  "issues": ["Les choix B et C sont trop similaires"],
  "suggestions": ["Reformuler le choix C pour le distinguer davantage"]
}
```

---

## Formats JSON

### Format d'export complet

```json
{
  "version": "2.0",
  "exportedAt": "2026-01-23T14:30:00.000Z",
  "application": "chiropraxie-qcm-v2",
  "banks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Anatomie Niveau 1",
      "description": "Questions de base en anatomie",
      "questions": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "type": "single_choice",
          "text": "Quel est le nombre de vertèbres cervicales ?",
          "choices": [
            {"id": "A", "text": "5"},
            {"id": "B", "text": "7"},
            {"id": "C", "text": "10"},
            {"id": "D", "text": "12"}
          ],
          "correctAnswer": "B",
          "explanation": "Le rachis cervical compte 7 vertèbres (C1-C7).",
          "theme": "Anatomie",
          "subtheme": "Rachis",
          "difficulty": "easy",
          "tags": ["anatomie", "vertèbres", "rachis"],
          "source": "manual",
          "createdAt": "2026-01-15T10:00:00.000Z",
          "updatedAt": "2026-01-15T10:00:00.000Z",
          "metadata": {
            "qualityScore": 95,
            "timesUsed": 42,
            "successRate": 0.88
          }
        }
      ]
    }
  ],
  "metadata": {
    "totalQuestions": 50,
    "themes": ["Anatomie", "Neurologie", "Biomécanique"]
  }
}
```

### Format de session de quiz

```json
{
  "id": "session-2026-01-23-143000",
  "bankId": "550e8400-e29b-41d4-a716-446655440000",
  "theme": "Anatomie",
  "questionIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174001"
  ],
  "answers": {
    "123e4567-e89b-12d3-a456-426614174000": "B",
    "223e4567-e89b-12d3-a456-426614174001": "A"
  },
  "startedAt": "2026-01-23T14:30:00.000Z",
  "completedAt": "2026-01-23T14:45:00.000Z",
  "score": 18,
  "duration": 900
}
```

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **PWA** | Progressive Web App - application web installable fonctionnant offline |
| **Offline-first** | Architecture où l'app fonctionne d'abord sans connexion |
| **IA locale** | Intelligence artificielle exécutée sur la machine de l'utilisateur |
| **Ollama** | Runtime local pour exécuter des LLM open source |
| **LLM** | Large Language Model - grand modèle de langage |
| **Mistral** | Modèle IA français open source |
| **IndexedDB** | Base de données navigateur pour stockage structuré |
| **Dexie.js** | Wrapper JavaScript pour IndexedDB |
| **Service Worker** | Script exécuté en arrière-plan pour cache offline |
| **Spaced Repetition** | Technique de révision espacée pour mémorisation |
| **SM-2** | SuperMemo 2 - algorithme de spaced repetition |
| **QCM** | Questionnaire à Choix Multiples |
| **OCR** | Optical Character Recognition - reconnaissance de texte |
| **Tesseract** | Moteur OCR open source |
| **pdf.js** | Bibliothèque JavaScript pour lire les PDF |
| **Jaccard** | Mesure de similarité entre ensembles |
| **Levenshtein** | Distance d'édition entre chaînes |
| **daisyUI** | Framework CSS basé sur Tailwind |
| **Zustand** | Bibliothèque de state management React |
| **TanStack Query** | Bibliothèque de cache et data fetching |
| **Vitest** | Framework de tests unitaires pour Vite |
| **Playwright** | Framework de tests end-to-end |

---

## Ressources externes

### Documentation

- **Ollama**: https://ollama.com/docs
- **Mistral**: https://mistral.ai/
- **Dexie.js**: https://dexie.org/
- **pdf.js**: https://mozilla.github.io/pdf.js/
- **Tesseract.js**: https://tesseract.projectnaptha.com/
- **daisyUI**: https://daisyui.com/
- **Zustand**: https://docs.pmnd.rs/zustand
- **TanStack Query**: https://tanstack.com/query/latest
- **SM-2 Algorithm**: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

### Tutoriels

- **PWA Guide**: https://web.dev/progressive-web-apps/
- **IndexedDB Tutorial**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **React Hooks**: https://react.dev/reference/react

### Outils

- **Lighthouse**: https://github.com/GoogleChrome/lighthouse
- **Bun**: https://bun.sh/
- **Vite**: https://vitejs.dev/

---

## Changelog (à maintenir)

### Version 2.0.0 (À venir)

**Phase 0: Setup**
- [ ] Initialisation projet Vite + React + TypeScript
- [ ] Configuration Tailwind + daisyUI
- [ ] Setup Dexie.js
- [ ] Thème Toulouse par défaut

**Phase 1: MVP Core**
- [ ] Quiz fonctionnel
- [ ] Navigation complète
- [ ] 10 thèmes UI
- [ ] Stockage IndexedDB

**Phase 2: Import Quizlet**
- [ ] Parser multi-format
- [ ] Conversion flashcards → QCM

**Phase 3: IA + Analyse**
- [ ] Intégration Ollama
- [ ] Génération de questions
- [ ] Détection doublons
- [ ] Analyse qualité

**Phase 4: Imports avancés**
- [ ] Import PDF
- [ ] Import images (OCR)
- [ ] Export/Import JSON

**Phase 5: Gamification**
- [ ] Streaks
- [ ] Spaced repetition (SM-2)
- [ ] Mode révision

**Phase 6: Polissage**
- [ ] Optimisations performance
- [ ] Tests E2E
- [ ] Déploiement

---

*Précédent: [07 - Risques & Mitigations](07-risques-mitigations.md)*  
*Retour au début: [PRD Index](../../PRD.md)*
