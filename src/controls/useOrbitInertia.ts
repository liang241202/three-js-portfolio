"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Camera, Group, Quaternion, Vector3 } from "three";
import type { DraggingRef, PivotRef } from "./types";

const FRICTION = 0.9;
const WORLD_UP = new Vector3(0, 1, 0);

// Vertical (pitch) limit. The default view looks down from (d,d,d), i.e. ~35.26 deg above the
// horizon; the orbit may tilt within +/-PITCH_RANGE of that (a ~30 deg vertical window) but never
// swings overhead or under the island. Yaw (left/right) stays unrestricted. Set PITCH_RANGE to 0
// for a hard "left/right only" lock.
const DEFAULT_ELEVATION = Math.asin(1 / Math.sqrt(3)); // the (1,1,1) view angle, ~0.6155 rad
const PITCH_RANGE = (15 * Math.PI) / 180;
const MIN_ELEVATION = DEFAULT_ELEVATION - PITCH_RANGE;
const MAX_ELEVATION = DEFAULT_ELEVATION + PITCH_RANGE;

// Apply a vertical (pitch) drag, clamped so the view's elevation stays within
// [MIN_ELEVATION, MAX_ELEVATION]. The target elevation is clamped FIRST, then the pivot is rotated by
// the minimal rotation mapping the current view direction onto one with the SAME azimuth and the
// clamped elevation. That minimal rotation's axis is the horizontal axis perpendicular to the view
// heading, so it changes elevation only (no azimuth drift) and lands exactly on the target; because
// the target is always in-band the elevation never nears the pole and never folds, at any drag size.
function applyClampedPitch(pivot: Group, camera: Camera, ay: number) {
  const dir = new Vector3().copy(camera.position).applyQuaternion(pivot.quaternion).normalize();
  const elevation = Math.asin(Math.max(-1, Math.min(1, dir.y)));
  // Dragging down (ay > 0) raises the camera; the band caps how far it can go.
  const target = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, elevation + ay));
  if (Math.abs(target - elevation) < 1e-6) return;
  const h = Math.hypot(dir.x, dir.z) || 1e-6;
  const cos = Math.cos(target);
  const desired = new Vector3((dir.x / h) * cos, Math.sin(target), (dir.z / h) * cos).normalize();
  pivot.quaternion.premultiply(new Quaternion().setFromUnitVectors(dir, desired));
}

export function useOrbitInertia(pivotRef: PivotRef, draggingRef?: DraggingRef) {
  const { gl, camera } = useThree();
  const state = useRef({
    dragging: false,
    inertiaActive: false,
    prev: { x: 0, y: 0 },
    yawVelocity: 0,
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
      // Mirror src/main.js:92-93 - signal drag activity so useResetView can cancel any in-progress
      // reset on the next useFrame tick.
      if (draggingRef) draggingRef.current = true;
      const dx = e.clientX - state.current.prev.x;
      const dy = e.clientY - state.current.prev.y;
      const ax = dx * 0.005;
      const ay = dy * 0.005;
      // Yaw about WORLD up (free; keeps the horizon level), then pitch about the live right axis
      // with the elevation clamped to the band before it is applied.
      pivot.quaternion.premultiply(new Quaternion().setFromAxisAngle(WORLD_UP, -ax));
      applyClampedPitch(pivot, camera, ay);
      // Inertia carries the horizontal spin only - vertical is clamped, so there is no pitch fling.
      state.current.yawVelocity = -ax;
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
  }, [gl, camera, pivotRef, draggingRef]);

  useFrame(() => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const s = state.current;
    if (s.inertiaActive && !s.dragging) {
      if (Math.abs(s.yawVelocity) > 0.0001) {
        // Azimuth-only spin about world up preserves elevation, so no re-clamp is needed here.
        pivot.quaternion.premultiply(new Quaternion().setFromAxisAngle(WORLD_UP, s.yawVelocity));
        s.yawVelocity *= FRICTION;
      } else {
        s.inertiaActive = false;
      }
    }
  });
}
