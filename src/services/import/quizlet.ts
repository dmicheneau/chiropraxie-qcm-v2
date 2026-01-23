/**
 * Quizlet Parser - Parse copy-pasted content from Quizlet export
 */

export interface FlashCard {
  term: string
  definition: string
}

export type ParseFormat = 'tab' | 'pipe' | 'newline' | 'numbered' | 'unknown'

export interface QuizletParseResult {
  cards: FlashCard[]
  format: ParseFormat
  confidence: number
  warnings: string[]
}

/**
 * Parse Quizlet export content in various formats
 */
export function parseQuizletExport(text: string): QuizletParseResult {
  const lines = text.trim().split('\n').filter(line => line.trim())
  const warnings: string[] = []

  if (lines.length === 0) {
    return {
      cards: [],
      format: 'unknown',
      confidence: 0,
      warnings: ['Aucun contenu détecté']
    }
  }

  // 1. Format tabulation (export Quizlet standard)
  const tabCards = parseTabFormat(lines)
  if (tabCards.length >= 2) {
    return {
      cards: tabCards,
      format: 'tab',
      confidence: 0.95,
      warnings
    }
  }

  // 2. Format pipe (terme | définition)
  const pipeCards = parsePipeFormat(lines)
  if (pipeCards.length >= 2) {
    return {
      cards: pipeCards,
      format: 'pipe',
      confidence: 0.9,
      warnings
    }
  }

  // 3. Format numéroté (1. terme - définition)
  const numberedCards = parseNumberedFormat(lines)
  if (numberedCards.length >= 2) {
    return {
      cards: numberedCards,
      format: 'numbered',
      confidence: 0.85,
      warnings
    }
  }

  // 4. Format double newline (terme\ndéfinition avec ligne vide entre paires)
  const newlineCards = parseNewlineFormat(text)
  if (newlineCards.length >= 2) {
    warnings.push('Format détecté par alternance. Vérifiez les paires.')
    return {
      cards: newlineCards,
      format: 'newline',
      confidence: 0.7,
      warnings
    }
  }

  // 5. Fallback: alternance simple ligne par ligne
  const alternateCards = parseAlternateFormat(lines)
  if (alternateCards.length >= 2) {
    warnings.push('Format détecté par alternance simple. Vérifiez l\'ordre terme/définition.')
    return {
      cards: alternateCards,
      format: 'newline',
      confidence: 0.5,
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

/**
 * Parse tab-separated format (standard Quizlet export)
 * Format: term\tdefinition
 */
function parseTabFormat(lines: string[]): FlashCard[] {
  return lines
    .filter(line => line.includes('\t'))
    .map(line => {
      const parts = line.split('\t')
      const term = parts[0]?.trim() || ''
      const definition = parts.slice(1).join(' ').trim()
      return { term, definition }
    })
    .filter(card => card.term && card.definition)
}

/**
 * Parse pipe-separated format
 * Format: term | definition
 */
function parsePipeFormat(lines: string[]): FlashCard[] {
  return lines
    .filter(line => line.includes(' | ') || line.includes('|'))
    .map(line => {
      const [term, ...rest] = line.split(/\s*\|\s*/)
      const definition = rest.join(' | ').trim()
      return { term: term?.trim() || '', definition }
    })
    .filter(card => card.term && card.definition)
}

/**
 * Parse numbered format
 * Format: 1. term - definition or 1) term: definition
 */
function parseNumberedFormat(lines: string[]): FlashCard[] {
  const regex = /^\d+[.)]\s*(.+?)\s*[-–—:]\s*(.+)$/
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

/**
 * Parse double newline format (blocks separated by empty lines)
 * Format:
 * term1
 * definition1
 * 
 * term2
 * definition2
 */
function parseNewlineFormat(text: string): FlashCard[] {
  // Split by double newline (empty line separator)
  const blocks = text.split(/\n\s*\n/).filter(block => block.trim())
  
  const cards: FlashCard[] = []
  
  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim())
    if (lines.length >= 2) {
      cards.push({
        term: lines[0].trim(),
        definition: lines.slice(1).join(' ').trim()
      })
    }
  }
  
  return cards
}

/**
 * Parse alternate line format (odd lines = terms, even lines = definitions)
 */
function parseAlternateFormat(lines: string[]): FlashCard[] {
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

/**
 * Detect the most likely format without parsing
 */
export function detectFormat(text: string): ParseFormat {
  const lines = text.trim().split('\n').filter(line => line.trim())
  
  if (lines.length === 0) return 'unknown'
  
  const sampleSize = Math.min(lines.length, 5)
  const sample = lines.slice(0, sampleSize)
  
  // Count format indicators
  const tabCount = sample.filter(l => l.includes('\t')).length
  const pipeCount = sample.filter(l => l.includes('|')).length
  const numberedCount = sample.filter(l => /^\d+[.)]/.test(l)).length
  
  if (tabCount >= sampleSize * 0.6) return 'tab'
  if (pipeCount >= sampleSize * 0.6) return 'pipe'
  if (numberedCount >= sampleSize * 0.6) return 'numbered'
  if (text.includes('\n\n')) return 'newline'
  
  return 'unknown'
}
