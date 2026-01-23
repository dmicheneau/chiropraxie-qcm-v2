# 05 - Intégrations

## Vue d'ensemble

Ce document détaille les intégrations techniques de Chiropraxie QCM V2. L'architecture offline-first implique que toutes les intégrations fonctionnent localement, sans dépendance à des services cloud.

```
┌─────────────────────────────────────────────────────────────┐
│                    CHIROPRAXIE QCM V2                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Ollama    │  │   pdf.js    │  │   Tesseract.js     │  │
│  │  (IA locale)│  │  (PDF)      │  │   (OCR)            │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬─────────┘  │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                   │
│                    ┌─────▼─────┐                            │
│                    │  Import   │                            │
│                    │  Pipeline │                            │
│                    └───────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Ollama (IA Locale)

### Installation

#### macOS / Linux

```bash
# Installation
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger le modèle principal
ollama pull mistral:7b-instruct

# Démarrer le serveur (s'il n'est pas démarré automatiquement)
ollama serve
```

#### Windows

1. Télécharger l'installateur depuis https://ollama.com
2. Exécuter l'installateur
3. Ouvrir PowerShell:
```powershell
ollama pull mistral:7b-instruct
ollama serve
```

### Configuration

```typescript
// src/config/ollama.ts

export interface OllamaConfig {
  endpoint: string
  model: string
  options: {
    temperature: number
    num_predict: number
    top_p: number
  }
}

export const defaultOllamaConfig: OllamaConfig = {
  endpoint: 'http://localhost:11434',
  model: 'mistral:7b-instruct',
  options: {
    temperature: 0.7,
    num_predict: 2000,
    top_p: 0.9
  }
}

// Modèles alternatifs pour hardware limité
export const alternativeModels = [
  {
    name: 'llama3.2:3b',
    size: '2 GB',
    ram: '4 GB',
    description: 'Plus rapide, qualité légèrement inférieure'
  },
  {
    name: 'phi3:mini',
    size: '2.3 GB',
    ram: '4 GB',
    description: 'Ultra-léger, bon pour machines modestes'
  },
  {
    name: 'gemma2:2b',
    size: '1.6 GB',
    ram: '4 GB',
    description: 'Le plus léger, performances basiques'
  }
]
```

### Service Ollama

```typescript
// src/services/ollama.ts

import { OllamaConfig, defaultOllamaConfig } from '@/config/ollama'

interface GenerateOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

interface OllamaResponse {
  model: string
  response: string
  done: boolean
  total_duration?: number
  eval_count?: number
}

export class OllamaService {
  private config: OllamaConfig
  
  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...defaultOllamaConfig, ...config }
  }
  
  /**
   * Vérifie si Ollama est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  /**
   * Liste les modèles installés
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.config.endpoint}/api/tags`)
    if (!response.ok) throw new Error('Ollama non disponible')
    
    const data = await response.json()
    return data.models?.map((m: any) => m.name) || []
  }
  
  /**
   * Vérifie si un modèle spécifique est installé
   */
  async hasModel(model: string): Promise<boolean> {
    const models = await this.listModels()
    return models.some(m => m.startsWith(model))
  }
  
  /**
   * Génère une réponse
   */
  async generate(
    prompt: string, 
    options: GenerateOptions = {}
  ): Promise<string> {
    const response = await fetch(`${this.config.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: options.stream ?? false,
        options: {
          temperature: options.temperature ?? this.config.options.temperature,
          num_predict: options.maxTokens ?? this.config.options.num_predict
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Erreur Ollama: ${response.status}`)
    }
    
    const data: OllamaResponse = await response.json()
    return data.response
  }
  
  /**
   * Génère avec streaming (pour affichage progressif)
   */
  async *generateStream(prompt: string): AsyncGenerator<string> {
    const response = await fetch(`${this.config.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`Erreur Ollama: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Stream non supporté')
    
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.response) {
            yield data.response
          }
        } catch {
          // Ignorer les lignes non-JSON
        }
      }
    }
  }
}

