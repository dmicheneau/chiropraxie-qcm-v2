import { describe, it, expect } from 'vitest'
import { parseQuizletExport, detectFormat } from '@/services/import/quizlet'

describe('parseQuizletExport', () => {
  describe('tab format', () => {
    it('parses standard Quizlet tab-separated format', () => {
      const input = `Term 1\tDefinition 1
Term 2\tDefinition 2
Term 3\tDefinition 3
Term 4\tDefinition 4`

      const result = parseQuizletExport(input)

      expect(result.format).toBe('tab')
      expect(result.cards).toHaveLength(4)
      expect(result.cards[0]).toEqual({ term: 'Term 1', definition: 'Definition 1' })
      expect(result.cards[3]).toEqual({ term: 'Term 4', definition: 'Definition 4' })
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('handles tabs with extra whitespace', () => {
      const input = `  Term 1  \t  Definition 1  
Term 2\tDefinition 2`

      const result = parseQuizletExport(input)

      expect(result.cards[0].term).toBe('Term 1')
      expect(result.cards[0].definition).toBe('Definition 1')
    })

    it('handles multiple tabs in definition', () => {
      const input = `Term 1\tPart A\tPart B
Term 2\tSimple definition`

      const result = parseQuizletExport(input)

      expect(result.cards[0].definition).toBe('Part A Part B')
    })
  })

  describe('pipe format', () => {
    it('parses pipe-separated format', () => {
      const input = `Term 1 | Definition 1
Term 2 | Definition 2
Term 3 | Definition 3
Term 4 | Definition 4`

      const result = parseQuizletExport(input)

      expect(result.format).toBe('pipe')
      expect(result.cards).toHaveLength(4)
      expect(result.cards[0]).toEqual({ term: 'Term 1', definition: 'Definition 1' })
    })

    it('handles pipes without spaces', () => {
      const input = `Term 1|Definition 1
Term 2|Definition 2`

      const result = parseQuizletExport(input)

      expect(result.cards).toHaveLength(2)
      expect(result.cards[0].term).toBe('Term 1')
    })

    it('handles multiple pipes in definition', () => {
      const input = `Term 1 | Part A | Part B
Term 2 | Simple`

      const result = parseQuizletExport(input)

      expect(result.cards[0].definition).toBe('Part A | Part B')
    })
  })

  describe('numbered format', () => {
    it('parses numbered format with period', () => {
      const input = `1. Term 1 - Definition 1
2. Term 2 - Definition 2
3. Term 3 - Definition 3
4. Term 4 - Definition 4`

      const result = parseQuizletExport(input)

      expect(result.format).toBe('numbered')
      expect(result.cards).toHaveLength(4)
      expect(result.cards[0]).toEqual({ term: 'Term 1', definition: 'Definition 1' })
    })

    it('parses numbered format with parenthesis', () => {
      const input = `1) Term 1 - Definition 1
2) Term 2 - Definition 2`

      const result = parseQuizletExport(input)

      expect(result.cards).toHaveLength(2)
    })

    it('parses numbered format with colon', () => {
      const input = `1. Term 1: Definition 1
2. Term 2: Definition 2`

      const result = parseQuizletExport(input)

      expect(result.cards).toHaveLength(2)
      expect(result.cards[0].definition).toBe('Definition 1')
    })

    it('handles en-dash and em-dash', () => {
      const input = `1. Term 1 – Definition 1
2. Term 2 — Definition 2`

      const result = parseQuizletExport(input)

      expect(result.cards).toHaveLength(2)
    })
  })

  describe('newline format', () => {
    it('parses double-newline separated format', () => {
      const input = `Term 1
Definition 1

Term 2
Definition 2

Term 3
Definition 3

Term 4
Definition 4`

      const result = parseQuizletExport(input)

      expect(result.format).toBe('newline')
      expect(result.cards).toHaveLength(4)
      expect(result.cards[0]).toEqual({ term: 'Term 1', definition: 'Definition 1' })
    })

    it('handles multi-line definitions', () => {
      const input = `Term 1
Line 1 of definition
Line 2 of definition

Term 2
Simple definition`

      const result = parseQuizletExport(input)

      expect(result.cards[0].definition).toBe('Line 1 of definition Line 2 of definition')
    })
  })

  describe('edge cases', () => {
    it('returns empty result for empty input', () => {
      const result = parseQuizletExport('')

      expect(result.cards).toHaveLength(0)
      expect(result.format).toBe('unknown')
      expect(result.warnings).toContain('Aucun contenu détecté')
    })

    it('returns empty result for whitespace-only input', () => {
      const result = parseQuizletExport('   \n\n   ')

      expect(result.cards).toHaveLength(0)
    })

    it('filters out cards with empty term or definition', () => {
      // Parser needs minimum 2 valid cards to detect format
      const input = `Valid Term 1\tValid Definition 1
Valid Term 2\tValid Definition 2
\tOnly definition
Only term\t`

      const result = parseQuizletExport(input)

      // Should only have the 2 valid cards, not the incomplete ones
      expect(result.cards).toHaveLength(2)
      expect(result.cards[0].term).toBe('Valid Term 1')
      expect(result.cards[1].term).toBe('Valid Term 2')
    })

    it('returns unknown format with warning when no format detected', () => {
      const input = `Random text without any recognizable format
Another random line`

      const result = parseQuizletExport(input)

      expect(result.format).toBe('unknown')
      expect(result.warnings.some(w => w.includes('non reconnu'))).toBe(true)
    })
  })

  describe('confidence scores', () => {
    it('has highest confidence for tab format', () => {
      const input = `A\tB\nC\tD\nE\tF\nG\tH`
      const result = parseQuizletExport(input)
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('has high confidence for pipe format', () => {
      const input = `A | B\nC | D\nE | F\nG | H`
      const result = parseQuizletExport(input)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85)
    })

    it('has lower confidence for newline format', () => {
      const input = `A\nB\n\nC\nD\n\nE\nF\n\nG\nH`
      const result = parseQuizletExport(input)
      expect(result.confidence).toBeLessThan(0.9)
    })
  })
})

describe('detectFormat', () => {
  it('detects tab format', () => {
    expect(detectFormat('A\tB\nC\tD\nE\tF')).toBe('tab')
  })

  it('detects pipe format', () => {
    expect(detectFormat('A | B\nC | D\nE | F')).toBe('pipe')
  })

  it('detects numbered format', () => {
    expect(detectFormat('1. A - B\n2. C - D\n3. E - F')).toBe('numbered')
  })

  it('detects newline format', () => {
    expect(detectFormat('A\nB\n\nC\nD')).toBe('newline')
  })

  it('returns unknown for unrecognized format', () => {
    expect(detectFormat('random text')).toBe('unknown')
  })
})
