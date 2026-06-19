import type { IslandObject } from "@/src/island/types";
import { islandObjects } from "@/src/island/data/objects";

// Shared collision footprint math so movement (useWASD) and teleport landing (travel.ts) agree on
// where an object's solid surface is. They were computed independently before, which let a teleport
// drop the Ball inside the surface the collider stops it at, so the first move after a teleport popped
// the Ball outward (cross-model review 2026-06-18). Single source of truth lives here.

// Mirror src/character/Ball.tsx sphereGeometry radius.
export const BALL_RADIUS = 0.3;

// A solid footprint the Ball cannot enter. The objects are never rotated, so an axis-aligned box is
// exact and fixes the square-corner clip the old inscribed circle let through (a circle of radius =
// half-width leaves the box's corners poking out). `round` footprints (the cylinder beacon) keep a
// radial collider because their footprint really is a disc.
export type Collider =
  | { round: true; x: number; z: number; r: number }
  | { round: false; x: number; z: number; hx: number; hz: number };

// Solid half-extent of a box blockout in object-local space (before visual.scale). Most blockouts are
// ~square; the workbench's top is 1.2w x 0.6d, so it gets a wider, shallower footprint — the old
// single circle (radius from scale[0]) over-covered its short side and under-covered its long side.
const DEFAULT_LOCAL_HALF = 0.5;
const LOCAL_FOOTPRINT: Record<string, { hx: number; hz: number }> = {
  "skills-workbench": { hx: 0.6, hz: 0.3 },
};
// Objects whose footprint is a disc, not a box.
const ROUND_IDS = new Set(["contact-beacon"]);

function objectCollider(o: IslandObject): Collider {
  const sx = o.visual.scale?.[0] ?? 1;
  const sz = o.visual.scale?.[2] ?? 1;
  const [x, , z] = o.position;
  if (ROUND_IDS.has(o.id)) {
    return { round: true, x, z, r: DEFAULT_LOCAL_HALF * sx };
  }
  const f = LOCAL_FOOTPRINT[o.id] ?? { hx: DEFAULT_LOCAL_HALF, hz: DEFAULT_LOCAL_HALF };
  return { round: false, x, z, hx: f.hx * sx, hz: f.hz * sz };
}

// Built once from the static registry. Movement and teleport landing both read this list. The temple
// body is excluded — it is the walkable hub the Ball climbs onto via TempleFloorCollider.
export const COLLIDERS: Collider[] = islandObjects
  .filter((o) => o.id !== "center-temple")
  .map(objectCollider);

// Push (x,z) out of any collider it has entered so the Ball rests against the solid surface (XZ only).
// Box colliders use closest-point-on-AABB so corners and long edges block correctly; round colliders
// push radially. The Ball slides along the surface instead of passing through. Returns resolved [x, z].
export function resolveCollision(x: number, z: number): [number, number] {
  for (const c of COLLIDERS) {
    if (c.round) {
      const dx = x - c.x;
      const dz = z - c.z;
      const minDist = c.r + BALL_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 < minDist * minDist && d2 > 1e-8) {
        const push = minDist / Math.sqrt(d2);
        x = c.x + dx * push;
        z = c.z + dz * push;
      }
      continue;
    }
    // Closest point on the AABB to the Ball center, in collider-local space.
    const dx = x - c.x;
    const dz = z - c.z;
    const cx = Math.max(-c.hx, Math.min(dx, c.hx));
    const cz = Math.max(-c.hz, Math.min(dz, c.hz));
    const ox = dx - cx; // from closest point to Ball center
    const oz = dz - cz;
    const d2 = ox * ox + oz * oz;
    if (d2 >= BALL_RADIUS * BALL_RADIUS) continue;
    if (d2 > 1e-8) {
      // Outside the box but within BALL_RADIUS of it: push straight out along the surface normal.
      const push = BALL_RADIUS / Math.sqrt(d2);
      x = c.x + cx + ox * push;
      z = c.z + cz + oz * push;
    } else {
      // Center is inside the box: eject along the shallowest penetration axis.
      const penX = c.hx - Math.abs(dx);
      const penZ = c.hz - Math.abs(dz);
      if (penX < penZ) x = c.x + Math.sign(dx || 1) * (c.hx + BALL_RADIUS);
      else z = c.z + Math.sign(dz || 1) * (c.hz + BALL_RADIUS);
    }
  }
  return [x, z];
}

// Distance from a teleport target's center, along outward unit (ux,uz), at which the Ball comes to
// rest just outside the collider. Round: r + BALL_RADIUS (unchanged). Box: distance to the box surface
// along the ray + BALL_RADIUS — slightly conservative near corners, which only lands the Ball a touch
// farther out (always outside the collider, so resolveCollision never pops the first move). Kept under
// the interaction radius (1.5) so the proximity prompt still fires on arrival.
export function outwardStopDistance(target: IslandObject, ux: number, uz: number): number {
  const c = objectCollider(target);
  if (c.round) return c.r + BALL_RADIUS;
  // Ray from the box center outward exits the surface at t = min(hx/|ux|, hz/|uz|).
  const ax = Math.abs(ux);
  const az = Math.abs(uz);
  let t = Infinity;
  if (ax > 1e-9) t = Math.min(t, c.hx / ax);
  if (az > 1e-9) t = Math.min(t, c.hz / az);
  if (!Number.isFinite(t)) t = Math.max(c.hx, c.hz); // degenerate direction (center of island)
  return t + BALL_RADIUS;
}
