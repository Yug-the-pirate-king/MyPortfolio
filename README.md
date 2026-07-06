# Yug Shah — Personal Portfolio

A modern, interactive personal portfolio built with vanilla HTML, CSS, and JavaScript. Features a stunning aurora background system, dynamic particle effects, smooth animations, and a fully modular JavaScript architecture.

## 🚀 Live Demo

[View Portfolio](https://shahyug.netlify.app/)

---

## ✨ Features

- **Aurora Background System** — GPU-rendered canvas aurora (`florida-aurora.js`) with colour shifts
- **Particle Canvas** — Interactive floating-particle layer (`particle-system.js`)
- **Custom Cursor** — Magnetic cursor that snaps to interactive elements
- **Text Theater** — Animated typewriter / reveal effects for headings
- **Dark / Light Theme** — Persisted via `localStorage`, applied before paint to prevent flash
- **Animated Stats Counter** — Numbers count up when scrolled into view via `IntersectionObserver`
- **Skills Ticker** — Three infinite-scroll rows of skill badges (forward / reverse)
- **Holographic Shimmer Cards** — `.holo-shimmer` hover effect on skill & certification cards
- **Certifications Grid** — Terminal-styled cards for Harvard CS50, Oracle, freeCodeCamp, Microsoft
- **About Carousel** — Data-driven card carousel loaded from `data/about-carousel.json`
- **Mobile Menu** — Full-screen overlay nav with hamburger toggle
- **SEO Ready** — Open Graph and Twitter Card meta tags included
- **Responsive Design** — Mobile-first layout across all breakpoints

---

## 📁 Project Structure

```
MyPortfolio/
├── index.html                      # Main portfolio page
├── resume.html                     # Interactive resume page
├── favicon.ico
├── server.py                       # Simple local dev server
│
├── assets/
│   ├── css/
│   │   └── main.css                # Root CSS (imports all partials)
│   ├── js/
│   │   ├── core/
│   │   │   ├── config.js           # Global config & constants
│   │   │   ├── data-loader.js      # Fetches JSON data files
│   │   │   └── theme-system.js     # Dark/light theme logic
│   │   ├── utils/
│   │   │   ├── helpers.js          # Shared utility functions
│   │   │   ├── animations.js       # Scroll-triggered animations
│   │   │   └── image-preloader.js  # Image preloading util
│   │   ├── components/
│   │   │   ├── navigation.js       # Sticky nav scroll logic
│   │   │   ├── mobile-menu.js      # Hamburger / overlay menu
│   │   │   ├── logo-animation.js   # SVG logo reveal
│   │   │   ├── carousel-base.js    # Base carousel class
│   │   │   ├── carousel-about.js   # About section carousel
│   │   │   ├── carousel-project.js # Project carousel
│   │   │   └── carousel-featured.js# Featured work carousel
│   │   ├── content/
│   │   │   ├── project-renderer.js # Renders projects from JSON
│   │   │   ├── carousel-renderer.js# Renders carousel cards from JSON
│   │   │   ├── brand-renderer.js   # Renders brand/logos section
│   │   │   ├── resume-renderer.js  # Populates resume.html from JSON
│   │   │   └── case-study-renderer.js # Case study page renderer
│   │   ├── florida-aurora.js       # Canvas aurora background system
│   │   ├── particle-system.js      # Canvas particle effects
│   │   ├── custom-cursor.js        # Magnetic custom cursor
│   │   ├── text-theater.js         # Typewriter / text animations
│   │   ├── magnetic.js             # Magnetic hover for buttons
│   │   └── main.js                 # App entry point & initializer
│   ├── images/                     # All image assets
│   ├── icons/                      # Icon assets
│   ├── logos/                      # Brand / company logos
│   └── Certifications/             # Certification images
│
├── data/
│   ├── projects.json               # Portfolio project cards
│   ├── about-carousel.json         # About section carousel slides
│   ├── accolades.json              # Awards & achievements
│   ├── brands.json                 # Brand collaborations / tools
│   ├── experience.json             # Work experience timeline
│   ├── skills.json                 # Skills data
│   ├── person.json                 # Personal info / bio
│   └── case-studies/               # Case study content data
│
├── work/                           # Case study HTML pages
│   ├── design-system.html
│   ├── product-suite.html
│   ├── ai-strategy.html
│   └── research-strategy.html
│
├── demos/                          # Interactive demos / experiments
├── .github/                        # GitHub Actions workflows
├── CLAUDE.md                       # AI-context design system docs
└── README.md                       # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic) |
| Styling | Vanilla CSS3 — Grid, Flexbox, custom properties |
| Logic | Vanilla JavaScript (ES6+, no frameworks) |
| Graphics | Canvas API (Aurora + Particles) |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |
| Data | JSON files loaded via `fetch` |
| Deployment | Netlify / GitHub Pages |

---

## 🎨 Design System

### Typography
- **Display:** DM Serif Display (italic variant for accents)
- **Body / UI:** DM Sans — weights 300, 400, 500

### Visual Effects
- Aurora canvas background with animated colour gradients
- Floating particle layer
- Glassmorphism nav bar (`backdrop-filter: blur`)
- Holographic shimmer effect (`.holo-shimmer`) on cards
- Magnetic snap on interactive elements

### Sections

| Section | Description |
|---|---|
| **Hero** | Full-screen intro with name, subtitle, and CTA links |
| **Achievements & Projects** | Highlight cards for Communication, Leadership, Coding |
| **Skills & Expertise** | Animated ticker rows + stat counters + skill cards |
| **Certifications** | Terminal-styled cards (Harvard, Oracle, freeCodeCamp, Microsoft) |
| **About** | Bio text + data-driven carousel |
| **Contact** | Email, LinkedIn, GitHub, Resume links |

---

## 🎓 Certifications Showcased

- CS50's Introduction to Cybersecurity — **Harvard University** (Sep 2025)
- CS50's Introduction to Computer Science — **Harvard University** (Sep 2025)
- JavaScript Algorithms & Data Structures — **freeCodeCamp** (Aug 2025)
- Web Development Fundamentals — **freeCodeCamp** (2025)
- Oracle Cloud AI Foundations Associate — **Oracle** (Aug 2025)
- Microsoft Excel Certification — **Microsoft** (2024)

---

## 🚀 Local Development

### Option 1 — Python server (recommended)

```bash
python server.py
# or
python -m http.server 8000
# Visit http://localhost:8000
```

### Option 2 — Node

```bash
npm install
npm start
```

### Cache Busting

CSS and JS files use query-string versioning to force browser cache refresh after updates:

```html
<link rel="stylesheet" href="assets/css/main.css?v=1761500000">
<script src="assets/js/main.js?v=1761500000"></script>
```

Increment the version number in `index.html` / `resume.html` after any CSS or JS change.

---

## 📦 Adding Content

### New Project Card
Edit `data/projects.json`:
```json
{
  "title": "Project Name",
  "category": "Web Development",
  "description": "Short description of the project.",
  "link": "https://github.com/Yug-the-pirate-king/project",
  "featured": true
}
```

### New Certification
Add a new `.certification-card` block in `index.html` inside `.certifications-grid`, following the terminal-style pattern of existing cards.

### About Carousel Slide
Edit `data/about-carousel.json` to add new slides — the carousel is rendered dynamically.

---

## 🔄 Git Workflow

| Branch | Purpose |
|---|---|
| `main` | Production — deployed to Netlify |
| `development` | Active feature development |

Slash commands via Claude Code (`.claude/commands/`):

- **`/status`** — Show git status, branch, and recent commits
- **`/quick-commit`** — Quick commit on current branch
- **`/deploy`** — Commit → merge to main → push → return to dev

---

## 📱 Responsive Breakpoints

| Breakpoint | Range |
|---|---|
| Mobile | < 768px |
| Tablet | 768px – 1024px |
| Desktop | > 1024px |

---

## 🌐 Browser Support

| Browser | Support |
|---|---|
| Chrome 76+ | ✅ Full |
| Firefox 103+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 79+ | ✅ Full |

> Backdrop filters and Canvas API require modern browser support.

---

## 📄 License

**Dual-licensed:**

- **Code & Technical Implementation** — [MIT License](LICENSE)
  HTML, CSS, and JavaScript are freely available for reference with attribution.
- **Portfolio Content & Designs** — All Rights Reserved
  Personal content, case studies, and creative work may not be reproduced without permission.

---

## 🤝 Connect

| Platform | Link |
|---|---|
| 📧 Email | [yugshah197@gmail.com](mailto:yugshah197@gmail.com) |
| 💼 LinkedIn | [linkedin.com/in/yug-shah26](https://www.linkedin.com/in/yug-shah26) |
| 🐙 GitHub | [github.com/Yug-the-pirate-king](https://github.com/Yug-the-pirate-king) |
| 🌍 Location | Mumbai, India |

---

*Built with ❤️ by Yug Shah — Web Developer | CS Student | Problem Solver*
