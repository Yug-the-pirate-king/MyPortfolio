# UX Portfolio Design System & Guidelines

This document defines the design system and implementation guidelines for the modern UX portfolio.

## Typography

**Primary Font:** IBM Plex Sans (Google Fonts)

| Weight | Value |
|--------|-------|
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| Semi-Bold | 600 |
| Bold | 700 |

- **Fallback stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace:** `"SF Mono", Monaco, "Cascadia Code", monospace`

**Responsive Type Scale**

| Element | Mobile (≤768px) | Desktop (>768px) |
|---------|-----------------|------------------|
| Title | 36px | 56px |
| Subtitle | 14px | 18px |
| H1 | 32px | 48px |
| H2 | 24px | 32px |
| H3 | 20px | 24px |
| Body | 12px | 16px |

```css
/* Mobile (≤768px) */
--font-size-title: 2.25rem;   /* 36px */
--font-size-subtitle: 0.875rem; /* 14px */
--font-size-h1: 2rem;         /* 32px */
--font-size-h2: 1.5rem;       /* 24px */
--font-size-h3: 1.25rem;      /* 20px */
--font-size-body: 0.75rem;    /* 12px */

/* Desktop (>768px) */
--font-size-title: 3.5rem;    /* 56px */
--font-size-subtitle: 1.125rem; /* 18px */
--font-size-h1: 3rem;         /* 48px */
--font-size-h2: 2rem;         /* 32px */
--font-size-h3: 1.5rem;       /* 24px */
--font-size-body: 1rem;       /* 16px */
```

## Color Palette

**Primary Colors**

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#0f0f0f` | Headings, primary surfaces |
| Secondary | `#525252` | Secondary text, muted elements |
| Tertiary | `#737373` | Placeholder, disabled states |

**Accent Colors (Temperature-Based Theming)**

| Theme | Accent | Hex |
|-------|--------|-----|
| Light | Cool blue | `#15B5FF` |
| Dark | Warm orange | `#ea580c` |

**Theming Rationale**

Cool accents are used in light mode because blue provides strong chromatic contrast against warm white backgrounds. Its shorter wavelength creates visual recession, reducing eye strain on bright screens and conveying trust, clarity, and professionalism.

Warm accents are used in dark mode because orange creates vibrant contrast against cool dark backgrounds without harsh glare. Longer wavelengths feel more comfortable in low-light environments and add approachable energy that balances dark mode's serious tone.

This temperature inversion ensures:
- Consistent perceptual impact across themes.
- Reduced eye fatigue through balanced wavelength distribution.
- Clear visual hierarchy that adapts to ambient lighting.
- Semantic reinforcement: cool for clarity/focus, warm for energy/emphasis.

**Neutral Scale**

| Token | Hex |
|-------|-----|
| White | `#ffffff` |
| Neutral 50 | `#fafafa` |
| Neutral 100 | `#f5f5f5` |
| Neutral 200 | `#e5e5e5` |
| Neutral 300 | `#d4d4d4` |
| Neutral 400 | `#a3a3a3` |
| Neutral 500 | `#737373` |
| Neutral 600 | `#525252` |
| Neutral 700 | `#404040` |
| Neutral 800 | `#262626` |
| Neutral 900 | `#171717` |

## Layout & Spacing

**Container**

| Property | Value |
|----------|-------|
| Max-width | 1200px |
| Width | 100% |
| Desktop padding | 120px 60px |
| Mobile padding | 80px 24px |

**Modular Spacing Scale**

| Token | Value | CSS Variable |
|-------|-------|--------------|
| xs | 4px | `--spacing-xs` |
| sm | 8px | `--spacing-sm` |
| md | 16px | `--spacing-md` |
| lg | 24px | `--spacing-lg` |
| xl | 48px | `--spacing-xl` |
| xxl | 80px | `--spacing-xxl` |

Utility classes follow the pattern: `.m-{size}`, `.p-{size}`, `.mt-{size}`, `.px-{size}`, etc.

**Grid System**

- CSS Grid utilities: `.grid`, `.grid-cols-{n}`, `.col-span-{n}`
- Responsive breakpoints: 768px (tablet), 1024px (desktop)
- Gap utilities: `.gap-1` (4px) through `.gap-16` (64px)

