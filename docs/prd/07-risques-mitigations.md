# 07 - Risques & Mitigations

## Tableau des risques

| # | Risque | Probabilité | Impact | Sévérité | Mitigation |
|---|--------|-------------|--------|----------|------------|
| **R1** | Ollama non installé par utilisateur | **Haute** (60%) | Moyen | 🟡 **Moyen** | Mode dégradé, documentation claire, détection + message |
| **R2** | Qualité réponses IA médiocre | Moyenne (40%) | **Haut** | 🔴 **Haut** | Prompts itératifs, validation humaine obligatoire |
| **R3** | Formats Quizlet variés non supportés | Moyenne (30%) | Moyen | 🟡 **Moyen** | Tests avec 20+ sets réels, parser robuste |
| **R4** | OCR français imprécis | Moyenne (40%) | Moyen | 🟡 **Moyen** | Prétraitement images, édition manuelle, message avertissement |
| **R5** | Performance génération IA lente | Moyenne (50%) | Faible | 🟢 **Faible** | Indicateur progression, streaming, suggestions alternatives |
| **R6** | Bundle size trop gros (> 500KB) | Faible (20%) | Moyen | 🟡 **Moyen** | Lazy loading, tree-shaking, audit régulier |
| **R7** | Détection doublons faux positifs | Moyenne (30%) | Moyen | 🟡 **Moyen** | Seuil ajustable (80%), validation humaine |
| **R8** | IndexedDB corruption | Faible (10%) | **Haut** | 🟡 **Moyen** | Export JSON régulier, migration automatique, backup |
| **R9** | Cross-browser incompatibilités | Faible (15%) | Moyen | 🟢 **Faible** | Tests Chrome/Firefox/Safari, polyfills, progressive enhancement |
| **R10** | Scope creep UI | **Haute** (70%) | Moyen | 🟡 **Moyen** | MVP strict, backlog Phase 7, discipline |

---

## Détails et plans de mitigation

### R1: Ollama non installé

**Probabilité**: Haute (60% des utilisateurs)  
**Impact**: Moyen (fonctionnalités IA indisponibles)  
**Sévérité**: 🟡 Moyen

**Scénarios**:
1. Utilisateur ne sait pas qu'Ollama est requis
2. Installation trop complexe
3. Ollama démarré mais modèle non téléchargé
4. Port 11434 déjà utilisé

**Mitigation**:

```typescript
// Détection au démarrage
async function checkOllamaSetup(): Promise<OllamaStatus> {
  const health = await ollamaService.isAvailable()
  
  if (!health) {
    return { 
      available: false, 
      issue: 'not_running',
      message: 'Ollama n\'est pas démarré. Démarrez-le avec: ollama serve'
    }
  }
  
  const hasModel = await ollamaService.hasModel('mistral:7b-instruct')
  
  if (!hasModel) {
    return {
      available: false,
      issue: 'model_missing',
      message: 'Modèle manquant. Installez-le avec: ollama pull mistral:7b-instruct'
    }
  }
  
  return { available: true }
}

// Documentation in-app
<OllamaSetupGuide 
  platform={detectPlatform()}
  model="mistral:7b-instruct"
/>

// Mode dégradé gracieux
if (!ollamaAvailable) {
  return (
    <Alert variant="info">
      <AlertIcon />
      <AlertTitle>Mode limité</AlertTitle>
      <AlertDescription>
        Certaines fonctionnalités IA sont indisponibles.
        L'import Quizlet et la détection de doublons restent fonctionnels.
        <Link to="/settings/ollama">Configurer Ollama</Link>
      </AlertDescription>
    </Alert>
  )
}
```

---

### R2: Qualité réponses IA médiocre

**Probabilité**: Moyenne (40%)  
**Impact**: Haut (questions incorrectes dans la banque)  
**Sévérité**: 🔴 Haut

**Scénarios**:
1. IA génère des questions hors sujet
2. Mauvaises réponses marquées comme correctes
3. Choix non plausibles
4. Explications incorrectes

**Mitigation**:

