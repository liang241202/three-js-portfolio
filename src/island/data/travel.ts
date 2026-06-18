import type { IslandObject, TravelDestination } from "@/src/island/types";
import { islandObjects } from "@/src/island/data/objects";
import { ISLAND_HALF_EXTENT } from "@/src/island/useIslandBoundary";

// Quick-travel destinations = the 5 portfolio (open-card) objects; the temple is never a destination (spec §10.1).
export const travelDestinations: TravelDestination[] = islandObjects
  .filter((o) => o.interaction.action === "open-card")
  .map((o) => ({ id: o.id, label: o.label }));

// Float offset the Ball settles to above ground (mirror src/character/Ball.tsx FLOAT_OFFSET).
const FLOAT_OFFSET = 0.5;
// Keep the landing this far inside the walkable square so the player never spawns on the edge.
const BOUNDARY_MARGIN = 0.3;

// Distance from (x,z) along outward unit vector (ux,uz) to the square walkable boundary: the
// smallest positive hit against the four walls at +/-ISLAND_HALF_EXTENT. Returns 0 if the point is
// already on/outside the square or the ray is degenerate (so the landing never crosses the edge).
function maxOutwardOffset(x: number, z: number, ux: number, uz: number): number {
  let t = Infinity;
  if (ux > 1e-9) t = Math.min(t, (ISLAND_HALF_EXTENT - x) / ux);
  else if (ux < -1e-9) t = Math.min(t, (-ISLAND_HALF_EXTENT - x) / ux);
  if (uz > 1e-9) t = Math.min(t, (ISLAND_HALF_EXTENT - z) / uz);
  else if (uz < -1e-9) t = Math.min(t, (-ISLAND_HALF_EXTENT - z) / uz);
  return t === Infinity ? 0 : Math.max(0, t);
}

// Land the character on the destination's boundary-facing (outer) side so the player arrives
// facing the object and the island center (Gate A 2026-06-14, was previously the inner side).
// The landing stays inside the interaction radius (prompt shows immediately, spec §10.1) and is
// capped so it never crosses the walkable boundary.
export function computeTeleportLanding(target: IslandObject): [number, number, number] {
  const [x, y, z] = target.position;
  const horiz = Math.hypot(x, z);
  // Unit vector from the island center toward the object = the outward direction; no offset at center.
  const ux = horiz > 1e-6 ? x / horiz : 0;
  const uz = horiz > 1e-6 ? z / horiz : 0;

  // Sit ~half the interaction radius out so the prompt is available, but never past the boundary.
  const room = maxOutwardOffset(x, z, ux, uz) - BOUNDARY_MARGIN;
  const offset = Math.max(0, Math.min(target.radius * 0.55, room));

  return [x + ux * offset, y + FLOAT_OFFSET, z + uz * offset];
}
