import type { Question, QuestionBank, QuestionSource } from '@/types'

// Questions de démonstration pour la banque par défaut
const sampleQuestions: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'single_choice',
    text: 'Combien de vertèbres compte la colonne vertébrale humaine?',
    choices: [
      { id: 'A', text: '24 vertèbres' },
      { id: 'B', text: '33 vertèbres' },
      { id: 'C', text: '28 vertèbres' },
      { id: 'D', text: '31 vertèbres' },
    ],
    correctAnswer: 'B',
    explanation:
      'La colonne vertébrale compte 33 vertèbres: 7 cervicales, 12 thoraciques, 5 lombaires, 5 sacrées (fusionnées), et 4 coccygiennes (fusionnées).',
    theme: 'Anatomie',
    subtheme: 'Colonne vertébrale',
    difficulty: 'easy',
    tags: ['anatomie', 'vertèbres', 'base'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle est la fonction principale du système nerveux central?',
    choices: [
      { id: 'A', text: 'Transporter le sang' },
      { id: 'B', text: 'Coordonner les activités du corps' },
      { id: 'C', text: 'Produire des hormones' },
      { id: 'D', text: 'Filtrer les toxines' },
    ],
    correctAnswer: 'B',
    explanation:
      'Le système nerveux central (cerveau et moelle épinière) coordonne et régule toutes les activités du corps.',
    theme: 'Neurologie',
    subtheme: 'Système nerveux central',
    difficulty: 'easy',
    tags: ['neurologie', 'système nerveux', 'base'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: "Quels sont les signes cliniques d'une subluxation vertébrale? (Sélectionnez toutes les réponses correctes)",
    choices: [
      { id: 'A', text: 'Douleur localisée' },
      { id: 'B', text: 'Restriction de mobilité' },
      { id: 'C', text: 'Augmentation de la température cutanée' },
      { id: 'D', text: 'Spasme musculaire' },
    ],
    correctAnswer: ['A', 'B', 'D'],
    explanation:
      "Les signes classiques d'une subluxation incluent la douleur, la restriction de mobilité et les spasmes musculaires. L'augmentation de température n'est pas un signe direct.",
    theme: 'Chiropraxie',
    subtheme: 'Subluxation',
    difficulty: 'medium',
    tags: ['subluxation', 'diagnostic', 'clinique'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Les disques intervertébraux sont vascularisés.',
    correctAnswer: 'false',
    explanation:
      'Les disques intervertébraux sont avasculaires (non vascularisés). Ils se nourrissent par diffusion depuis les plateaux vertébraux.',
    theme: 'Anatomie',
    subtheme: 'Disques intervertébraux',
    difficulty: 'medium',
    tags: ['disques', 'anatomie', 'vascularisation'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: "Quel nerf peut être affecté lors d'une hernie discale L5-S1?",
    choices: [
      { id: 'A', text: 'Nerf fémoral' },
      { id: 'B', text: 'Nerf sciatique' },
      { id: 'C', text: 'Nerf médian' },
      { id: 'D', text: 'Nerf radial' },
    ],
    correctAnswer: 'B',
    explanation:
      'Une hernie discale L5-S1 peut comprimer le nerf sciatique, provoquant une sciatique (douleur irradiant dans la jambe).',
    theme: 'Pathologie',
    subtheme: 'Hernie discale',
    difficulty: 'medium',
    tags: ['hernie', 'nerf sciatique', 'pathologie'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle technique chiropratique utilise un instrument à ressort?',
    choices: [
      { id: 'A', text: 'Diversified' },
      { id: 'B', text: 'Activator' },
      { id: 'C', text: 'Gonstead' },
      { id: 'D', text: 'Thompson' },
    ],
    correctAnswer: 'B',
    explanation:
      'La technique Activator utilise un instrument spécifique à ressort pour délivrer des ajustements précis et à faible force.',
    theme: 'Techniques',
    subtheme: 'Instruments',
    difficulty: 'easy',
    tags: ['techniques', 'activator', 'instruments'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: "Quel est le rôle du ligament longitudinal antérieur?",
    choices: [
      { id: 'A', text: "Limiter l'extension de la colonne" },
      { id: 'B', text: 'Limiter la flexion de la colonne' },
      { id: 'C', text: 'Limiter la rotation de la colonne' },
      { id: 'D', text: 'Stabiliser les disques intervertébraux' },
    ],
    correctAnswer: 'A',
    explanation:
      "Le ligament longitudinal antérieur court le long de la face antérieure des corps vertébraux et limite l'extension (hyperextension) de la colonne.",
    theme: 'Anatomie',
    subtheme: 'Ligaments',
    difficulty: 'medium',
    tags: ['ligaments', 'biomécanique'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'La lordose cervicale est une courbure physiologique normale.',
    correctAnswer: 'true',
    explanation:
      "La lordose cervicale (courbure concave vers l'arrière) est l'une des quatre courbures physiologiques normales de la colonne vertébrale.",
    theme: 'Anatomie',
    subtheme: 'Courbures rachidiennes',
    difficulty: 'easy',
    tags: ['lordose', 'rachis', 'anatomie'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: "Quelle est la principale contre-indication absolue à l'ajustement cervical?",
    choices: [
      { id: 'A', text: 'Hypertension artérielle' },
      { id: 'B', text: 'Fracture récente' },
      { id: 'C', text: 'Arthrose' },
      { id: 'D', text: 'Céphalées de tension' },
    ],
    correctAnswer: 'B',
    explanation:
      "Une fracture récente est une contre-indication absolue à l'ajustement chiropratique car elle pourrait aggraver la lésion.",
    theme: 'Sécurité',
    subtheme: 'Contre-indications',
    difficulty: 'easy',
    tags: ['sécurité', 'contre-indications', 'fracture'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quels sont les composants du trépied de Lovett? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Vertèbre' },
      { id: 'B', text: 'Disque intervertébral' },
      { id: 'C', text: 'Ligaments' },
      { id: 'D', text: 'Muscles paravertébraux' },
    ],
    correctAnswer: ['A', 'B', 'D'],
    explanation:
      "Le trépied de Lovett comprend la vertèbre, le disque et les muscles. Ce concept décrit l'interdépendance de ces trois éléments.",
    theme: 'Chiropraxie',
    subtheme: 'Concepts fondamentaux',
    difficulty: 'hard',
    tags: ['lovett', 'biomécanique', 'théorie'],
    source: 'manual',
  },
]

// Créer la banque par défaut
export function createDefaultQuestionBank(): QuestionBank {
  const now = new Date().toISOString()
  
  const questions: Question[] = sampleQuestions.map(q => ({
    ...q,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }))
  
  // Calculer les métadonnées
  const themes = [...new Set(questions.map(q => q.theme))]
  const sources = questions.reduce(
    (acc, q) => {
      acc[q.source] = (acc[q.source] || 0) + 1
      return acc
    },
    {} as Record<QuestionSource, number>
  )
  
  return {
    id: 'default',
    name: 'Banque de démonstration',
    description:
      "Questions de démonstration couvrant l'anatomie, la neurologie, et les techniques chiropratiques de base.",
    questions,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
    metadata: {
      totalQuestions: questions.length,
      themes,
      sources,
    },
  }
}
