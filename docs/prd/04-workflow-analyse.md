# 04 - Workflow d'Analyse

## Vue d'ensemble

Le workflow d'analyse est le cœur intelligent de Chiropraxie QCM V2. Il transforme des données brutes (texte copié, PDF, images) en questions de qualité enrichies. Ce pipeline garantit la cohérence, détecte les doublons et enrichit automatiquement les métadonnées.

```
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌──────────┐    ┌────────┐
│  IMPORT  │ → │  PARSING   │ → │   ANALYSE    │ → │ ENRICHIR │ → │ VALIDER│
│          │    │            │    │   QUALITÉ    │    │   AUTO   │    │ HUMAIN │
└──────────┘    └────────────┘    └──────────────┘    └──────────┘    └────────┘
     │               │                   │                  │              │
     ▼               ▼                   ▼                  ▼              ▼
  Sources        Structure          Score +             Tags,          Banque
  brutes         données           Doublons           Difficulté       finale
```

---

## Étape 1: Import (Sources)

### Sources supportées

| Source | Format | Méthode | Phase |
|--------|--------|---------|-------|
| **Quizlet** | Texte copié | Copy-paste | Phase 2 |
| **Texte libre** | Notes, paragraphes | Saisie directe | Phase 3 |
| **PDF** | Fichier .pdf | Upload + pdf.js | Phase 4 |
| **Image** | JPG, PNG | Upload + Tesseract.js | Phase 4 |
| **JSON** | Export app | Upload | Phase 4 |

### Interface d'import

```
┌─────────────────────────────────────────────────────────────┐
│  IMPORTER DES QUESTIONS                                      │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Quizlet │ │  Texte  │ │   PDF   │ │  Image  │ │  JSON  │ │
│  │   📋    │ │   📝    │ │   📄    │ │   🖼️   │ │   {}   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │   Collez votre contenu Quizlet ici...                   │ │
│  │                                                          │ │
│  │                                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  💡 Astuce: Sur Quizlet, cliquez "..." puis "Exporter"      │
│                                                              │
│                               [ Analyser ]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Étape 2: Parsing (Extraction structure)

### Parser Quizlet

```typescript
interface FlashCard {
  term: string
  definition: string
  index: number
}

interface ParseResult {
  cards: FlashCard[]
  format: 'tab' | 'pipe' | 'newline' | 'numbered' | 'unknown'
  confidence: number  // 0-1
}

function parseQuizletContent(text: string): ParseResult {
  const lines = text.trim().split('\n').filter(line => line.trim())
  
  // Détection format par ordre de priorité
  
  // Format 1: Tabulation (export Quizlet standard)
  if (lines.some(line => line.includes('\t'))) {
    const cards = lines
      .filter(line => line.includes('\t'))
      .map((line, index) => {
        const [term, definition] = line.split('\t').map(s => s.trim())
        return { term, definition, index }
      })
      .filter(card => card.term && card.definition)
    
    return { cards, format: 'tab', confidence: 0.95 }
  }
  
  // Format 2: Pipe
  if (lines.some(line => line.includes(' | '))) {
    const cards = lines
      .filter(line => line.includes(' | '))
      .map((line, index) => {
        const [term, definition] = line.split(' | ').map(s => s.trim())
        return { term, definition, index }
      })
      .filter(card => card.term && card.definition)
    
    return { cards, format: 'pipe', confidence: 0.9 }
  }
  
  // Format 3: Numéroté (1. terme - définition)
  const numberedRegex = /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/
  if (lines.some(line => numberedRegex.test(line))) {
    const cards = lines
      .map((line, index) => {
        const match = line.match(numberedRegex)
        if (match) {
          return { term: match[1].trim(), definition: match[2].trim(), index }
        }
        return null
      })
      .filter((card): card is FlashCard => card !== null)
    
    return { cards, format: 'numbered', confidence: 0.85 }
  }
  
  // Format 4: Double newline (alternance terme/définition)
  if (lines.length >= 2 && lines.length % 2 === 0) {
    const cards: FlashCard[] = []
    for (let i = 0; i < lines.length; i += 2) {
      cards.push({
        term: lines[i].trim(),
        definition: lines[i + 1].trim(),
        index: i / 2
      })
    }
    return { cards, format: 'newline', confidence: 0.7 }
  }
  
  return { cards: [], format: 'unknown', confidence: 0 }
}
```

### Parser PDF

```typescript
import * as pdfjsLib from 'pdfjs-dist'