// Instance singleton
export const ollamaService = new OllamaService()
```

### Hook React

```typescript
// src/hooks/useOllama.ts

import { useState, useEffect, useCallback } from 'react'
import { ollamaService, OllamaService } from '@/services/ollama'

interface UseOllamaReturn {
  isAvailable: boolean
  isLoading: boolean
  error: string | null
  generate: (prompt: string) => Promise<string>
  generateWithProgress: (
    prompt: string, 
    onProgress: (text: string) => void
  ) => Promise<string>
  checkHealth: () => Promise<boolean>
}

export function useOllama(): UseOllamaReturn {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const checkHealth = useCallback(async () => {
    try {
      const available = await ollamaService.isAvailable()
      setIsAvailable(available)
      setError(available ? null : 'Ollama non démarré')
      return available
    } catch (e) {
      setIsAvailable(false)
      setError('Impossible de contacter Ollama')
      return false
    }
  }, [])
  
  useEffect(() => {
    checkHealth().finally(() => setIsLoading(false))
    
    // Re-vérifier toutes les 30 secondes
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])
  
  const generate = useCallback(async (prompt: string): Promise<string> => {
    if (!isAvailable) {
      throw new Error('Ollama non disponible')
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await ollamaService.generate(prompt)
      return response
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(message)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable])
  
  const generateWithProgress = useCallback(async (
    prompt: string,
    onProgress: (text: string) => void
  ): Promise<string> => {
    if (!isAvailable) {
      throw new Error('Ollama non disponible')
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      let fullResponse = ''
      
      for await (const chunk of ollamaService.generateStream(prompt)) {
        fullResponse += chunk
        onProgress(fullResponse)
      }
      
      return fullResponse
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue'
      setError(message)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [isAvailable])
  
  return {
    isAvailable,
    isLoading,
    error,
    generate,
    generateWithProgress,
    checkHealth
  }
}
```

### Prompts

```typescript
// src/services/ollama/prompts.ts

export const PROMPTS = {
  /**
   * Génération de questions QCM
   */
  generateQuestions: (sourceText: string, count: number = 10) => `
Tu es un expert en création de QCM pédagogiques pour des étudiants en chiropraxie.
Génère exactement ${count} questions à choix multiples basées sur le texte fourni.

RÈGLES STRICTES:
1. Chaque question doit avoir exactement 4 choix (A, B, C, D)
2. Une seule bonne réponse par question
3. Les mauvaises réponses doivent être plausibles mais clairement fausses
4. Inclure une explication pédagogique pour chaque question
5. Varier les niveaux de difficulté (easy, medium, hard)
6. Questions en français
7. Retourner UNIQUEMENT du JSON valide

FORMAT DE SORTIE:
{
  "questions": [
    {
      "text": "Texte de la question avec point d'interrogation ?",
      "choices": [
        {"id": "A", "text": "Premier choix"},
        {"id": "B", "text": "Deuxième choix"},
        {"id": "C", "text": "Troisième choix"},
        {"id": "D", "text": "Quatrième choix"}
      ],
      "correctAnswer": "A",
      "explanation": "Explication claire et pédagogique",
      "difficulty": "medium",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}

TEXTE SOURCE:
${sourceText}
`.trim(),

  /**
   * Génération de tags
   */
  generateTags: (questionText: string) => `
Analyse cette question de QCM en chiropraxie et suggère 3-5 tags pertinents.

RÈGLES:
- Tags courts (1-3 mots)
- En français
- Spécifiques au domaine médical/chiropraxie
- Utiles pour recherche et filtrage

Question: ${questionText}

Réponse (JSON uniquement):
{"tags": ["tag1", "tag2", "tag3"]}
`.trim(),

  /**
   * Génération d'explication
   */
  generateExplanation: (questionText: string, correctAnswer: string) => `
Tu es un professeur expert en chiropraxie.
Génère une explication pédagogique courte (2-3 phrases) pour cette question.

Question: ${questionText}
Bonne réponse: ${correctAnswer}

L'explication doit:
1. Expliquer pourquoi cette réponse est correcte
2. Être claire et accessible
3. Aider à mémoriser le concept

Réponse (JSON uniquement):
{"explanation": "Explication ici"}
`.trim(),

  /**
   * Évaluation qualité
   */
  evaluateQuality: (questionText: string, choices: string[]) => `
Évalue la qualité de cette question de QCM.

Question: ${questionText}
Choix: ${choices.join(' | ')}

Analyse:
1. La question est-elle claire et bien formulée ?
2. Les choix sont-ils plausibles et distincts ?
3. Y a-t-il des ambiguïtés ?

Réponse (JSON uniquement):
{
  "score": 85,
  "issues": ["problème éventuel"],
  "suggestions": ["amélioration suggérée"]
}
`.trim()
}
```

---

## Import Quizlet (Copy-Paste)

### Pourquoi copy-paste ?

Quizlet bloque activement le scraping web:
- HTTP 403 sur les requêtes programmatiques
- Captchas fréquents
- Rate limiting agressif

**Solution**: L'utilisateur copie manuellement le contenu depuis Quizlet.

### Instructions utilisateur

```markdown
## Comment importer depuis Quizlet

1. Ouvrez votre set Quizlet
2. Cliquez sur les "..." (menu)
3. Sélectionnez "Exporter"
4. Copiez tout le contenu (Ctrl+A, Ctrl+C)
5. Collez dans l'application
```

### Parser multi-format

```typescript
// src/services/import/quizlet.ts

export interface FlashCard {
  term: string
  definition: string
}

export interface QuizletParseResult {
  cards: FlashCard[]
  format: 'tab' | 'pipe' | 'newline' | 'numbered' | 'unknown'
  confidence: number
  warnings: string[]
}

export function parseQuizletExport(text: string): QuizletParseResult {
  const lines = text.trim().split('\n').filter(line => line.trim())
  const warnings: string[] = []
  
  // Tentative de détection du format par ordre de fiabilité
  
  // 1. Format tabulation (export Quizlet standard)
  const tabCards = parseTabFormat(lines)
  if (tabCards.length > 0) {
    return {
      cards: tabCards,
      format: 'tab',
      confidence: 0.95,
      warnings
    }
  }
  
  // 2. Format pipe (terme | définition)
  const pipeCards = parsePipeFormat(lines)
  if (pipeCards.length > 0) {
    return {
      cards: pipeCards,
      format: 'pipe',
      confidence: 0.9,
      warnings
    }
  }
  
  // 3. Format numéroté (1. terme - définition)
  const numberedCards = parseNumberedFormat(lines)
  if (numberedCards.length > 0) {
    return {
      cards: numberedCards,
      format: 'numbered',
      confidence: 0.85,
      warnings
    }
  }
  
  // 4. Format double newline (terme\ndéfinition\n\nterme\n...)
  const newlineCards = parseNewlineFormat(lines)
  if (newlineCards.length > 0) {
    warnings.push('Format détecté par alternance. Vérifiez les paires.')
    return {
      cards: newlineCards,
      format: 'newline',
      confidence: 0.7,
      warnings
    }
  }
  
  // Aucun format reconnu
  warnings.push('Format non reconnu. Vérifiez le contenu copié.')
  return {
    cards: [],
    format: 'unknown',
    confidence: 0,
    warnings
  }
}

function parseTabFormat(lines: string[]): FlashCard[] {
  return lines
    .filter(line => line.includes('\t'))
    .map(line => {
      const [term, definition] = line.split('\t').map(s => s.trim())
      return { term, definition }
    })
    .filter(card => card.term && card.definition)
}

function parsePipeFormat(lines: string[]): FlashCard[] {
  return lines
    .filter(line => line.includes(' | '))
    .map(line => {
      const [term, definition] = line.split(' | ').map(s => s.trim())
      return { term, definition }
    })
    .filter(card => card.term && card.definition)
}

function parseNumberedFormat(lines: string[]): FlashCard[] {
  const regex = /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/
  return lines
    .map(line => {
      const match = line.match(regex)
      if (match) {
        return { term: match[1].trim(), definition: match[2].trim() }
      }
      return null
    })
    .filter((card): card is FlashCard => card !== null)
}

function parseNewlineFormat(lines: string[]): FlashCard[] {
  if (lines.length < 2 || lines.length % 2 !== 0) {
    return []
  }
  
  const cards: FlashCard[] = []
  for (let i = 0; i < lines.length; i += 2) {
    cards.push({
      term: lines[i].trim(),
      definition: lines[i + 1].trim()
    })
  }
  return cards
}
```

### Conversion Flashcard → QCM

```typescript
// src/services/import/converter.ts

import { FlashCard } from './quizlet'
import { Question, Choice } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { shuffleArray } from '@/utils/shuffle'

export type ConversionMode = 'term-to-question' | 'definition-to-question'

export interface ConversionOptions {
  mode: ConversionMode
  theme: string
  difficulty: 'easy' | 'medium' | 'hard'
  shuffleChoices: boolean
}

export function convertFlashcardsToQuestions(
  cards: FlashCard[],
  options: ConversionOptions
): Question[] {
  if (cards.length < 4) {
    throw new Error('Minimum 4 flashcards requis pour générer des QCM')
  }
  
  return cards.map((card, index) => {
    // Détermine question et bonne réponse selon le mode
    const questionText = options.mode === 'term-to-question'
      ? `Quelle est la définition de "${card.term}" ?`
      : `Quel terme correspond à cette définition: "${card.definition}" ?`
    
    const correctAnswer = options.mode === 'term-to-question'
      ? card.definition
      : card.term
    
    // Générer 3 mauvaises réponses (autres cartes)
    const wrongAnswers = generateWrongAnswers(cards, index, options.mode)
    
    // Créer les choix
    const choices: Choice[] = [
      { id: 'A', text: correctAnswer },
      { id: 'B', text: wrongAnswers[0] },
      { id: 'C', text: wrongAnswers[1] },
      { id: 'D', text: wrongAnswers[2] }
    ]
    
    // Mélanger si demandé
    const finalChoices = options.shuffleChoices 
      ? shuffleChoicesWithCorrectTracking(choices)
      : choices
    
    // Trouver l'ID de la bonne réponse après mélange
    const correctId = finalChoices.find(c => c.text === correctAnswer)?.id || 'A'
    
    return {
      id: generateUUID(),
      type: 'single_choice' as const,
      text: questionText,
      choices: finalChoices,
      correctAnswer: correctId,
      theme: options.theme,
      difficulty: options.difficulty,
      tags: [],
      source: 'quizlet' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

function generateWrongAnswers(
  cards: FlashCard[],
  currentIndex: number,
  mode: ConversionMode
): string[] {
  // Exclure la carte actuelle
  const otherCards = cards.filter((_, i) => i !== currentIndex)
  
  // Mélanger et prendre 3
  const shuffled = shuffleArray(otherCards)
  const selected = shuffled.slice(0, 3)
  
  return selected.map(card => 
    mode === 'term-to-question' ? card.definition : card.term
  )
}

function shuffleChoicesWithCorrectTracking(choices: Choice[]): Choice[] {
  const shuffled = shuffleArray([...choices])
  return shuffled.map((choice, index) => ({
    ...choice,
    id: String.fromCharCode(65 + index) // A, B, C, D
  }))
}
```

---

## Import PDF

### Configuration pdf.js

```typescript
// src/services/import/pdf.ts

import * as pdfjsLib from 'pdfjs-dist'

// Worker pour le parsing (évite le blocage du thread principal)
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface PDFExtractResult {
  text: string
  pages: number
  title?: string
  wordCount: number
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PDFExtractResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  
  let fullText = ''
  const totalPages = pdf.numPages
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
    
    fullText += pageText + '\n\n'
    
    if (onProgress) {
      onProgress((i / totalPages) * 100)
    }
  }
  
  // Métadonnées
  const metadata = await pdf.getMetadata().catch(() => null)
  
  return {
    text: fullText.trim(),
    pages: totalPages,
    title: metadata?.info?.Title,
    wordCount: fullText.split(/\s+/).length
  }
}

// Prétraitement du texte pour améliorer la génération IA
export function preprocessPDFText(text: string): string {
  return text
    // Supprimer numéros de page isolés
    .replace(/^\d+$/gm, '')
    // Supprimer headers/footers répétés (heuristique)
    .replace(/^.{0,50}$/gm, match => {
      // Garder les lignes courtes seulement si elles semblent être des titres
      return /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ]/.test(match) ? match : ''
    })
    // Normaliser espaces
    .replace(/\s+/g, ' ')
    // Supprimer lignes vides multiples
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
```

---

## Import Images (OCR)

### Configuration Tesseract.js

```typescript
// src/services/import/ocr.ts

import Tesseract, { Worker, createWorker } from 'tesseract.js'

let worker: Worker | null = null

export interface OCRResult {
  text: string
  confidence: number
  processingTime: number
}

async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker('fra', 1, {
      logger: () => {} // Désactiver logs par défaut
    })
  }
  return worker
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  const startTime = performance.now()
  
  const w = await getWorker()
  
  // Configurer le logger pour le progress
  if (onProgress) {
    await w.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO
    })
  }
  
  const { data } = await w.recognize(file, {
    rotateAuto: true
  }, {
    text: true,
    blocks: false,
    hocr: false
  })
  
  return {
    text: data.text.trim(),
    confidence: data.confidence,
    processingTime: performance.now() - startTime
  }
}

// Prétraitement image pour améliorer l'OCR
export async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    img.onload = () => {
      if (!ctx) {
        reject(new Error('Canvas non supporté'))
        return
      }
      
      canvas.width = img.width
      canvas.height = img.height
      
      // Dessiner l'image
      ctx.drawImage(img, 0, 0)
      
      // Appliquer des filtres pour améliorer le contraste
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Conversion en niveaux de gris + seuillage adaptatif
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
        // Seuillage simple
        const binary = gray > 128 ? 255 : 0
        data[i] = data[i+1] = data[i+2] = binary
      }
      
      ctx.putImageData(imageData, 0, 0)
      
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Échec conversion'))
      }, 'image/png')
    }
    
    img.onerror = () => reject(new Error('Échec chargement image'))
    img.src = URL.createObjectURL(file)
  })
}

