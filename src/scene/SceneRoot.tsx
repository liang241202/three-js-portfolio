"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Group } from "three";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import Terrain from "./Terrain";
import Ball from "@/src/character/Ball";

export default function SceneRoot() {
  const rigRef = useRef<CameraRigHandle>(null);

  // Dual-write: ref for sync access (Ball useFrame),
  // state for re-render trigger (CameraRig Box3 fit).
  const terrainRef = useRef<Group | null>(null);
  const [terrainMounted, setTerrainMounted] = useState<Group | null>(null);

  const setTerrain = useCallback((g: Group | null) => {
    terrainRef.current = g;
    setTerrainMounted(g);
  }, []);

  return (
    <Canvas
      camera={{ fov: 75, near: 0.01, far: 2000 }}
      gl={{ antialias: true }}
    >
      {/* Mirror src/main.js:20-21 - lights */}
      <directionalLight intensity={1} position={[5, 10, 7.5]} />
      <ambientLight intensity={0.3} />

      <CameraRig ref={rigRef} fitTarget={terrainMounted} />

      <group ref={setTerrain}>
        <Terrain rows={10} cols={10} size={1} />
      </group>

      <Ball terrainRef={terrainRef} />
    </Canvas>
  );
}