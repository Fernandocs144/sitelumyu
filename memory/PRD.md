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

## Update (2026-07-02) — i18n + Leads backend + Scroll animation
- Added EN/PT language switch (default Portuguese) via src/i18n.js (LanguageProvider + localStorage). All 5 pages fully translated. Verified by testing agent (frontend 100%).
- Added backend leads API: POST/GET /api/leads (FastAPI + Motor/MongoDB, collection `leads`). Contact form now posts to backend end-to-end (was mailto). Fixed id serialization (response_model_by_alias=False).
- Resend email notification wired in server.py (_send_notification). RESEND_API_KEY in backend/.env is EMPTY -> emails NOT sent yet (leads stored with notified:false). AWAITING user's Resend API key to activate email.
- Homepage scroll-driven animation: robot parallax/fade + glowing ScrollConnection line + comet + diamond reveal (framer-motion useScroll). 
- 3D GLB models (robot/diamond/logo) were provided and compressed, but three.js in-browser loading (XHR FileLoader + WASM decoders + texture decode) HANGS in this preview environment. Pivoted to 2D scroll animation delivering the same visual concept. Models kept in /public/models but not loaded.

## Backlog / Next
- P0: Add RESEND_API_KEY (+ verify lumyo.pt domain) to enable email notifications.
- P1: Retry native 3D on a production build / different hosting where XHR+WASM aren't blocked.
- P2: spam protection (captcha/rate-limit) on /api/leads.
