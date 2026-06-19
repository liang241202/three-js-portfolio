# Golden Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the stylized-realistic destination art (tree + swaying grass + cliff) on one outer corner of the island, with the voxel scaffold hidden there but collision untouched.

**Architecture:** Additive overlay. A self-contained `GoldenSlice` component renders a stylized ground + cliff rock (GLB) + hero tree (GLB) + procedural instanced grass (wind vertex shader) over one corner, in its own `<group scale={WORLD_SCALE}>` so it shares the terrain's coordinate space WITHOUT joining the terrain group (which the camera Box3-fit and the Ball raycast depend on). `Terrain` gains a backward-compatible `hideCells` prop to drop the voxel cubes under the slice. `collision.ts`, `Ball`, and the camera are not touched.

**Tech Stack:** Next 16 / React 19 / R3F 9 / drei 10 (`useGLTF`, `shaderMaterial`) / three 0.184 — all already installed. No KTX2/draco, no new dependency. Verification via `tsc`/`lint`/`build` + Playwright headless + SwiftShader (webapp-testing skill).

> **TDD note:** This is GPU/visual work — most behavior is verified by build + a Playwright screenshot assertion, not unit tests. Each task therefore ends with the real verification command(s) for that change and a commit. Fabricated pytest-style unit tests would not exercise the rendered result and are deliberately omitted (ponytail: the integration script IS the check).

---

## File Structure

