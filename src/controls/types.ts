import type { Group, Mesh } from "three";
import type { RefObject } from "react";

export type PivotRef = RefObject<Group | null>;
export type CharacterRef = RefObject<Mesh | null>;
export type TerrainRef = RefObject<Group | null>;

// Shared cancel signal between useOrbitInertia and useResetView.
// Mirrors src/main.js:92-93 - while left-drag is active, an in-progress
// R-reset animation must cancel. CameraRig owns the ref, writes from
// useOrbitInertia, reads from useResetView.
export type DraggingRef = RefObject<boolean>;