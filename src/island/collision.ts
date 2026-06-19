import type { IslandObject } from "@/src/island/types";
import { getIslandObject, islandObjects } from "@/src/island/data/objects";
import { TEMPLE_PILLARS } from "@/src/island/templeBase";

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

// The temple body is NOT a collider — it is the walkable hub the Ball climbs onto (TempleFloorCollider
// raycasts its base top as the floor). Its four corner pillars ARE solid, so the Ball can stand on the
// base and weave between them but can't walk through them (handoff candidate 2, 2026-06-19). XZ-only,
// like every collider here, so the pillars block at ground level and on top of the base alike.
function templePillarColliders(): Collider[] {
  const temple = getIslandObject("center-temple");
  if (!temple) return [];
  const s = temple.visual.scale?.[0] ?? 1;
  const [tx, , tz] = temple.position;
  const half = TEMPLE_PILLARS.half * s;
  const off = TEMPLE_PILLARS.offset * s;
  return [-1, 1].flatMap((sx) =>
    [-1, 1].map((sz) => ({
      round: false as const,
      x: tx + sx * off,
      z: tz + sz * off,
      hx: half,
      hz: half,
    })),
  );
}

// Built once from the static registry. Movement and teleport landing both read this list.
export const COLLIDERS: Collider[] = [
  ...islandObjects.filter((o) => o.id !== "center-temple").map(objectCollider),
  ...templePillarColliders(),
];

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
// rest just outside the collider — i.e. where its closest-point distance to the footprint equals
// BALL_RADIUS, matching resolveCollision. Round: r + BALL_RADIUS. Box: the Ball stops perpendicular to
// whichever face/corner the ray presents, so for an oblique approach this is farther out than the bare
// surface distance; measuring it along the ray instead (the naive min(hx/|ux|, hz/|uz|)) lands the Ball
// a hair inside the collider and the first post-teleport move pops it (the 2026-06-18 bug, for boxes).
// result + travel's LANDING_MARGIN must stay under the interaction radius (1.5) or the on-arrival
// prompt won't fire (spec §10.1). That holds for the current five destinations (worst ~1.47,
// project-02) but is NOT general — a larger footprint or a near-45 corner approach can exceed 1.5.
// Re-check if a destination is repositioned or grown.
export function outwardStopDistance(target: IslandObject, ux: number, uz: number): number {
  const c = objectCollider(target);
  if (c.round) return c.r + BALL_RADIUS;
  const ax = Math.abs(ux);
  const az = Math.abs(uz);
  const r = BALL_RADIUS;
  // distToBox along the ray is monotonic from 0 (at center), so it crosses r exactly once; whichever
  // boundary piece below is geometrically valid is that crossing. Take the smallest valid distance.
  let best = Infinity;
  // Rest against an x-face: |d*ux| = hx + r, valid only while still within the z half-extent there.
  if (ax > 1e-9) {
    const d = (c.hx + r) / ax;
    if (d * az <= c.hz) best = Math.min(best, d);
  }
  // Rest against a z-face.
  if (az > 1e-9) {
    const d = (c.hz + r) / az;
    if (d * ax <= c.hx) best = Math.min(best, d);
  }
  // Rest against a corner: outer root of (ax*d - hx)^2 + (az*d - hz)^2 = r^2 (A = ux^2+uz^2 = 1).
  const B = -2 * (c.hx * ax + c.hz * az);
  const C = c.hx * c.hx + c.hz * c.hz - r * r;
  const disc = B * B - 4 * C;
  if (disc >= 0) {
    const d = (-B + Math.sqrt(disc)) / 2;
    if (d * ax >= c.hx - 1e-9 && d * az >= c.hz - 1e-9) best = Math.min(best, d);
  }
  return Number.isFinite(best) ? best : Math.max(c.hx, c.hz) + r; // degenerate direction (island center)
}
