"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector3 } from "three";

// Intro reveal. The scene first renders as a glowing cyan Sobel edge-outline on black — a blueprint of
// the island coming alive — then floods to full colour from the ground up when the visitor hits START.
// `uProgress` 0 -> 1 sweeps a soft horizontal wipe from edge-view to the real scene. This Effect runs
// FIRST in the EffectComposer so the bright cyan edges feed Bloom and glow, and so at progress 1 it is
// a pass-through and the rest of the chain (Bloom / Vignette / ToneMapping) behaves exactly as before.
//
// Reads `inputBuffer` / `texelSize` (provided to every postprocessing Effect) to run a 3x3 Sobel on the
// rendered scene's luminance — no depth/normal pass needed, and it works on any future art unchanged.
const fragment = /* glsl */ `
  uniform float uProgress;
  uniform vec3 uEdgeColor;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 t = texelSize;
    float tl = luma(texture2D(inputBuffer, uv + t * vec2(-1.0,  1.0)).rgb);
    float ml = luma(texture2D(inputBuffer, uv + t * vec2(-1.0,  0.0)).rgb);
    float bl = luma(texture2D(inputBuffer, uv + t * vec2(-1.0, -1.0)).rgb);
    float tm = luma(texture2D(inputBuffer, uv + t * vec2( 0.0,  1.0)).rgb);
    float bm = luma(texture2D(inputBuffer, uv + t * vec2( 0.0, -1.0)).rgb);
    float tr = luma(texture2D(inputBuffer, uv + t * vec2( 1.0,  1.0)).rgb);
    float mr = luma(texture2D(inputBuffer, uv + t * vec2( 1.0,  0.0)).rgb);
    float br = luma(texture2D(inputBuffer, uv + t * vec2( 1.0, -1.0)).rgb);
    float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float gy =  tl + 2.0 * tm + tr - bl - 2.0 * bm - br;
    float edge = clamp(sqrt(gx * gx + gy * gy) * 1.4, 0.0, 1.0);

    // Push the edge into HDR so Bloom (luminanceThreshold 0.8) catches the strong lines and they glow.
    vec3 edgeView = uEdgeColor * edge * 1.8;

    // Soft wipe rising from the bottom (uv.y = 0). The boundary travels from below the screen to above
    // it as progress 0 -> 1, so the reveal is fully edge-view at 0 and fully scene at 1.
    float band = 0.28;
    float by = mix(-band, 1.0 + band, uProgress);
    float reveal = 1.0 - smoothstep(by - band, by + band, uv.y);

    outputColor = vec4(mix(edgeView, inputColor.rgb, reveal), inputColor.a);
  }
`;

class EdgeRevealImpl extends Effect {
  constructor() {
    super("EdgeRevealEffect", fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uProgress", new Uniform(0)],
        ["uEdgeColor", new Uniform(new Vector3(0.32, 0.95, 0.88))],
      ]),
    });
  }
}

// Exp-ease the reveal toward 1 once `startedRef` flips true (set by START), so the colour floods in
// over ~2.5s without pulling in a tween dependency. Built with useMemo + <primitive> rather than
// wrapEffect: wrapEffect JSON.stringifies its props each render, and under React 19 the ref it needs
// lands in props and points at a circular three object — which throws "Converting circular structure
// to JSON". A plain primitive sidesteps that entirely and lets us mutate the uniform directly.
const REVEAL_RATE = 0.8; // exp-ease constant; lower = a slower, more savourable colour flood (~3s)

export default function EdgeReveal({ startedRef }: { startedRef: RefObject<boolean> }) {
  const effect = useMemo(() => new EdgeRevealImpl(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame((_, delta) => {
    const u = effect.uniforms.get("uProgress");
    if (!u) return;
    const target = startedRef.current ? 1 : 0;
    u.value += (target - u.value) * Math.min(1, delta * REVEAL_RATE);
    // Snap home: the exp-ease only approaches 1 asymptotically, which would leave a faint cyan edge
    // tint in the top sliver of the screen forever. Land exactly on a clean pass-through.
    if (target === 1 && u.value > 0.999) u.value = 1;
  });
  return <primitive object={effect} dispose={null} />;
}
