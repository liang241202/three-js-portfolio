"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import type { DraggingRef, PivotRef } from "./types";

const R_HOLD_MS = 2000;
const PROGRESS_STEP = 0.02; // 50 frames at 60fps ~= 0.83s ease

export function useResetView(pivotRef: PivotRef, draggingRef?: DraggingRef) {
  const state = useRef({
    rHeld: false,
    rPressedAt: 0,
    returning: false,
    progress: 0,
    startQuat: new Quaternion(),
    startPos: new Vector3(),
  });
  const defaultQuat = useRef(new Quaternion()).current;
  const defaultPos = useRef(new Vector3(0, 0, 0)).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      if (!state.current.rHeld) {
        state.current.rHeld = true;
        state.current.rPressedAt = performance.now();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      state.current.rHeld = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(() => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const s = state.current;

    // Mirror src/main.js:92-93 - left-drag-move cancels in-progress reset.
    if (s.returning && draggingRef?.current) {
      s.returning = false;
      return;
    }

    // Mirror src/main.js:166-188
    if (s.rHeld && !s.returning) {
      const now = performance.now();
      if (now - s.rPressedAt >= R_HOLD_MS) {
        s.rHeld = false;
        s.returning = true;
        s.progress = 0;
        s.startQuat.copy(pivot.quaternion);
        s.startPos.copy(pivot.position);
      }
    }
    if (s.returning) {
      if (s.progress < 1.0) {
        s.progress += PROGRESS_STEP;
        const t = 1 - Math.pow(1 - s.progress, 4); // easeOutQuart
        pivot.quaternion.copy(s.startQuat).slerp(defaultQuat, t);
        pivot.position.lerpVectors(s.startPos, defaultPos, t);
        if (s.progress >= 1.0) {
          pivot.quaternion.copy(defaultQuat);
          pivot.position.copy(defaultPos);
          s.returning = false;
        }
      }
    }
  });
}