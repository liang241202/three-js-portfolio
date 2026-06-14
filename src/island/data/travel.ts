import type { IslandObject, TravelDestination } from "@/src/island/types";
import { islandObjects } from "@/src/island/data/objects";

// Quick-travel destinations = the 5 portfolio (open-card) objects; the temple is never a destination (spec §10.1).
export const travelDestinations: TravelDestination[] = islandObjects
  .filter((o) => o.interaction.action === "open-card")
  .map((o) => ({ id: o.id, label: o.label }));

// Float offset the Ball settles to above ground (mirror src/character/Ball.tsx FLOAT_OFFSET).
const FLOAT_OFFSET = 0.5;

// Land the character just inside the destination's interaction radius so its prompt is
// immediately available (spec §10.1). Landing sits between the object and the island center.
export function computeTeleportLanding(target: IslandObject): [number, number, number] {
  const [x, y, z] = target.position;
  const horiz = Math.hypot(x, z);
  const inset = Math.min(target.radius * 0.8, horiz); // ~1.2 world units in from the object
  // Unit vector from the object toward the island center (origin); fall back to no offset at center.
  const dx = horiz > 1e-6 ? -x / horiz : 0;
  const dz = horiz > 1e-6 ? -z / horiz : 0;
  return [x + dx * inset, y + FLOAT_OFFSET, z + dz * inset];
}
