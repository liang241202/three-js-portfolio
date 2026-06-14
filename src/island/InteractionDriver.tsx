"use client";

import type { RefObject } from "react";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { findNearestObjectId } from "@/src/island/useNearestObject";

type Props = {
  characterRef: RefObject<Mesh | null>;
  /** Fired only when the nearest-object id actually changes. */
  onNearestChange: (id: string | null) => void;
};

const THROTTLE_SECONDS = 0.1; // ~10Hz proximity sampling

// Lives inside <Canvas> so it can read the live character position each frame. Throttled,
// and only lifts state to React when the nearest id changes (avoids per-frame re-renders).
export default function InteractionDriver({ characterRef, onNearestChange }: Props): null {
  const acc = useRef(0);
  const currentId = useRef<string | null>(null);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < THROTTLE_SECONDS) return;
    acc.current = 0;

    const mesh = characterRef.current;
    if (!mesh) return;

    const id = findNearestObjectId(mesh.position.x, mesh.position.z);
    if (id !== currentId.current) {
      currentId.current = id;
      onNearestChange(id);
    }
  });

  return null;
}
