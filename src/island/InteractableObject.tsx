"use client";

import type { JSX } from "react";
import { Float } from "@react-three/drei";
import type { IslandObject } from "@/src/island/types";
import { TEMPLE_BASE } from "@/src/island/templeBase";

type Props = {
  object: IslandObject;
};

// Voxel-style blockout per object role (handoff §4). Each object is a small grouped
// primitive cluster anchored at its ground position; local y=0 is the ground plane.
export default function InteractableObject({ object }: Props): JSX.Element {
  const scale = object.visual.scale ?? [1, 1, 1];
  const blockout = renderBlockout(object);
  // Gentle hover on the interactable artifacts — adds life and telegraphs interactivity. The temple
  // is excluded: it is the walkable hub (its base is the Ball's floor via TempleFloorCollider), so it
  // must stay put. Float is purely visual: proximity and teleport read the static data position, so
  // the bob never affects interaction (Gate A 2026-06-18).
  const content =
    object.id === "center-temple" ? (
      blockout
    ) : (
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.5} floatingRange={[0, 0.22]}>
        {blockout}
      </Float>
    );
  return (
    <group position={object.position} scale={scale}>
      {content}
    </group>
  );
}

function renderBlockout(object: IslandObject): JSX.Element {
  const c = object.visual.color;
  switch (object.id) {
    case "contact-beacon":
      // Slim beacon / antenna with a red signal light (distant landmark).
      return (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.8, 8]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.45, 0.12, 0.45]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 1.95, 0]} castShadow>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial color="#ff5566" emissive="#ff2233" emissiveIntensity={1.4} />
          </mesh>
        </group>
      );
    case "project-01":
      // Glowing pedestal + upright panel (featured).
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.9, 0.5, 0.9]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.8, 0.95, 0.12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.1} />
          </mesh>
        </group>
      );
    case "project-02":
      // Stacked blocks + small screen (secondary, distinct from project-01).
      return (
        <group>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.85, 0.4, 0.85]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[0.6, 0.4, 0.6]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.95, 0.28]} castShadow>
            <boxGeometry args={[0.5, 0.36, 0.06]} />
            <meshStandardMaterial color="#1e2630" emissive="#7fd1c0" emissiveIntensity={1.3} />
          </mesh>
        </group>
      );
    case "about-grove":
      // Blocky grove: trunk + foliage + a reading stone.
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial color="#6b4f2f" />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[0.95, 0.75, 0.95]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0.55, 0.12, 0.2]} castShadow>
            <boxGeometry args={[0.4, 0.24, 0.3]} />
            <meshStandardMaterial color="#9aa3ab" />
          </mesh>
        </group>
      );
    case "skills-workbench":
      // Low workbench + crate (workshop / tools).
      return (
        <group>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[1.2, 0.16, 0.6]} />
            <meshStandardMaterial color={c} />
          </mesh>
          {([-0.5, 0.5] as const).map((x) =>
            ([-0.22, 0.22] as const).map((z) => (
              <mesh key={`leg-${x}-${z}`} position={[x, 0.27, z]} castShadow>
                <boxGeometry args={[0.12, 0.55, 0.12]} />
                <meshStandardMaterial color="#6b4f2f" />
              </mesh>
            )),
          )}
          <mesh position={[0.62, 0.24, 0.0]} castShadow>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshStandardMaterial color="#b98a55" />
          </mesh>
        </group>
      );
    case "center-temple":
      // Blocky temple / portal plaza with a glowing rune pad (utility hub). The base slab geometry
      // is shared with TempleFloorCollider (TEMPLE_BASE) so the Ball's walkable floor matches it.
      return (
        <group>
          <mesh position={[0, TEMPLE_BASE.localY, 0]} castShadow>
            <boxGeometry args={[TEMPLE_BASE.width, TEMPLE_BASE.height, TEMPLE_BASE.width]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.9, 0.06, 0.9]} />
            <meshStandardMaterial color="#2a2333" emissive="#9b7bff" emissiveIntensity={1.4} />
          </mesh>
          {([-0.6, 0.6] as const).map((x) =>
            ([-0.6, 0.6] as const).map((z) => (
              <mesh key={`pillar-${x}-${z}`} position={[x, 0.85, z]} castShadow>
                <boxGeometry args={[0.22, 1.1, 0.22]} />
                <meshStandardMaterial color={c} />
              </mesh>
            )),
          )}
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[1.7, 0.26, 1.7]} />
            <meshStandardMaterial color={c} />
          </mesh>
        </group>
      );
    default:
      // Fallback: render the declared primitive so unknown ids still appear.
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color={c} />
        </mesh>
      );
  }
}
