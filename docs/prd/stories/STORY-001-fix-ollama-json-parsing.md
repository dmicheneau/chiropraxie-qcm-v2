# STORY-001: Correction du parsing JSON Ollama pour imports PDF/Image/AI

## Informations générales

| Champ          | Valeur                                                      |
| -------------- | ----------------------------------------------------------- |
| **ID**         | STORY-001                                                   |
| **Titre**      | Correction du parsing JSON Ollama pour imports PDF/Image/AI |
| **Epic**       | Intégration IA (Phase 3)                                    |
| **Priorité**   | **CRITIQUE**                                                |
| **Estimation** | 4-6 heures                                                  |
| **Assigné**    | -                                                           |
| **Créé le**    | 2026-01-28                                                  |
| **Statut**     | À faire                                                     |

---

## Contexte et problème

### Situation actuelle

L'import de questions depuis PDF, images (OCR) et génération IA via Ollama **génère 0 questions** malgré :

- Ollama fonctionnel (mistral:7b-instruct disponible et répond)
- Extraction de texte PDF/OCR réussie
- Détection automatique du thème réussie
- JSON retourné par Ollama syntaxiquement valide

### Cause racine identifiée

Le modèle `mistral:7b-instruct` génère un **format JSON différent** de celui demandé dans le prompt :

**Format demandé par le prompt :**

```json
{
  "questions": [
    {
      "text": "Question?",
      "choices": [{ "id": "A", "text": "Réponse" }],
      "correctAnswer": "A"
    }
  ]
}
```

**Format généré par Ollama :**

```json
{
  "questions": [
    {
      "question": "Question?",
      "answers": [
        { "text": "Réponse", "correct": true },
        { "text": "Autre", "correct": false }
      ]
    }
  ]
}
```

### Double problème

1. **Problème de parsing (RÉSOLU)** : Le parser ne supportait pas le format alternatif (`question`/`answers`). Corrigé dans commits `5b55551` et `3f57ead`.

2. **Problème d'extraction JSON (NON RÉSOLU)** : Le regex d'extraction utilise `*?` (non-greedy) qui **tronque le JSON** quand il y a des arrays imbriqués.

```javascript
// Pattern actuel (parser.ts:40)
/\{"questions"\s*:\s*\[[\s\S]*?\]\s*\}/

// Input:
{"questions": [{"answers": [{"correct": true}]}]}

// Le *? s'arrête au premier ] (celui de "answers")
// Résultat extrait (INVALIDE):
{"questions": [{"answers": [{"correct": true}]
// Manque ]} à la fin
```

### Impact utilisateur

- **Import PDF** : 0 questions générées malgré extraction réussie
- **Import Image (OCR)** : 0 questions générées
- **Génération IA** : 0 questions générées
- **Import Quizlet** : Non affecté (format différent)
- **Import JSON** : Non affecté (pas de génération IA)

**Fonctionnalité majeure non utilisable** : Les utilisateurs ne peuvent pas bénéficier de la génération automatique de questions, qui est une feature différenciante de l'application.

---

## Objectifs

### Objectif principal

Permettre l'import et la génération de questions via Ollama avec un taux de succès > 90%.

### Critères de succès

- [ ] Import PDF génère des questions valides
- [ ] Import Image (OCR) génère des questions valides
- [ ] Génération IA directe fonctionne
- [ ] Support des deux formats JSON (demandé et alternatif)
- [ ] Tous les tests existants passent (57 tests)
- [ ] Nouveaux tests couvrent les cas imbriqués

### Non-objectifs (hors scope)

- Changement de modèle Ollama par défaut
- Amélioration des prompts
- UI/UX de la page d'import

---

## Spécifications techniques

### Architecture impactée

```
src/services/ollama/
├── parser.ts        ← MODIFICATION PRINCIPALE
├── service.ts       ← MODIFICATION MINEURE
├── prompts.ts       ← Pas de modification
└── generator.ts     ← Pas de modification

src/tests/services/
└── ollama.test.ts   ← AJOUT DE TESTS
```

### Détail des modifications

#### 1. parser.ts - Fonction extractJSON()

**Problème** : Le regex `/\{"questions"\s*:\s*\[[\s\S]*?\]\s*\}/` avec `*?` (non-greedy) s'arrête au premier `]` rencontré, tronquant les JSON avec arrays imbriqués.

**Solution** : Remplacer le regex par une fonction de comptage de brackets équilibrés.

```typescript
/**
 * Extract JSON object from text using balanced bracket counting
 * Handles nested arrays correctly (unlike regex)
 */
function extractJSONObject(text: string, startPattern?: string): string | null {
  // Find start position
  let start = -1
  if (startPattern) {
    const patternIndex = text.indexOf(startPattern)
    if (patternIndex !== -1) {
      start = text.lastIndexOf('{', patternIndex)
    }
  }
  if (start === -1) {
    start = text.indexOf('{')
  }
  if (start === -1) return null

  // Count brackets to find matching close
  let depth = 0
  let inString = false
  let escapeNext = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      escapeNext = true
      continue
    }

    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}
```

