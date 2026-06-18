"use client";

import { Environment, Lightformer } from "@react-three/drei";

// Cosmic-night lighting. A cool key light gives form; a low cool ambient lifts the shadows; and an
// image-based Environment built from Lightformers (no network HDR fetch, baked once) wraps the PBR
// materials in soft teal/magenta rim reflections. The env map is what moves the look off the old
// "flat-lit checkerboard" toward a designed, modern scene.
export default function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.28} color="#4a5a8c" />
      <directionalLight position={[7, 13, 8]} intensity={1.5} color="#e6ecff" />
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#dfe7ff"
          position={[0, 9, 3]}
          scale={[12, 12, 1]}
        />
        <Lightformer form="circle" intensity={1.8} color="#2fe6c8" position={[-9, 3, -5]} scale={7} />
        <Lightformer form="circle" intensity={1.5} color="#ff5ea8" position={[9, 2, -7]} scale={7} />
      </Environment>
    </>
  );
}