// Libérer les ressources
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
```

---

## Export/Import JSON

### Format d'export

```typescript
// src/services/export/format.ts

import { QuestionBank, Question } from '@/types'

export interface ExportData {
  version: '2.0'
  exportedAt: string
  application: 'chiropraxie-qcm-v2'
  banks: ExportBank[]
  metadata: ExportMetadata
}

export interface ExportBank {
  id: string
  name: string
  description: string
  questions: Question[]
}

export interface ExportMetadata {
  totalQuestions: number
  themes: string[]
  exportedBy?: string
}

// Validation avec Zod
import { z } from 'zod'

export const ExportSchema = z.object({
  version: z.literal('2.0'),
  exportedAt: z.string().datetime(),
  application: z.literal('chiropraxie-qcm-v2'),
  banks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    questions: z.array(z.any()) // Validation détaillée séparée
  })),
  metadata: z.object({
    totalQuestions: z.number(),
    themes: z.array(z.string()),
    exportedBy: z.string().optional()
  })
})
```

### Service d'export

```typescript
// src/services/export/export.ts

import { db } from '@/services/db'
import { ExportData, ExportBank } from './format'

export async function exportAllData(): Promise<ExportData> {
  const banks = await db.banks.toArray()
  
  const exportBanks: ExportBank[] = banks.map(bank => ({
    id: bank.id,
    name: bank.name,
    description: bank.description,
    questions: bank.questions
  }))
  
  const allQuestions = banks.flatMap(b => b.questions)
  const themes = [...new Set(allQuestions.map(q => q.theme))]
  
  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    application: 'chiropraxie-qcm-v2',
    banks: exportBanks,
    metadata: {
      totalQuestions: allQuestions.length,
      themes
    }
  }
}

