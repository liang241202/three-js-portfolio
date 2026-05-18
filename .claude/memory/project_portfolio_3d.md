---
name: project-portfolio-3d
description: Core purpose and stack of the Three_js_projects portfolio site
metadata:
  type: project
---

This project is an interactive 3D website built as the user's personal portfolio.

**Why:** User wants a portfolio site that showcases 3D interactivity as the main feature — immersive and tech-forward while keeping a quiet, calm aesthetic that intuitively presents their work.

**How to apply:** All feature decisions should serve the portfolio goal — visual impact, smooth interaction, and professional presentation matter more than internal tooling concerns. Prioritize user-facing 3D experience quality. Style direction: immersive + quiet + intuitive.

Stack: Three.js (^0.175.0) + Vite (^6.2.5), single-page, no framework.
Entry point: `src/main.js`, `index.html`, `style.css`.

Current state of `src/main.js`:
- Procedurally generated checkerboard ground with varying tile heights
- Floating sphere character with WASD movement
- Camera orbit with inertia, zoom (scroll), pan (right-click drag)
- 'R' held 2s → smooth return to default camera view
- Raycaster-based terrain collision and float height detection