interface PDFParseResult {
  text: string
  pages: number
  metadata?: {
    title?: string
    author?: string
  }
}

async function parsePDF(file: File): Promise<PDFParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n\n'
  }
  
  const metadata = await pdf.getMetadata().catch(() => null)
  
  return {
    text: fullText.trim(),
    pages: pdf.numPages,
    metadata: metadata?.info
  }
}
```

### Parser Image (OCR)

```typescript
import Tesseract from 'tesseract.js'

interface OCRResult {
  text: string
  confidence: number  // 0-100
  words: number
}

async function parseImage(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const result = await Tesseract.recognize(file, 'fra', {
    logger: info => {
      if (info.status === 'recognizing text' && onProgress) {
        onProgress(info.progress * 100)
      }
    }
  })
  
  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence,
    words: result.data.words.length
  }
}
```

---

## Étape 3: Analyse Qualité

### Score de qualité

Le score de qualité (0-100) est calculé à partir de plusieurs critères:

```typescript
interface QualityAnalysis {
  score: number           // 0-100 (agrégé)
  details: {
    coherence: number     // 0-100: question correspond aux choix
    clarity: number       // 0-100: lisibilité, longueur
    difficulty: number    // 0-100: niveau approprié
    completeness: number  // 0-100: tous les champs remplis
  }
  issues: string[]        // Problèmes détectés
  suggestions: string[]   // Améliorations suggérées
}

function analyzeQuestionQuality(question: Question): QualityAnalysis {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // 1. Cohérence (25%)
  let coherence = 100
  if (!question.correctAnswer) {
    coherence -= 50
    issues.push('Pas de bonne réponse définie')
  }
  if (question.choices && question.choices.length < 3) {
    coherence -= 30
    issues.push('Moins de 3 choix de réponse')
  }
  
  // 2. Clarté (25%)
  let clarity = 100
  if (question.text.length < 20) {
    clarity -= 30
    suggestions.push('Question trop courte')
  }
  if (question.text.length > 500) {
    clarity -= 20
    suggestions.push('Question très longue, envisager de la simplifier')
  }
  if (!question.text.includes('?')) {
    clarity -= 10
    suggestions.push('Ajouter un point d\'interrogation')
  }
  
  // 3. Difficulté (25%)
  let difficulty = 100
  // Analyse basée sur longueur des choix, vocabulaire technique, etc.
  const avgChoiceLength = question.choices 
    ? question.choices.reduce((sum, c) => sum + c.text.length, 0) / question.choices.length
    : 0
  if (avgChoiceLength < 10 && question.difficulty === 'hard') {
    difficulty -= 20
    suggestions.push('Difficulté "difficile" mais choix courts')
  }
  
  // 4. Complétude (25%)
  let completeness = 100
  if (!question.explanation) {
    completeness -= 20
    suggestions.push('Ajouter une explication')
  }
  if (!question.theme) {
    completeness -= 30
    issues.push('Thème non défini')
  }
  if (question.tags.length === 0) {
    completeness -= 15
    suggestions.push('Ajouter des tags pour la recherche')
  }
  
  // Score agrégé
  const score = Math.round(
    coherence * 0.25 + 
    clarity * 0.25 + 
    difficulty * 0.25 + 
    completeness * 0.25
  )
  
  return {
    score,
    details: { coherence, clarity, difficulty, completeness },
    issues,
    suggestions
  }
}
```

### Indicateur visuel

```
Score 80-100: 🟢 Excellent  (vert)
Score 50-79:  🟡 À améliorer (jaune)
Score 0-49:   🔴 Problèmes  (rouge)
```

---

## Étape 4: Détection des doublons

### Algorithme de similarité

On utilise une combinaison de Jaccard et Levenshtein pour détecter les questions similaires:

```typescript
interface DuplicateCheck {
  isDuplicate: boolean
  similarity: number        // 0-1
  matchingQuestionId?: string
  matchingQuestionText?: string
}

