"use client";

type Props = {
  started: boolean;
  onStart: () => void;
};

// First-impression intro gate. A screen-fixed DOM sibling of the Canvas (like the other overlays).
// While the scene renders behind it as glowing violet edges (EdgeReveal), this panel holds the ENTER
// button and frames the opening shot — it captures pointer events so the camera can't be orbited
// before START. Pressing ENTER eases the colour flood; the gate then fades out, goes pointer-events-none
// and disables the button (removing it from the tab order under aria-hidden) so it neither swallows
// clicks nor traps keyboard focus in the live scene.
export default function IntroGate({ started, onStart }: Props) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity
        duration-700 ease-out ${started ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"}`}
      // Only a light scrim — the cyan Sobel edges rendered behind are the star, so the overlay stays
      // mostly transparent and leans on text-shadow for legibility.
      style={{ background: "rgba(3,2,10,0.28)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      aria-hidden={started}
    >
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.5em] text-[#b9a3ff]/70">
        Interactive Portfolio
      </p>
      <h1
        id="intro-title"
        className="px-6 text-center text-5xl font-semibold tracking-[0.18em] text-[#f1ecff] sm:text-7xl"
        style={{ textShadow: "0 0 24px rgba(155,123,255,0.4)" }}
      >
        FLOATING&nbsp;ISLAND
      </h1>
      <button
        type="button"
        onClick={onStart}
        autoFocus
        disabled={started}
        className="pointer-events-auto mt-12 rounded-full border border-[#9b7bff]/60 px-10 py-3 text-sm
          font-semibold uppercase tracking-[0.35em] text-[#d9ccff] transition-all duration-300
          hover:border-[#9b7bff] hover:bg-[#9b7bff]/10 hover:tracking-[0.45em]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9b7bff]"
        style={{ boxShadow: "0 0 28px rgba(155,123,255,0.2), inset 0 0 18px rgba(155,123,255,0.07)" }}
      >
        Enter
      </button>
      <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-white/35">
        Drag to look&nbsp;&nbsp;·&nbsp;&nbsp;WASD to move&nbsp;&nbsp;·&nbsp;&nbsp;E to interact
      </p>
    </div>
  );
}
