"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Group, Object3D, PerspectiveCamera, Vector3 } from "three";
import { useOrbitInertia } from "@/src/controls/useOrbitInertia";
import { usePan } from "@/src/controls/usePan";
import { useZoom } from "@/src/controls/useZoom";
import { useResetView } from "@/src/controls/useResetView";

export type CameraRigHandle = {
  pivot: Group;
};

type Props = {
  fitTarget: Object3D | null;
  distanceMultiplier?: number;
  /** While false, the window-level R-hold reset is ignored (intro gate up). */
  introStartedRef?: RefObject<boolean>;
};

const CameraRig = forwardRef<CameraRigHandle, Props>(function CameraRig(
  { fitTarget, distanceMultiplier = 2, introStartedRef },
  ref,
) {
  const pivotRef = useRef<Group | null>(null);
  // Shared drag signal: useOrbitInertia writes, useResetView reads to cancel
  // an in-progress R-reset (mirrors src/main.js:92-93).
  const draggingRef = useRef(false);
  const { camera } = useThree();

  useImperativeHandle(
    ref,
    () => ({
      get pivot() {
        return pivotRef.current as Group;
      },
    }),
    [],
  );

  // Mirror src/main.js:6-10 - camera is a child of pivot
  useLayoutEffect(() => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    pivot.add(camera);
    return () => {
      pivot.remove(camera);
    };
  }, [camera]);

  // Mirror src/main.js:247-257 setupInitialCameraView
  useLayoutEffect(() => {
    if (!fitTarget || !(camera instanceof PerspectiveCamera)) return;
    const box = new Box3().setFromObject(fitTarget);
    if (box.isEmpty()) return;
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * distanceMultiplier;
    camera.position.set(distance, distance, distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [fitTarget, camera, distanceMultiplier]);

  // WBS-7: pivot-affecting hooks
  useOrbitInertia(pivotRef, draggingRef);
  usePan(pivotRef);
  useZoom(pivotRef);
  useResetView(pivotRef, draggingRef, introStartedRef);

  return <group ref={pivotRef} />;
});

export default CameraRig;