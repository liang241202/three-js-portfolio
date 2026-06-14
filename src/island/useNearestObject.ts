import { islandObjects } from "@/src/island/data/objects";

// Nearest eligible interactable from a character XZ position (spec §10 rules 1-3).
// Eligible when horizontal distance to the object <= object.radius; nearest wins.
// XZ-only: the character floats above terrain and objects sit at ground level, so a
// horizontal test keeps the interaction radius behaving predictably.
export function findNearestObjectId(x: number, z: number): string | null {
  let nearestId: string | null = null;
  let nearestDist = Infinity;
  for (const o of islandObjects) {
    const dx = x - o.position[0];
    const dz = z - o.position[2];
    const dist = Math.hypot(dx, dz);
    if (dist <= o.radius && dist < nearestDist) {
      nearestDist = dist;
      nearestId = o.id;
    }
  }
  return nearestId;
}
