// The temple's base slab. Its TOP face is the walkable floor the Ball stands on, so the geometry is
// shared by the drawn base (InteractableObject) and the invisible walk collider (TempleFloorCollider)
// — that way the surface the Ball lands on always tracks exactly what is rendered. Values are in the
// temple's local space (before the registry position/scale is applied).
export const TEMPLE_BASE = { width: 1.6, height: 0.3, localY: 0.15 } as const;

// The temple's four corner pillars, one at each (+/-offset, +/-offset). Their footprint is solid so
// the Ball is blocked from walking through them, while the base top between them stays walkable. Shared
// by the drawn temple (InteractableObject) and the collider (collision.ts) so the solid box always
// matches what's rendered. Local space (before the registry position/scale). half = square footprint
// half-width.
export const TEMPLE_PILLARS = { offset: 0.6, half: 0.11, height: 1.1, localY: 0.85 } as const;
