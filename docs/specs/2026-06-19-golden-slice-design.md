# Golden Slice — stylized-realistic target art on one island corner

**Date:** 2026-06-19
**Tier:** 2 (confirmed — downgraded from initial Tier 3 because the chosen approach
defers every dependency / asset-pipeline change: drei is already installed, no
KTX2/draco, no build/CI/lockfile change.)
**Branch:** `feat/golden-slice`

## Goal

Prove the **stylized-realistic** destination art (ref: Jordan Breton FWA portfolio,
`C:\Users\Hliang\Portfolio\reference\`) on **one outer corner** of the island, so the
target art language is locked before building it out. The voxel/box look is disposable
scaffold (memory `island-visual-direction`); this slice shows what replaces it.

**Acceptance bar:** standing at that corner, the camera sees a stylized tree + swaying
grass + a textured cliff edge that reads as the destination art — not voxels. The rest
of the island stays voxel scaffold, untouched.

## Non-goals (explicitly out)

- Volumetric clouds — separable A-layer atmosphere system, its own later task.
- KTX2 / draco — optimization for many high-res assets; YAGNI for one corner.
- Walkability of the new ground — the Ball does not need to traverse the slice;
  it is a camera-viewed visual proof. Collision stays 100% on the voxel terrain.
- Whole-island art swap — that is the build-out, not this de-risking slice.

## Approach (chosen: additive overlay)

A self-contained `GoldenSlice` component placed over one outer corner. The voxel cubes
in that corner are **visually hidden**, but collision / Ball / raycast keep using the
full voxel terrain underneath — so `collision.ts`, `Ball`, and the camera are not touched.
Fully isolated and reversible: delete the component + un-hide the cells to revert.

Rejected: (2) replacing the corner and rewiring collision so the Ball walks the new
ground — touches `collision.ts`/raycast/AABB, far bigger, risks existing behavior, not
needed to lock direction. (3) whole-island swap — not a slice.

## Components

### New: `src/scene/GoldenSlice.tsx`
Sits next to `Terrain.tsx`. Renders, positioned over a chosen outer-corner cell block:

- **Ground** — a stylized ground mesh covering the ~3×3 corner cell block (pack terrain
  piece, or a lightly noise-displaced plane with a grass-toned standard material),
  `receiveShadow`.
- **Cliff** — stylized rock mesh(es) on the island's two outer edges of that corner,
  dropping below the rim to read as a floating-island cliff face.
- **Tree** — one hero GLB via drei `useGLTF` (existing dependency), `castShadow`, wrapped
  in `<Suspense>`. drei's `useGLTF.preload` for the asset.
- **Grass** — `InstancedMesh` of blades scattered on the ground, with a custom
  vertex-shader wind sway (per-vertex displacement weighted by blade height, driven by
  `uTime` + wind direction). This is the one signature shader. Built with drei
  `shaderMaterial` + `useFrame` to advance `uTime`.

All meshes obey the existing HDR pipeline: renderer `NoToneMapping`, ACES applied last in
PostFX, `emissiveIntensity > 1` only where bloom is intended (memory
`island-visual-cosmic-night`). Grass material is a `ShaderMaterial`, not a postprocessing
Effect, so the React-19 `wrapEffect` pitfall does not apply.

### Asset coherence constraint (HARD)
Tree, grass-blade reference, and cliff rock all come from **one CC0 pack** for a
consistent art style (leading candidate: Quaternius stylized nature, CC0 — verify
availability + license during implementation; record the source + license). Mixing
sources looks incoherent. GLB files live in `public/models/`. License/attribution noted
in the spec/commit even for CC0.

### Changed: `src/scene/Terrain.tsx`
Add `hideCells?: Set<string>` prop. Cells whose `${i}-${j}` key is in the set are skipped
during render. Default (prop absent) = current behavior unchanged → backward compatible.
Does **not** affect the collision/raycast path (the Ball reads the terrain group; hidden
meshes simply are not rendered — for the visual slice the Ball is not expected at that
corner).

### Changed: `src/scene/SceneRoot.tsx`
Mount `<GoldenSlice />`; pass the corner's cell keys to `Terrain` via `hideCells`. Single
source of truth for which cells the slice owns: a small exported constant (e.g.
`GOLDEN_SLICE_CELLS`) co-located with `GoldenSlice`, imported by `SceneRoot` so the hidden
cells and the slice geometry cannot drift apart.

## Corner choice

A front-facing outer corner (cells roughly `i∈{0,1,2}, j∈{0,1,2}`, i.e. an edge corner so
the cliff has an island rim to drop from). Exact cells + scale/position tuned during
implementation by screenshotting against the default camera framing. Cell keys use
`Terrain`'s `${i}-${j}` format. Scale must match the WORLD_SCALE-1.5 terrain (cells are
size 1, terrain group scaled 1.5).

## Verification

- **Machine:** `npx tsc --noEmit`, `npm run lint`, `npm run build` all exit 0.
- **Visual (Playwright + SwiftShader,** flags `--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist`, via webapp-testing
  `with_server.py`): new script `golden_slice.py` orbits to the corner and asserts —
  tree + grass + cliff render; grass animates (two frames differ); bloom intact; no voxel
  cubes poke through the vignette; intro reveal still works (no regression).
- **Review before any push:** code-reviewer subagent + Codex cross-model review (Claude
  implements → Codex reviews, cross-model pairing). Re-review new commits added after the
  pre-push marker.

## Rollback

Additive + isolated. Revert = delete `GoldenSlice.tsx`, remove its mount + the `hideCells`
prop usage in `SceneRoot`, delete the `public/models/` GLB(s). `Terrain`'s `hideCells` prop
is backward-compatible and can stay (harmless) or be removed.

## Risks

- **Scale/coherence mismatch** — pack assets may not match the voxel scale or each other's
  style; mitigated by single-pack sourcing + screenshot tuning.
- **Voxel show-through** at the seam between stylized ground and remaining voxel cubes;
  mitigated by hiding the corner block and oversizing the stylized ground slightly.
- **Asset availability** — the chosen CC0 pack must actually have tree+grass+rock at a
  usable license; verified as the first implementation step before wiring anything.
