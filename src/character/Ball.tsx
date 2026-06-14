"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, Raycaster, Vector3 } from "three";
import { useWASD } from "@/src/controls/useWASD";
import type { PausedRef } from "@/src/controls/types";

// Mirror src/main.js:37-42 - raycaster + downward vector + float offset
const FLOAT_OFFSET = 0.5;
const DOWN = new Vector3(0, -1, 0);

// Mirror src/main.js:198-202 - 5-point sample offsets (centre + 4 cardinal at radius 0.2)
const SAMPLE_OFFSETS: Vector3[] = [
  new Vector3(0, 1, 0),
  new Vector3(0.2, 1, 0),
  new Vector3(-0.2, 1, 0),
  new Vector3(0, 1, 0.2),
  new Vector3(0, 1, -0.2),
];

type Props = {
  /** Lifted to SceneRoot so proximity detection and quick-travel can read/write the character. */
  characterRef: React.RefObject<Mesh | null>;
  terrainRef: React.RefObject<Group | null>;
  pausedRef?: PausedRef;
  initialPosition?: [number, number, number];
};

export default function Ball({
  characterRef,
  terrainRef,
  pausedRef,
  initialPosition = [0, 2, 3],
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

    let maxGroundY = -Infinity;
    for (const off of SAMPLE_OFFSETS) {
      origin.current.copy(mesh.position).add(off);
      raycaster.set(origin.current, DOWN);
      const hits = raycaster.intersectObjects(terrain.children, true);
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
  useWASD(meshRef, terrainRef, pausedRef);

  // Mirror src/main.js:29-35 - SphereGeometry(0.3, 16, 16), MeshStandardMaterial color 0xff7788, castShadow
  return (
    <mesh ref={meshRef} position={initialPosition} castShadow>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={0xff7788} />
    </mesh>
  );
}