## Interactive Elements & Effects

**Glassmorphism Language**

| Element | Treatment |
|---------|-----------|
| Buttons | Semi-transparent background with backdrop blur |
| Cards | Subtle transparency with layered shadows |
| Theme toggle | Circular glass button with blur |
| Dark mode | No visible borders for a cleaner aesthetic |

**Transitions & Animations**

```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--transition-slow: 500ms ease;
--transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

> Prefer animating only `transform` and `opacity` for GPU efficiency. Avoid animating `width`, `height`, `top`, `left`, or `backdrop-filter`.

**Hover States**

| Class | Effect |
|-------|--------|
| `.hover-lift` | `translateY(-2px)` with enhanced shadow |
| `.hover-scale` | `scale(1.02)` |
| `.hover-fade` | `opacity(0.8)` |

## Theme System

**Light Mode**

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Text | `#1a1a1a` |
| Accent | `#15B5FF` |

**Dark Mode**

| Property | Value |
|----------|-------|
| Background | `#0a0a0a` |
| Text | `#e0e0e0` |
| Accent | `#ea580c` |

**Theme Toggle**

- 48 × 48 px circular button, fixed top-right position.
- Icons: 🌙 for light mode, ☀️ for dark mode.
- Glass effect with `backdrop-filter: blur()`.
- Respects `prefers-reduced-motion`.

## Component Library

**Buttons**

```css
.btn-primary {
  /* Dark glass with white text in light mode */
  /* Light glass in dark mode */
  border-radius: 50px;
  padding: 16px 32px;
}

.btn-secondary {
  /* Light glass with dark text in light mode */
  /* Subtle glass in dark mode */
  border-radius: 50px;
  padding: 16px 32px;
}
```

**Cards**

```css
.card {
  /* Standard glass card */
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.glass-card {
  /* Enhanced glass card with stronger blur */
  border-radius: 20px;
  backdrop-filter: blur(20px);
}

.interactive-card {
  /* Glass card with hover-lift */
  border-radius: 20px;
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
```

**Interactive Text**

```css
.link-underline {
  color: var(--color-accent);
  background-image: linear-gradient(currentColor, currentColor);
  background-position: 0% 100%;
  background-repeat: no-repeat;
  background-size: 0% 2px;
  transition: background-size var(--transition-base);
}

.link-underline:hover {
  background-size: 100% 2px;
}
```

## Portfolio Construction Guidelines

**Page Structure**

1. Header with glass navigation.
2. Hero section with large typography.
3. Project showcase grid.
4. About section.
5. Contact / footer.

**Project Cards**

- Use `.glass-card` with `.hover-lift`.
- Include thumbnail, title, and description.
- Maintain consistent spacing and alignment.
- Responsive grid: 1 column on mobile → 2-3 columns on desktop.

**Navigation**

- Fixed or sticky header with glass effect.
- Theme toggle in top-right corner.
- Smooth scroll to sections.
- Active state indicators using the theme accent color.

**Performance Considerations**

- Use `backdrop-filter` sparingly and on small regions; apply `contain: paint layout` where possible.
- Animate only `transform` and `opacity`.
- Avoid `will-change` unless profiling shows a need; remove it after the animation.
- Lazy load project images with `loading="lazy"` and responsive `srcset`.
- Defer non-critical JavaScript.
- Maintain WCAG contrast ratios in both themes.

**Content Guidelines**

- Use sentence case for body text and labels.
- Maintain a consistent voice and tone.
- Structure case studies with problem → process → solution → outcome.
- Showcase a diverse range of project types and skills.

## Implementation Notes

- Provide `-webkit-` fallbacks for `backdrop-filter` and other non-standard properties.
- Use a mobile-first responsive approach.
- Write semantic HTML for accessibility and SEO.
- Test glass effects over varied backgrounds.
- Verify color contrast in both themes.
- Honor `prefers-reduced-motion` by disabling non-essential animations.

## File Organization

