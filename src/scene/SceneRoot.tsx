"use client";

import { Canvas } from "@react-three/fiber";

export default function SceneRoot() {
  return (
    <Canvas
      camera={{ fov: 75, near: 0.01, far: 2000, position: [10, 10, 10] }}
      gl={{ antialias: true }}
    >
      {/* lights + scene wired up in WBS-4 */}
    </Canvas>
  );
}