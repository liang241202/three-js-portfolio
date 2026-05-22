"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, Raycaster, Vector3 } from "three";

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
  terrainRef: React.RefObject<Group | null>;
  initialPosition?: [number, number, number];
};

export default function Ball({ terrainRef, initialPosition = [0, 2, 0] }: Props) {
  const meshRef = useRef<Mesh>(null!);
  const raycaster = useRef(new Raycaster()).current;
  const floatTime = useRef(0);
  const lastGroundY = useRef(0);
  const origin = useRef(new Vector3());

  // Mirror src/main.js:196-220 updateFloatingCharacter, driven by R3F useFrame
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

  // Mirror src/main.js:29-35 - SphereGeometry(0.3, 16, 16), MeshStandardMaterial color 0xff7788, castShadow
  return (
    <mesh ref={meshRef} position={initialPosition} castShadow>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={0xff7788} />
    </mesh>
  );
}