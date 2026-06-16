import type { IslandObject } from "@/src/island/types";
import { OBJECT_SCALE, WORLD_SCALE } from "@/src/island/layout";

// Island Interaction Slice v1 object registry (spec §7 — ids are FIXED, do not rename).
// Base layout is authored at WORLD_SCALE = 1: pentagon ring radius 3.3 on the 10x10 terrain.
// Vertex angles 90 / 90+/-72 / 90+/-144, mapped x = r*cos(theta), z = -r*sin(theta) (north = -z),
// so contact-beacon sits north. scaleObject() below spreads x,z by WORLD_SCALE so the objects
// sit farther apart, and gives visuals a gentle OBJECT_SCALE boost.
//
// position.y is a hand-tuned ground anchor (terrain-height dependent) and is intentionally NOT
// scaled — every base y below is already the final world y for the current terrain.
const INTERACT_RADIUS = 1.5; // NOT scaled with the world (Gate A 2026-06-14): objects spread
// apart but keep their original interaction reach, so adjacent interaction radii stay distinct.

const baseObjects: IslandObject[] = [
  {
    id: "contact-beacon",
    kind: "contact",
    label: "Contact Beacon",
    position: [0, 0, -3.3],
    radius: INTERACT_RADIUS,
    visual: { primitive: "cylinder", color: "#c9d1d9", scale: [1.4, 1.4, 1.4] },
    interaction: { prompt: "Press E to contact", action: "open-card", targetCardId: "contact" },
  },
  {
    id: "project-01",
    kind: "project",
    label: "Featured Project",
    position: [3.14, 0, -1.02],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#e0a83a", scale: [1.4, 1.4, 1.4] },
    interaction: { prompt: "Press E to inspect project", action: "open-card", targetCardId: "project-01" },
  },
  {
    id: "project-02",
    kind: "project",
    label: "Secondary Project",
    position: [1.94, 0, 2.67],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#8a8f98", scale: [1.4, 1.4, 1.4] },
    interaction: { prompt: "Press E to inspect project", action: "open-card", targetCardId: "project-02" },
  },
  {
    id: "about-grove",
    kind: "about",
    label: "About Grove",
    position: [-3.14, 0, -1.02],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#5b8c43", scale: [1.4, 1.4, 1.4] },
    interaction: { prompt: "Press E to meet the builder", action: "open-card", targetCardId: "about" },
  },
  {
    id: "skills-workbench",
    kind: "skills",
    label: "Skills Workbench",
    position: [-1.94, 0, 2.67],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#9c6b3f", scale: [1.4, 1.4, 1.4] },
    interaction: { prompt: "Press E to inspect tools", action: "open-card", targetCardId: "skills" },
  },
  {
    id: "center-temple",
    kind: "utility",
    label: "Temple",
    // y re-seated to 1.5 (was 1): the temple sits flush on the PLATEAU, not the peak. The terrain
    // is now scaled uniformly by WORLD_SCALE, so the plateau top rose 1.0 -> 1.5. The temple is a
    // sibling (not scaled), so its base is lifted by that same +0.5 delta to stay flush on the
    // plateau surface — no floating gap for the Ball to walk under. (An earlier pass used the
    // peak's +1.0 delta by mistake, which left the base hovering 0.5 above the plateau.) The
    // central peak cube still pokes up through one corner as before. Hand-tuned, terrain-height
    // dependent; interaction is XZ-only (useNearestObject) so this y is purely visual.
    position: [0, 1.5, 0],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#bfae8e", scale: [1.6, 1.6, 1.6] },
    interaction: { prompt: "Press E to travel", action: "open-travel" },
  },
];

// Spread positions by WORLD_SCALE (x,z only — y is a ground anchor) and give visuals a gentle,
// non-proportional OBJECT_SCALE boost. ids/kind/interaction pass through frozen (spec §7 contract).
function scaleObject(o: IslandObject): IslandObject {
  const [x, y, z] = o.position;
  const s = o.visual.scale;
  return {
    ...o,
    position: [x * WORLD_SCALE, y, z * WORLD_SCALE],
    visual: {
      ...o.visual,
      scale: s ? [s[0] * OBJECT_SCALE, s[1] * OBJECT_SCALE, s[2] * OBJECT_SCALE] : s,
    },
  };
}

export const islandObjects: IslandObject[] = baseObjects.map(scaleObject);

export function getIslandObject(id: string): IslandObject | undefined {
  return islandObjects.find((o) => o.id === id);
}
