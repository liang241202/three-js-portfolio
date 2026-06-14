import type { IslandObject } from "@/src/island/types";

// Island Interaction Slice v1 object registry (spec §7 — ids are FIXED, do not rename).
// Positions: pentagon ring radius 3.3 on the existing 10x10 terrain (x,z in [-4.5,4.5]).
// Vertex angles 90 / 90+/-72 / 90+/-144, mapped x = r*cos(theta), z = -r*sin(theta) (north = -z),
// so contact-beacon sits north. y is the ground-anchor; InteractableObject offsets meshes upward.
const INTERACT_RADIUS = 1.5;

export const islandObjects: IslandObject[] = [
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
    position: [0, 1, 0],
    radius: INTERACT_RADIUS,
    visual: { primitive: "box", color: "#bfae8e", scale: [1.6, 1.6, 1.6] },
    interaction: { prompt: "Press E to travel", action: "open-travel" },
  },
];

export function getIslandObject(id: string): IslandObject | undefined {
  return islandObjects.find((o) => o.id === id);
}
