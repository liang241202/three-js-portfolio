"use client";

import type { QuickTravelPanelProps } from "@/src/island/types";

export function QuickTravelPanel({
  open,
  destinations,
  onSelect,
  onClose,
}: QuickTravelPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <section
      className="fixed right-4 top-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm -translate-y-1/2 rounded-2xl border border-amber-100/18 bg-[#11100e]/92 text-stone-100 shadow-[0_24px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl sm:right-8"
      aria-labelledby="quick-travel-heading"
    >
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-amber-200/78">
            Island Map
          </p>
          <h2 id="quick-travel-heading" className="mt-1 text-xl font-semibold text-stone-50">
            Quick travel
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick travel"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/14 bg-white/7 text-lg leading-none text-stone-200 transition hover:border-amber-200/38 hover:bg-amber-200/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200/55"
        >
          <span aria-hidden="true">x</span>
        </button>
      </header>

      <div className="max-h-[min(26rem,64vh)] overflow-y-auto p-3">
        {destinations.length > 0 ? (
          <ul className="space-y-2">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <button
                  type="button"
                  onClick={() => onSelect(destination.id)}
                  className="group flex w-full items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.045] px-4 py-3 text-left text-stone-100 transition hover:border-amber-200/30 hover:bg-amber-200/10 focus:outline-none focus:ring-2 focus:ring-amber-200/55"
                >
                  <span className="text-sm font-medium leading-5">{destination.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-sm text-amber-200/72 transition group-hover:translate-x-0.5 group-hover:text-amber-100"
                  >
                    &gt;
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-5 text-sm leading-6 text-stone-300/78">No destinations available.</p>
        )}
      </div>
    </section>
  );
}

export default QuickTravelPanel;
