import type { Question, QuestionBank, QuestionSource } from '@/types'

// Questions de démonstration pour la banque par défaut
const sampleQuestions: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ============================================
  // ANATOMIE - Colonne vertébrale
  // ============================================
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
    text: 'Quelle vertèbre est appelée "Atlas"?',
    choices: [
      { id: 'A', text: 'C1' },
      { id: 'B', text: 'C2' },
      { id: 'C', text: 'C7' },
      { id: 'D', text: 'T1' },
    ],
    correctAnswer: 'A',
    explanation:
      'L\'Atlas (C1) est la première vertèbre cervicale. Elle supporte le crâne et permet les mouvements de flexion/extension de la tête.',
    theme: 'Anatomie',
    subtheme: 'Colonne vertébrale',
    difficulty: 'easy',
    tags: ['atlas', 'cervicales', 'C1'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle vertèbre possède le processus odontoïde (dent)?',
    choices: [
      { id: 'A', text: 'C1 (Atlas)' },
      { id: 'B', text: 'C2 (Axis)' },
      { id: 'C', text: 'C3' },
      { id: 'D', text: 'C7' },
    ],
    correctAnswer: 'B',
    explanation:
      'L\'Axis (C2) possède le processus odontoïde qui s\'articule avec l\'Atlas pour permettre la rotation de la tête.',
    theme: 'Anatomie',
    subtheme: 'Colonne vertébrale',
    difficulty: 'easy',
    tags: ['axis', 'cervicales', 'C2', 'odontoïde'],
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
    text: 'Quelle est la structure centrale du disque intervertébral?',
    choices: [
      { id: 'A', text: 'L\'anneau fibreux' },
      { id: 'B', text: 'Le nucleus pulposus' },
      { id: 'C', text: 'Le ligament longitudinal' },
      { id: 'D', text: 'Le plateau vertébral' },
    ],
    correctAnswer: 'B',
    explanation:
      'Le nucleus pulposus est le noyau gélatineux central du disque, entouré par l\'anneau fibreux (annulus fibrosus).',
    theme: 'Anatomie',
    subtheme: 'Disques intervertébraux',
    difficulty: 'easy',
    tags: ['disques', 'nucleus pulposus', 'anatomie'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'La lordose cervicale est une courbure physiologique normale.',
    correctAnswer: 'true',
    explanation:
      'La lordose cervicale (courbure concave vers l\'arrière) est l\'une des quatre courbures physiologiques normales de la colonne vertébrale.',
    theme: 'Anatomie',
    subtheme: 'Courbures rachidiennes',
    difficulty: 'easy',
    tags: ['lordose', 'rachis', 'anatomie'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel est le rôle du ligament longitudinal antérieur?',
    choices: [
      { id: 'A', text: 'Limiter l\'extension de la colonne' },
      { id: 'B', text: 'Limiter la flexion de la colonne' },
      { id: 'C', text: 'Limiter la rotation de la colonne' },
      { id: 'D', text: 'Stabiliser les disques intervertébraux' },
    ],
    correctAnswer: 'A',
    explanation:
      'Le ligament longitudinal antérieur court le long de la face antérieure des corps vertébraux et limite l\'extension (hyperextension) de la colonne.',
    theme: 'Anatomie',
    subtheme: 'Ligaments',
    difficulty: 'medium',
    tags: ['ligaments', 'biomécanique'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Combien de vertèbres cervicales possède l\'être humain?',
    choices: [
      { id: 'A', text: '5' },
      { id: 'B', text: '6' },
      { id: 'C', text: '7' },
      { id: 'D', text: '8' },
    ],
    correctAnswer: 'C',
    explanation:
      'L\'être humain possède 7 vertèbres cervicales (C1 à C7), comme tous les mammifères (même la girafe!).',
    theme: 'Anatomie',
    subtheme: 'Colonne vertébrale',
    difficulty: 'easy',
    tags: ['cervicales', 'vertèbres', 'base'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle vertèbre cervicale est aussi appelée "vertèbre proéminente"?',
    choices: [
      { id: 'A', text: 'C5' },
      { id: 'B', text: 'C6' },
      { id: 'C', text: 'C7' },
      { id: 'D', text: 'T1' },
    ],
    correctAnswer: 'C',
    explanation:
      'C7 est appelée "vertèbre proéminente" car son processus épineux est le premier facilement palpable à la base du cou.',
    theme: 'Anatomie',
    subtheme: 'Colonne vertébrale',
    difficulty: 'medium',
    tags: ['C7', 'palpation', 'repères'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quels sont les composants du foramen intervertébral? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Le nerf spinal' },
      { id: 'B', text: 'Les vaisseaux sanguins' },
      { id: 'C', text: 'Le ligament jaune' },
      { id: 'D', text: 'La moelle épinière' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation:
      'Le foramen intervertébral contient le nerf spinal, les vaisseaux sanguins et le ligament jaune. La moelle épinière passe dans le canal vertébral, pas le foramen.',
    theme: 'Anatomie',
    subtheme: 'Foramen',
    difficulty: 'hard',
    tags: ['foramen', 'nerf spinal', 'anatomie'],
    source: 'manual',
  },

  // ============================================
  // NEUROLOGIE
  // ============================================
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
    type: 'single_choice',
    text: 'Quel nerf peut être affecté lors d\'une hernie discale L5-S1?',
    choices: [
      { id: 'A', text: 'Nerf fémoral' },
      { id: 'B', text: 'Nerf sciatique' },
      { id: 'C', text: 'Nerf médian' },
      { id: 'D', text: 'Nerf radial' },
    ],
    correctAnswer: 'B',
    explanation:
      'Une hernie discale L5-S1 peut comprimer le nerf sciatique, provoquant une sciatique (douleur irradiant dans la jambe).',
    theme: 'Neurologie',
    subtheme: 'Nerfs périphériques',
    difficulty: 'medium',
    tags: ['hernie', 'nerf sciatique', 'pathologie'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Combien de paires de nerfs spinaux l\'être humain possède-t-il?',
    choices: [
      { id: 'A', text: '26 paires' },
      { id: 'B', text: '31 paires' },
      { id: 'C', text: '33 paires' },
      { id: 'D', text: '28 paires' },
    ],
    correctAnswer: 'B',
    explanation:
      'L\'être humain possède 31 paires de nerfs spinaux: 8 cervicaux, 12 thoraciques, 5 lombaires, 5 sacrés et 1 coccygien.',
    theme: 'Neurologie',
    subtheme: 'Nerfs spinaux',
    difficulty: 'medium',
    tags: ['nerfs spinaux', 'anatomie'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Le dermatome C6 correspond au pouce.',
    correctAnswer: 'true',
    explanation:
      'Le dermatome C6 innerve principalement le pouce et la face latérale de l\'avant-bras.',
    theme: 'Neurologie',
    subtheme: 'Dermatomes',
    difficulty: 'medium',
    tags: ['dermatomes', 'C6', 'innervation'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel réflexe teste la racine nerveuse C5-C6?',
    choices: [
      { id: 'A', text: 'Réflexe tricipital' },
      { id: 'B', text: 'Réflexe bicipital' },
      { id: 'C', text: 'Réflexe rotulien' },
      { id: 'D', text: 'Réflexe achilléen' },
    ],
    correctAnswer: 'B',
    explanation:
      'Le réflexe bicipital teste les racines C5-C6. Le réflexe tricipital teste C7, le rotulien L3-L4, et l\'achilléen S1.',
    theme: 'Neurologie',
    subtheme: 'Réflexes',
    difficulty: 'medium',
    tags: ['réflexes', 'examen neurologique', 'C5', 'C6'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel nerf crânien est responsable de l\'innervation du muscle trapèze?',
    choices: [
      { id: 'A', text: 'Nerf vague (X)' },
      { id: 'B', text: 'Nerf accessoire (XI)' },
      { id: 'C', text: 'Nerf hypoglosse (XII)' },
      { id: 'D', text: 'Nerf glossopharyngien (IX)' },
    ],
    correctAnswer: 'B',
    explanation:
      'Le nerf accessoire (XI) innerve les muscles trapèze et sterno-cléido-mastoïdien.',
    theme: 'Neurologie',
    subtheme: 'Nerfs crâniens',
    difficulty: 'hard',
    tags: ['nerfs crâniens', 'trapèze', 'XI'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quels sont les signes d\'une atteinte de la queue de cheval? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Anesthésie en selle' },
      { id: 'B', text: 'Rétention urinaire' },
      { id: 'C', text: 'Faiblesse bilatérale des membres inférieurs' },
      { id: 'D', text: 'Douleur cervicale' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation:
      'Le syndrome de la queue de cheval est une urgence chirurgicale caractérisée par une anesthésie en selle, une rétention urinaire et une faiblesse des membres inférieurs.',
    theme: 'Neurologie',
    subtheme: 'Urgences neurologiques',
    difficulty: 'hard',
    tags: ['queue de cheval', 'urgence', 'drapeaux rouges'],
    source: 'manual',
  },

  // ============================================
  // CHIROPRAXIE - Concepts et subluxation
  // ============================================
  {
    type: 'multiple_choice',
    text: 'Quels sont les signes cliniques d\'une subluxation vertébrale? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Douleur localisée' },
      { id: 'B', text: 'Restriction de mobilité' },
      { id: 'C', text: 'Augmentation de la température cutanée' },
      { id: 'D', text: 'Spasme musculaire' },
    ],
    correctAnswer: ['A', 'B', 'D'],
    explanation:
      'Les signes classiques d\'une subluxation incluent la douleur, la restriction de mobilité et les spasmes musculaires. L\'augmentation de température n\'est pas un signe direct.',
    theme: 'Chiropraxie',
    subtheme: 'Subluxation',
    difficulty: 'medium',
    tags: ['subluxation', 'diagnostic', 'clinique'],
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
      'Le trépied de Lovett comprend la vertèbre, le disque et les muscles. Ce concept décrit l\'interdépendance de ces trois éléments.',
    theme: 'Chiropraxie',
    subtheme: 'Concepts fondamentaux',
    difficulty: 'hard',
    tags: ['lovett', 'biomécanique', 'théorie'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Qui est considéré comme le fondateur de la chiropraxie?',
    choices: [
      { id: 'A', text: 'Andrew Taylor Still' },
      { id: 'B', text: 'Daniel David Palmer' },
      { id: 'C', text: 'Bartlett Joshua Palmer' },
      { id: 'D', text: 'Clarence Gonstead' },
    ],
    correctAnswer: 'B',
    explanation:
      'Daniel David Palmer (D.D. Palmer) a fondé la chiropraxie en 1895 à Davenport, Iowa.',
    theme: 'Chiropraxie',
    subtheme: 'Histoire',
    difficulty: 'easy',
    tags: ['histoire', 'DD Palmer', 'fondateur'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'En quelle année la chiropraxie a-t-elle été fondée?',
    choices: [
      { id: 'A', text: '1874' },
      { id: 'B', text: '1895' },
      { id: 'C', text: '1910' },
      { id: 'D', text: '1920' },
    ],
    correctAnswer: 'B',
    explanation:
      'La chiropraxie a été fondée le 18 septembre 1895 quand D.D. Palmer a effectué le premier ajustement sur Harvey Lillard.',
    theme: 'Chiropraxie',
    subtheme: 'Histoire',
    difficulty: 'easy',
    tags: ['histoire', '1895', 'fondation'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Le premier patient chiropratique était Harvey Lillard.',
    correctAnswer: 'true',
    explanation:
      'Harvey Lillard, un concierge sourd, fut le premier patient de D.D. Palmer en 1895.',
    theme: 'Chiropraxie',
    subtheme: 'Histoire',
    difficulty: 'medium',
    tags: ['histoire', 'Harvey Lillard', 'premier patient'],
    source: 'manual',
  },

  // ============================================
  // TECHNIQUES CHIROPRATIQUES
  // ============================================
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
    text: 'Quelle technique utilise une table avec des "drop pieces"?',
    choices: [
      { id: 'A', text: 'Diversified' },
      { id: 'B', text: 'Activator' },
      { id: 'C', text: 'Thompson' },
      { id: 'D', text: 'Cox Flexion-Distraction' },
    ],
    correctAnswer: 'C',
    explanation:
      'La technique Thompson utilise une table avec des segments à chute (drop pieces) qui facilitent l\'ajustement.',
    theme: 'Techniques',
    subtheme: 'Tables',
    difficulty: 'medium',
    tags: ['Thompson', 'drop', 'tables'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle technique est spécifiquement conçue pour les hernies discales?',
    choices: [
      { id: 'A', text: 'Gonstead' },
      { id: 'B', text: 'Cox Flexion-Distraction' },
      { id: 'C', text: 'Diversified' },
      { id: 'D', text: 'Activator' },
    ],
    correctAnswer: 'B',
    explanation:
      'La technique Cox Flexion-Distraction utilise une table spéciale pour créer une décompression discale, particulièrement indiquée pour les hernies.',
    theme: 'Techniques',
    subtheme: 'Hernies discales',
    difficulty: 'medium',
    tags: ['Cox', 'flexion-distraction', 'hernie'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quelles sont les caractéristiques de la technique Gonstead? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Utilisation de radiographies debout' },
      { id: 'B', text: 'Palpation statique et dynamique' },
      { id: 'C', text: 'Nervoscope pour détection de chaleur' },
      { id: 'D', text: 'Utilisation d\'instruments mécaniques' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation:
      'La technique Gonstead utilise des radiographies debout, la palpation et le nervoscope. Elle n\'utilise pas d\'instruments mécaniques.',
    theme: 'Techniques',
    subtheme: 'Gonstead',
    difficulty: 'hard',
    tags: ['Gonstead', 'radiographies', 'nervoscope'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'La technique Diversified est la technique la plus enseignée dans les écoles de chiropraxie.',
    correctAnswer: 'true',
    explanation:
      'La technique Diversified est effectivement la plus répandue et la plus enseignée, utilisant des ajustements manuels à haute vélocité et basse amplitude (HVLA).',
    theme: 'Techniques',
    subtheme: 'Diversified',
    difficulty: 'easy',
    tags: ['Diversified', 'HVLA', 'enseignement'],
    source: 'manual',
  },

  // ============================================
  // PATHOLOGIE
  // ============================================
  {
    type: 'single_choice',
    text: 'Quel est le niveau le plus fréquent de hernie discale lombaire?',
    choices: [
      { id: 'A', text: 'L2-L3' },
      { id: 'B', text: 'L3-L4' },
      { id: 'C', text: 'L4-L5' },
      { id: 'D', text: 'L5-S1' },
    ],
    correctAnswer: 'D',
    explanation:
      'Le niveau L5-S1 est le plus fréquent pour les hernies discales lombaires, suivi de L4-L5.',
    theme: 'Pathologie',
    subtheme: 'Hernie discale',
    difficulty: 'medium',
    tags: ['hernie', 'lombaire', 'L5-S1'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Qu\'est-ce que la spondylolisthésis?',
    choices: [
      { id: 'A', text: 'Une inflammation des vertèbres' },
      { id: 'B', text: 'Un glissement antérieur d\'une vertèbre sur l\'autre' },
      { id: 'C', text: 'Une fracture du pédicule' },
      { id: 'D', text: 'Une dégénérescence discale' },
    ],
    correctAnswer: 'B',
    explanation:
      'La spondylolisthésis est le glissement antérieur d\'une vertèbre par rapport à la vertèbre sous-jacente, souvent au niveau L5-S1.',
    theme: 'Pathologie',
    subtheme: 'Troubles vertébraux',
    difficulty: 'medium',
    tags: ['spondylolisthésis', 'glissement', 'L5-S1'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel type de scoliose est le plus fréquent?',
    choices: [
      { id: 'A', text: 'Congénitale' },
      { id: 'B', text: 'Neuromusculaire' },
      { id: 'C', text: 'Idiopathique' },
      { id: 'D', text: 'Dégénérative' },
    ],
    correctAnswer: 'C',
    explanation:
      'La scoliose idiopathique représente environ 80% des cas. Elle se développe généralement pendant l\'adolescence sans cause identifiable.',
    theme: 'Pathologie',
    subtheme: 'Déformations rachidiennes',
    difficulty: 'medium',
    tags: ['scoliose', 'idiopathique', 'adolescence'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'L\'arthrose cervicale est aussi appelée cervicarthrose.',
    correctAnswer: 'true',
    explanation:
      'La cervicarthrose est le terme médical pour l\'arthrose cervicale, une dégénérescence des articulations cervicales.',
    theme: 'Pathologie',
    subtheme: 'Arthrose',
    difficulty: 'easy',
    tags: ['arthrose', 'cervicarthrose', 'dégénérescence'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel angle de Cobb définit une scoliose?',
    choices: [
      { id: 'A', text: '> 5°' },
      { id: 'B', text: '> 10°' },
      { id: 'C', text: '> 15°' },
      { id: 'D', text: '> 20°' },
    ],
    correctAnswer: 'B',
    explanation:
      'Une scoliose est définie par un angle de Cobb supérieur à 10°. En dessous, on parle d\'attitude scoliotique.',
    theme: 'Pathologie',
    subtheme: 'Déformations rachidiennes',
    difficulty: 'hard',
    tags: ['scoliose', 'angle de Cobb', 'radiographie'],
    source: 'manual',
  },

  // ============================================
  // SÉCURITÉ ET CONTRE-INDICATIONS
  // ============================================
  {
    type: 'single_choice',
    text: 'Quelle est la principale contre-indication absolue à l\'ajustement cervical?',
    choices: [
      { id: 'A', text: 'Hypertension artérielle' },
      { id: 'B', text: 'Fracture récente' },
      { id: 'C', text: 'Arthrose' },
      { id: 'D', text: 'Céphalées de tension' },
    ],
    correctAnswer: 'B',
    explanation:
      'Une fracture récente est une contre-indication absolue à l\'ajustement chiropratique car elle pourrait aggraver la lésion.',
    theme: 'Sécurité',
    subtheme: 'Contre-indications',
    difficulty: 'easy',
    tags: ['sécurité', 'contre-indications', 'fracture'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quels sont les "drapeaux rouges" nécessitant une référence médicale urgente? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Perte de poids inexpliquée' },
      { id: 'B', text: 'Antécédent de cancer' },
      { id: 'C', text: 'Douleur lombaire matinale' },
      { id: 'D', text: 'Fièvre associée à la douleur' },
    ],
    correctAnswer: ['A', 'B', 'D'],
    explanation:
      'La perte de poids inexpliquée, les antécédents de cancer et la fièvre sont des drapeaux rouges. La douleur matinale seule n\'est pas un drapeau rouge.',
    theme: 'Sécurité',
    subtheme: 'Drapeaux rouges',
    difficulty: 'hard',
    tags: ['drapeaux rouges', 'urgence', 'référence'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'L\'ostéoporose sévère est une contre-indication relative aux manipulations vertébrales.',
    correctAnswer: 'true',
    explanation:
      'L\'ostéoporose sévère est une contre-indication relative. Des techniques douces peuvent être utilisées, mais les manipulations HVLA classiques sont déconseillées.',
    theme: 'Sécurité',
    subtheme: 'Contre-indications',
    difficulty: 'medium',
    tags: ['ostéoporose', 'contre-indication', 'précautions'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel symptôme représente une urgence absolue lors d\'une cervicalgie?',
    choices: [
      { id: 'A', text: 'Douleur irradiant dans le bras' },
      { id: 'B', text: 'Difficulté à avaler avec douleur intense' },
      { id: 'C', text: 'Raideur matinale' },
      { id: 'D', text: 'Craquements lors des mouvements' },
    ],
    correctAnswer: 'B',
    explanation:
      'La dysphagie (difficulté à avaler) associée à une douleur cervicale intense peut indiquer un abcès rétropharyngé, une urgence médicale.',
    theme: 'Sécurité',
    subtheme: 'Urgences',
    difficulty: 'hard',
    tags: ['urgence', 'dysphagie', 'abcès'],
    source: 'manual',
  },

  // ============================================
  // BIOMÉCANIQUE
  // ============================================
  {
    type: 'single_choice',
    text: 'Quel mouvement est principalement permis par l\'articulation atlanto-occipitale?',
    choices: [
      { id: 'A', text: 'Rotation' },
      { id: 'B', text: 'Flexion/Extension' },
      { id: 'C', text: 'Inclinaison latérale' },
      { id: 'D', text: 'Circumduction' },
    ],
    correctAnswer: 'B',
    explanation:
      'L\'articulation atlanto-occipitale (C0-C1) permet principalement la flexion et l\'extension de la tête (mouvement du "oui").',
    theme: 'Biomécanique',
    subtheme: 'Cervicales',
    difficulty: 'medium',
    tags: ['atlanto-occipital', 'flexion', 'extension'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel mouvement est principalement permis par l\'articulation atlanto-axoïdienne?',
    choices: [
      { id: 'A', text: 'Rotation' },
      { id: 'B', text: 'Flexion/Extension' },
      { id: 'C', text: 'Inclinaison latérale' },
      { id: 'D', text: 'Translation' },
    ],
    correctAnswer: 'A',
    explanation:
      'L\'articulation atlanto-axoïdienne (C1-C2) permet principalement la rotation de la tête (mouvement du "non"), environ 50% de la rotation cervicale totale.',
    theme: 'Biomécanique',
    subtheme: 'Cervicales',
    difficulty: 'medium',
    tags: ['atlanto-axoïdien', 'rotation', 'C1-C2'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Le couplage de Fryette stipule que dans le rachis thoraco-lombaire, la rotation et l\'inclinaison latérale se font du même côté.',
    correctAnswer: 'false',
    explanation:
      'Selon la première loi de Fryette (Type I), quand le rachis est en position neutre, la rotation et l\'inclinaison se font du côté opposé. En flexion/extension (Type II), elles se font du même côté.',
    theme: 'Biomécanique',
    subtheme: 'Lois de Fryette',
    difficulty: 'hard',
    tags: ['Fryette', 'couplage', 'rotation'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel est l\'angle normal de lordose lombaire?',
    choices: [
      { id: 'A', text: '20-30°' },
      { id: 'B', text: '40-60°' },
      { id: 'C', text: '70-80°' },
      { id: 'D', text: '10-15°' },
    ],
    correctAnswer: 'B',
    explanation:
      'La lordose lombaire normale est d\'environ 40-60°, mesurée de L1 à S1 sur une radiographie de profil.',
    theme: 'Biomécanique',
    subtheme: 'Courbures',
    difficulty: 'hard',
    tags: ['lordose', 'angle', 'radiographie'],
    source: 'manual',
  },

  // ============================================
  // EXAMEN CLINIQUE
  // ============================================
  {
    type: 'single_choice',
    text: 'Quel test évalue une radiculopathie lombaire?',
    choices: [
      { id: 'A', text: 'Test de Spurling' },
      { id: 'B', text: 'Test de Lasègue' },
      { id: 'C', text: 'Test de Phalen' },
      { id: 'D', text: 'Test de Finkelstein' },
    ],
    correctAnswer: 'B',
    explanation:
      'Le test de Lasègue (straight leg raise) évalue une radiculopathie lombaire, particulièrement L5 et S1.',
    theme: 'Examen clinique',
    subtheme: 'Tests neurologiques',
    difficulty: 'medium',
    tags: ['Lasègue', 'radiculopathie', 'lombaire'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel test évalue une radiculopathie cervicale?',
    choices: [
      { id: 'A', text: 'Test de Spurling' },
      { id: 'B', text: 'Test de Lasègue' },
      { id: 'C', text: 'Test de Patrick' },
      { id: 'D', text: 'Test de Gaenslen' },
    ],
    correctAnswer: 'A',
    explanation:
      'Le test de Spurling (compression foraminale) évalue une radiculopathie cervicale par compression du foramen intervertébral.',
    theme: 'Examen clinique',
    subtheme: 'Tests neurologiques',
    difficulty: 'medium',
    tags: ['Spurling', 'radiculopathie', 'cervicale'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quel test évalue l\'articulation sacro-iliaque?',
    choices: [
      { id: 'A', text: 'Test de Spurling' },
      { id: 'B', text: 'Test de Lasègue' },
      { id: 'C', text: 'Test de Gaenslen' },
      { id: 'D', text: 'Test de Phalen' },
    ],
    correctAnswer: 'C',
    explanation:
      'Le test de Gaenslen stresse l\'articulation sacro-iliaque en hyperextendant une hanche tout en fléchissant l\'autre.',
    theme: 'Examen clinique',
    subtheme: 'Tests articulaires',
    difficulty: 'medium',
    tags: ['Gaenslen', 'sacro-iliaque', 'SI'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quels tests évaluent l\'articulation sacro-iliaque? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Test de Gaenslen' },
      { id: 'B', text: 'Test de Patrick (FABER)' },
      { id: 'C', text: 'Test de compression pelvienne' },
      { id: 'D', text: 'Test de Spurling' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation:
      'Gaenslen, Patrick (FABER) et la compression pelvienne évaluent tous la sacro-iliaque. Spurling évalue le rachis cervical.',
    theme: 'Examen clinique',
    subtheme: 'Tests articulaires',
    difficulty: 'hard',
    tags: ['sacro-iliaque', 'FABER', 'tests'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Le signe de Babinski positif est normal chez l\'adulte.',
    correctAnswer: 'false',
    explanation:
      'Un signe de Babinski positif (extension du gros orteil) chez l\'adulte indique une lésion du faisceau pyramidal. Il est normal uniquement chez le nourrisson.',
    theme: 'Examen clinique',
    subtheme: 'Tests neurologiques',
    difficulty: 'medium',
    tags: ['Babinski', 'pyramidal', 'neurologie'],
    source: 'manual',
  },

  // ============================================
  // IMAGERIE
  // ============================================
  {
    type: 'single_choice',
    text: 'Quelle incidence radiographique est utilisée pour évaluer une instabilité cervicale?',
    choices: [
      { id: 'A', text: 'Incidence de face' },
      { id: 'B', text: 'Incidence de profil' },
      { id: 'C', text: 'Incidences dynamiques en flexion/extension' },
      { id: 'D', text: 'Incidence oblique' },
    ],
    correctAnswer: 'C',
    explanation:
      'Les radiographies dynamiques en flexion et extension permettent d\'évaluer une instabilité ligamentaire cervicale.',
    theme: 'Imagerie',
    subtheme: 'Radiographie',
    difficulty: 'hard',
    tags: ['radiographie', 'dynamique', 'instabilité'],
    source: 'manual',
  },
  {
    type: 'single_choice',
    text: 'Quelle imagerie est la plus sensible pour détecter une hernie discale?',
    choices: [
      { id: 'A', text: 'Radiographie standard' },
      { id: 'B', text: 'Scanner (CT)' },
      { id: 'C', text: 'IRM' },
      { id: 'D', text: 'Échographie' },
    ],
    correctAnswer: 'C',
    explanation:
      'L\'IRM est l\'examen de choix pour visualiser les tissus mous, incluant les disques intervertébraux et les hernies.',
    theme: 'Imagerie',
    subtheme: 'IRM',
    difficulty: 'easy',
    tags: ['IRM', 'hernie', 'imagerie'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'La radiographie standard permet de visualiser les disques intervertébraux.',
    correctAnswer: 'false',
    explanation:
      'Les disques intervertébraux ne sont pas visibles sur une radiographie standard car ils sont radio-transparents. On peut seulement évaluer l\'espace intervertébral.',
    theme: 'Imagerie',
    subtheme: 'Radiographie',
    difficulty: 'easy',
    tags: ['radiographie', 'disques', 'limites'],
    source: 'manual',
  },

  // ============================================
  // PHARMACOLOGIE (à connaître)
  // ============================================
  {
    type: 'single_choice',
    text: 'Quelle classe médicamenteuse est contre-indiquée chez un patient sous anticoagulants?',
    choices: [
      { id: 'A', text: 'Paracétamol' },
      { id: 'B', text: 'AINS (Anti-inflammatoires non stéroïdiens)' },
      { id: 'C', text: 'Myorelaxants' },
      { id: 'D', text: 'Antidépresseurs' },
    ],
    correctAnswer: 'B',
    explanation:
      'Les AINS augmentent le risque de saignement chez les patients sous anticoagulants et sont donc contre-indiqués.',
    theme: 'Pharmacologie',
    subtheme: 'Interactions',
    difficulty: 'medium',
    tags: ['AINS', 'anticoagulants', 'interactions'],
    source: 'manual',
  },

  // ============================================
  // PÉDIATRIE
  // ============================================
  {
    type: 'single_choice',
    text: 'À quel âge la lordose lombaire se développe-t-elle chez l\'enfant?',
    choices: [
      { id: 'A', text: 'À la naissance' },
      { id: 'B', text: 'Vers 6 mois (position assise)' },
      { id: 'C', text: 'Vers 12-18 mois (marche)' },
      { id: 'D', text: 'Vers 5 ans' },
    ],
    correctAnswer: 'C',
    explanation:
      'La lordose lombaire se développe lorsque l\'enfant commence à marcher (12-18 mois), pour compenser le poids du tronc.',
    theme: 'Pédiatrie',
    subtheme: 'Développement',
    difficulty: 'medium',
    tags: ['lordose', 'développement', 'enfant'],
    source: 'manual',
  },
  {
    type: 'true_false',
    text: 'Le réflexe de Moro disparaît normalement vers 4-6 mois.',
    correctAnswer: 'true',
    explanation:
      'Le réflexe de Moro (réflexe de sursaut) est présent à la naissance et disparaît normalement entre 4 et 6 mois.',
    theme: 'Pédiatrie',
    subtheme: 'Réflexes primitifs',
    difficulty: 'medium',
    tags: ['Moro', 'réflexes', 'nourrisson'],
    source: 'manual',
  },

  // ============================================
  // ERGONOMIE ET PRÉVENTION
  // ============================================
  {
    type: 'single_choice',
    text: 'Quelle est la position idéale de l\'écran d\'ordinateur?',
    choices: [
      { id: 'A', text: 'Au-dessus du niveau des yeux' },
      { id: 'B', text: 'Au niveau des yeux ou légèrement en dessous' },
      { id: 'C', text: 'À 20 cm des yeux' },
      { id: 'D', text: 'À 45° sur le côté' },
    ],
    correctAnswer: 'B',
    explanation:
      'L\'écran doit être au niveau des yeux ou légèrement en dessous, à une distance d\'environ 50-70 cm, pour minimiser la tension cervicale.',
    theme: 'Ergonomie',
    subtheme: 'Poste de travail',
    difficulty: 'easy',
    tags: ['ergonomie', 'écran', 'prévention'],
    source: 'manual',
  },
  {
    type: 'multiple_choice',
    text: 'Quelles sont les recommandations pour soulever une charge? (Sélectionnez toutes les réponses correctes)',
    choices: [
      { id: 'A', text: 'Garder la charge près du corps' },
      { id: 'B', text: 'Plier les genoux, pas le dos' },
      { id: 'C', text: 'Éviter les torsions du tronc' },
      { id: 'D', text: 'Soulever rapidement pour limiter l\'effort' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation:
      'Les bonnes pratiques incluent: charge près du corps, flexion des genoux, éviter les torsions. Soulever lentement et de manière contrôlée, pas rapidement.',
    theme: 'Ergonomie',
    subtheme: 'Manutention',
    difficulty: 'easy',
    tags: ['manutention', 'prévention', 'dos'],
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
      'Questions couvrant l\'anatomie, la neurologie, les techniques chiropratiques, la pathologie, la sécurité et la biomécanique.',
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
