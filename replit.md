# Yug Shah - Portfolio Website

## Overview
A modern, interactive portfolio website showcasing web development skills and projects. Built with pure HTML, CSS, and vanilla JavaScript featuring sophisticated glassmorphism effects, interactive particle systems, and temperature-based theming.

## Project Type
Static website - HTML/CSS/JavaScript portfolio

## Current State
Fully functional and ready to use
- Portfolio server running on port 5000
- Interactive particle system with customizable controls
- Dark/light theme switching with temperature-based colors
- Responsive design for all devices
- Professional skills and certifications showcase

## Recent Changes
- **November 27, 2025**: Major portfolio upgrade
  - Updated all content for Yug Shah (CS Student, Mumbai)
  - Enhanced hero section with greeting, tagline, and CTA buttons
  - Added Skills section with 4 glassmorphism skill cards
  - Added Certifications section with 6 certification cards
  - Updated About section with education information
  - Updated Contact section with real contact info and social links
  - Added professional CSS styling with dark mode support
  - Fixed server.py to allow address reuse

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
│   │   ├── main.css        # Main stylesheet (imports all modules)
│   │   ├── _variables.css  # CSS custom properties
│   │   ├── _hero.css       # Hero section styles
│   │   ├── _sections.css   # Skills, certs, about, contact styles
│   │   └── ...
│   ├── js/                 # Component-based JavaScript
│   ├── images/             # Image assets
│   ├── icons/              # SVG icons
│   └── logos/              # Brand logos
├── data/                   # JSON data files
│   ├── person.json         # Personal information (Yug Shah)
│   ├── skills.json         # Skills and categories
│   ├── projects.json       # Project showcase data
│   └── ...
├── server.py               # Development server with cache control
└── replit.md               # This file
```

### Key Features
1. **Professional Hero Section** - Greeting, name, roles, tagline, and CTAs
2. **Skills Section** - 4 glassmorphism cards for skill categories
3. **Certifications Section** - 6 cards showcasing Harvard CS50, Oracle AI, freeCodeCamp, etc.
4. **Interactive Particle System** - WebGL-powered particle effects with user controls
5. **Temperature-based Theming** - Cool blues for light mode, warm oranges for dark mode
6. **Glassmorphism Design** - Modern glass effects with backdrop blur
7. **Modular Architecture** - Component-based JavaScript and organized CSS
8. **Data-Driven Content** - JSON-based personal info and project management

### Design System
- **Typography**: IBM Plex Sans (Google Fonts)
- **Colors**: Temperature-based accents (#15B5FF for light, #ea580c for dark)
- **Container**: Max-width 1200px for optimal readability
- **Spacing**: Modular scale (4px to 80px)

### Personal Information (from person.json)
- **Name**: Yug Shah
- **Role**: Computer Science & Engineering Student
- **Location**: Mumbai, India
- **Education**: B.Sc. CS&E at SVKM's Shri Bhagubhai Mafatlal College
- **Email**: yugshah197@gmail.com
- **LinkedIn**: linkedin.com/in/yug-shah26
- **GitHub**: github.com/Yug-the-pirate-king

## Development Workflow

### Running Locally
The Portfolio Server workflow automatically starts the development server on port 5000:
```bash
python3 server.py
```

### Cache Control
The server includes `Cache-Control: no-cache` headers to prevent browser caching during development.

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
- The portfolio showcases Yug Shah's skills as a CS student with certifications from Harvard, Oracle, freeCodeCamp, and Microsoft
