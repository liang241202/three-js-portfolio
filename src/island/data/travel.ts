import type { IslandObject, TravelDestination } from "@/src/island/types";
import { islandObjects } from "@/src/island/data/objects";
import { ISLAND_HALF_EXTENT } from "@/src/island/useIslandBoundary";
import { outwardStopDistance } from "@/src/island/collision";

// Quick-travel destinations = the 5 portfolio (open-card) objects; the temple is never a destination (spec §10.1).
export const travelDestinations: TravelDestination[] = islandObjects
  .filter((o) => o.interaction.action === "open-card")
  .map((o) => ({ id: o.id, label: o.label }));

// Float offset the Ball settles to above ground (mirror src/character/Ball.tsx FLOAT_OFFSET).
const FLOAT_OFFSET = 0.5;
// Keep the landing this far inside the walkable square so the player never spawns on the edge.
const BOUNDARY_MARGIN = 0.3;
// Land this far OUTSIDE the object's solid collider so the first move after a teleport doesn't pop
// the Ball back to the surface (cross-model review 2026-06-18).
const LANDING_MARGIN = 0.1;

// Distance from (x,z) along outward unit vector (ux,uz) to the square walkable boundary: the
// smallest positive hit against the four walls at +/-ISLAND_HALF_EXTENT. Returns 0 if the ray is
// degenerate or the nearest wall lies behind the point along (ux,uz) (e.g. the point is on/outside
// the boundary in that direction) — so for the outward direction used here the landing never crosses
// the edge.
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

  // Sit just outside the object's solid collider so the prompt is available and the first move
  // doesn't pop the Ball back out, but never past the walkable boundary. The stop distance rests the
  // Ball perpendicular to the face the outward ray presents (so a rectangular footprint stops at its
  // real face). It stays under the interaction radius (1.5) for the current five destinations (worst
  // ~1.47), so the prompt shows on arrival — see outwardStopDistance's note; not guaranteed in general.
  const room = maxOutwardOffset(x, z, ux, uz) - BOUNDARY_MARGIN;
  const offset = Math.max(0, Math.min(outwardStopDistance(target, ux, uz) + LANDING_MARGIN, room));

  return [x + ux * offset, y + FLOAT_OFFSET, z + uz * offset];
}