```typescript
// Validation en plusieurs étapes
async function generateWithValidation(text: string): Promise<Question[]> {
  // 1. Génération
  const questions = await generateQuestionsWithAI(text)
  
  // 2. Analyse qualité automatique
  for (const question of questions) {
    const quality = analyzeQuestionQuality(question)
    question.metadata = { qualityScore: quality.score }
    
    // Flag automatique si score < 50
    if (quality.score < 50) {
      question.metadata.flagged = true
      question.metadata.flagReason = quality.issues.join(', ')
    }
  }
  
  // 3. Validation humaine obligatoire
  return questions // Toujours prévisualiser avant ajout
}

// Feedback utilisateur
<QuestionPreview question={question}>
  <QualityScore score={question.metadata.qualityScore} />
  {question.metadata.flagged && (
    <Alert variant="warning">
      ⚠️ Vérifiez cette question: {question.metadata.flagReason}
    </Alert>
  )}
  <Button onClick={handleRegenerate}>Régénérer</Button>
  <Button onClick={handleEdit}>Éditer</Button>
</QuestionPreview>

// Prompts itératifs (amélioration continue)
const PROMPT_VERSION = 'v3'
// Historique des versions dans git
// v1: initial
// v2: ajout contrainte "plausibles mais clairement fausses"
// v3: ajout exemples de bonnes questions
```

---

### R3: Formats Quizlet variés

**Probabilité**: Moyenne (30%)  
**Impact**: Moyen (import échoue ou partiel)  
**Sévérité**: 🟡 Moyen

**Scénarios**:
1. Format export Quizlet change
2. Contenu copié depuis l'interface (pas export)
3. Séparateurs non standards

**Mitigation**:

```typescript
// Parser multi-format avec fallbacks
function parseQuizletContent(text: string): ParseResult {
  const parsers = [
    parseTabFormat,      // Confiance 95%
    parsePipeFormat,     // Confiance 90%
    parseNumberedFormat, // Confiance 85%
    parseNewlineFormat   // Confiance 70%
  ]
  
  for (const parser of parsers) {
    const result = parser(text)
    if (result.cards.length > 0) {
      return result
    }
  }
  
  // Échec: guider l'utilisateur
  return {
    cards: [],
    format: 'unknown',
    confidence: 0,
    warnings: [
      'Format non reconnu.',
      'Assurez-vous de copier depuis l\'export Quizlet.',
      'Formats supportés: Tab, Pipe, Numéroté, Double newline'
    ]
  }
}

// Tests avec sets réels
describe('Quizlet parser', () => {
  it('parses official export format', () => {
    const input = readFixture('quizlet-official.txt')
    expect(parseQuizletContent(input).cards.length).toBeGreaterThan(0)
  })
  
  it('parses user copy-paste', () => {
    const input = readFixture('quizlet-copypaste.txt')
    expect(parseQuizletContent(input).cards.length).toBeGreaterThan(0)
  })
  
  // ... 20+ fixtures de sets réels
})
```

---

### R4: OCR français imprécis

**Probabilité**: Moyenne (40%)  
**Impact**: Moyen (texte extrait nécessite correction)  
**Sévérité**: 🟡 Moyen

**Scénarios**:
1. Photo floue ou mal éclairée
2. Écriture manuscrite
3. Accents mal reconnus
4. Mise en page complexe

**Mitigation**:

```typescript
// Prétraitement image
async function enhanceImageForOCR(file: File): Promise<Blob> {
  // Contraste, luminosité, rotation, seuillage
  return preprocessImage(file)
}

// Avertissement utilisateur
<Alert variant="info">
  💡 Pour de meilleurs résultats:
  • Photo bien éclairée
  • Texte net et lisible
  • Éviter l'écriture manuscrite
</Alert>

// Édition obligatoire après OCR
<OCRResult text={ocrText} confidence={confidence}>
  {confidence < 80 && (
    <Alert variant="warning">
      Confiance OCR: {confidence}%
      Vérifiez le texte avant de continuer.
    </Alert>
  )}
  <TextArea 
    value={editableText}
    onChange={handleEdit}
    placeholder="Éditez le texte extrait si nécessaire"
  />
</OCRResult>

// Alternative: import PDF plutôt qu'image scannée
<ImportTabs>
  <Tab label="Image (OCR)">Photo/Scan</Tab>
  <Tab label="PDF" recommended>
    Meilleure qualité si vous avez le PDF
  </Tab>
</ImportTabs>
```

---

### R5: Performance génération IA lente

