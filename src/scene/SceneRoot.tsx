"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Group, Mesh } from "three";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import Terrain from "./Terrain";
import Ball from "@/src/character/Ball";
import IslandObjects from "@/src/island/IslandObjects";
import InteractionDriver from "@/src/island/InteractionDriver";
import { useInteraction } from "@/src/island/useInteraction";
import { travelDestinations } from "@/src/island/data/travel";
import { WORLD_SCALE } from "@/src/island/layout";
import InteractionPrompt from "@/src/ui/InteractionPrompt";
import PortfolioCardPanel from "@/src/ui/PortfolioCardPanel";
import QuickTravelPanel from "@/src/ui/QuickTravelPanel";

export default function SceneRoot() {
  const rigRef = useRef<CameraRigHandle>(null);

  // Dual-write: ref for sync access (Ball useFrame),
  // state for re-render trigger (CameraRig Box3 fit).
  const terrainRef = useRef<Group | null>(null);
  const [terrainMounted, setTerrainMounted] = useState<Group | null>(null);

  const setTerrain = useCallback((g: Group | null) => {
    terrainRef.current = g;
    setTerrainMounted(g);
  }, []);

  // Lifted from Ball so proximity detection and quick-travel can read/write the character.
  const characterRef = useRef<Mesh | null>(null);

  const {
    onNearestChange,
    pausedRef,
    promptText,
    activeCard,
    travelOpen,
    closeCard,
    closeTravel,
    onSelectDestination,
  } = useInteraction(characterRef);

  return (
    // Relative wrapper: Canvas plus screen-fixed HTML overlays as DOM siblings (spec §12).
    <div className="relative h-full w-full">
      <Canvas
        camera={{ fov: 75, near: 0.01, far: 2000 }}
        gl={{ antialias: true }}
      >
        {/* Cosmic void: the island reads as a floating world suspended in space (spec §11). */}
        <color attach="background" args={["#05060a"]} />

        {/* Mirror src/main.js:20-21 - lights */}
        <directionalLight intensity={1} position={[5, 10, 7.5]} />
        <ambientLight intensity={0.3} />

        {/* distanceMultiplier pulled further in (1.3 -> 0.6) so the now-1.5x world reads bigger on
            screen; the Box3 auto-fit otherwise cancels the enlargement (Gate A 2026-06-14). */}
        <CameraRig ref={rigRef} fitTarget={terrainMounted} distanceMultiplier={0.6} />

        {/* Scale the terrain uniformly by WORLD_SCALE so the cubes keep cube proportions while the
            spread-out objects stay on solid ground. Vertical steps grow with the world, but the
            useWASD climb gate derives its probe height from WORLD_SCALE too (scale-correct), so the
            plateau/peak stay climbable and the temple reachable on foot (Gate A 2026-06-16). */}
        <group ref={setTerrain} scale={WORLD_SCALE}>
          <Terrain rows={10} cols={10} size={1} />
        </group>

        <IslandObjects />

        <Ball characterRef={characterRef} terrainRef={terrainRef} pausedRef={pausedRef} />

        <InteractionDriver characterRef={characterRef} onNearestChange={onNearestChange} />
      </Canvas>

      <InteractionPrompt prompt={promptText} />
      <PortfolioCardPanel card={activeCard} onClose={closeCard} />
      <QuickTravelPanel
        open={travelOpen}
        destinations={travelDestinations}
        onSelect={onSelectDestination}
        onClose={closeTravel}
      />
    </div>
  );
}