**Avantages** :

- Gère correctement les arrays imbriqués (`answers` dans `questions`)
- Gère les strings contenant des brackets `{` ou `}`
- Gère les caractères échappés dans les strings
- Plus robuste que les regex pour le JSON

#### 2. service.ts - Ajouter format JSON

**Modification** : Ajouter le paramètre `format: "json"` pour forcer Ollama à retourner du JSON valide.

```typescript
// service.ts:109
body: JSON.stringify({
  model: this.config.model,
  prompt,
  stream: false,
  format: 'json', // AJOUTER CECI
  options: {
    temperature: options.temperature ?? this.config.options.temperature,
    // ...
  },
})
```

**Note** : Cette modification est optionnelle mais recommandée. Certains modèles (comme qwen2.5) respectent mieux ce paramètre.

#### 3. ollama.test.ts - Nouveaux tests

Ajouter des tests pour les cas suivants :

```typescript
describe('extractJSON with nested arrays', () => {
  it('should correctly extract JSON with answers array inside questions array', () => {
    const response = `{"questions": [
      {
        "question": "Test?",
        "answers": [
          {"text": "A", "correct": true},
          {"text": "B", "correct": false}
        ]
      }
    ]}`

    const result = extractJSON(response)
    expect(result).not.toBeNull()
    expect(() => JSON.parse(result!)).not.toThrow()
    const parsed = JSON.parse(result!)
    expect(parsed.questions).toHaveLength(1)
    expect(parsed.questions[0].answers).toHaveLength(2)
  })

  it('should handle multiple levels of nesting', () => {
    const response = `{"questions": [
      {
        "question": "Q1?",
        "answers": [{"text": "A1", "correct": true}]
      },
      {
        "question": "Q2?",
        "answers": [{"text": "A2", "correct": false}]
      }
    ]}`

    const result = extractJSON(response)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions).toHaveLength(2)
  })

  it('should handle strings containing brackets', () => {
    const response = `{"questions": [
      {
        "question": "What is {x} in math?",
        "answers": [{"text": "A variable", "correct": true}]
      }
    ]}`

    const result = extractJSON(response)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.questions[0].question).toContain('{x}')
  })
})
```

---

## Tâches

### TASK-001-1: Refactorer extractJSON() avec comptage de brackets

**Estimation** : 2h | **Priorité** : CRITIQUE

#### Description

Remplacer l'implémentation regex de `extractJSON()` par une fonction de comptage de brackets équilibrés.

#### Sous-tâches

- [ ] Créer la fonction `extractJSONObject()` avec comptage de brackets
- [ ] Gérer les strings (ne pas compter les brackets dans les strings)
- [ ] Gérer les caractères échappés (`\"`, `\\`)
- [ ] Modifier `extractJSON()` pour utiliser la nouvelle fonction
- [ ] Conserver la logique de repair JSON existante
- [ ] Tester manuellement avec des exemples

#### Fichiers

- `src/services/ollama/parser.ts`

#### Critères d'acceptation

- [ ] Les JSON avec arrays imbriqués sont extraits correctement
- [ ] Les strings contenant des brackets sont gérées
- [ ] Les 57 tests existants passent toujours
- [ ] Pas de régression sur les cas simples

---

### TASK-001-2: Ajouter tests pour JSON imbriqués

**Estimation** : 1h | **Priorité** : HIGH

#### Description

Ajouter des tests unitaires couvrant les cas de JSON imbriqués et edge cases.

#### Sous-tâches

- [ ] Test: JSON avec `answers` array dans `questions` array
- [ ] Test: Multiple questions avec arrays imbriqués
- [ ] Test: Strings contenant des brackets `{` et `}`
- [ ] Test: Caractères échappés dans les strings
- [ ] Test: JSON très profondément imbriqué (3+ niveaux)
- [ ] Test: JSON avec texte avant/après

#### Fichiers

- `src/tests/services/ollama.test.ts`

#### Critères d'acceptation

- [ ] Tous les nouveaux tests passent
- [ ] Couverture des edge cases documentés
- [ ] Tests reproductibles et déterministes

---

### TASK-001-3: Ajouter paramètre format JSON à Ollama

**Estimation** : 30min | **Priorité** : MEDIUM

#### Description

Ajouter le paramètre `format: "json"` aux appels Ollama pour améliorer la fiabilité des réponses JSON.

#### Sous-tâches

- [ ] Modifier la méthode `generate()` dans `service.ts`
- [ ] Ajouter option pour activer/désactiver le format JSON
- [ ] Documenter le comportement