**Probabilité**: Moyenne (50%)  
**Impact**: Faible (expérience utilisateur dégradée)  
**Sévérité**: 🟢 Faible

**Scénarios**:
1. Hardware modeste (CPU uniquement)
2. Modèle lourd (mistral:7b)
3. Génération de nombreuses questions

**Mitigation**:

```typescript
// Indicateur de progression
<GenerationProgress
  current={currentQuestion}
  total={totalQuestions}
  estimatedTime={estimatedTime}
/>

// Streaming pour feedback immédiat
async function generateWithStreaming(text: string) {
  setGenerating(true)
  
  for await (const chunk of ollamaService.generateStream(prompt)) {
    setPartialResponse(prev => prev + chunk)
  }
  
  setGenerating(false)
}

// Suggestions de modèles alternatifs
if (averageGenerationTime > 30000) { // > 30s
  showNotification({
    type: 'info',
    message: 'Génération lente détectée',
    action: {
      label: 'Essayer un modèle plus léger',
      onClick: () => navigate('/settings/ollama')
    }
  })
}

// Batch optimisé (générer toutes les questions en 1 appel)
const prompt = `Génère exactement ${count} questions...`
// Au lieu de count appels séparés
```

---

### R8: IndexedDB corruption

**Probabilité**: Faible (10%)  
**Impact**: Haut (perte de données)  
**Sévérité**: 🟡 Moyen

**Scénarios**:
1. Fermeture brutale du navigateur
2. Migration de schéma échouée
3. Quota dépassé
4. Bug dans Dexie.js

**Mitigation**:

```typescript
// Export automatique périodique
useEffect(() => {
  const interval = setInterval(() => {
    const lastExport = localStorage.getItem('last_export')
    const daysSinceExport = lastExport 
      ? (Date.now() - parseInt(lastExport)) / (1000 * 60 * 60 * 24)
      : 999
    
    if (daysSinceExport > 7) {
      showNotification({
        type: 'warning',
        message: 'Pensez à exporter vos données',
        action: {
          label: 'Exporter maintenant',
          onClick: handleExport
        }
      })
    }
  }, 1000 * 60 * 60) // Vérifier toutes les heures
  
  return () => clearInterval(interval)
}, [])

// Gestion d'erreurs Dexie
db.on('versionchange', () => {
  db.close()
  alert('La base de données doit être mise à jour. Rechargez la page.')
})

db.on('blocked', () => {
  alert('Fermez les autres onglets de l\'application.')
})

// Migration avec rollback
db.version(2).stores({
  questions: 'id, theme, subtheme, difficulty, source, createdAt',
  banks: 'id, name, isDefault, createdAt',
  // ... nouveaux schémas
}).upgrade(async tx => {
  try {
    // Migrer les données
    const oldQuestions = await tx.table('questions').toArray()
    // ... transformation
    await tx.table('questions').bulkPut(newQuestions)
  } catch (error) {
    console.error('Migration failed', error)
    // Rollback manuel si nécessaire
  }
})
```

---

## Critères d'acceptance

### Phase 1: MVP Core

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| Quiz fonctionne offline | Désactiver réseau, jouer un quiz | 100% fonctionnel |
| Score calculé correctement | Tests unitaires | 100% précis |
| Progression persiste | Refresh page, vérifier données | 100% conservé |
| Thèmes s'affichent | Tester 10 thèmes | Tous visibles |
| Tests passent | `bun test` | > 80% coverage |
| Lint propre | `bun lint` | 0 erreur |

### Phase 2: Import Quizlet

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| Import 100 flashcards | Copier set réel, importer | < 30s |
| Parsing correct | Tests avec 20+ fixtures | 100% détecté |
| 0 perte de données | Comparer input/output | 100% conservé |
| Questions jouables | Jouer quiz importé | Fonctionne |

### Phase 3: IA + Analyse

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| Génération IA fonctionne | Générer 10 questions | Succès si Ollama up |
| Doublons détectés | Importer set avec doublons | > 90% détection |
| Mode dégradé | Tester sans Ollama | Message clair affiché |
| Génération < 2min | Générer 10 questions | < 120s (CPU) |

### Phase 4: Imports avancés

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| PDF < 20 pages | Importer PDF test | < 30s |
| OCR image | Importer photo nette | < 10s |
| Export JSON | Exporter et réimporter | 0 perte |
| Import JSON valide | Importer export valide | 100% succès |

