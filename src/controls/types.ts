import type { Group, Mesh } from "three";
import type { RefObject } from "react";

export type PivotRef = RefObject<Group | null>;
export type CharacterRef = RefObject<Mesh | null>;
export type TerrainRef = RefObject<Group | null>;

// Extra raycast target for the float probe / climb gate: an invisible collision group (currently
// the temple base) the Ball can stand on even though it lives outside the terrain group.
export type WalkColliderRef = RefObject<Group | null>;

// Mirrors "an interaction panel is open". useWASD reads it each frame to pause
// movement without re-registering its frame callback.
export type PausedRef = RefObject<boolean>;

// Shared cancel signal between useOrbitInertia and useResetView.
// Mirrors src/main.js:92-93 - while left-drag is active, an in-progress
// R-reset animation must cancel. CameraRig owns the ref, writes from
// useOrbitInertia, reads from useResetView.
export type DraggingRef = RefObject<boolean>;