function checkDuplicate(
  newQuestion: Question, 
  existingQuestions: Question[]
): DuplicateCheck {
  const THRESHOLD = 0.8  // 80% de similarité = doublon
  
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
    isDuplicate: maxSimilarity >= THRESHOLD,
    similarity: maxSimilarity,
    matchingQuestionId: matchingQuestion?.id,
    matchingQuestionText: matchingQuestion?.text
  }
}

// Jaccard similarity sur les mots
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(' '))
  const words2 = new Set(normalizeText(text2).split(' '))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

// Levenshtein distance normalisée
function levenshteinSimilarity(text1: string, text2: string): number {
  const distance = levenshteinDistance(
    normalizeText(text1), 
    normalizeText(text2)
  )
  const maxLength = Math.max(text1.length, text2.length)
  return 1 - (distance / maxLength)
}

// Combinaison des deux méthodes
function calculateSimilarity(text1: string, text2: string): number {
  const jaccard = jaccardSimilarity(text1, text2)
  const levenshtein = levenshteinSimilarity(text1, text2)
  
  // Moyenne pondérée (Jaccard plus robuste aux reformulations)
  return jaccard * 0.6 + levenshtein * 0.4
}

// Normalisation du texte
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Supprimer accents
    .replace(/[^\w\s]/g, '')           // Supprimer ponctuation
    .replace(/\s+/g, ' ')              // Normaliser espaces
    .trim()
}
```

### Interface doublon détecté

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ DOUBLON POTENTIEL DÉTECTÉ (87% similarité)              │
│                                                              │
│  Nouvelle question:                                          │
│  "Quel est le rôle principal du système nerveux central?"   │
│                                                              │
│  Similaire à:                                                │
│  "Quelle est la fonction principale du système nerveux      │
│   central (SNC)?"                                            │
│                                                              │
│  [ Garder les deux ]  [ Remplacer l'ancienne ]  [ Ignorer ] │
└─────────────────────────────────────────────────────────────┘
```

---

## Étape 5: Enrichissement Automatique

### Tags automatiques (IA)

```typescript
const TAGS_PROMPT = `
Analyse cette question de QCM en chiropraxie et suggère 3-5 tags pertinents.
Les tags doivent être:
- Courts (1-3 mots)
- Spécifiques au domaine médical/chiropraxie
- Utiles pour la recherche et le filtrage

Question: {questionText}

Réponse (JSON uniquement):
{
  "tags": ["tag1", "tag2", "tag3"]
}
`

async function generateTags(
  question: Question, 
  ollamaService: OllamaService
): Promise<string[]> {
  try {
    const prompt = TAGS_PROMPT.replace('{questionText}', question.text)
    const response = await ollamaService.generate(prompt)
    const parsed = JSON.parse(response)
    return parsed.tags || []
  } catch {
    // Fallback: extraction mots-clés simple
    return extractKeywords(question.text)
  }
}

// Fallback si Ollama non disponible
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 
    'est', 'sont', 'qui', 'que', 'quoi', 'quel', 'quelle', 'quels',
    'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'ce', 'cette'
  ])
  
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopWords.has(word))
    .slice(0, 5)
}
```

### Estimation de difficulté

```typescript
type Difficulty = 'easy' | 'medium' | 'hard'

interface DifficultyAnalysis {
  difficulty: Difficulty
  confidence: number  // 0-1
  factors: string[]   // Raisons
}

function estimateDifficulty(question: Question): DifficultyAnalysis {
  let score = 0
  const factors: string[] = []
  
  // Longueur de la question
  if (question.text.length > 200) {
    score += 2
    factors.push('Question longue')
  } else if (question.text.length < 50) {
    score -= 1
    factors.push('Question courte')
  }
  
  // Vocabulaire technique (mots longs = souvent techniques)
  const words = question.text.split(/\s+/)
  const longWords = words.filter(w => w.length > 10).length
  if (longWords > 3) {
    score += 2
    factors.push('Vocabulaire technique')
  }
  
  // Négations (questions avec "ne...pas", "sauf", "excepté")
  if (/\b(ne\s+\w+\s+pas|sauf|excepté|hormis)\b/i.test(question.text)) {
    score += 1
    factors.push('Présence de négation')
  }
  
  // Similarité des choix
  if (question.choices) {
    const choiceTexts = question.choices.map(c => c.text.toLowerCase())
    const avgSimilarity = calculateAverageChoiceSimilarity(choiceTexts)
    if (avgSimilarity > 0.5) {
      score += 2
      factors.push('Choix très similaires')
    }
  }
  
  // Déterminer difficulté
  let difficulty: Difficulty
  let confidence: number
  
  if (score <= 0) {
    difficulty = 'easy'
    confidence = 0.8
  } else if (score <= 3) {
    difficulty = 'medium'
    confidence = 0.7
  } else {
    difficulty = 'hard'
    confidence = 0.75
  }
  
  return { difficulty, confidence, factors }
}
```

