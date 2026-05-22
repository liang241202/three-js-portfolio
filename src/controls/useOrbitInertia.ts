"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import type { DraggingRef, PivotRef } from "./types";

const FRICTION = 0.9;

export function useOrbitInertia(pivotRef: PivotRef, draggingRef?: DraggingRef) {
  const { gl } = useThree();
  const state = useRef({
    dragging: false,
    inertiaActive: false,
    prev: { x: 0, y: 0 },
    axis: new Vector3(),
    angle: 0,
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      state.current.dragging = true;
      state.current.prev = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      state.current.dragging = false;
      state.current.inertiaActive = true;
      // Clear drag signal on release so an in-progress reset is no longer cancelled.
      if (draggingRef) draggingRef.current = false;
    };
    const onMove = (e: MouseEvent) => {
      const pivot = pivotRef.current;
      if (!state.current.dragging || !pivot) return;
      // Mirror src/main.js:92-93 - signal drag activity so useResetView can
      // cancel any in-progress reset on the next useFrame tick.
      if (draggingRef) draggingRef.current = true;
      const dx = e.clientX - state.current.prev.x;
      const dy = e.clientY - state.current.prev.y;
      const ax = dx * 0.005;
      const ay = dy * 0.005;
      const up = new Vector3(0, 1, 0).applyQuaternion(pivot.quaternion).normalize();
      const right = new Vector3(1, 0, 0).applyQuaternion(pivot.quaternion).normalize();
      const qY = new Quaternion().setFromAxisAngle(up, -ax);
      const qX = new Quaternion().setFromAxisAngle(right, -ay);
      pivot.quaternion.premultiply(qY).premultiply(qX);
      // Mirror src/main.js:103-104 - axis is up.cross(right) (NOT right.cross(up))
      state.current.axis.copy(up.clone().cross(right).normalize());
      state.current.angle = Math.sqrt(ax * ax + ay * ay);
      state.current.prev = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [gl, pivotRef, draggingRef]);

  useFrame(() => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const s = state.current;
    if (s.inertiaActive && !s.dragging) {
      if (s.angle > 0.0001) {
        const q = new Quaternion().setFromAxisAngle(s.axis, s.angle);
        pivot.quaternion.premultiply(q);
        s.angle *= FRICTION;
      } else {
        s.inertiaActive = false;
      }
    }
  });
}