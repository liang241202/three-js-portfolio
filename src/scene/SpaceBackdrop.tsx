"use client";

import { BackSide } from "three";
import { GradientTexture, Stars } from "@react-three/drei";

// Cosmic-night backdrop (spec §11 "floating world suspended in space"): a large inward-facing sphere
// with a vertical indigo -> near-black gradient, plus a slow starfield. Purely atmospheric — drawn
// behind everything (fog disabled so the stars stay crisp), it lights and collides with nothing.
export default function SpaceBackdrop() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[600, 32, 32]} />
        <meshBasicMaterial side={BackSide} fog={false} depthWrite={false}>
          <GradientTexture stops={[0, 0.55, 1]} colors={["#181641", "#0a0a1f", "#050308"]} size={512} />
        </meshBasicMaterial>
      </mesh>
      <Stars radius={260} depth={70} count={3500} factor={5} saturation={0} speed={0.4} fade />
    </group>
  );
}