### Génération d'explications

```typescript
const EXPLANATION_PROMPT = `
Tu es un professeur expert en chiropraxie. Génère une explication pédagogique courte (2-3 phrases) pour cette question de QCM.

Question: {questionText}
Bonne réponse: {correctAnswer}

L'explication doit:
1. Expliquer pourquoi la bonne réponse est correcte
2. Être claire et concise
3. Aider à mémoriser le concept

Réponse (JSON uniquement):
{
  "explanation": "Explication ici"
}
`

async function generateExplanation(
  question: Question,
  ollamaService: OllamaService
): Promise<string | null> {
  try {
    const correctChoice = question.choices?.find(
      c => c.id === question.correctAnswer
    )
    
    const prompt = EXPLANATION_PROMPT
      .replace('{questionText}', question.text)
      .replace('{correctAnswer}', correctChoice?.text || question.correctAnswer as string)
    
    const response = await ollamaService.generate(prompt)
    const parsed = JSON.parse(response)
    return parsed.explanation || null
  } catch {
    return null
  }
}
```

---

## Étape 6: Validation Humaine

### Interface de prévisualisation

```
┌─────────────────────────────────────────────────────────────┐
│  PRÉVISUALISATION - 15 questions importées                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] Question 1                           Score: 🟢 92   ││
│  │ "Quel est le nombre de vertèbres cervicales chez..."   ││
│  │ Thème: Anatomie  Difficulté: Facile                     ││
│  │ Tags: vertèbre, cervicale, anatomie                     ││
│  │                                    [ Éditer ] [ ✗ ]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] Question 2                           Score: 🟡 68   ││
│  │ "La manipulation vertébrale peut être contre-indiq..."  ││
│  │ ⚠️ Suggestion: Ajouter une explication                  ││
│  │                                    [ Éditer ] [ ✗ ]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [ ] Question 3 (désélectionnée)          Score: 🔴 35   ││
│  │ "test question"                                          ││
│  │ ❌ Problème: Question trop courte, pas de choix         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Thème: [ Anatomie ▼ ]  Sous-thème: [ Rachis ▼ ]           │
│                                                              │
│  ✓ 14 questions sélectionnées                               │
│                                                              │
│         [ Annuler ]          [ Ajouter à ma banque ]        │
└─────────────────────────────────────────────────────────────┘
```

### Actions utilisateur

| Action | Description |
|--------|-------------|
| **Sélectionner/Désélectionner** | Inclure ou exclure une question |
| **Éditer** | Modifier le texte, choix, réponse |
| **Régénérer** | Demander à l'IA une nouvelle version |
| **Changer thème** | Appliquer un thème à la sélection |
| **Ajouter à ma banque** | Valider et sauvegarder |

---

## Pipeline complet

