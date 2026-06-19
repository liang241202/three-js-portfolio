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
      {/* The key light casts the scene's real shadows. The orthographic shadow frustum is sized to the
          1.5x world (terrain reaches +/-7.5, props a little beyond); normalBias clears the acne the flat
          cube-grid faces would otherwise self-shadow. */}
      <directionalLight
        position={[7, 13, 8]}
        intensity={1.5}
        color="#e6ecff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
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
