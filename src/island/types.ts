// Island Interaction Slice v1 — shared data + UI contract.
// Data-before-mesh: meshes and overlays render from these types (spec §8, design brief §"Data before mesh").

export type IslandObjectKind = "project" | "about" | "skills" | "contact" | "utility";

export type IslandObjectAction = "open-card" | "open-travel";

export type IslandObjectPrimitive = "box" | "sphere" | "cylinder" | "custom";

export type IslandObject = {
  id: string;
  kind: IslandObjectKind;
  label: string;
  /** Ground-anchor world position [x, y, z]. Proximity is measured on the XZ plane. */
  position: [number, number, number];
  /** Interaction radius in world units; eligible when horizontal distance <= radius. */
  radius: number;
  visual: {
    primitive: IslandObjectPrimitive;
    color: string;
    scale?: [number, number, number];
  };
  interaction: {
    prompt: string;
    action: IslandObjectAction;
    /** Required for action "open-card"; must match a PortfolioCard.id. */
    targetCardId?: string;
  };
};

export type PortfolioCard = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  stack?: string[];
  highlights?: string[];
  links?: {
    label: string;
    href: string;
  }[];
};

export type TravelDestination = {
  /** IslandObject.id of a portfolio object (the temple is never a destination). */
  id: string;
  label: string;
};

// ---------------------------------------------------------------------------
// FROZEN UI CONTRACT for src/ui/* (Codex implements to exactly these props).
// Do not change shapes without re-syncing the cross-model implementer.
// All three overlays are screen-fixed DOM siblings of <Canvas>, not drei <Html>.
// ---------------------------------------------------------------------------

/** Bottom-center prompt. Renders nothing when `prompt` is null. */
export type InteractionPromptProps = {
  prompt: string | null;
};

/** Right-side ~2/3 card panel with a fullscreen toggle. Renders nothing when `card` is null. */
export type PortfolioCardPanelProps = {
  card: PortfolioCard | null;
  onClose: () => void;
};

/** Quick-travel list shown from the center temple. Renders nothing when `open` is false. */
export type QuickTravelPanelProps = {
  open: boolean;
  destinations: TravelDestination[];
  onSelect: (destinationId: string) => void;
  onClose: () => void;
};
