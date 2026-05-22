"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Group, Object3D, PerspectiveCamera, Vector3 } from "three";

export type CameraRigHandle = {
  pivot: Group;
};

type Props = {
  fitTarget: Object3D | null;
  distanceMultiplier?: number;
};

const CameraRig = forwardRef<CameraRigHandle, Props>(function CameraRig(
  { fitTarget, distanceMultiplier = 2 },
  ref,
) {
  const pivotRef = useRef<Group>(null!);
  const { camera } = useThree();

  useImperativeHandle(
    ref,
    () => ({
      get pivot() {
        return pivotRef.current;
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

  return <group ref={pivotRef} />;
});

export default CameraRig;