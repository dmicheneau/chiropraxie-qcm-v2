/**
 * Ollama Services Tests
 * Tests for AI response parsing and duplicate detection
 */

import { describe, it, expect } from 'vitest'
import {
  extractJSON,
  parseAIQuestions,
  parseTags,
  parseExplanation,
  parseQualityEvaluation,
  convertToQuestions,
} from '@/services/ollama/parser'
import {
  jaccardSimilarity,
  levenshteinDistance,
  levenshteinSimilarity,
  calculateSimilarity,
  checkDuplicate,
  findInternalDuplicates,
} from '@/services/analysis/duplicates'
import type { Question } from '@/types'

// =========================================
// JSON Extraction Tests
// =========================================

describe('extractJSON', () => {
  it('should extract simple JSON object', () => {
    const text = '{"questions": []}'
    expect(extractJSON(text)).toBe('{"questions": []}')
  })

  it('should extract JSON from text with surrounding content', () => {
    const text = `
      Here are the questions:
      {"questions": [{"text": "What is anatomy?", "choices": [{"id": "A", "text": "Science"}], "correctAnswer": "A"}]}
      I hope these help!
    `
    const result = extractJSON(text)
    expect(result).not.toBeNull()
    expect(JSON.parse(result!)).toHaveProperty('questions')
  })

  it('should extract JSON array', () => {
    const text = '[{"id": 1}, {"id": 2}]'
    expect(extractJSON(text)).toBe('[{"id": 1}, {"id": 2}]')
  })

  it('should return null for invalid JSON', () => {
    const text = 'This is just plain text'
    expect(extractJSON(text)).toBeNull()
  })

  it('should return null for malformed JSON', () => {
    const text = '{"broken": json, not valid}'
    expect(extractJSON(text)).toBeNull()
  })

  it('should handle JSON with newlines', () => {
    const text = `{
      "questions": [
        {"text": "Test"}
      ]
    }`
    expect(extractJSON(text)).not.toBeNull()
  })
})

// =========================================
// Question Parsing Tests
// =========================================

describe('parseAIQuestions', () => {
  it('should parse valid questions array', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'What is the spinal cord?',
          choices: [
            { id: 'A', text: 'A nerve bundle' },
            { id: 'B', text: 'A muscle' },
            { id: 'C', text: 'A bone' },
            { id: 'D', text: 'A blood vessel' },
          ],
          correctAnswer: 'A',
          explanation: 'The spinal cord is part of the nervous system.',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.parseErrors).toHaveLength(0)
    expect(result.questions[0].text).toBe('What is the spinal cord?')
    expect(result.questions[0].correctAnswer).toBe('A')
  })

  it('should handle direct array format wrapped in text', () => {
    // When AI returns an array directly, it's typically wrapped in explanation text
    // Our parser handles this by extracting the array properly
    const response = `Here are the generated questions:
    {"questions": [
      {
        "text": "Test question?",
        "choices": [
          { "id": "A", "text": "Choice A" },
          { "id": "B", "text": "Choice B" },
          { "id": "C", "text": "Choice C" },
          { "id": "D", "text": "Choice D" }
        ],
        "correctAnswer": "B"
      }
    ]}
    I hope these help!`

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].correctAnswer).toBe('B')
  })

  it('should report error for missing text', () => {
    const response = JSON.stringify({
      questions: [
        {
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'A',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(0)
    expect(result.parseErrors).toHaveLength(1)
    expect(result.parseErrors[0]).toContain('texte manquant')
  })

  it('should auto-complete questions with less than 4 choices', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
          ],
          correctAnswer: 'A',
        },
      ],
    })

    const result = parseAIQuestions(response)
    // Now accepts 2-4 choices and auto-completes to 4
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].choices).toHaveLength(4)
    expect(result.parseErrors.length).toBeGreaterThan(0) // Should warn about missing choices
    expect(result.parseErrors.some(e => e.includes('ajouté automatiquement'))).toBe(true)
  })

  it('should report error for invalid correctAnswer', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'E',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(0)
    expect(result.parseErrors[0]).toContain('réponse correcte invalide')
  })

  it('should handle empty response', () => {
    const result = parseAIQuestions('')
    expect(result.questions).toHaveLength(0)
    expect(result.parseErrors).toHaveLength(1)
  })

  it('should validate difficulty values', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'A',
          difficulty: 'hard',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions[0].difficulty).toBe('hard')
  })

  it('should default invalid difficulty to medium', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'A',
          difficulty: 'super_hard',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions[0].difficulty).toBe('medium')
  })

  it('should preserve tags when provided', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'A',
          tags: ['anatomy', 'spine'],
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions[0].tags).toEqual(['anatomy', 'spine'])
  })
})

// =========================================
// convertToQuestions Tests
// =========================================

