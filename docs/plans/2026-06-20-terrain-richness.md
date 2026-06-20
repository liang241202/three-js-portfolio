# Gate A Plan — Terrain richness (replace the voxel grid with varied terrain)

**Status:** DRAFT for Gate A approval. Not started. Pure design — no code written yet.
**Date:** 2026-06-20
**Proposed tier:** **Tier 3** — replaces the foundational terrain mesh and rewrites the collision /
height-tracking that the Ball and camera depend on. Architectural + a known-fragile zone (collision
"no-pop" pitfall has bitten twice — see memory `island-collision-aabb`).

## Why this exists

The golden slice locked the *art vocabulary* (GLB props + wind-shader grass + cosmic-night pipeline)
and the user approved it (2026-06-20). The remaining gap to the reference is **terrain form, not
props**: the island still reads as a "grid" because the base is a flat 10×10 voxel plane. The user's
explicit steer: *don't tile the golden-slice corner across the island — that's boring; make the
terrain varied/rich like the reference.* So the lift is the deferred "textured/sculpted terrain" work
plus zone-based prop scatter. This is the crux, and it's the expensive part because collision is
coupled to the current grid.

## Core decision: how to build the terrain form

Two candidate approaches; recommendation first.

### Option A — heightmap-displaced terrain (RECOMMENDED)
One subdivided `PlaneGeometry` displaced by a heightmap (procedural noise and/or a hand-painted PNG),
vertex-colored or triplanar-shaded by height/slope.
- **Pros:** single mesh, GPU-cheap; arbitrary hills/valleys/coastline from one source; **collision
  gets *simpler*** — sample the height function at (x,z) instead of raycasting a cube set; art tuning
  is editing a noise seed or a grayscale PNG, not placing geometry.
- **Cons:** stylized-realistic look needs decent shading work (triplanar/biome blend); a hand-painted
  heightmap is its own small art task to match the reference's composition.

### Option B — modular terrain chunks from an asset pack
Hand-assemble pre-made stylized terrain/cliff tiles (e.g. Quaternius/KayKit) into the island shape.
- **Pros:** maximum art control; matches the stylized look out of the box.
- **Cons:** heavy assembly; collision stays mesh-based (raycast or per-chunk colliders) — no
  simplification; more assets to manage; harder to vary procedurally.

**Recommendation: Option A.** It converts "grid → landscape" with the smallest, most reversible
change AND simplifies collision instead of complicating it. Option B is a fallback if A's shading
can't hit the stylized bar.

## Zoning (variety, not tiling)

Divide the island into a few character zones; scatter varied props per zone (reuse the golden-slice
`useNormalizedModel` + multiple GLB set members, randomized transform). Proposed zones:
- **Meadow** — dense grass (the golden-slice field, scaled up), scattered trees/bushes.
- **Cliff rim** — rocks dropped below the edge (the floating-island look), sparse grass.
- **Temple plateau** — the existing raised center, kept walkable, framed by foliage.
- **Water/shore** (stretch) — a low zone + a simple animated water plane.

Zone membership drives both terrain height bias and which props scatter where, so the island reads as
distinct places rather than one repeated stamp.

## Blast radius (files this will touch)

- `src/scene/Terrain.tsx` — replaced or rewritten (grid → heightmap mesh). Biggest change.
- `src/character/Ball.tsx` — 5-point raycast height tracking → height-function sampling.
- `src/controls/useWASD.ts` — climb gate currently needs a terrain raycast hit; re-base on the height
  function (and a max-slope walkability rule).
- `src/island/collision.ts` + AABB object colliders — props on varied ground need their rest height
  recomputed from the terrain height, not y=0 (watch the perpendicular-rest "no-pop" pitfall).
- `src/controls/useIslandBoundary.ts` — boundary may follow the new terrain extent.
- `CameraRig.tsx` — Box3-fit depends on terrain bounds; verify framing still works.
- `GoldenSlice.tsx` / `Terrain.hideCells` — the golden-slice corner gets folded into a zone (the
  `hideCells` scaffold may be retired).
- Memories `island-world-scaling`, `island-collision-aabb` updated after.

## Verification plan

- Machine: `tsc --noEmit`, `lint`, `build` all clean.
- Runtime (Playwright + SwiftShader, extend `golden_slice.py`): no page/shader errors, no WebGL
  context loss; **walk-test across the varied terrain** — Ball follows the height field with no
  fall-through and no pop on first move (the regression that bit twice); climb/slope gate behaves;
  camera Box3-fit still frames the island; intro reveal intact.
- Visual: close-up + overview shots per zone for human art review.

## Rollback (Tier 3)

Each slice on its own branch off `main`; commit checkpoints. The terrain swap is the risky step —
keep the old `Terrain.tsx` grid path behind it until the heightmap collision is proven, so a single
`git revert` of the swap commit restores the walkable voxel island. No data/schema/remote state is
involved, so rollback is a branch discard or revert; nothing irreversible.

## Decomposition (grabbable slices, ordered)

1. **Terrain-form spike (S2, Tier 2 prototype):** heightmap mesh + height-sample collision in
   isolation; decide A vs B for real. *De-risks everything below.*
2. **Terrain swap (Tier 3):** replace the grid with the chosen terrain; port Ball height + WASD gate +
   camera fit; prove walk-test. *The risky foundation.*
3. **Zone scatter + density (Tier 2):** zones drive prop scatter; fold in the golden-slice corner;
   bump grass to full island scale. *Where the richness shows.*
4. **Stretch:** water/shore zone, biome shading polish.

## Open questions for Gate A

1. Approve **Option A (heightmap)** as the terrain approach, or prototype both first (slice 1)?
2. Procedural noise heightmap, or a hand-painted PNG to control composition like the reference?
3. How much of the island stays **walkable** vs scenic vista? (Drives how hard the slope/collision
   rules need to be.)
4. Keep the temple plateau exactly as-is, or restyle it into the new terrain?