#### Fichiers

- `src/services/ollama/service.ts`

#### Critères d'acceptation

- [ ] Les appels Ollama incluent `format: "json"` par défaut
- [ ] Option disponible pour désactiver si nécessaire
- [ ] Pas d'impact sur les appels existants

---

### TASK-001-4: Test d'intégration end-to-end

**Estimation** : 1h | **Priorité** : HIGH

#### Description

Valider le fix avec un test d'intégration complet utilisant Ollama réel.

#### Sous-tâches

- [ ] Démarrer Ollama localement
- [ ] Tester import PDF avec fichier de test
- [ ] Tester génération IA directe
- [ ] Vérifier les logs de parsing
- [ ] Documenter les résultats

#### Prérequis

- Ollama installé et démarré
- Modèle mistral:7b-instruct disponible

#### Critères d'acceptation

- [ ] Import PDF génère > 0 questions
- [ ] Génération IA génère > 0 questions
- [ ] Pas d'erreurs de parsing dans les logs

---

### TASK-001-5: Documentation et cleanup

**Estimation** : 30min | **Priorité** : LOW

#### Description

Mettre à jour la documentation et nettoyer le code.

#### Sous-tâches

- [ ] Ajouter JSDoc sur les nouvelles fonctions
- [ ] Mettre à jour AGENTS.md si nécessaire
- [ ] Retirer les logs de debug excessifs (garder les utiles)
- [ ] Commit final avec message descriptif

#### Fichiers

- `src/services/ollama/parser.ts`
- `src/services/ollama/generator.ts`
- `AGENTS.md` (si applicable)

#### Critères d'acceptation

- [ ] Code documenté avec JSDoc
- [ ] Logs de debug appropriés (pas trop verbeux)
- [ ] Commit propre et descriptif

---

## Risques et mitigations

| Risque                                | Probabilité | Impact | Mitigation                                      |
| ------------------------------------- | ----------- | ------ | ----------------------------------------------- |
| Régression sur cas existants          | Moyenne     | Haut   | Tests exhaustifs, garder les 57 tests existants |
| Performance du comptage vs regex      | Faible      | Faible | JSON typiques < 10KB, impact négligeable        |
| Format Ollama change encore           | Moyenne     | Moyen  | Parser flexible, support multiple formats       |
| Modèle ne respecte pas `format: json` | Moyenne     | Faible | Parser robuste reste la solution principale     |

---

## Dépendances

### Dépendances techniques

- Aucune nouvelle dépendance npm requise
- Ollama doit être installé pour les tests d'intégration

### Dépendances avec autres stories

- Aucune bloquante
- Cette story débloque l'utilisation des imports PDF/Image/AI

---

## Définition of Done

- [ ] Code implémenté et fonctionnel
- [ ] Tous les tests passent (existants + nouveaux)
- [ ] Type-check passe sans erreur
- [ ] Code review effectuée
- [ ] Tests d'intégration validés avec Ollama réel
- [ ] Documentation mise à jour
- [ ] Mergé dans la branche develop

---

## Annexes

### A. Regex problématique actuel

```javascript
// parser.ts:40 - Pattern qui cause le bug
;/\{"questions"\s*:\s*\[[\s\S]*?\]\s*\}/

// [\s\S]*? = match tout caractère (y compris newlines), NON-GREEDY
// Le *? s'arrête au PREMIER ] trouvé, pas au dernier
```

### B. Exemple de réponse Ollama réelle

```json
{
  "questions": [
    {
      "id": 1,
      "question": "Quel est le rôle principal du tissu conjonctif lâche?",
      "answers": [
        { "text": "Il joue un rôle de remplissage", "correct": true },
        { "text": "Il est composé majoritairement de fibres", "correct": false },
        { "text": "Il est constitué de graisse brune", "correct": false },
        { "text": "Il est composé d'un maillage de fibres", "correct": false }
      ]
    }
  ]
}
```

### C. Modèles Ollama recommandés pour JSON

| Modèle              | Taille | Support JSON        | Recommandé   |
| ------------------- | ------ | ------------------- | ------------ |
| qwen2.5:7b          | 4.7GB  | Natif (tag `tools`) | **Oui**      |
| llama3.1:8b         | 4.7GB  | Natif (tag `tools`) | Oui          |
| mistral:7b-instruct | 4.1GB  | Limité              | Non (actuel) |

### D. Logs de debug utiles

```typescript
// Logs à conserver pour debugging
console.log('[Parser] extractJSON called, input length:', text?.length)
console.log('[Parser] JSON extracted, length:', result?.length)
console.log('[Ollama] Parsed questions count:', parsed.questions.length)
console.log('[Ollama] Parse errors:', parsed.parseErrors)
```

---

_Dernière mise à jour: 2026-01-28_
