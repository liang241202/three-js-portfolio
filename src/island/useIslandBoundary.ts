import { WORLD_SCALE } from "@/src/island/layout";

// Square walkable boundary (spec §11). The terrain is a 10x10 grid of unit cubes scaled by
// WORLD_SCALE: the outer edge sits at +/-(5*WORLD_SCALE) and the OUTERMOST cube centers at
// +/-(4.5*WORLD_SCALE). Clamping to those cube centers lets the player roam the whole square island
// — corners included — while the Ball (radius 0.3 << cube half 0.75*WORLD_SCALE) stays fully
// supported on the edge cubes. This replaces the earlier inscribed ellipse, which left the corners
// and a wide rim unreachable and read as a too-small circle (2026-06-18). The climb-gate raycast in
// useWASD remains the backstop for plateau/peak edges.
export const ISLAND_HALF_EXTENT = 4.5 * WORLD_SCALE;

export function isInsideIsland(x: number, z: number): boolean {
  return Math.abs(x) <= ISLAND_HALF_EXTENT && Math.abs(z) <= ISLAND_HALF_EXTENT;
}