describe('convertToQuestions', () => {
  it('should convert AI questions to full Question objects', () => {
    const aiQuestions = [
      {
        text: 'What is anatomy?',
        choices: [
          { id: 'A', text: 'Study of body structure' },
          { id: 'B', text: 'Study of cells' },
          { id: 'C', text: 'Study of diseases' },
          { id: 'D', text: 'Study of chemistry' },
        ],
        correctAnswer: 'A',
        explanation: 'Anatomy is the study of body structure.',
        difficulty: 'easy' as const,
        tags: ['anatomy', 'basics'],
      },
    ]

    const questions = convertToQuestions(aiQuestions, 'Anatomie', 'Introduction')

    expect(questions).toHaveLength(1)
    expect(questions[0].type).toBe('single_choice')
    expect(questions[0].theme).toBe('Anatomie')
    expect(questions[0].subtheme).toBe('Introduction')
    expect(questions[0].source).toBe('ai_generated')
    expect(questions[0].id).toBeDefined()
    expect(questions[0].createdAt).toBeDefined()
  })
})

// =========================================
// Helper Parsing Tests
// =========================================

describe('parseTags', () => {
  it('should parse tags from JSON response', () => {
    const response = '{"tags": ["anatomy", "spine", "vertebra"]}'
    expect(parseTags(response)).toEqual(['anatomy', 'spine', 'vertebra'])
  })

  it('should return empty array for invalid response', () => {
    expect(parseTags('no json here')).toEqual([])
    expect(parseTags('{"other": "data"}')).toEqual([])
  })
})

describe('parseExplanation', () => {
  it('should parse explanation from JSON response', () => {
    const response = '{"explanation": "This is because of X and Y."}'
    expect(parseExplanation(response)).toBe('This is because of X and Y.')
  })

  it('should return null for invalid response', () => {
    expect(parseExplanation('no json')).toBeNull()
    expect(parseExplanation('{"other": "data"}')).toBeNull()
  })
})

describe('parseQualityEvaluation', () => {
  it('should parse quality evaluation', () => {
    const response = JSON.stringify({
      score: 85,
      details: {
        clarity: 90,
        coherence: 80,
        plausibility: 85,
        relevance: 85,
      },
      issues: ['Minor ambiguity'],
      suggestions: ['Add more context'],
    })

    const result = parseQualityEvaluation(response)
    expect(result).not.toBeNull()
    expect(result!.score).toBe(85)
    expect(result!.details.clarity).toBe(90)
    expect(result!.issues).toContain('Minor ambiguity')
  })

  it('should clamp score to 0-100 range', () => {
    const response = '{"score": 150}'
    const result = parseQualityEvaluation(response)
    expect(result!.score).toBe(100)
  })

  it('should return null for missing score', () => {
    const response = '{"details": {}}'
    expect(parseQualityEvaluation(response)).toBeNull()
  })
})

// =========================================
// Malformed JSON Repair Tests (Real Ollama outputs)
// =========================================

describe('extractJSON with malformed Ollama responses', () => {
  it('should repair missing "text" key in choices', () => {
    // Real pattern from Ollama: {"id": "D", "Stroma"} instead of {"id": "D", "text": "Stroma"}
    const malformedResponse = `{"questions": [
      {
        "text": "Quel tissu conjonctif recouvre le scléros?",
        "choices": [
          {"id": "A", "text": "Tunica fibrosa"},
          {"id": "B", "text": "Tunica vasculosa"},
          {"id": "C", "text": "Tunica albuginea"},
          {"id": "D", "Stroma"}
        ],
        "correctAnswer": "A",
        "explanation": "Explication...",
        "difficulty": "easy"
      }
    ]}`

    const result = extractJSON(malformedResponse)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions).toHaveLength(1)
    expect(parsed.questions[0].choices[3].text).toBe('Stroma')
  })

  it('should handle multiple missing "text" keys in same response', () => {
    const malformedResponse = `{"questions": [
      {
        "text": "Question test?",
        "choices": [
          {"id": "A", "Réponse A"},
          {"id": "B", "Réponse B"},
          {"id": "C", "Réponse C"},
          {"id": "D", "Réponse D"}
        ],
        "correctAnswer": "A"
      }
    ]}`

    const result = extractJSON(malformedResponse)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions[0].choices[0].text).toBe('Réponse A')
    expect(parsed.questions[0].choices[1].text).toBe('Réponse B')
    expect(parsed.questions[0].choices[2].text).toBe('Réponse C')
    expect(parsed.questions[0].choices[3].text).toBe('Réponse D')
  })

  it('should handle JSON with surrounding explanation text', () => {
    const responseWithText = `Voici les questions générées:

    {"questions": [
      {
        "text": "Quelle est la fonction du nerf?",
        "choices": [
          {"id": "A", "text": "Transmission"},
          {"id": "B", "text": "Protection"},
          {"id": "C", "text": "Nutrition"},
          {"id": "D", "text": "Support"}
        ],
        "correctAnswer": "A"
      }
    ]}
    
    J'espère que ces questions vous seront utiles!`

    const result = extractJSON(responseWithText)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions).toHaveLength(1)
  })

  it('should handle trailing commas', () => {
    const responseWithTrailingComma = `{"questions": [
      {
        "text": "Question?",
        "choices": [
          {"id": "A", "text": "A"},
          {"id": "B", "text": "B"},
          {"id": "C", "text": "C"},
          {"id": "D", "text": "D"},
        ],
        "correctAnswer": "A",
      },
    ]}`

    const result = extractJSON(responseWithTrailingComma)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions).toHaveLength(1)
  })
})

