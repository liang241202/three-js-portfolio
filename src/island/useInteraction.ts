"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Mesh } from "three";
import type { PortfolioCard } from "@/src/island/types";
import { getIslandObject } from "@/src/island/data/objects";
import { getPortfolioCard } from "@/src/island/data/cards";
import { computeTeleportLanding } from "@/src/island/data/travel";
import { findNearestObjectId } from "@/src/island/useNearestObject";

export type UseInteraction = {
  /** Stable callback for InteractionDriver to report the nearest object id. */
  onNearestChange: (id: string | null) => void;
  /** Mirrors "a panel is open"; read in useWASD's frame loop to pause movement. */
  pausedRef: RefObject<boolean>;
  /** Bottom-center prompt text, or null when nothing is active / a panel is open. */
  promptText: string | null;
  /** Card to show in the right-side panel, or null. */
  activeCard: PortfolioCard | null;
  travelOpen: boolean;
  closeCard: () => void;
  closeTravel: () => void;
  /** Teleport near a destination object, then close the travel panel (spec §10.1). */
  onSelectDestination: (destinationId: string) => void;
};

// Owns interaction state (spec §10). Hot values are mirrored into refs so the single
// window key listener never needs to re-subscribe as the player walks around.
export function useInteraction(characterRef: RefObject<Mesh | null>): UseInteraction {
  const [nearestObjectId, setNearestObjectId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [travelOpen, setTravelOpen] = useState(false);

  const panelOpen = openCardId !== null || travelOpen;

  // Mirror "a panel is open" into a ref for useWASD's frame loop. Written in a layout effect
  // (not during render, per react-hooks/refs) so the pause is committed before the next
  // animation frame — WASD never advances a frame after a panel opens.
  const pausedRef = useRef(false);
  useLayoutEffect(() => {
    pausedRef.current = panelOpen;
  }, [panelOpen]);

  const onNearestChange = useCallback((id: string | null) => setNearestObjectId(id), []);
  const closeCard = useCallback(() => setOpenCardId(null), []);
  const closeTravel = useCallback(() => setTravelOpen(false), []);

  const onSelectDestination = useCallback(
    (destinationId: string) => {
      const target = getIslandObject(destinationId);
      const mesh = characterRef.current;
      if (target && mesh) {
        const [x, y, z] = computeTeleportLanding(target);
        mesh.position.set(x, y, z);
        // Sync nearest to the landing point now, so it isn't stale (center-temple) until the
        // throttled driver re-samples — otherwise a fast E could reopen travel (Codex review).
        setNearestObjectId(findNearestObjectId(x, z));
      }
      // Close panel after selecting; teleport does NOT auto-open the destination card (spec §10.1).
      setTravelOpen(false);
    },
    [characterRef],
  );

  // Re-subscribes when the relevant state changes so the handler always sees fresh values
  // without reading refs during render. These changes are user-paced (low frequency).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        // Pressing E while a panel is open does nothing in v1 (spec §10 rule 7).
        if (panelOpen) return;
        if (!nearestObjectId) return;
        const obj = getIslandObject(nearestObjectId);
        if (!obj) return;
        if (obj.interaction.action === "open-card" && obj.interaction.targetCardId) {
          setOpenCardId(obj.interaction.targetCardId);
        } else if (obj.interaction.action === "open-travel") {
          setTravelOpen(true);
        }
      } else if (e.key === "Escape") {
        if (openCardId !== null) setOpenCardId(null);
        else if (travelOpen) setTravelOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, nearestObjectId, openCardId, travelOpen]);

  const activeCard = openCardId ? getPortfolioCard(openCardId) ?? null : null;
  const promptText =
    !panelOpen && nearestObjectId
      ? getIslandObject(nearestObjectId)?.interaction.prompt ?? null
      : null;

  return {
    onNearestChange,
    pausedRef,
    promptText,
    activeCard,
    travelOpen,
    closeCard,
    closeTravel,
    onSelectDestination,
  };
}
