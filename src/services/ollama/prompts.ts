/**
 * AI Prompts for Question Generation
 * Carefully crafted prompts for generating QCM questions in French
 */

/**
 * Main prompt for generating QCM questions from source text
 */
export function generateQuestionsPrompt(sourceText: string, count: number = 10): string {
  return `Tu es un expert en création de QCM pédagogiques pour des étudiants en chiropraxie.
Génère exactement ${count} questions à choix multiples basées sur le texte fourni.

RÈGLES STRICTES:
1. Chaque question doit avoir exactement 4 choix (A, B, C, D)
2. Une seule bonne réponse par question
3. Les mauvaises réponses doivent être plausibles mais clairement fausses
4. Inclure une explication pédagogique courte (2-3 phrases) pour chaque question
5. Varier les niveaux de difficulté: environ 30% facile, 50% moyen, 20% difficile
6. Questions en français uniquement
7. Retourner UNIQUEMENT du JSON valide, sans texte avant ou après

FORMAT DE SORTIE (JSON strict):
{
  "questions": [
    {
      "text": "Question avec point d'interrogation ?",
      "choices": [
        {"id": "A", "text": "Premier choix"},
        {"id": "B", "text": "Deuxième choix"},
        {"id": "C", "text": "Troisième choix"},
        {"id": "D", "text": "Quatrième choix"}
      ],
      "correctAnswer": "A",
      "explanation": "Explication claire et pédagogique de la bonne réponse.",
      "difficulty": "medium",
      "tags": ["anatomie", "colonne vertébrale"]
    }
  ]
}

TEXTE SOURCE:
${sourceText}

Génère maintenant ${count} questions QCM en JSON:`
}

/**
 * Prompt for generating tags for a question
 */
export function generateTagsPrompt(questionText: string): string {
  return `Analyse cette question de QCM en chiropraxie et suggère 3-5 tags pertinents.

RÈGLES:
- Tags courts (1-3 mots maximum)
- En français
- Spécifiques au domaine médical/chiropraxie
- Utiles pour recherche et filtrage

Question: ${questionText}

Réponse (JSON uniquement, sans autre texte):
{"tags": ["tag1", "tag2", "tag3"]}`
}

/**
 * Prompt for generating explanation for a question
 */
export function generateExplanationPrompt(
  questionText: string,
  correctAnswer: string,
  incorrectAnswers: string[]
): string {
  return `Tu es un professeur expert en chiropraxie.
Génère une explication pédagogique courte (2-3 phrases) pour cette question.

Question: ${questionText}
Bonne réponse: ${correctAnswer}
Mauvaises réponses: ${incorrectAnswers.join(', ')}

L'explication doit:
1. Expliquer clairement pourquoi "${correctAnswer}" est la bonne réponse
2. Mentionner brièvement pourquoi les autres options sont incorrectes
3. Aider l'étudiant à mémoriser le concept

Réponse (JSON uniquement):
{"explanation": "Explication ici"}`
}

/**
 * Prompt for evaluating question quality
 */
export function evaluateQualityPrompt(questionText: string, choices: string[]): string {
  return `Évalue la qualité de cette question de QCM pour des étudiants en chiropraxie.

Question: ${questionText}
Choix: ${choices.join(' | ')}

Analyse les critères suivants (note sur 100 chacun):
1. CLARTÉ: La question est-elle claire et sans ambiguïté ?
2. COHÉRENCE: Les choix sont-ils cohérents avec la question ?
3. PLAUSIBILITÉ: Les mauvaises réponses sont-elles plausibles ?
4. PERTINENCE: La question est-elle pertinente pour des étudiants en chiropraxie ?

Réponse (JSON uniquement):
{
  "score": 85,
  "details": {
    "clarity": 90,
    "coherence": 85,
    "plausibility": 80,
    "relevance": 85
  },
  "issues": ["problème éventuel"],
  "suggestions": ["amélioration suggérée"]
}`
}

/**
 * Prompt for estimating difficulty
 */
export function estimateDifficultyPrompt(questionText: string, correctAnswer: string): string {
  return `Estime la difficulté de cette question de QCM pour un étudiant en chiropraxie.

Question: ${questionText}
Bonne réponse: ${correctAnswer}

Critères:
- "easy": Connaissance de base, premier cycle
- "medium": Connaissance intermédiaire, nécessite compréhension
- "hard": Connaissance avancée, cas clinique complexe

Réponse (JSON uniquement):
{"difficulty": "medium", "reasoning": "Explication courte"}`
}

/**
 * Prompt for detecting theme from source text
 */
export function detectThemePrompt(sourceText: string): string {
  const themes = [
    'Anatomie',
    'Neurologie',
    'Chiropraxie',
    'Techniques',
    'Pathologie',
    'Sécurité',
    'Biomécanique',
    'Examen clinique',
    'Imagerie',
    'Pharmacologie',
  ]

  return `Tu es un expert en chiropraxie. Analyse ce texte et identifie le thème principal parmi la liste ci-dessous.

THÈMES DISPONIBLES:
${themes.map((t, i) => `${i + 1}. ${t}`).join('\n')}

TEXTE À ANALYSER:
${sourceText.slice(0, 2000)}

RÈGLES:
1. Choisis UN SEUL thème de la liste
2. Si le texte couvre plusieurs thèmes, choisis le plus dominant
3. Suggère également un sous-thème spécifique si pertinent
4. Réponse en JSON uniquement

Réponse (JSON uniquement, sans autre texte):
{"theme": "Anatomie", "subtheme": "Colonne vertébrale", "confidence": 85}`
}
