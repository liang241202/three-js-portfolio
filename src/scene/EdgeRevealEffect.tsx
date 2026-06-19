"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";

// Intro reveal. The scene first renders as a glowing violet Sobel edge-outline on black — a holographic
// blueprint of the island coming alive — then blooms to full colour from the temple at the island's
// heart when the visitor hits START. `uProgress` 0 -> 1 grows a colour circle out from `uCenter`.
//
// Tuned to be our own rather than a straight homage: the signature cyan is swapped for the scene's
// violet rune-pad glow (#9b7bff), the reveal radiates from the temple instead of wiping bottom-up, and
// the edges carry a drifting scanline shimmer so the blueprint reads as alive. This Effect runs FIRST
// in the EffectComposer so the bright violet edges feed Bloom and glow, and at progress 1 it is a clean
// pass-through so the rest of the chain (Bloom / Vignette / ToneMapping) behaves exactly as before.
//
// Reads `inputBuffer` / `texelSize` / `resolution` (provided to every postprocessing Effect) to run a
// 3x3 Sobel on the rendered scene's luminance — no depth/normal pass, and it works on any future art.
const fragment = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uEdgeColor;
  uniform vec2 uCenter;

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

    // Holographic shimmer: fine scanlines drifting upward + a slow breathing pulse so the blueprint
    // feels alive rather than a static filter. Pushed into HDR so Bloom catches the strong lines.
    float scan = 0.72 + 0.28 * sin(uv.y * 90.0 - uTime * 5.0);
    float pulse = 0.88 + 0.12 * sin(uTime * 1.6);
    vec3 edgeView = uEdgeColor * edge * 1.9 * scan * pulse;

    // Radial reveal blooming out from the temple at uCenter: a colour circle grows to cover the frame.
    vec2 d = uv - uCenter;
    d.x *= resolution.x / resolution.y; // aspect-correct so the bloom stays circular
    float dist = length(d);
    float band = 0.22;
    float radius = mix(-band, 1.7, uProgress); // 1.7 > the farthest aspect-corrected corner, so full
    float reveal = 1.0 - smoothstep(radius - band, radius + band, dist);

    outputColor = vec4(mix(edgeView, inputColor.rgb, reveal), inputColor.a);
  }
`;

class EdgeRevealImpl extends Effect {
  constructor() {
    super("EdgeRevealEffect", fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uProgress", new Uniform(0)],
        ["uTime", new Uniform(0)],
        // Violet rune-pad glow (#9b7bff) — the scene's own identity colour.
        ["uEdgeColor", new Uniform(new Vector3(0.608, 0.482, 1.0))],
        // Screen-space anchor of the temple (island centre), where the colour blooms from.
        ["uCenter", new Uniform(new Vector2(0.5, 0.55))],
      ]),
    });
  }
}

// Drive the reveal at a constant rate once `startedRef` flips true (set by START), so the colour
// circle visibly sweeps out from the temple over REVEAL_SECONDS — a linear ramp, not an exp-ease,
// because the exp-ease front-loads the motion and the small central island would be uncovered almost
// instantly. Built with useMemo + <primitive> rather than wrapEffect: wrapEffect JSON.stringifies its
// props each render, and under React 19 the ref it needs lands in props pointing at a circular three
// object — which throws "Converting circular structure to JSON". A plain primitive sidesteps that and
// lets us mutate the uniforms directly.
const REVEAL_SECONDS = 3.5;

export default function EdgeReveal({ startedRef }: { startedRef: RefObject<boolean> }) {
  const effect = useMemo(() => new EdgeRevealImpl(), []);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame((_, delta) => {
    const time = effect.uniforms.get("uTime");
    if (time) time.value += delta;
    const u = effect.uniforms.get("uProgress");
    if (!u) return;
    const dir = startedRef.current ? 1 : -1;
    u.value = Math.max(0, Math.min(1, u.value + (dir * delta) / REVEAL_SECONDS));
  });
  return <primitive object={effect} dispose={null} />;
}
