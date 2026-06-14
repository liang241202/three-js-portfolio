"use client";

import type { JSX } from "react";
import { islandObjects } from "@/src/island/data/objects";
import InteractableObject from "@/src/island/InteractableObject";

// Renders every interactable from the registry. Pure visual blockout (no interaction here).
export default function IslandObjects(): JSX.Element {
  return (
    <group>
      {islandObjects.map((object) => (
        <InteractableObject key={object.id} object={object} />
      ))}
    </group>
  );
}
