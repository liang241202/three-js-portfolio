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
      const drop: Object3D[] = [];
      object.traverse((o) => {
        if (/_\d+$/.test(o.name) && o.name !== keepName) drop.push(o);
      });
      drop.forEach((o) => o.removeFromParent());
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
  }, [gltf, targetHeight, keepName]);
}

function Model({
  url,
  targetHeight,
  keepName,
  position,
  extraScale = 1,
}: {
  url: string;
  targetHeight: number;
  keepName?: string;
  position: [number, number, number];
  extraScale?: number;
}) {
  const { object, scale, offset } = useNormalizedModel(url, targetHeight, keepName);
  return (
    <group position={position} scale={scale * extraScale}>
      <group position={offset}>
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
        {/* Stylized ground pad over the cleared corner, just above the old cube tops (y=0) to
            avoid z-fighting; opaque so no voxel shows through. Kept flat (Ball floats correctly
            over it — see Ball.tsx hold-on-miss). Colors tuned to the pack palette in Task 5. */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.4, 3.4]} />
          <meshStandardMaterial color="#4f7a3a" roughness={0.95} metalness={0} />
        </mesh>

        <Suspense fallback={null}>
          {/* Single rock (the set scatters if normalized whole) on the outer -X/-Z rim, dropped
              below the surface so it reads as a floating-island cliff edge. */}
          <Model url="/models/cliff.glb" targetHeight={2.8} keepName="Rock_1" position={[-1.4, -0.6, -1.4]} extraScale={1.3} />
          {/* Hero tree (one of the 5 in the set), planted on the pad. */}
          <Model url="/models/tree.glb" targetHeight={2.2} keepName="NormalTree_3" position={[0.4, 0, 0.4]} />
        </Suspense>

        <GrassField area={3.0} count={400} />
      </group>
    </group>
  );
}
