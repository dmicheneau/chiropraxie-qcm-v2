# 06 - UI/UX Spécifications

## Vue d'ensemble

Chiropraxie QCM V2 propose une interface moderne, ludique et personnalisable. L'utilisateur peut choisir parmi **10 thèmes visuels prédéfinis**, chacun avec sa propre palette de couleurs et son ambiance.

---

## 10 Thèmes Prédéfinis

### 1. Toulouse (Thème par défaut)

**Ambiance** : Professionnelle et chaleureuse, aux couleurs de la ville de Toulouse

```css
:root[data-theme="toulouse"] {
  /* Primaire - Rouge toulousain */
  --color-primary: #E4003A;
  --color-primary-light: #FF4466;
  --color-primary-dark: #B30030;
  
  /* Secondaire - Violet */
  --color-secondary: #6B2E8C;
  --color-secondary-light: #8B4BAC;
  --color-secondary-dark: #4B1E6C;
  
  /* Accent - Or */
  --color-accent: #D4AF37;
  
  /* Neutrals */
  --color-base-100: #F5F3F0;
  --color-base-200: #E8E4DF;
  --color-base-300: #D1CBC4;
  --color-base-content: #2A2623;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

---

### 2. Nocturne

**Ambiance** : Dark élégant, bleu nuit avec touches argentées

```css
:root[data-theme="nocturne"] {
  /* Primaire - Bleu nuit */
  --color-primary: #1E40AF;
  --color-primary-light: #3B82F6;
  --color-primary-dark: #1E3A8A;
  
  /* Secondaire - Argent */
  --color-secondary: #94A3B8;
  --color-secondary-light: #CBD5E1;
  --color-secondary-dark: #64748B;
  
  /* Accent - Cyan */
  --color-accent: #06B6D4;
  
  /* Neutrals - Dark */
  --color-base-100: #0F172A;
  --color-base-200: #1E293B;
  --color-base-300: #334155;
  --color-base-content: #F1F5F9;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

---

### 3. Clown

**Ambiance** : Coloré et ludique, multicolore vif

```css
:root[data-theme="clown"] {
  /* Primaire - Rouge vif */
  --color-primary: #EF4444;
  --color-primary-light: #F87171;
  --color-primary-dark: #DC2626;
  
  /* Secondaire - Jaune */
  --color-secondary: #FBBF24;
  --color-secondary-light: #FCD34D;
  --color-secondary-dark: #F59E0B;
  
  /* Accent - Vert lime */
  --color-accent: #84CC16;
  
  /* Neutrals */
  --color-base-100: #FFFBEB;
  --color-base-200: #FEF3C7;
  --color-base-300: #FDE68A;
  --color-base-content: #78350F;
  
  /* Sémantiques */
  --color-success: #22C55E;
  --color-warning: #FB923C;
  --color-error: #DC2626;
  --color-info: #3B82F6;
}
```

---

### 4. Azure

**Ambiance** : Bleu professionnel, style Microsoft

```css
:root[data-theme="azure"] {
  /* Primaire - Bleu Azure */
  --color-primary: #0078D4;
  --color-primary-light: #2B88D8;
  --color-primary-dark: #005A9E;
  
  /* Secondaire - Gris bleuté */
  --color-secondary: #69AFE5;
  --color-secondary-light: #91C5F0;
  --color-secondary-dark: #4E93C9;
  
  /* Accent - Orange */
  --color-accent: #F7630C;
  
  /* Neutrals */
  --color-base-100: #FFFFFF;
  --color-base-200: #F3F2F1;
  --color-base-300: #EDEBE9;
  --color-base-content: #323130;
  
  /* Sémantiques */
  --color-success: #107C10;
  --color-warning: #F7630C;
  --color-error: #D13438;
  --color-info: #0078D4;
}
```

---

### 5. Forest

**Ambiance** : Vert nature, apaisant

```css
:root[data-theme="forest"] {
  /* Primaire - Vert forêt */
  --color-primary: #047857;
  --color-primary-light: #059669;
  --color-primary-dark: #065F46;
  
  /* Secondaire - Vert clair */
  --color-secondary: #34D399;
  --color-secondary-light: #6EE7B7;
  --color-secondary-dark: #10B981;
  
  /* Accent - Terre */
  --color-accent: #92400E;
  
  /* Neutrals */
  --color-base-100: #F0FDF4;
  --color-base-200: #DCFCE7;
  --color-base-300: #BBF7D0;
  --color-base-content: #14532D;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #FBBF24;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

---

### 6. Sunset

**Ambiance** : Orange et rose, coucher de soleil

```css
:root[data-theme="sunset"] {
  /* Primaire - Orange */
  --color-primary: #F97316;
  --color-primary-light: #FB923C;
  --color-primary-dark: #EA580C;
  
  /* Secondaire - Rose */
  --color-secondary: #EC4899;
  --color-secondary-light: #F472B6;
  --color-secondary-dark: #DB2777;
  
  /* Accent - Violet */
  --color-accent: #A855F7;
  
  /* Neutrals */
  --color-base-100: #FFF7ED;
  --color-base-200: #FFEDD5;
  --color-base-300: #FED7AA;
  --color-base-content: #7C2D12;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #FBBF24;
  --color-error: #DC2626;
  --color-info: #3B82F6;
}
```

---

### 7. Ocean

**Ambiance** : Bleu turquoise, frais

```css
:root[data-theme="ocean"] {
  /* Primaire - Turquoise */
  --color-primary: #0891B2;
  --color-primary-light: #06B6D4;
  --color-primary-dark: #0E7490;
  
  /* Secondaire - Bleu clair */
  --color-secondary: #38BDF8;
  --color-secondary-light: #7DD3FC;
  --color-secondary-dark: #0284C7;
  
  /* Accent - Corail */
  --color-accent: #F472B6;
  
  /* Neutrals */
  --color-base-100: #ECFEFF;
  --color-base-200: #CFFAFE;
  --color-base-300: #A5F3FC;
  --color-base-content: #164E63;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #FBBF24;
  --color-error: #EF4444;
  --color-info: #06B6D4;
}
```

---

### 8. Medical

**Ambiance** : Blanc et bleu clair, propre et médical

```css
:root[data-theme="medical"] {
  /* Primaire - Bleu médical */
  --color-primary: #2563EB;
  --color-primary-light: #3B82F6;
  --color-primary-dark: #1D4ED8;
  
  /* Secondaire - Gris bleu */
  --color-secondary: #94A3B8;
  --color-secondary-light: #CBD5E1;
  --color-secondary-dark: #64748B;
  
  /* Accent - Vert médical */
  --color-accent: #10B981;
  
  /* Neutrals */
  --color-base-100: #FFFFFF;
  --color-base-200: #F8FAFC;
  --color-base-300: #F1F5F9;
  --color-base-content: #1E293B;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

---

### 9. Lavande

**Ambiance** : Violet doux, zen

```css
:root[data-theme="lavande"] {
  /* Primaire - Lavande */
  --color-primary: #8B5CF6;
  --color-primary-light: #A78BFA;
  --color-primary-dark: #7C3AED;
  
  /* Secondaire - Rose pâle */
  --color-secondary: #F0ABFC;
  --color-secondary-light: #F5D0FE;
  --color-secondary-dark: #E879F9;
  
  /* Accent - Jaune doux */
  --color-accent: #FCD34D;
  
  /* Neutrals */
  --color-base-100: #FAF5FF;
  --color-base-200: #F3E8FF;
  --color-base-300: #E9D5FF;
  --color-base-content: #581C87;
  
  /* Sémantiques */
  --color-success: #10B981;
  --color-warning: #FBBF24;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

---

### 10. Cupcake

**Ambiance** : Rose pastel, fun

```css
:root[data-theme="cupcake"] {
  /* Primaire - Rose cupcake */
  --color-primary: #F472B6;
  --color-primary-light: #F9A8D4;
  --color-primary-dark: #EC4899;
  
  /* Secondaire - Bleu pastel */
  --color-secondary: #93C5FD;
  --color-secondary-light: #BFDBFE;
  --color-secondary-dark: #60A5FA;
  
  /* Accent - Vert menthe */
  --color-accent: #6EE7B7;
  
  /* Neutrals */
  --color-base-100: #FDF2F8;
  --color-base-200: #FCE7F3;
  --color-base-300: #FBCFE8;
  --color-base-content: #831843;
  
  /* Sémantiques */
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --color-info: #60A5FA;
}
```

---

## Design System

### Typographie

```css
/* Famille de polices */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', 'Monaco', monospace;

/* Tailles */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Poids */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espacements

```css
/* Échelle d'espacement (Tailwind) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Bordures

```css
--border-radius-sm: 0.25rem;  /* 4px */
--border-radius-md: 0.5rem;   /* 8px */
--border-radius-lg: 1rem;     /* 16px */
--border-radius-full: 9999px;

--border-width: 1px;
--border-width-2: 2px;
--border-width-4: 4px;
```

### Ombres

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## Composants UI

### Button

```tsx
// Variantes
<Button variant="primary">Démarrer</Button>
<Button variant="secondary">Annuler</Button>
<Button variant="outline">Paramètres</Button>
<Button variant="ghost">Aide</Button>

// Tailles
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>

// États
<Button disabled>Désactivé</Button>
<Button loading>Chargement...</Button>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu de la carte
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Modal

```tsx
<Modal isOpen={isOpen} onClose={handleClose}>
  <ModalHeader>Titre du modal</ModalHeader>
  <ModalBody>
    Contenu du modal
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Fermer</Button>
  </ModalFooter>
</Modal>
```

### Badge

```tsx
<Badge variant="success">Correct</Badge>
<Badge variant="error">Incorrect</Badge>
<Badge variant="warning">À réviser</Badge>
<Badge variant="info">Nouveau</Badge>
```

---

## Navigation

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  [Logo] Chiropraxie QCM            🔥 7 jours   [⚙️ Thème]  │
└─────────────────────────────────────────────────────────────┘
│                                                              │
│  Sidebar (Desktop) / Bottom Nav (Mobile)                    │
│  [🏠 Accueil] [📝 Quiz] [📊 Stats] [📥 Import] [⚙️ Params]  │
│                                                              │
│  Main Content                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │                                                          ││
│  │                    Page Content                          ││
│  │                                                          ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Accueil** | `/` | Dashboard, streak, "À réviser" |
| **Quiz** | `/quiz` | Configuration et jeu |
| **Résultats** | `/quiz/results/:id` | Score et détails |
| **Statistiques** | `/stats` | Graphiques et progression |
| **Import** | `/import` | Onglets Quizlet/PDF/Image/JSON |
| **Paramètres** | `/settings` | Thème, préférences, export |

---

## Responsive Design

### Breakpoints

```css
/* Mobile first */
--breakpoint-sm: 640px;   /* Tablette portrait */
--breakpoint-md: 768px;   /* Tablette paysage */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Layout adaptatif

| Écran | Navigation | Sidebar | Cards |
|-------|-----------|---------|-------|
| Mobile (< 640px) | Bottom nav | Hidden | 1 colonne |
| Tablette (640-1024px) | Bottom nav | Hidden | 2 colonnes |
| Desktop (> 1024px) | Sidebar fixe | Visible | 3 colonnes |

---

## Animations

### Transitions

```css
/* Durées standard */
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;

/* Easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Exemples

```tsx
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Contenu
</motion.div>

// Slide in
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  Contenu
</motion.div>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Cliquez
</motion.button>
```

---

## Accessibilité (A11y)

### Checklist

- [ ] Contraste > 4.5:1 pour texte normal
- [ ] Contraste > 3:1 pour texte large
- [ ] Navigation clavier complète (Tab, Enter, Esc)
- [ ] ARIA labels sur boutons icônes
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Textes alternatifs sur images
- [ ] Tailles cliquables > 44x44px (mobile)
- [ ] Pas d'animations automatiques > 5s
- [ ] Mode réduit mouvement supporté

```css
/* Respecter les préférences utilisateur */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Wireframes ASCII

### Page Accueil

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Chiropraxie QCM              🔥 7 jours   [Thème ▼] │
├─────────────────────────────────────────────────────────────┤
│  [🏠]  [📝]  [📊]  [📥]  [⚙️]                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Bonjour ! 👋                                                │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  Streak actuel     │  │  À réviser         │            │
│  │  🔥 7 jours        │  │  📚 15 questions   │            │
│  │  Record: 12        │  │  [Réviser]         │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  Démarrer un quiz                         │               │
│  │                                           │               │
│  │  Thème: [Tous les thèmes ▼]              │               │
│  │  Nombre: [20 questions ▼]                │               │
│  │  Difficulté: [Toutes ▼]                  │               │
│  │                                           │               │
│  │              [ Commencer ]                │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  Derniers résultats                                          │
│  ┌──────────────────────────────────────────┐               │
│  │  18/20 - Anatomie - Il y a 2h   🟢 90%   │               │
│  │  15/20 - Neurologie - Hier      🟡 75%   │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Page Quiz

```
┌─────────────────────────────────────────────────────────────┐
│  Question 5/20                           ⏱️ 02:35    [Pause] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quel est le nombre de vertèbres cervicales chez l'homme ?  │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  A. 5 vertèbres                           │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  B. 7 vertèbres                  ✓        │  (sélectionné)
│  └──────────────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  C. 10 vertèbres                          │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │  D. 12 vertèbres                          │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│                                                              │
│                    [ Valider la réponse ]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Page Résultats

```
┌─────────────────────────────────────────────────────────────┐
│  Quiz terminé ! 🎉                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│           ┌────────────────────┐                            │
│           │      18 / 20       │                            │
│           │       90%          │                            │
│           │    🟢 Excellent    │                            │
│           └────────────────────┘                            │
│                                                              │
│  Détails par question:                                       │
│  ┌──────────────────────────────────────────┐               │
│  │  ✅ Question 1 - Anatomie                │               │
│  │  ✅ Question 2 - Neurologie              │               │
│  │  ❌ Question 3 - Biomécanique            │               │
│  │  ✅ Question 4 - Anatomie                │               │
│  │  ...                                     │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  [ Revoir les erreurs ]  [ Nouveau quiz ]  [ Retour ]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

*Précédent: [05 - Intégrations](05-integrations.md)*  
*Suivant: [07 - Risques & Mitigations](07-risques-mitigations.md)*
