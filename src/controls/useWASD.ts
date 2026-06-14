"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Raycaster, Vector3 } from "three";
import type { CharacterRef, PausedRef, TerrainRef } from "./types";
import { isInsideIsland } from "@/src/island/useIslandBoundary";

const MOVE_SPEED = 2;
const DOWN = new Vector3(0, -1, 0);

export function useWASD(characterRef: CharacterRef, terrainRef: TerrainRef, pausedRef?: PausedRef) {
  const { camera } = useThree();
  const move = useRef({ forward: false, backward: false, left: false, right: false });
  const raycaster = useRef(new Raycaster()).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w") move.current.forward = true;
      if (e.key === "s") move.current.backward = true;
      if (e.key === "a") move.current.left = true;
      if (e.key === "d") move.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w") move.current.forward = false;
      if (e.key === "s") move.current.backward = false;
      if (e.key === "a") move.current.left = false;
      if (e.key === "d") move.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    // Movement pauses while a card / quick-travel panel is open (spec §10 rule 11).
    if (pausedRef?.current) return;

    const char = characterRef.current;
    const terrain = terrainRef.current;
    if (!char || !terrain) return;

    // Mirror src/main.js:222-245 updateCharacterMovement
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const right = new Vector3().crossVectors(direction, new Vector3(0, 1, 0)).normalize();
    const moveVector = new Vector3();
    if (move.current.forward) moveVector.add(direction);
    if (move.current.backward) moveVector.sub(direction);
    if (move.current.left) moveVector.sub(right);
    if (move.current.right) moveVector.add(right);
    if (moveVector.lengthSq() === 0) return;
    moveVector.normalize().multiplyScalar(MOVE_SPEED * delta);

    const futurePosition = char.position.clone().add(moveVector);

    // Island boundary: reject moves that would leave the walkable ellipse (spec §11).
    // The terrain raycast gate below stays as a backstop for plateau/peak edges.
    if (!isInsideIsland(futurePosition.x, futurePosition.z)) return;

    const rayOrigin = futurePosition.clone().add(new Vector3(0, 1, 0));
    raycaster.set(rayOrigin, DOWN);
    const hit = raycaster.intersectObjects(terrain.children, true);
    if (hit.length > 0) {
      const dist = rayOrigin.y - hit[0].point.y;
      if (dist > 0.3) {
        char.position.add(moveVector);
      }
    }
  });
}