- **Create** `public/models/` — CC0 GLB assets (one tree, one cliff/rock). Grass is procedural (no asset).
- **Create** `public/models/CREDITS.md` — asset source + CC0 license note.
- **Create** `src/scene/GoldenSlice.tsx` — composition: exports `GOLDEN_SLICE_CELLS`; renders ground + cliff + tree; mounts `<GrassField>`. Owns the corner's coordinate math.
- **Create** `src/scene/GrassField.tsx` — instanced procedural grass blades + wind `shaderMaterial` (the one signature shader). Isolated because it is the most complex unit.
- **Modify** `src/scene/Terrain.tsx` — add `hideCells?: ReadonlySet<string>` prop (backward compatible).
- **Modify** `src/scene/SceneRoot.tsx` — pass `hideCells={GOLDEN_SLICE_CELLS}` to `Terrain`; mount `<GoldenSlice />`.
- **Create** `%TEMP%/golden_slice.py` — Playwright visual verification script (not committed; lives in TEMP like the session's other scripts).

Corner coordinate facts (from `Terrain.tsx`): cube center = `(j - 4.5, height - 0.5, i - 4.5)` in terrain-local space (cols=rows=10, size=1, halfW=halfH=5). Base cells have `height = 0` → top surface at local `y = 0`. The slice uses the `-X / -Z` outer corner cells `i,j ∈ {0,1,2}`, which are base level (the raised plateau is `i,j ∈ 3..6`, untouched). Local extent ≈ `x,z ∈ [-5, -2]`. Terrain group is scaled by `WORLD_SCALE = 1.5`; `GoldenSlice` applies the same scale to its own wrapper group.

---

## Task 1: Acquire CC0 assets

**Files:**
- Create: `public/models/tree.glb`, `public/models/cliff.glb`
- Create: `public/models/CREDITS.md`

- [ ] **Step 1: Get a CC0 stylized nature pack.**

Primary source: **Quaternius** (CC0, `quaternius.com` → a Nature pack, e.g. "Ultimate Nature" / "Stylized Nature"). Fallback: **Poly Haven Models** (`polyhaven.com/models`, CC0). Download the pack, pick ONE stylized tree and ONE rock/cliff mesh from the SAME pack (style coherence is a hard constraint — see spec). Export/convert to `.glb` if the pack ships `.gltf`/`.fbx` (gltf already fine). Optimize is optional and out of scope (no draco).

- [ ] **Step 2: Place the files.**

Copy the two GLBs to `public/models/tree.glb` and `public/models/cliff.glb`.

- [ ] **Step 3: Record the license.**

Write `public/models/CREDITS.md` with: pack name, author, source URL, license (CC0), and the date retrieved. CC0 needs no attribution legally, but record it anyway.

- [ ] **Step 4: Verify the files load.**

Run the dev server and load each GLB through drei `useGLTF` in a throwaway check, OR inspect with `npx gltf-pipeline -i public/models/tree.glb -o /tmp/_check.glb` (or `gltf.report`) to confirm the file is a valid glTF with a mesh. Expected: no parse error, mesh node present.

- [ ] **Step 5: Commit.**

```bash
git add public/models/tree.glb public/models/cliff.glb public/models/CREDITS.md
git commit -m "feat(golden-slice): add CC0 stylized tree + cliff assets"
```

> **Gate:** if no single pack yields a usable tree + rock at CC0, STOP and report — do not silently mix sources (breaks the coherence constraint) or switch to procedural meshes without approval.

---

## Task 2: `Terrain` `hideCells` prop + `GOLDEN_SLICE_CELLS`

**Files:**
- Modify: `src/scene/Terrain.tsx`
- Create: `src/scene/GoldenSlice.tsx` (constant only, in this task)

- [ ] **Step 1: Add the prop and skip hidden cubes in `Terrain.tsx`.**

```tsx
type Props = {
  rows?: number;
  cols?: number;
  size?: number;
  // Cells (keyed `${i}-${j}`) to skip RENDERING — used by GoldenSlice to clear its
  // corner. Collision/raycast are unaffected (the Ball reads the terrain group; a
  // non-rendered cube simply has no mesh). Absent = current behavior (backward compatible).
  hideCells?: ReadonlySet<string>;
};

export default function Terrain({ rows = 10, cols = 10, size = 1, hideCells }: Props) {
  const cubes = useMemo(() => {
    const halfW = (cols * size) / 2;
    const halfH = (rows * size) / 2;
    const geometry = new BoxGeometry(size, size, size);
    const items: { key: string; pos: [number, number, number]; color: number }[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const key = `${i}-${j}`;
        if (hideCells?.has(key)) continue;
        const isDark = (i + j) % 2 === 0;
        let height = 0;
        if (i >= 3 && i <= 6 && j >= 3 && j <= 6) height = 1;
        const color = height > 0 ? (isDark ? 0x46583f : 0x52664a) : (isDark ? 0x363f4e : 0x3e4a59);
        items.push({
          key,
          pos: [j * size - halfW + size / 2, height * size - 0.5, i * size - halfH + size / 2],
          color,
        });
      }
    }
    return { items, geometry };
  }, [rows, cols, size, hideCells]);
  // ...unchanged render...
}
```

(Keep the existing comment block above the `height`/peak logic; only the `key` extraction, the `continue`, and the dep array change.)

- [ ] **Step 2: Create the cell constant in `GoldenSlice.tsx`.**

```tsx
// The outer -X/-Z corner block this slice owns. Single source of truth: SceneRoot hides
// exactly these voxel cells and GoldenSlice draws its art over them, so they cannot drift.
export const GOLDEN_SLICE_CELLS: ReadonlySet<string> = new Set(
  [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => `${i}-${j}`)),
);
```

- [ ] **Step 3: Temporarily wire it in `SceneRoot.tsx` to verify the hole.**

Add `import GoldenSlice, { GOLDEN_SLICE_CELLS } from "./GoldenSlice";` and pass `hideCells={GOLDEN_SLICE_CELLS}` to `<Terrain rows={10} cols={10} size={1} />`. (Default GoldenSlice export is added in Task 3; for this task export a `null`-returning stub so the import resolves.)

- [ ] **Step 4: Verify.**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: all exit 0. Then `npm run dev` + screenshot: the `-X/-Z` corner has a 3×3 hole (missing cubes). The Ball still walks normally (collision unaffected).

- [ ] **Step 5: Commit.**

```bash
git add src/scene/Terrain.tsx src/scene/GoldenSlice.tsx src/scene/SceneRoot.tsx
git commit -m "feat(golden-slice): Terrain hideCells prop + corner cell constant"
```

---

## Task 3: `GoldenSlice` ground + cliff + tree

**Files:**
- Modify: `src/scene/GoldenSlice.tsx`
- Modify: `src/scene/SceneRoot.tsx`

- [ ] **Step 1: Implement `GoldenSlice.tsx`.**

```tsx
"use client";

import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import { WORLD_SCALE } from "@/src/island/layout";
import GrassField from "./GrassField";

export const GOLDEN_SLICE_CELLS: ReadonlySet<string> = new Set(
  [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => `${i}-${j}`)),
);

// Center of the {0,1,2}^2 corner block in terrain-local space: cell center = (j-4.5, _, i-4.5),
// so the block spans x,z ∈ [-5,-2]; its center is ≈ (-3.5, 0, -3.5), top surface at local y = 0.
const CORNER_CENTER: [number, number, number] = [-3.5, 0, -3.5];

function Tree() {
  const { scene } = useGLTF("/models/tree.glb");
  // castShadow on every mesh in the GLB.
  scene.traverse((o) => {
    // @ts-expect-error three Object3D union; only Meshes have isMesh
    if (o.isMesh) o.castShadow = true;
  });
  return <primitive object={scene} />;
}

function Cliff() {
  const { scene } = useGLTF("/models/cliff.glb");
  return <primitive object={scene} />;
}

useGLTF.preload("/models/tree.glb");
useGLTF.preload("/models/cliff.glb");

export default function GoldenSlice() {
  return (
    // Share the terrain's coordinate space WITHOUT joining the terrain group
    // (camera Box3-fit + Ball raycast depend on that group's contents).
    <group scale={WORLD_SCALE}>
      <group position={CORNER_CENTER}>
        {/* Stylized ground: a 3x3-cell pad at the top surface (local y≈0), oversized
            slightly to hide the seam against the remaining voxel cubes. */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.4, 3.4]} />
          <meshStandardMaterial color="#4f7a3a" roughness={0.95} metalness={0} />
        </mesh>

        <Suspense fallback={null}>
          {/* Cliff on the outer -X/-Z rim, dropping below the island. Tune in Task 5. */}
          <group position={[-1.4, -0.2, -1.4]} scale={1}>
            <Cliff />
          </group>

          {/* Hero tree, planted on the pad. Tune position/scale in Task 5. */}
          <group position={[0.3, 0, 0.3]} scale={1}>
            <Tree />
          </group>
        </Suspense>

        <GrassField area={3.0} count={400} />
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Add a minimal `GrassField` stub so the import resolves** (real shader in Task 4):

```tsx
// src/scene/GrassField.tsx — STUB for Task 3; replaced in Task 4.
export default function GrassField(_: { area: number; count: number }) {
  return null;
}
```

- [ ] **Step 3: Finalize `SceneRoot.tsx` wiring.**

Ensure `<GoldenSlice />` is mounted as a sibling AFTER the terrain group (not inside it):

```tsx
<group ref={setTerrain} scale={WORLD_SCALE}>
  <Terrain rows={10} cols={10} size={1} hideCells={GOLDEN_SLICE_CELLS} />
</group>

<GoldenSlice />
```

- [ ] **Step 4: Verify.**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: all exit 0. Then `npm run dev` + screenshot the corner: stylized ground + tree + cliff visible, sitting where the voxel hole was, no cubes poking through the pad. Bloom still works elsewhere.

- [ ] **Step 5: Commit.**

```bash
git add src/scene/GoldenSlice.tsx src/scene/GrassField.tsx src/scene/SceneRoot.tsx
git commit -m "feat(golden-slice): corner ground + cliff + hero tree (GLB)"
```

---

## Task 4: `GrassField` — instanced grass + wind shader

**Files:**
- Modify: `src/scene/GrassField.tsx`

- [ ] **Step 1: Implement the wind `shaderMaterial` + instanced blades.**

```tsx
"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { Color, InstancedMesh, Matrix4, Vector2 } from "three";

const GrassMaterial = shaderMaterial(
  {
    uTime: 0,
    uWindDir: new Vector2(1, 0.4),
    uColorBottom: new Color("#2f5d34"),
    uColorTop: new Color("#7fae57"),
  },
  // vertex: blade modeled with y ∈ [0, h]; sway grows with height so the base stays planted.
  /* glsl */ `
    attribute mat4 instanceMatrix;
    uniform float uTime;
    uniform vec2 uWindDir;
    varying float vH;
    void main() {
      vH = clamp(position.y, 0.0, 1.0);
      vec3 p = position;
      float phase = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.7;
      float sway = sin(uTime * 1.6 + phase);
      float w = pow(vH, 1.5) * 0.18;
      p.x += sway * w * uWindDir.x;
      p.z += sway * w * uWindDir.y;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    varying float vH;
    uniform vec3 uColorBottom;
    uniform vec3 uColorTop;
    void main() {
      gl_FragColor = vec4(mix(uColorBottom, uColorTop, vH), 1.0);
    }
  `,
);
extend({ GrassMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    grassMaterial: ThreeElement<typeof GrassMaterial>;
  }
}

type Props = { area: number; count: number };

export default function GrassField({ area, count }: Props) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<{ uTime: number } | null>(null);

  // Scatter blades once over the pad (centered on the corner group's origin).
  const matrices = useMemo(() => {
    const m = new Matrix4();
    const out = new Float32Array(count * 16);
    for (let k = 0; k < count; k++) {
      const x = (Math.random() - 0.5) * area;
      const z = (Math.random() - 0.5) * area;
      const s = 0.6 + Math.random() * 0.5;
      m.makeScale(s, s, s);
      m.setPosition(x, 0, z);
      m.toArray(out, k * 16);
    }
    return out;
  }, [area, count]);

  // Apply matrices after mount (layout effect, so meshRef is set and it runs before paint).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    (mesh.instanceMatrix.array as Float32Array).set(matrices);
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uTime += dt;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* A 3-segment tapered blade, ~0.4 tall, pivot at the base (y=0). */}
      <planeGeometry args={[0.06, 0.4, 1, 3]} onUpdate={(g) => g.translate(0, 0.2, 0)} />
      {/* @ts-expect-error custom material element from extend() */}
      <grassMaterial ref={matRef} side={2} />
    </instancedMesh>
  );
}
```

> **Pitfall:** for a raw `ShaderMaterial` on an `InstancedMesh` you MUST declare `attribute mat4 instanceMatrix;` yourself (three only injects it for built-in materials). The shader above does. If blades render but don't move, check `uTime` is advancing (the `useFrame` + `matRef`).

- [ ] **Step 2: Verify build.**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: all exit 0. If the `grassMaterial` JSX type errors, confirm the `declare module` augmentation is in this file and `extend({ GrassMaterial })` ran at module scope.

- [ ] **Step 3: Verify animation visually** (covered by the script in Task 5, asserting two frames differ). Quick manual: `npm run dev`, blades scattered on the pad, gently swaying.

- [ ] **Step 4: Commit.**

```bash
git add src/scene/GrassField.tsx
git commit -m "feat(golden-slice): instanced grass with wind vertex shader"
```

---

## Task 5: Tune + full verification

**Files:**
- Modify: `src/scene/GoldenSlice.tsx` (positions/scales/colors only)
- Create: `%TEMP%/golden_slice.py` (verification script, not committed)

- [ ] **Step 1: Screenshot-tune.** Run `npm run dev`, orbit to the corner, and adjust in `GoldenSlice.tsx`: tree position/scale, cliff position/scale so it reads as a rim drop, ground pad size to kill any seam, grass `count`/`area`, and the grass colors to match the pack's palette (coherence). Keep edits to literals — no structural change.

- [ ] **Step 2: Write `%TEMP%/golden_slice.py`** (Playwright + SwiftShader). It should: launch the page, dismiss the IntroGate (press the start control / ENTER), orbit the camera toward the `-X/-Z` corner, capture frame A, wait ~400ms, capture frame B. Assert: (a) page has no console errors; (b) frames A and B differ in a bounded grass region (proves animation); (c) a reference screenshot of the corner is saved for human review. Mirror the existing `intro_reveal.py` structure and the SwiftShader flags.

- [ ] **Step 3: Run the full machine + visual gate.**

```bash
npx tsc --noEmit
npm run lint
npm run build
python <webapp-testing>/scripts/with_server.py --server "npm run dev" --port 3000 -- python %TEMP%/golden_slice.py
```
Expected: machine checks exit 0; script asserts pass (grass animates, no console errors, corner screenshot saved). **Kill stray node on :3000 first** (handoff env note).

- [ ] **Step 4: Regression — intro reveal still works.** Re-run the existing `%TEMP%/intro_reveal.py` (or eyeball): violet edge outline → radial colour bloom on START, unchanged.

- [ ] **Step 5: Commit.**

```bash
git add src/scene/GoldenSlice.tsx
git commit -m "feat(golden-slice): tune corner composition + add visual verification"
```

---

## Review (autonomous-run gate, before Gate B)

- Dispatch the **code-reviewer** subagent on the branch diff; fix must/should findings. Record a pre-push marker; re-review any commits added after it.
- Dispatch **Codex** cross-model review (`codex_run.ps1 -Mode review`, grep `VERDICT` in the output file; exit 4 with a normal verdict is the known parser quirk). Cross-model pairing: Claude implemented → Codex reviews.
- Assemble the Gate B package: per-file diff summary, verification evidence (actual output), review findings + resolutions, deviations from this plan, proposed merge/push plan. Push/merge stays gated on explicit human approval.

---

## Self-Review (against the spec)

- **Ground/cliff/tree (spec Components)** → Tasks 1, 3. ✓
- **Grass + signature wind shader** → Task 4. ✓ (grass refined to procedural geometry — no GLB — color-matched to pack for coherence; fewer assets, same art intent.)
- **Single-pack coherence (HARD)** → Task 1 Step 1 + gate. ✓
- **`Terrain.hideCells`, backward compatible** → Task 2. ✓
- **Single source of truth for owned cells** → `GOLDEN_SLICE_CELLS` exported from `GoldenSlice`, imported by `SceneRoot`. ✓
- **HDR pipeline obeyed (NoToneMapping/ACES-last/emissive>1 only for bloom)** → no `emissiveIntensity` set on slice materials, so nothing forces bloom; ✓ consistent with the pipeline.
- **Collision/Ball/camera untouched** → only `Terrain` render path + new sibling component; ✓.
- **Corner choice + scale match** → File Structure coordinate facts + Task 5 tuning. ✓
- **Verification (machine + Playwright + reviews)** → Task 5 + Review section. ✓
- **Rollback** → delete `GoldenSlice.tsx`/`GrassField.tsx`, revert `SceneRoot`, drop `public/models/*`; `hideCells` prop is harmless if left. ✓
- **Non-goals (clouds, KTX2/draco, walkability, whole-island)** → none appear in any task. ✓

Type consistency: `GOLDEN_SLICE_CELLS: ReadonlySet<string>` matches `Terrain.hideCells?: ReadonlySet<string>`; `GrassField` props `{ area, count }` match call site `<GrassField area={3.0} count={400} />`. ✓
