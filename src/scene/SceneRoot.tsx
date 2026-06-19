"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Group, Mesh, NoToneMapping } from "three";
import { Sparkles } from "@react-three/drei";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import Terrain from "./Terrain";
import SpaceBackdrop from "./SpaceBackdrop";
import SceneLighting from "./SceneLighting";
import PostFX from "./PostFX";
import Ball from "@/src/character/Ball";
import IslandObjects from "@/src/island/IslandObjects";
import TempleFloorCollider from "@/src/island/TempleFloorCollider";
import InteractionDriver from "@/src/island/InteractionDriver";
import { useInteraction } from "@/src/island/useInteraction";
import { travelDestinations } from "@/src/island/data/travel";
import { WORLD_SCALE } from "@/src/island/layout";
import InteractionPrompt from "@/src/ui/InteractionPrompt";
import PortfolioCardPanel from "@/src/ui/PortfolioCardPanel";
import QuickTravelPanel from "@/src/ui/QuickTravelPanel";
import IntroGate from "@/src/ui/IntroGate";

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

  // Invisible walk-collider over the temple base; the Ball raycasts it (alongside the terrain) so it
  // climbs onto the temple floor / rune pad instead of clipping through it.
  const walkColliderRef = useRef<Group | null>(null);

  const {
    onNearestChange,
    pausedRef,
    introStarted,
    introStartedRef,
    startIntro,
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
        // PCF shadow maps give the floating props a real cast shadow on the terrain, which brings back
        // the grounding the removed ContactShadows provided — but driven by the actual key light, so it
        // tracks the bob instead of leaving a trail (handoff candidate 3, 2026-06-19). "percentage"
        // (PCFShadowMap) is explicit because three r184 deprecated the default PCFSoftShadowMap and was
        // silently falling back to exactly this.
        shadows="percentage"
        camera={{ fov: 75, near: 0.01, far: 2000 }}
        // Disable renderer tone mapping so the scene reaches PostFX's EffectComposer in HDR; ACES is
        // applied there as the final effect, after Bloom isolates the emissive highlights.
        gl={{ antialias: true, toneMapping: NoToneMapping }}
      >
        {/* Cosmic void: the island reads as a floating world suspended in space (spec §11). The flat
            base color is a fallback behind the gradient backdrop sphere. */}
        <color attach="background" args={["#070512"]} />

        {/* Cosmic-night dreamscape: gradient sky + starfield, designed teal/magenta env lighting. */}
        <SpaceBackdrop />
        <SceneLighting />

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

        <TempleFloorCollider ref={walkColliderRef} />

        <Ball
          characterRef={characterRef}
          terrainRef={terrainRef}
          pausedRef={pausedRef}
          walkColliderRef={walkColliderRef}
        />

        <InteractionDriver characterRef={characterRef} onNearestChange={onNearestChange} />

        {/* Drifting motes for a dreamy, alive atmosphere over the island. */}
        <Sparkles
          count={45}
          scale={[18, 8, 18]}
          position={[0, 3, 0]}
          size={3}
          speed={0.25}
          opacity={0.5}
          color="#bcdcff"
        />

        <PostFX introStartedRef={introStartedRef} />
      </Canvas>

      <InteractionPrompt prompt={promptText} />
      <PortfolioCardPanel card={activeCard} onClose={closeCard} />
      <QuickTravelPanel
        open={travelOpen}
        destinations={travelDestinations}
        onSelect={onSelectDestination}
        onClose={closeTravel}
      />
      <IntroGate started={introStarted} onStart={startIntro} />
    </div>
  );
}
