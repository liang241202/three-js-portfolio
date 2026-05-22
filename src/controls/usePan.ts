"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { PivotRef } from "./types";

const PAN_SPEED = 0.01;

export function usePan(pivotRef: PivotRef) {
  const { gl, camera } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    let panning = false;
    let start = { x: 0, y: 0 };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      panning = true;
      start = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: MouseEvent) => {
      if (e.button !== 2) return;
      panning = false;
    };
    const onMove = (e: MouseEvent) => {
      const pivot = pivotRef.current;
      if (!panning || !pivot) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const moveX = -dx * PAN_SPEED;
      const moveY = dy * PAN_SPEED;
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      const right = forward.clone().cross(camera.up).normalize();
      const up = new Vector3().copy(camera.up).normalize();
      pivot.position.add(right.multiplyScalar(moveX));
      pivot.position.add(up.multiplyScalar(moveY));
      start = { x: e.clientX, y: e.clientY };
    };

    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [gl, camera, pivotRef]);
}