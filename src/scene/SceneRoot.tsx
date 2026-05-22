"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import CameraRig, { type CameraRigHandle } from "./CameraRig";

export default function SceneRoot() {
  const rigRef = useRef<CameraRigHandle>(null);

  return (
    <Canvas
      camera={{ fov: 75, near: 0.01, far: 2000, position: [10, 10, 10] }}
      gl={{ antialias: true }}
    >
      {/* Mirror src/main.js:20-21 - lights */}
      <directionalLight intensity={1} position={[5, 10, 7.5]} />
      <ambientLight intensity={0.3} />

      {/* fitTarget intentionally null until WBS-5 supplies real terrain */}
      <CameraRig ref={rigRef} fitTarget={null} />

      {/* WBS-5: <Terrain /> will mount here (with shared ref enabling Box3 fit) */}
    </Canvas>
  );
}