import type { IslandObject } from "@/src/island/types";

// Shared collision footprint math so movement (useWASD) and teleport landing (travel.ts) agree on
// where an object's solid surface is. They were computed independently before, which let a teleport
// drop the Ball at 0.825 from center while the collider stops it at 1.105 — so the first move after a
// teleport popped the Ball outward (cross-model review 2026-06-18).

// Mirror src/character/Ball.tsx sphereGeometry radius.
export const BALL_RADIUS = 0.3;

// Approximate solid footprint radius of an interactable's blockout, derived from its visual scale.
// Kept under the interaction radius (1.5) so proximity prompts still fire before the Ball is stopped.
// Single-circle approximation — wide/rectangular objects clipping is a known follow-up.
export function objectCollisionRadius(o: IslandObject): number {
  return 0.5 * (o.visual.scale?.[0] ?? 1);
}

// Distance from an object's center at which the Ball comes to rest against it.
export function objectStopDistance(o: IslandObject): number {
  return objectCollisionRadius(o) + BALL_RADIUS;
}
