# LUMYO — Digital Systems Studio Website

## Problem Statement
Build a website exactly like a provided design mockup: "LUMYO", a futuristic AI/tech
agency landing page. Same colors (dark magenta/purple/blue neon), same texts, same
animation feel.

## User Choices
- Frontend-only (no backend)
- AI-generated images in the reference style
- Separate pages for each nav link
- Moderate animation

## Tech Stack
- React 18 + react-router-dom v6 (CRA + CRACO)
- Tailwind CSS 3 (injected via craco webpack postcss patch)
- framer-motion (scroll/entrance animations), lucide-react (icons)
- Fonts: Michroma (display), Chakra Petch (headings), Rajdhani (body)

## Pages
- / (Home): hero w/ robot, feature strip, 3 service sections, OUR SOLUTIONS, DESIGN UNIQUE
- /solutions: 4 solution detail cards
- /case-studies: stats + 3 case studies
- /studio: about + 4-step process
- /contact: contact form (frontend-only mailto) -> comercial@lumyo.pt

## Implemented (2026-07-02)
- Full 5-page site, matching mockup layout/colors/text. Verified by testing agent (100% frontend pass).
- AI-generated images: robot, light streams, AI network, diamond wireframe.

## Notes / Backlog
- Contact form uses mailto (frontend-only). P1: add real backend lead capture if desired.
- Minor: React Router v7 future-flag console warnings (non-blocking).
- P2: EN/PT language switch is currently visual only.
