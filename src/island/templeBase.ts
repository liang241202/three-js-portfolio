// The temple's base slab. Its TOP face is the walkable floor the Ball stands on, so the geometry is
// shared by the drawn base (InteractableObject) and the invisible walk collider (TempleFloorCollider)
// — that way the surface the Ball lands on always tracks exactly what is rendered. Values are in the
// temple's local space (before the registry position/scale is applied).
export const TEMPLE_BASE = { width: 1.6, height: 0.3, localY: 0.15 } as const;
