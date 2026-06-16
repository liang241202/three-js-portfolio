"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, Raycaster, Vector3 } from "three";
import { useWASD } from "@/src/controls/useWASD";
import type { PausedRef, WalkColliderRef } from "@/src/controls/types";
import { WORLD_SCALE } from "@/src/island/layout";

// Mirror src/main.js:37-42 - raycaster + downward vector + float offset
const FLOAT_OFFSET = 0.5;
const DOWN = new Vector3(0, -1, 0);

// Ground-probe origins ride one terrain step (WORLD_SCALE) above the Ball, not a hardcoded 1, so
// the downward ray clears the top of the next-taller cube and actually detects it. With 1.5x cubes a
// fixed +1 origin sits *inside* the plateau/peak (top is 1.5 up); a ray cast from inside the mesh
// finds no down-facing ground, so the Ball never rises and walks into the slope instead of climbing.
// Tying the probe height to WORLD_SCALE keeps float/climb tracking scale-correct, matching the
// useWASD gate (mirror src/main.js:198-202 5-point sample, generalized 2026-06-16). See memory
// island-world-scaling.
const PROBE_Y = WORLD_SCALE;
// 5-point sample offsets (centre + 4 cardinal at horizontal radius 0.2 - the Ball's own footprint).
const SAMPLE_OFFSETS: Vector3[] = [
  new Vector3(0, PROBE_Y, 0),
  new Vector3(0.2, PROBE_Y, 0),
  new Vector3(-0.2, PROBE_Y, 0),
  new Vector3(0, PROBE_Y, 0.2),
  new Vector3(0, PROBE_Y, -0.2),
];

type Props = {
  /** Lifted to SceneRoot so proximity detection and quick-travel can read/write the character. */
  characterRef: React.RefObject<Mesh | null>;
  terrainRef: React.RefObject<Group | null>;
  pausedRef?: PausedRef;
  /** Invisible temple-floor collider; raycast alongside the terrain so the Ball stands on the
   *  temple base instead of clipping through it. */
  walkColliderRef?: WalkColliderRef;
  initialPosition?: [number, number, number];
};

export default function Ball({
  characterRef,
  terrainRef,
  pausedRef,
  walkColliderRef,
  // Spawn x,z scaled with the 1.5x world (south open ground); y unchanged because the base-ground
  // top stays at world y=0 under uniform WORLD_SCALE (base cube: -0.5*s + 0.5*s = 0), so the Ball
  // still settles to its float offset there (Gate A 2026-06-16).
  initialPosition = [0, 2, 4.5],
}: Props) {
  const meshRef = characterRef;
  const raycaster = useRef(new Raycaster()).current;
  const floatTime = useRef(0);
  const lastGroundY = useRef(0);
  const origin = useRef(new Vector3());

  // Mirror src/main.js:190 - floating-character update FIRST in animate()
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const terrain = terrainRef.current;
    if (!mesh || !terrain) return;

    floatTime.current += delta;

    // Probe the terrain plus the temple walk-collider (a sibling of the terrain group), so the Ball
    // floats on the temple base/rune pad instead of sinking through it. Built once per frame.
    const collider = walkColliderRef?.current;
    const targets = collider ? terrain.children.concat(collider) : terrain.children;

    let maxGroundY = -Infinity;
    for (const off of SAMPLE_OFFSETS) {
      origin.current.copy(mesh.position).add(off);
      raycaster.set(origin.current, DOWN);
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) {
        maxGroundY = Math.max(maxGroundY, hits[0].point.y);
      }
    }
    if (maxGroundY > -Infinity) {
      // Mirror src/main.js:212-218 - sin bob (2Hz, x-phase) + climb damping + 0.1 lerp
      const floatOffsetY = Math.sin(floatTime.current * 2 + mesh.position.x) * 0.05;
      let targetY = maxGroundY + FLOAT_OFFSET + floatOffsetY;
      const climbTrend = targetY - lastGroundY.current;
      if (climbTrend > 0.05) targetY -= 0.15;
      else if (climbTrend < -0.05) targetY += 0.1;
      mesh.position.y += (targetY - mesh.position.y) * 0.1;
      lastGroundY.current = maxGroundY;
    }
  });

  // Mirror src/main.js:191 - character movement SECOND in animate().
  // Registering useWASD after the floating useFrame keeps R3F invoke order
  // aligned with the original animate() sequence.
  useWASD(meshRef, terrainRef, pausedRef, walkColliderRef);

  // Mirror src/main.js:29-35 - SphereGeometry(0.3, 16, 16), MeshStandardMaterial color 0xff7788, castShadow
  return (
    <mesh ref={meshRef} position={initialPosition} castShadow>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={0xff7788} />
    </mesh>
  );
}