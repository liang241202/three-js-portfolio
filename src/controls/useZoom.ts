"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { PivotRef } from "./types";

const ZOOM_SPEED = 0.5;
const MIN_ZOOM = 3;
const MAX_ZOOM = 50;

export function useZoom(pivotRef: PivotRef) {
  const { gl, camera } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const pivot = pivotRef.current;
      if (!pivot) return;
      const direction = new Vector3().subVectors(pivot.position, camera.position).normalize();
      const delta = e.deltaY > 0 ? 1 : -1;
      const distance = camera.position.distanceTo(pivot.position);
      let newDistance = distance - delta * ZOOM_SPEED;
      newDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newDistance));
      camera.position.copy(
        pivot.position.clone().add(direction.clone().multiplyScalar(-newDistance)),
      );
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [gl, camera, pivotRef]);
}