export function downloadExport(data: ExportData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `chiropraxie-qcm-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### Service d'import

```typescript
// src/services/export/import.ts

import { db } from '@/services/db'
import { ExportData, ExportSchema } from './format'
import { QuestionBank } from '@/types'
import { generateUUID } from '@/utils/uuid'

export interface ImportResult {
  success: boolean
  banksImported: number
  questionsImported: number
  errors: string[]
  warnings: string[]
}

export type ConflictStrategy = 'skip' | 'replace' | 'merge'

export async function importFromJSON(
  file: File,
  conflictStrategy: ConflictStrategy = 'skip'
): Promise<ImportResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Lire le fichier
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Valider le format
    const parsed = ExportSchema.safeParse(data)
    if (!parsed.success) {
      return {
        success: false,
        banksImported: 0,
        questionsImported: 0,
        errors: ['Format de fichier invalide'],
        warnings: []
      }
    }
    
    const exportData = parsed.data as ExportData
    
    // Importer chaque banque
    let banksImported = 0
    let questionsImported = 0
    
    for (const bank of exportData.banks) {
      const existingBank = await db.banks.get(bank.id)
      
      if (existingBank) {
        switch (conflictStrategy) {
          case 'skip':
            warnings.push(`Banque "${bank.name}" ignorée (existe déjà)`)
            continue
          case 'replace':
            await db.banks.delete(bank.id)
            break
          case 'merge':
            // Fusionner les questions
            const mergedQuestions = mergeQuestions(
              existingBank.questions, 
              bank.questions
            )
            await db.banks.update(bank.id, { 
              questions: mergedQuestions,
              updatedAt: new Date().toISOString()
            })
            questionsImported += bank.questions.length
            banksImported++
            continue
        }
      }
      
      // Créer nouvelle banque
      const newBank: QuestionBank = {
        id: conflictStrategy === 'replace' ? bank.id : generateUUID(),
        name: bank.name,
        description: bank.description,
        questions: bank.questions,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          totalQuestions: bank.questions.length,
          themes: [...new Set(bank.questions.map(q => q.theme))],
          sources: countSources(bank.questions)
        }
      }
      
      await db.banks.add(newBank)
      banksImported++
      questionsImported += bank.questions.length
    }
    
    return {
      success: true,
      banksImported,
      questionsImported,
      errors,
      warnings
    }
    
  } catch (e) {
    return {
      success: false,
      banksImported: 0,
      questionsImported: 0,
      errors: [e instanceof Error ? e.message : 'Erreur inconnue'],
      warnings
    }
  }
}

function mergeQuestions(existing: Question[], incoming: Question[]): Question[] {
  const existingIds = new Set(existing.map(q => q.id))
  const newQuestions = incoming.filter(q => !existingIds.has(q.id))
  return [...existing, ...newQuestions]
}

function countSources(questions: Question[]): Record<string, number> {
  return questions.reduce((acc, q) => {
    acc[q.source] = (acc[q.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
```

---

## Résumé des dépendances

| Package | Version | Usage |
|---------|---------|-------|
| `pdfjs-dist` | ^4.0.0 | Extraction texte PDF |
| `tesseract.js` | ^5.0.0 | OCR images |
| `zod` | ^3.22.0 | Validation schémas |

---

*Précédent: [04 - Workflow d'Analyse](04-workflow-analyse.md)*  
*Suivant: [06 - UI/UX Spécifications](06-ui-ux-specs.md)*
