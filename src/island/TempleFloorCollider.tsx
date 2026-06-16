"use client";

import { forwardRef } from "react";
import type { Group } from "three";
import { getIslandObject } from "@/src/island/data/objects";
import { TEMPLE_BASE } from "@/src/island/templeBase";

// Invisible walk-collider matching the temple's base slab. The Ball's float probe (Ball.tsx) and the
// climb gate (useWASD.ts) raycast this alongside the terrain, so the Ball climbs the ~0.55-high base
// and stands on the rune pad instead of clipping through the floor — those raycasts otherwise see
// only the terrain group and ignore every island object. It reuses the temple's registry transform
// (position + scale) and the shared TEMPLE_BASE geometry, so the walkable surface always matches the
// drawn base. SceneRoot owns the ref and feeds it to the Ball.
const TempleFloorCollider = forwardRef<Group>(function TempleFloorCollider(_props, ref) {
  const temple = getIslandObject("center-temple");
  if (!temple) return null;
  const scale = temple.visual.scale ?? [1, 1, 1];
  return (
    <group ref={ref} position={temple.position} scale={scale}>
      {/* visible={false} renders nothing but stays raycastable — three.js raycasting ignores the
          visible flag — so the box acts as pure, invisible collision over the drawn base slab. */}
      <mesh position={[0, TEMPLE_BASE.localY, 0]} visible={false}>
        <boxGeometry args={[TEMPLE_BASE.width, TEMPLE_BASE.height, TEMPLE_BASE.width]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
});

export default TempleFloorCollider;
