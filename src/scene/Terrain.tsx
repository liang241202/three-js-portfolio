"use client";

import { useMemo } from "react";
import { BoxGeometry } from "three";

type Props = {
  rows?: number;
  cols?: number;
  size?: number;
  // Cells (keyed `${i}-${j}`) to skip RENDERING, so GoldenSlice's stylized art replaces the voxels
  // there. A skipped cube has NO mesh, so it also leaves the Ball's raycast set (the Ball probes
  // `terrain.children`): the useWASD climb gate requires a ground hit to advance, so it BLOCKS the
  // Ball from stepping onto a cleared cell, and the float probe holds Y on a miss — i.e. the cleared
  // corner becomes a non-walkable scenic vista with no fall-through (walkability there is out of
  // scope for the slice). The camera Box3-fit is unaffected: row 0 / col 0 keep cubes at j,i>=3, so
  // the island's min-x/min-z bounds don't move. Absent = current behavior (backward compatible).
  hideCells?: ReadonlySet<string>;
};

// Mirror src/main.js:259-283 generateGround
export default function Terrain({ rows = 10, cols = 10, size = 1, hideCells }: Props) {
  const cubes = useMemo(() => {
    const halfW = (cols * size) / 2;
    const halfH = (rows * size) / 2;
    const geometry = new BoxGeometry(size, size, size);
    const items: { key: string; pos: [number, number, number]; color: number }[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const key = `${i}-${j}`;
        if (hideCells?.has(key)) continue;
        const isDark = (i + j) % 2 === 0;
        let height = 0;
        if (i >= 3 && i <= 6 && j >= 3 && j <= 6) height = 1;
        // Cosmic-night palette (Gate A 2026-06-18): slate rock at the base, mossy green on the raised
        // plateau, each with a subtle two-tone checker so it reads as textured stone, not a chessboard.
        const color = height > 0 ? (isDark ? 0x46583f : 0x52664a) : (isDark ? 0x363f4e : 0x3e4a59);
        // The legacy lone peak (i===5 && j===5 -> height 2) was dropped 2026-06-16: it sits hidden
        // under the temple, and a cube taller than the temple's walkable floor would poke through it
        // and fight the TempleFloorCollider (the Ball would jitter up onto the stub). The temple
        // floor is now the island's central high point.
        items.push({
          key,
          pos: [
            j * size - halfW + size / 2,
            height * size - 0.5,
            i * size - halfH + size / 2,
          ],
          color,
        });
      }
    }
    return { items, geometry };
  }, [rows, cols, size, hideCells]);

  return (
    <group>
      {cubes.items.map((c) => (
        <mesh key={c.key} position={c.pos} geometry={cubes.geometry} receiveShadow>
          <meshStandardMaterial color={c.color} roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}