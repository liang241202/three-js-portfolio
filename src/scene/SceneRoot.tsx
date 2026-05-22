"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Group } from "three";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import Terrain from "./Terrain";

export default function SceneRoot() {
  const rigRef = useRef<CameraRigHandle>(null);
  const [groundGroup, setGroundGroup] = useState<Group | null>(null);

  return (
    <Canvas
      camera={{ fov: 75, near: 0.01, far: 2000 }}
      gl={{ antialias: true }}
    >
      {/* Mirror src/main.js:20-21 - lights */}
      <directionalLight intensity={1} position={[5, 10, 7.5]} />
      <ambientLight intensity={0.3} />

      {/* CameraRig now has a real fitTarget; Box3 fit will activate after Terrain mounts */}
      <CameraRig ref={rigRef} fitTarget={groundGroup} />

      <group ref={setGroundGroup}>
        <Terrain rows={10} cols={10} size={1} />
      </group>
    </Canvas>
  );
}