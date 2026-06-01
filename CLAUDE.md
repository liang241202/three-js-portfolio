# three-js-portfolio

3D interactive portfolio. Plan A migration from Vite + vanilla Three.js to Next.js + React Three Fiber + TypeScript + Tailwind has passed WBS-9 detection. WBS-10 removes legacy Vite files and updates repo docs.

## Stack (Current)

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19
- **3D**: React Three Fiber 9 + drei 10 + three.js 0.184
- **Language**: TypeScript 5.9 (strict)
- **Styling**: Tailwind CSS v4
- **Runtime**: Node 24 LTS (`.nvmrc` = `24`, `engines.node` = `>=24 <25`)

## Entry Points

- `app/layout.tsx` - RSC root layout with Tailwind globals and minimal metadata
- `app/page.tsx` - RSC home page; mounts `<SceneRoot />` inside full-viewport `<main>`
- `src/scene/SceneRoot.tsx` - only app-level client boundary; owns `<Canvas>` composition
- `src/scene/CameraRig.tsx` - perspective camera, pivot group, Box3 fit, orbit/pan/zoom/reset hooks
- `src/scene/Terrain.tsx` - memoized 10x10 cube grid with plateau and peak
- `src/character/Ball.tsx` - sphere character, 5-point raycast height tracking, WASD movement
- `src/controls/` - custom control hooks and shared ref types

## Dev Commands

```powershell
npm run dev    # next dev
npm run build  # next build
npm run start  # serve production build
npm run lint   # ESLint flat config
```

## Scope

Plan A in scope:

- Preserve behavioral parity with the pre-migration baseline.
- Keep the current 3D scene running under Next.js + R3F.
- Use `pre-migration-v0` and the AI workspace snapshots as the source of truth for old behavior.

Out of scope for Plan A:

- Portfolio content routes (`about`, `projects`, `contact`)
- DB, CMS, analytics, auth, or persistence
- Deploy/Vercel configuration
- New 3D product features beyond parity
- Broad visual redesign

## Reference Materials

- `pre-migration-v0` tag preserves the original Vite/vanilla implementation.
- AI workspace snapshots live under `C:\Users\Hliang\Obsidian_vaults\SWE_obsidian\AI\AI-workspace\projects\three-js-portfolio\snapshots\`.
- `design_reference_brief.md` exists for the future product/design phase. It is not current implementation scope.
- `C:\Users\Hliang\Downloads\MicroWorld\React_training\next-learn` is a read-only Next.js learning/reference workspace.

## Structure Conventions

- App Router files are RSC by default.
- Keep `'use client'` boundaries narrow; `SceneRoot` is the main scene boundary.
- Scene code belongs in `src/scene/`.
- Character behavior belongs in `src/character/`.
- Camera and character controls belong in `src/controls/`.
- Shared control ref types live in `src/controls/types.ts`.
- `useFrame` registration order is intentional: floating height tracking runs before WASD movement to mirror the legacy animation loop.
- `next-env.d.ts` is generated and intentionally ignored because Next 16 flips the generated import path between dev and build.
- Legacy provenance comments like `Mirror src/main.js:...` are intentional. The old source is preserved by the `pre-migration-v0` tag.

## Completed / Pending

- [x] WBS-0 through WBS-9 complete.
- [x] WBS-9 detection gate passed: build, lint, production start, human parity, and perf.
- [x] Perf parity: pre-migration `60.16 FPS`, migrated `60.13 FPS` (`99.95%`).
- [x] `THREE.Clock` warning diagnosed as R3F internal upstream noise, not repo source.
- [ ] WBS-10: cleanup + docs.
- [ ] WBS-11: knowledge capture, merge to main, final tag.
- [ ] Future product/design phase: island portfolio golden slice from `design_reference_brief.md`.
- [ ] Future deploy task: Vercel setup after Plan A is complete.

## Workflow

Global rules live in `~/.claude/CLAUDE.md` and `~/AI_workspace/workflows/dual-agent-workflow.md`.
This file only records project-specific context.
