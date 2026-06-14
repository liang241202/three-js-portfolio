// Island world-scale knobs (added 2026-06-14, Gate A "放大世界" refinement).
//
// WORLD_SCALE enlarges the LAYOUT — object ring positions (so objects sit farther apart),
// the walkable boundary, the spawn point, and the terrain size. Because CameraRig auto-fits
// the terrain Box3, enlarging the world does NOT change on-screen size on its own; the camera
// distance is reduced separately in SceneRoot.
//
// OBJECT_SCALE is a deliberately gentle, *non-proportional* boost to each object's visual size
// (the goal is spacing, not chunky props), kept well below WORLD_SCALE.
//
// To resize the island later, change WORLD_SCALE here. Vertical anchors (temple/spawn y) are
// terrain-height dependent and tuned by hand, not derived from these knobs.
export const WORLD_SCALE = 1.5;
export const OBJECT_SCALE = 1.15;
