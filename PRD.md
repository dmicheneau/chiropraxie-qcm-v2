# Product Requirements Document - Chiropraxie QCM V2

## Vue d'ensemble

Ce document décrit les exigences produit pour **Chiropraxie QCM V2**, une application web PWA de quiz pour la révision en chiropraxie. Il s'agit d'une réécriture complète de l'application Python V1, avec une architecture moderne offline-first et intégration d'IA locale.

---

## Table des matières

1. [Vision & Objectifs](docs/prd/01-vision-objectifs.md)
   - Vision produit
   - Objectifs V2 vs V1
   - Contraintes (budget zéro, offline-first)
   - Justification non-migration

2. [Architecture Technique](docs/prd/02-architecture-technique.md)
   - Diagramme architecture
   - Stack technologique
   - Modèle de données TypeScript
   - Choix Ollama

3. [Phases d'Implémentation](docs/prd/03-phases-implementation.md)
   - Phase 0: Setup (1 semaine)
   - Phase 1: MVP Core (3-4 semaines)
   - Phase 2: Import Quizlet (2-3 semaines)
   - Phase 3: IA Ollama (3-4 semaines)
   - Phase 4: Imports avancés (2-3 semaines)
   - Phase 5: Gamification (2-3 semaines)
   - Phase 6: Polissage (2 semaines)

4. [Workflow d'Analyse](docs/prd/04-workflow-analyse.md)
   - Pipeline Import → Analyse → Enrichissement → Validation
   - Détection doublons
   - Tags automatiques
   - Métriques qualité

5. [Intégrations](docs/prd/05-integrations.md)
   - Ollama (IA locale)
   - Import Quizlet (copy-paste)
   - Import PDF/Images
   - Export/Import JSON

6. [UI/UX Spécifications](docs/prd/06-ui-ux-specs.md)
   - 10 thèmes prédéfinis
   - Design system
   - Navigation
   - Responsive design

7. [Risques & Mitigations](docs/prd/07-risques-mitigations.md)
   - Tableau des risques
   - Plans de mitigation
   - Critères d'acceptance

8. [Annexes](docs/prd/08-annexes.md)
   - Exemples code TypeScript
   - Exemples prompts Ollama
   - Formats JSON
   - Glossaire

---

## Résumé exécutif

### Contexte

L'application V1 est un serveur Python local avec frontend HTML basique. Elle fonctionne mais présente des limitations :
- Installation Python requise
- Pas de persistence de progression
- Pas d'import automatisé
- Interface datée

### Vision V2

Créer une **PWA moderne offline-first** qui :
- Fonctionne sans installation (navigateur web)
- Utilise l'IA locale (Ollama) pour générer des questions
- Propose un workflow intelligent d'analyse des données importées
- Offre une interface ludique avec 10 thèmes visuels
- Fonctionne 100% offline (pas de backend cloud)

### Décisions clés

| Aspect | Décision |
|--------|----------|
| **Backend** | Aucun (100% client-side) |
| **IA** | Ollama local (mistral:7b-instruct) |
| **Authentification** | Mode anonyme uniquement |
| **Import Quizlet** | Copy-paste (scraping bloqué) |
| **Gamification** | Streaks uniquement |
| **Thèmes UI** | 10 prédéfinis (Toulouse, nocturne, etc.) |
| **Migration V1** | Non - workflow différent |
| **Langue** | Français uniquement |

### Timeline

```
Phase 0: Setup              ████░░░░░░░░░░░░░░░░░░░░  1 sem    (5%)
Phase 1: MVP Core           ████████████░░░░░░░░░░░░  3-4 sem  (25%)
Phase 2: Import Quizlet     ████████░░░░░░░░░░░░░░░░  2-3 sem  (15%)
Phase 3: IA + Analyse       ████████████░░░░░░░░░░░░  3-4 sem  (25%)
Phase 4: Imports avancés    ████████░░░░░░░░░░░░░░░░  2-3 sem  (15%)
Phase 5: Gamification       ████████░░░░░░░░░░░░░░░░  2-3 sem  (10%)
Phase 6: Polissage          ████░░░░░░░░░░░░░░░░░░░░  2 sem    (5%)
────────────────────────────────────────────────────────────────
Total estimé: 14-18 semaines (3.5-4.5 mois)
```

### Milestones

| Milestone | Phase | Livrable |
|-----------|-------|----------|
| **M1** | Fin Phase 1 | MVP utilisable offline |
| **M2** | Fin Phase 2 | Import Quizlet fonctionnel |
| **M3** | Fin Phase 3 | IA + analyse qualité opérationnels |
| **M4** | Fin Phase 5 | Feature complete |
| **M5** | Fin Phase 6 | Production ready |

---

## Navigation rapide

### Par rôle

**Développeur:**
- [Architecture Technique](docs/prd/02-architecture-technique.md)
- [Annexes (code)](docs/prd/08-annexes.md)

**Product Owner:**
- [Vision & Objectifs](docs/prd/01-vision-objectifs.md)
- [Phases d'Implémentation](docs/prd/03-phases-implementation.md)

**Designer:**
- [UI/UX Spécifications](docs/prd/06-ui-ux-specs.md)

**QA:**
- [Risques & Mitigations](docs/prd/07-risques-mitigations.md)

### Par fonctionnalité

| Fonctionnalité | Document |
|---------------|----------|
| Quiz | [03-phases-implementation.md](docs/prd/03-phases-implementation.md#phase-1-mvp-core) |
| Import | [05-integrations.md](docs/prd/05-integrations.md) |
| IA | [05-integrations.md](docs/prd/05-integrations.md#ollama-ia-locale) |
| Thèmes | [06-ui-ux-specs.md](docs/prd/06-ui-ux-specs.md#thèmes-prédéfinis) |
| Workflow analyse | [04-workflow-analyse.md](docs/prd/04-workflow-analyse.md) |

---

## Documents liés

- **AGENTS.md** - Guidelines pour agents IA
- **brainstorming-session-2026-01-12.md** - Session de brainstorming initiale

---

*Dernière mise à jour: 2026-01-23*  
*Version: 1.0*  
*Statut: Planification complète*