```typescript
interface ImportPipeline {
  source: ImportSource
  parsed: ParseResult
  questions: Question[]
  analysis: Map<string, QualityAnalysis>
  duplicates: Map<string, DuplicateCheck>
  enrichments: Map<string, EnrichmentResult>
}

async function runImportPipeline(
  content: string | File,
  source: 'quizlet' | 'text' | 'pdf' | 'image',
  existingQuestions: Question[],
  ollamaService?: OllamaService
): Promise<ImportPipeline> {
  
  // 1. Parsing selon la source
  let parsed: ParseResult
  let rawText: string
  
  switch (source) {
    case 'quizlet':
      parsed = parseQuizletContent(content as string)
      rawText = content as string
      break
    case 'pdf':
      const pdfResult = await parsePDF(content as File)
      rawText = pdfResult.text
      parsed = { cards: [], format: 'text', confidence: 1 }
      break
    case 'image':
      const ocrResult = await parseImage(content as File)
      rawText = ocrResult.text
      parsed = { cards: [], format: 'text', confidence: ocrResult.confidence / 100 }
      break
    default:
      rawText = content as string
      parsed = { cards: [], format: 'text', confidence: 1 }
  }
  
  // 2. Génération de questions
  let questions: Question[]
  
  if (parsed.cards.length > 0) {
    // Conversion flashcards → QCM
    questions = convertFlashcardsToQuestions(parsed.cards)
  } else if (ollamaService) {
    // Génération IA
    questions = await generateQuestionsWithAI(rawText, ollamaService)
  } else {
    throw new Error('Ollama non disponible pour générer des questions')
  }
  
  // 3. Analyse qualité
  const analysis = new Map<string, QualityAnalysis>()
  for (const question of questions) {
    analysis.set(question.id, analyzeQuestionQuality(question))
  }
  
  // 4. Détection doublons
  const duplicates = new Map<string, DuplicateCheck>()
  for (const question of questions) {
    duplicates.set(question.id, checkDuplicate(question, existingQuestions))
  }
  
  // 5. Enrichissement automatique
  const enrichments = new Map<string, EnrichmentResult>()
  for (const question of questions) {
    const enrichment: EnrichmentResult = {
      tags: ollamaService 
        ? await generateTags(question, ollamaService)
        : extractKeywords(question.text),
      difficulty: estimateDifficulty(question),
      explanation: ollamaService
        ? await generateExplanation(question, ollamaService)
        : null
    }
    enrichments.set(question.id, enrichment)
  }
  
  return {
    source: { type: source, content },
    parsed,
    questions,
    analysis,
    duplicates,
    enrichments
  }
}
```

---

## Métriques du workflow

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Temps parsing Quizlet | < 1s | Performance.now() |
| Temps parsing PDF | < 30s (20 pages) | Performance.now() |
| Temps OCR image | < 10s | Performance.now() |
| Précision détection doublons | > 90% | Tests manuels |
| Qualité tags IA | > 80% pertinents | Review manuel |
| Temps enrichissement/question | < 5s | Performance.now() |

---

## Mode dégradé (sans Ollama)

Si Ollama n'est pas disponible, le workflow fonctionne en mode limité:

| Fonctionnalité | Avec Ollama | Sans Ollama |
|----------------|-------------|-------------|
| Import Quizlet | ✅ Complet | ✅ Complet |
| Import PDF/Image | ✅ Génération IA | ⚠️ Extraction texte seul |
| Génération QCM | ✅ IA | ❌ Indisponible |
| Détection doublons | ✅ Complet | ✅ Complet (algorithme local) |
| Tags automatiques | ✅ IA | ⚠️ Mots-clés basiques |
| Estimation difficulté | ✅ IA + heuristiques | ⚠️ Heuristiques seules |
| Génération explications | ✅ IA | ❌ Indisponible |

### Message utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️ Mode limité - Ollama non détecté                        │
│                                                              │
│  Certaines fonctionnalités IA sont indisponibles:           │
│  • Génération automatique de questions                       │
│  • Suggestions de tags intelligentes                         │
│  • Génération d'explications                                 │
│                                                              │
│  Pour activer l'IA:                                          │
│  1. Installez Ollama: https://ollama.com                    │
│  2. Dans un terminal: ollama pull mistral:7b-instruct       │
│  3. Démarrez Ollama: ollama serve                           │
│                                                              │
│  L'import Quizlet et la détection de doublons restent       │
│  disponibles sans IA.                                        │
│                                                              │
│                                        [ Compris ]           │
└─────────────────────────────────────────────────────────────┘
```

---

*Précédent: [03 - Phases d'Implémentation](03-phases-implementation.md)*  
*Suivant: [05 - Intégrations](05-integrations.md)*
