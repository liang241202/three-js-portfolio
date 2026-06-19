"use client";

type Props = {
  started: boolean;
  onStart: () => void;
};

// First-impression intro gate. A screen-fixed DOM sibling of the Canvas (like the other overlays).
// While the scene renders behind it as glowing cyan edges (EdgeReveal), this black panel holds the
// ENTER button and frames the opening shot — it captures pointer events so the camera can't be orbited
// before START. Pressing ENTER eases the colour flood; the gate then fades out and goes
// pointer-events-none so it never swallows clicks meant for the live scene.
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
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.5em] text-[#5fe9d6]/70">
        Interactive Portfolio
      </p>
      <h1
        id="intro-title"
        className="px-6 text-center text-5xl font-semibold tracking-[0.18em] text-[#e8fffb] sm:text-7xl"
        style={{ textShadow: "0 0 24px rgba(95,233,214,0.35)" }}
      >
        FLOATING&nbsp;ISLAND
      </h1>
      <button
        type="button"
        onClick={onStart}
        autoFocus
        className="pointer-events-auto mt-12 rounded-full border border-[#5fe9d6]/60 px-10 py-3 text-sm
          font-semibold uppercase tracking-[0.35em] text-[#bafff5] transition-all duration-300
          hover:border-[#5fe9d6] hover:bg-[#5fe9d6]/10 hover:tracking-[0.45em]
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5fe9d6]"
        style={{ boxShadow: "0 0 28px rgba(95,233,214,0.18), inset 0 0 18px rgba(95,233,214,0.06)" }}
      >
        Enter
      </button>
      <p className="mt-10 text-[11px] uppercase tracking-[0.25em] text-white/35">
        Drag to look&nbsp;&nbsp;·&nbsp;&nbsp;WASD to move&nbsp;&nbsp;·&nbsp;&nbsp;E to interact
      </p>
    </div>
  );
}
