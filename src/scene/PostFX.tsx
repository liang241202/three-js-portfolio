"use client";

import type { RefObject } from "react";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import EdgeReveal from "./EdgeRevealEffect";

// Signature "polished mobile game" sheen. The renderer's own tone mapping is disabled (see SceneRoot
// gl.toneMapping = NoToneMapping) so the scene reaches this composer in HDR: Bloom can then isolate
// the true emissive highlights (beacon light, rune pad, project panels/screen — all authored with
// emissiveIntensity > 1) and bloom them into a soft glow without washing out the lit diffuse. A soft
// Vignette frames the island, and ACES tone mapping is applied LAST so the glow is mapped to screen
// correctly. Mounted last in the Canvas so it post-processes the whole frame.
//
// EdgeReveal runs FIRST: during the intro it converts the frame into glowing violet edges (which then
// bloom); once START is pressed it eases to a pass-through, so the rest of the chain is untouched.
export default function PostFX({ introStartedRef }: { introStartedRef: RefObject<boolean> }) {
  return (
    <EffectComposer>
      <EdgeReveal startedRef={introStartedRef} />
      <Bloom
        intensity={1.7}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        radius={0.9}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.65} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
