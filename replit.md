# Shah Yug - UX Portfolio

## Overview
A modern, interactive UX portfolio website showcasing design work with sophisticated glassmorphism effects, interactive particle systems, and temperature-based theming. Built with pure HTML, CSS, and vanilla JavaScript - no build system required.

## Project Type
Static website - HTML/CSS/JavaScript portfolio

## Current State
✅ Fully functional and ready to use
- Portfolio server running on port 5000
- Interactive particle system with customizable controls
- Dark/light theme switching
- Responsive design for all devices
- Data-driven project showcase via JSON

## Recent Changes
- **November 27, 2025**: Initial setup for Replit environment
  - Installed Python 3.11 for static file serving
  - Created `server.py` with cache control headers (prevents browser caching issues)
  - Configured workflow to serve on port 5000
  - Updated .gitignore with Python-specific entries
  - Configured static deployment

## Project Architecture

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **Server**: Python 3 HTTP server (development only)
- **Deployment**: Static site (no server needed in production)

### File Structure
```
├── index.html              # Main portfolio page
├── resume.html             # Resume page
├── lab.html                # Interactive experiments
├── work/                   # Case study pages
├── assets/
│   ├── css/                # Modular CSS architecture
│   ├── js/                 # Component-based JavaScript
│   ├── images/             # Image assets
│   ├── icons/              # SVG icons
│   └── logos/              # Brand logos
├── data/                   # JSON data files
│   ├── projects.json       # Project showcase data
│   ├── brands.json         # Brand logos
│   ├── case-studies/       # Case study content
│   └── ...
├── server.py               # Development server with cache control
└── replit.md               # This file
```

### Key Features
1. **Interactive Particle System** - WebGL-powered particle effects with user controls
2. **Temperature-based Theming** - Cool blues for light mode, warm oranges for dark mode
3. **Glassmorphism Design** - Modern glass effects with backdrop blur
4. **Modular Architecture** - Component-based JavaScript and organized CSS
5. **Data-Driven Content** - JSON-based project management

### Design System
- **Typography**: IBM Plex Sans (Google Fonts)
- **Colors**: Temperature-based accents (#15B5FF for light, #ea580c for dark)
- **Container**: Max-width 1200px for optimal readability
- **Spacing**: Modular scale (4px to 80px)

## Development Workflow

### Running Locally
The Portfolio Server workflow automatically starts the development server on port 5000:
```bash
python3 server.py
```

### Cache Control
The server includes `Cache-Control: no-cache` headers to prevent browser caching during development. This ensures changes are immediately visible.

### Deployment
Configured as a static site deployment:
- Deployment type: Static
- Public directory: `.` (root)
- All static files are served directly
- No build step required

## User Preferences
None specified yet.

## Important Notes
- This is a pure static website - no npm, webpack, or build tools needed
- All JavaScript is vanilla - no frameworks or dependencies
- Cache control headers prevent browser caching issues during development
- For production, the site can be deployed as pure static files (no server needed)
- See CLAUDE.md for detailed design system documentation
