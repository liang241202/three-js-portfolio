"use client";

import { useMemo } from "react";
import { BoxGeometry } from "three";

type Props = {
  rows?: number;
  cols?: number;
  size?: number;
};

// Mirror src/main.js:259-283 generateGround
export default function Terrain({ rows = 10, cols = 10, size = 1 }: Props) {
  const cubes = useMemo(() => {
    const halfW = (cols * size) / 2;
    const halfH = (rows * size) / 2;
    const geometry = new BoxGeometry(size, size, size);
    const items: { key: string; pos: [number, number, number]; color: number }[] = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const isDark = (i + j) % 2 === 0;
        const color = isDark ? 0x9fc5e8 : 0xcfe2f3;
        let height = 0;
        if (i >= 3 && i <= 6 && j >= 3 && j <= 6) height = 1;
        // The legacy lone peak (i===5 && j===5 -> height 2) was dropped 2026-06-16: it sits hidden
        // under the temple, and a cube taller than the temple's walkable floor would poke through it
        // and fight the TempleFloorCollider (the Ball would jitter up onto the stub). The temple
        // floor is now the island's central high point.
        items.push({
          key: `${i}-${j}`,
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
  }, [rows, cols, size]);

  return (
    <group>
      {cubes.items.map((c) => (
        <mesh key={c.key} position={c.pos} geometry={cubes.geometry}>
          <meshStandardMaterial color={c.color} />
        </mesh>
      ))}
    </group>
  );
}