### Phase 5: Gamification

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| Streak correct | Jouer 3 jours consécutifs | Compteur = 3 |
| SM-2 conforme | Tests unitaires algorithme | 100% spec |
| Questions dues | Attendre délai SM-2 | Apparaissent au bon jour |

### Phase 6: Polissage

| Critère | Méthode de test | Seuil |
|---------|-----------------|-------|
| Lighthouse Performance | `lighthouse` | > 90 |
| Lighthouse PWA | `lighthouse` | > 90 |
| Bundle size | Vite build | < 500KB gzip |
| E2E tests | Playwright | 100% pass |
| Cross-browser | Tests manuels | Chrome/Firefox/Safari OK |
| PWA installable | Test mobile + desktop | Fonctionne |

---

## Plans B (alternatives)

### Si Ollama trop complexe pour utilisateurs

**Plan B1**: Proposer API OpenAI en option (coût utilisateur)

```typescript
interface AIConfig {
  provider: 'ollama' | 'openai'
  ollamaEndpoint?: string
  openaiApiKey?: string
}

// Adapter selon le provider
class AIService {
  async generate(prompt: string): Promise<string> {
    if (this.config.provider === 'ollama') {
      return ollamaService.generate(prompt)
    } else {
      return openaiService.generate(prompt, this.config.openaiApiKey)
    }
  }
}
```

**Plan B2**: Marketplace de questions communautaires (Phase 7)

---

### Si détection doublons insuffisante

**Plan B**: Recherche fulltext + clustering manuel

```typescript
// Recherche par mots-clés
function searchSimilarQuestions(query: string): Question[] {
  const keywords = extractKeywords(query)
  return db.questions
    .where('text')
    .startsWithAnyOfIgnoreCase(keywords)
    .toArray()
}

// Clustering manuel par l'utilisateur
<DuplicateManager>
  <QuestionCluster>
    <Question id="1" text="..." />
    <Question id="2" text="..." similar />
    <Button onClick={() => merge([1, 2])}>Fusionner</Button>
  </QuestionCluster>
</DuplicateManager>
```

---

### Si performance IndexedDB insuffisante

**Plan B**: Migration vers SQLite WASM (sql.js)

```typescript
import initSqlJs from 'sql.js'

const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
})

const db = new SQL.Database()
db.run(`
  CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    text TEXT,
    theme TEXT,
    ...
  )
`)

// API similaire à Dexie
```

---

## Checklist pré-déploiement

### Technique

- [ ] Tous les tests passent (`bun test`)
- [ ] Lint clean (`bun lint`)
- [ ] Type-check OK (`bun type-check`)
- [ ] Build production réussit (`bun build`)
- [ ] Bundle size < 500KB gzip
- [ ] Lighthouse > 90 partout
- [ ] Tests E2E passent à 100%
- [ ] Service Worker fonctionne offline
- [ ] Manifest PWA valide
- [ ] Icônes 192x192 et 512x512 présentes

### Fonctionnel

- [ ] Quiz jouable de bout en bout
- [ ] Import Quizlet fonctionne
- [ ] IA génère des questions (si Ollama up)
- [ ] Détection doublons opérationnelle
- [ ] Import PDF fonctionne
- [ ] Import images (OCR) fonctionne
- [ ] Export/Import JSON sans perte
- [ ] Streaks calculent correctement
- [ ] SM-2 conforme
- [ ] 10 thèmes s'affichent
- [ ] Mode dégradé sans Ollama

### UX

- [ ] Navigation intuitive
- [ ] Feedback visuel sur toutes les actions
- [ ] Messages d'erreur clairs
- [ ] Temps de chargement < 3s
- [ ] Animations fluides (60fps)
- [ ] Responsive mobile/tablet/desktop
- [ ] Accessibilité (Tab navigation, ARIA)
- [ ] Aucune faute de frappe

### Documentation

- [ ] README à jour
- [ ] Guide installation Ollama in-app
- [ ] AGENTS.md complet
- [ ] PRD finalisé
- [ ] CHANGELOG.md créé

---

*Précédent: [06 - UI/UX Spécifications](06-ui-ux-specs.md)*  
*Suivant: [08 - Annexes](08-annexes.md)*
