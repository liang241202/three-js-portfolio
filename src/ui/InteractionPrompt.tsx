"use client";

import type { InteractionPromptProps } from "@/src/island/types";

export function InteractionPrompt({ prompt }: InteractionPromptProps) {
  if (prompt === null) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="flex max-w-[min(92vw,34rem)] items-center gap-3 rounded-full border border-amber-200/20 bg-stone-950/78 px-4 py-2.5 text-sm text-stone-100 shadow-[0_18px_60px_rgba(0,0,0,0.42)] ring-1 ring-white/10 backdrop-blur-md">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-amber-200/35 bg-amber-200/12 font-mono text-xs font-semibold text-amber-100 shadow-[0_0_22px_rgba(245,158,11,0.18)]"
        >
          E
        </span>
        <span className="leading-5 tracking-wide text-stone-100/92">{prompt}</span>
      </div>
    </div>
  );
}

export default InteractionPrompt;