```
/assets/
  /css/                      # Modular CSS architecture
    main.css                 # Entry point and imports
    _variables.css           # CSS custom properties and tokens
    _base.css                # Reset and base styles
    _navigation.css          # Header and navigation
    _hero.css                # Hero section
    _particles.css           # Particle system
    _components.css          # Reusable components
    _carousels.css           # Carousel implementations
    _sections.css            # Page sections
    _project-pages.css       # Case study layouts
    _charts.css              # Data visualizations
    _utilities.css           # Utility classes and responsive overrides (load last)
  /js/                       # Interactive features
    main.js                  # Core functionality
    particles.js             # Particle system
    theme.js                 # Theme switching
  /images/                   # Image assets
/data/
  projects.json              # Project data
/work/                       # Case study pages
  design-system.html
  product-suite.html
  ai-strategy.html
  research-strategy.html
/.claude/                    # Claude Code configuration
  /commands/                 # Slash commands
  settings.local.json
index.html                   # Main portfolio page
lab.html                     # Interactive experiments
resume.html                  # Resume page
CLAUDE.md                    # This file — AI context
README.md                    # Public documentation
```

## Technical Architecture

### Modular CSS System

Styles are split into CSS modules imported into `main.css` in dependency order:

| Order | Module | Responsibility |
|-------|--------|----------------|
| 1 | `_variables.css` | Design tokens: colors, typography, spacing, container width |
| 2 | `_base.css` | Reset, foundational styles, text selection |
| 3 | `_navigation.css` | Header, menu, theme toggle |
| 4 | `_hero.css` | Hero section and back-to-top button |
| 5 | `_particles.css` | Particle system and controls |
| 6 | `_components.css` | Reusable UI components: buttons, cards |
| 7 | `_carousels.css` | Carousel implementations |
| 8 | `_sections.css` | Page sections: projects, about, brands, contact |
| 9 | `_project-pages.css` | Case study layouts |
| 10 | `_charts.css` | Data visualizations |
| 11 | `_utilities.css` | Helper classes, dark mode, responsive overrides |

`_utilities.css` must load last so helper classes can override component styles.

### Cache Busting Strategy

Version CSS and JavaScript assets with query parameters to control browser caching:

```html
<link rel="stylesheet" href="assets/css/main.css?v=1760841100">
<script src="assets/js/main.js?v=1760840700" defer></script>
```

Update version numbers after each CSS or JS change to force browsers to fetch the latest files.

### Container Strategy

The container token centers content and prevents it from stretching too wide on large displays.

```css
:root {
  --container-max-width: 1200px;
}
```

- Applied to hero content, navigation, and page sections.
- Content remains fluid until it reaches 1200px, then centers with whitespace on the sides.
- Rationale: maintains readability and prevents "tiny elements spread out" on 4K+ displays.

### Known Limitations & Best Practices

**Viewport Scaling on Large Displays**

CSS cannot replicate browser zoom when using `vh` units. Using `transform: scale()` or the non-standard `zoom` property with `vh`-based layouts will break because:

- Browser zoom recalculates viewport dimensions **before** layout.
- CSS scaling happens **after** layout, when viewport units have already been computed.
- Result: misaligned or broken `vh`-based elements.

**Recommended Approaches for Large Displays**

1. ✅ Use max-width containers to prevent excessive spread.
2. ✅ Add targeted media queries to increase specific sizes at 2K/4K breakpoints.
3. ✅ Let users apply browser zoom themselves.
4. ❌ Avoid `transform: scale()` or `zoom` with `vh` layouts.

**Future Considerations**

If elements feel too small on ultra-high-resolution displays:

- Increase `--container-max-width` to 1400-1600px.
- Add media queries for larger base font sizes at 2560px+ breakpoints.
- Adjust specific component sizes (navigation, buttons) via targeted media queries.

### Development Workflow

Slash commands available in `.claude/commands/`:

| Command | Action |
|---------|--------|
| `/quick-commit` | Commit changes on the current branch |
| `/deploy` | Commit, merge to main, and push both branches |
| `/status` | Show git status and recent commits |

This design system provides a comprehensive foundation for building a modern, professional UX portfolio with sophisticated glassmorphism effects and adaptive temperature-based theming.