// Elliptical walkable boundary (spec §11). The ellipse (semi-axes 4.3) sits inside the
// 10x10 terrain (x,z in [-4.5,4.5]) so the character stops before the island edge and never
// walks out over the cosmic void. A circle is the equal-axis special case kept here for v1.
export const ISLAND_SEMI_AXIS_X = 4.3;
export const ISLAND_SEMI_AXIS_Z = 4.3;

export function isInsideIsland(x: number, z: number): boolean {
  return (
    (x * x) / (ISLAND_SEMI_AXIS_X * ISLAND_SEMI_AXIS_X) +
      (z * z) / (ISLAND_SEMI_AXIS_Z * ISLAND_SEMI_AXIS_Z) <=
    1
  );
}