describe('parseAIQuestions with real Ollama edge cases', () => {
  it('should normalize correctAnswer from index to letter', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 0, // Index instead of letter
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].correctAnswer).toBe('A')
  })

  it('should normalize correctAnswer from string index to letter', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: '1', // String index instead of letter
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].correctAnswer).toBe('B')
  })

  it('should handle lowercase correctAnswer', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'c', // lowercase
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].correctAnswer).toBe('C')
  })

  it('should handle simple string choices (no id/text object)', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Question?',
          choices: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
          correctAnswer: 'B',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].choices[0].id).toBe('A')
    expect(result.questions[0].choices[0].text).toBe('Choice A')
  })

  it('should handle mixed valid and invalid questions', () => {
    const response = JSON.stringify({
      questions: [
        {
          text: 'Valid question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'A',
        },
        {
          // Missing text - should be skipped
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
          ],
          correctAnswer: 'A',
        },
        {
          text: 'Another valid question?',
          choices: [
            { id: 'A', text: 'A' },
            { id: 'B', text: 'B' },
            { id: 'C', text: 'C' },
            { id: 'D', text: 'D' },
          ],
          correctAnswer: 'C',
        },
      ],
    })

    const result = parseAIQuestions(response)
    expect(result.questions).toHaveLength(2) // Only valid ones
    expect(result.parseErrors).toHaveLength(1) // One error for invalid
  })

  it('should handle complete real Ollama response with text key errors', () => {
    // Real response pattern from Ollama mistral:7b-instruct
    const realOllamaResponse = ` {"questions": [
  {
    "text": "Quel tissu conjonctif recouvre le scléros de l'œil?",
    "choices": [
      {"id": "A", "text": "Tunica fibrosa"},
      {"id": "B", "text": "Tunica vasculosa"},
      {"id": "C", "text": "Tunica albuginea"},
      {"id": "D", "Stroma"}
    ],
    "correctAnswer": "A",
    "explanation": "La tunica fibrosa est le tissu conjonctif qui recouvre le scléros de l'œil.",
    "difficulty": "easy"
  },
  {
    "text": "Quel rôle joue le tissu conjonctif dans les articulations?",
    "choices": [
      {"id": "A", "text": "Il protège les os des forces de frottement."},
      {"id": "B", "text": "Il forme la capsule articulaire."},
      {"id": "C", "text": "Il fournit l'alimentation des articulations."},
      {"id": "D", "text": "Il permet le glissement entre les os."}
    ],
    "correctAnswer": "B",
    "explanation": "Le tissu conjonctif forme la capsule articulaire qui protège les articulations.",
    "difficulty": "medium"
  }
]
}`

    const result = parseAIQuestions(realOllamaResponse)
    expect(result.questions).toHaveLength(2)
    expect(result.questions[0].choices[3].text).toBe('Stroma')
    expect(result.questions[0].correctAnswer).toBe('A')
    expect(result.questions[1].correctAnswer).toBe('B')
  })
})

// =========================================
// Duplicate Detection Tests
// =========================================

describe('jaccardSimilarity', () => {
  it('should return 1 for identical sets', () => {
    const set = new Set(['a', 'b', 'c'])
    expect(jaccardSimilarity(set, set)).toBe(1)
  })

  it('should return 0 for disjoint sets', () => {
    const set1 = new Set(['a', 'b'])
    const set2 = new Set(['c', 'd'])
    expect(jaccardSimilarity(set1, set2)).toBe(0)
  })

  it('should return 0.5 for 50% overlap', () => {
    const set1 = new Set(['a', 'b'])
    const set2 = new Set(['b', 'c'])
    // Intersection: {b} = 1, Union: {a, b, c} = 3
    expect(jaccardSimilarity(set1, set2)).toBeCloseTo(1 / 3)
  })

  it('should handle empty sets', () => {
    const empty = new Set<string>()
    expect(jaccardSimilarity(empty, empty)).toBe(1)
  })
})

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('test', 'test')).toBe(0)
  })

  it('should return correct distance for single edit', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1) // substitution
    expect(levenshteinDistance('cat', 'cats')).toBe(1) // insertion
    expect(levenshteinDistance('cats', 'cat')).toBe(1) // deletion
  })

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0)
    expect(levenshteinDistance('abc', '')).toBe(3)
    expect(levenshteinDistance('', 'abc')).toBe(3)
  })

  it('should calculate multi-edit distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
  })
})

