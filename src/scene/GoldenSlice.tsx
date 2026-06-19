"use client";

// The outer -X/-Z corner block this slice owns. Single source of truth: SceneRoot hides
// exactly these voxel cells and GoldenSlice draws its art over them, so they cannot drift.
export const GOLDEN_SLICE_CELLS: ReadonlySet<string> = new Set(
  [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => `${i}-${j}`)),
);

// Art (ground + cliff + tree + grass) added in Task 3 / Task 4.
export default function GoldenSlice() {
  return null;
}
