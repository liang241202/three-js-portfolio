"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, Object3D, Vector3 } from "three";
import { WORLD_SCALE } from "@/src/island/layout";
import GrassField from "./GrassField";

// The outer -X/-Z corner block this slice owns. Single source of truth: SceneRoot hides
// exactly these voxel cells and GoldenSlice draws its art over them, so they cannot drift.
export const GOLDEN_SLICE_CELLS: ReadonlySet<string> = new Set(
  [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => `${i}-${j}`)),
);

// Center of the {0,1,2}^2 corner block in terrain-LOCAL space (cell center = (j-4.5, _, i-4.5),
// block spans x,z in [-5,-2]); top surface of the base cubes is local y = 0. GoldenSlice re-applies
// WORLD_SCALE itself so it shares the terrain's coordinate space without joining the terrain group.
const CORNER_CENTER: [number, number, number] = [-3.5, 0, -3.5];

type Normalized = { object: Object3D; scale: number; offset: [number, number, number] };

// Load a CC0 GLB and normalize it to a target height, base resting on y=0, centered on x/z.
// The pack assets are authored at an unknown (tiny) scale, and tree.glb/cliff.glb are MULTI-object
// sets — so we clone the cached scene (never mutate useGLTF's shared copy), optionally keep one
// "_N" member, then size by the measured box instead of guessing scale numbers.
function useNormalizedModel(url: string, targetHeight: number, keepName?: string): Normalized {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const object = gltf.scene.clone(true);

    if (keepName) {
      // Keep the named set member AND its descendants; drop only its siblings. (A regex over
      // `_\d+$` over-matched group members like NormalTree_3_1/_2 and deleted the tree's geometry.)
      const keep = object.getObjectByName(keepName);
      if (!keep) {
        // Silent fallback would render the WHOLE scattered set; surface a mistyped name in dev.
        if (process.env.NODE_ENV !== "production") {
          console.warn(`GoldenSlice: GLB node "${keepName}" not found in ${url}; rendering whole set.`);
        }
      } else if (keep.parent) {
        [...keep.parent.children].forEach((c) => {
          if (c !== keep) c.removeFromParent();
        });
      }
    }

    object.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = size.y > 1e-6 ? targetHeight / size.y : 1;
    // Offset is in pre-scale local units; the wrapper <group scale={scale}> scales it too, so the
    // base lands at the wrapper's y and x/z are centered on the wrapper origin.
    const offset: [number, number, number] = [-center.x, -box.min.y, -center.z];
    return { object, scale, offset };
  }, [gltf, url, targetHeight, keepName]);
}

function Model({
  url,
  targetHeight,
  keepName,
  position,
  rotationY = 0,
  extraScale = 1,
}: {
  url: string;
  targetHeight: number;
  keepName?: string;
  position: [number, number, number];
  rotationY?: number;
  extraScale?: number;
}) {
  const { object, scale, offset } = useNormalizedModel(url, targetHeight, keepName);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale * extraScale}>
      <group position={offset}>
        {/* `object` is a clone(true) of useGLTF's cached scene: the node wrappers are ours but the
            geometry/material are SHARED with the cache, so we deliberately do NOT dispose here
            (it would corrupt the cache). GoldenSlice mounts once for the session. */}
        <primitive object={object} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/tree.glb");
useGLTF.preload("/models/cliff.glb");

export default function GoldenSlice() {
  return (
    // Own WORLD_SCALE group — shares terrain coordinates WITHOUT joining the terrain group
    // (the camera Box3-fit and Ball raycast depend on that group's exact contents).
    <group scale={WORLD_SCALE}>
      <group position={CORNER_CENTER}>
        {/* Backing pad over the cleared corner, just above the old cube tops (y=0) to avoid
            z-fighting; opaque so no voxel shows through. Dark grass-green so any sliver between the
            dense blades reads as shadowed grass, not soil (real textured terrain is a later lift).
            Kept flat (Ball floats correctly over it — see Ball.tsx hold-on-miss). */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.4, 3.4]} />
          <meshStandardMaterial color="#274a2b" roughness={0.98} metalness={0} />
        </mesh>

        <Suspense fallback={null}>
          {/* Each Model keeps ONE set member (the whole set scatters if normalized together).
              Different members + positions/rotations/scales make the corner read as a varied
              vignette, not a tiled stamp. Rocks dropped below y=0 read as floating-island edges. */}
          {/* Hero cliff on the outer -X/-Z rim. */}
          <Model url="/models/cliff.glb" targetHeight={3.0} keepName="Rock_1" position={[-1.5, -0.8, -1.5]} extraScale={1.3} />
          {/* Scattered boulder + small stone for ground variety. */}
          <Model url="/models/cliff.glb" targetHeight={0.9} keepName="Rock_2" position={[1.1, 0, -0.9]} rotationY={1.2} />
          <Model url="/models/cliff.glb" targetHeight={0.55} keepName="Rock_3" position={[-0.5, 0, 1.1]} rotationY={2.5} />
          {/* Hero tree + a smaller second tree, different members, planted on the pad. */}
          <Model url="/models/tree.glb" targetHeight={2.6} keepName="NormalTree_3" position={[0.5, 0, 0.6]} />
          <Model url="/models/tree.glb" targetHeight={1.7} keepName="NormalTree_1" position={[-1.0, 0, 0.9]} rotationY={2.0} />
        </Suspense>

        {/* Dense enough to fully hide the flat pad — area matches the pad so blades reach the edge. */}
        <GrassField area={3.4} count={4500} />
      </group>
    </group>
  );
}