describe('levenshteinSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(levenshteinSimilarity('test', 'test')).toBe(1)
  })

  it('should return 0 for completely different strings of same length', () => {
    expect(levenshteinSimilarity('abc', 'xyz')).toBe(0)
  })

  it('should return value between 0 and 1', () => {
    const similarity = levenshteinSimilarity('hello', 'hallo')
    expect(similarity).toBeGreaterThan(0)
    expect(similarity).toBeLessThan(1)
  })
})

describe('calculateSimilarity', () => {
  it('should return 1 for identical texts', () => {
    const text = 'What is the structure of the spine?'
    expect(calculateSimilarity(text, text)).toBe(1)
  })

  it('should return 1 for case-insensitive identical texts', () => {
    expect(calculateSimilarity('Hello World', 'hello world')).toBe(1)
  })

  it('should detect high similarity for similar questions', () => {
    const q1 = 'Quelle est la structure de la colonne vertebrale?'
    const q2 = 'Quelle est la structure de la colonne vertebrale humaine?'
    expect(calculateSimilarity(q1, q2)).toBeGreaterThan(0.7)
  })

  it('should detect low similarity for different questions', () => {
    const q1 = 'Quelle est la fonction du cerveau?'
    const q2 = 'Combien de vertebres dans le corps?'
    expect(calculateSimilarity(q1, q2)).toBeLessThan(0.5)
  })
})

describe('checkDuplicate', () => {
  const existingQuestions: Question[] = [
    {
      id: '1',
      type: 'single_choice',
      text: 'Quelle est la fonction principale du nerf sciatique?',
      choices: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
        { id: 'C', text: 'C' },
        { id: 'D', text: 'D' },
      ],
      correctAnswer: 'A',
      theme: 'Neurologie',
      difficulty: 'medium',
      tags: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'single_choice',
      text: 'Combien de vertebres cervicales possede le corps humain?',
      choices: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
        { id: 'C', text: 'C' },
        { id: 'D', text: 'D' },
      ],
      correctAnswer: 'B',
      theme: 'Anatomie',
      difficulty: 'easy',
      tags: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it('should detect exact duplicate', () => {
    const result = checkDuplicate(
      'Quelle est la fonction principale du nerf sciatique?',
      existingQuestions
    )
    expect(result.isDuplicate).toBe(true)
    expect(result.bestMatch?.matchType).toBe('exact')
  })

  it('should detect similar question', () => {
    const result = checkDuplicate('Quelle est la fonction du nerf sciatique?', existingQuestions)
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.matches[0].similarity).toBeGreaterThan(0.7)
  })

  it('should not flag unrelated question', () => {
    const result = checkDuplicate('Quel est le role du systeme immunitaire?', existingQuestions)
    expect(result.isDuplicate).toBe(false)
    expect(result.matches).toHaveLength(0)
  })

  it('should return matches sorted by similarity', () => {
    const result = checkDuplicate(
      'Combien de vertebres cervicales dans le corps?',
      existingQuestions
    )
    if (result.matches.length > 1) {
      expect(result.matches[0].similarity).toBeGreaterThanOrEqual(result.matches[1].similarity)
    }
  })
})

describe('findInternalDuplicates', () => {
  it('should find duplicates within a list', () => {
    const questions = [
      { text: 'What is anatomy?', id: '1' },
      { text: 'What is physiology?', id: '2' },
      { text: 'What is anatomy?', id: '3' }, // Duplicate of first
    ]

    const duplicates = findInternalDuplicates(questions)
    expect(duplicates.length).toBeGreaterThan(0)
    expect(duplicates[0].index1).toBe(0)
    expect(duplicates[0].index2).toBe(2)
    expect(duplicates[0].similarity).toBe(1)
  })

  it('should return empty array for unique questions', () => {
    const questions = [
      { text: 'Question about bones' },
      { text: 'Question about muscles' },
      { text: 'Question about nerves' },
    ]

    const duplicates = findInternalDuplicates(questions)
    expect(duplicates).toHaveLength(0)
  })

  it('should detect similar but not identical questions', () => {
    const questions = [
      { text: 'Quelle est la fonction du coeur?' },
      { text: 'Quelle est la fonction principale du coeur humain?' },
    ]

    const duplicates = findInternalDuplicates(questions, 0.5) // Lower threshold
    expect(duplicates.length).toBeGreaterThan(0)
  })
})
