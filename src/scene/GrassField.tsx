"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { Color, DoubleSide, InstancedMesh, Object3D, PlaneGeometry, Vector2 } from "three";

const BLADE_HEIGHT = 0.4;

// Wind sway material. Blade modeled with y in [0, BLADE_HEIGHT]; the displacement grows with height
// so the base stays planted (the signature Jordan-Breton grass effect). It is a ShaderMaterial (not a
// postprocessing Effect), so the React-19 wrapEffect pitfall does not apply.
const GrassMaterial = shaderMaterial(
  {
    uTime: 0,
    uWindDir: new Vector2(1, 0.4),
    uColorBottom: new Color("#2f5d34"),
    uColorTop: new Color("#7fae57"),
  },
  /* glsl */ `
    // NB: three injects 'attribute mat4 instanceMatrix;' for a ShaderMaterial on an InstancedMesh
    // (USE_INSTANCING) — declaring it here is a GLSL redefinition error. Only RawShaderMaterial needs it.
    uniform float uTime;
    uniform vec2 uWindDir;
    varying float vH;
    void main() {
      vH = clamp(position.y / ${BLADE_HEIGHT.toFixed(2)}, 0.0, 1.0);
      vec3 p = position;
      float phase = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.7;
      float sway = sin(uTime * 1.6 + phase);
      float w = pow(vH, 1.5) * 0.18;
      p.x += sway * w * uWindDir.x;
      p.z += sway * w * uWindDir.y;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    varying float vH;
    uniform vec3 uColorBottom;
    uniform vec3 uColorTop;
    void main() {
      gl_FragColor = vec4(mix(uColorBottom, uColorTop, vH), 1.0);
    }
  `,
);
extend({ GrassMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    grassMaterial: ThreeElement<typeof GrassMaterial>;
  }
}

type Props = { area: number; count: number };

export default function GrassField({ area, count }: Props) {
  const meshRef = useRef<InstancedMesh>(null);
  const matRef = useRef<{ uTime: number } | null>(null);

  // A few-segment blade so it can bend; pivot moved to the base (y=0) so sway rotates about the root.
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(0.06, BLADE_HEIGHT, 1, 3);
    g.translate(0, BLADE_HEIGHT / 2, 0);
    return g;
  }, []);

  // GrassField uniquely owns this geometry (unlike the GLB clones, which share useGLTF's cache),
  // so dispose it on unmount — matches the useMemo+cleanup pattern in EdgeRevealEffect.
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Scatter the blades once (layout effect: meshRef is set and it runs before paint).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    for (let k = 0; k < count; k++) {
      dummy.position.set((Math.random() - 0.5) * area, 0, (Math.random() - 0.5) * area);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.6 + Math.random() * 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(k, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [area, count]);

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uTime += dt;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <grassMaterial ref={matRef} side={DoubleSide} />
    </instancedMesh>
  );
}
