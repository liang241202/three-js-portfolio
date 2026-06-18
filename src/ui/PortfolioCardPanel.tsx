"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioCardPanelProps } from "@/src/island/types";

export function PortfolioCardPanel({ card, onClose }: PortfolioCardPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Mirror React state to the browser's real fullscreen status so the button label and layout stay
  // correct however fullscreen is left — including the native ESC exit. (With the card fullscreen,
  // the first ESC exits fullscreen; a second ESC reaches the interaction layer and closes the card.)
  useEffect(() => {
    const sync = () =>
      setFullscreen(
        document.fullscreenElement != null && document.fullscreenElement === panelRef.current,
      );
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Take the panel itself fullscreen (not the whole document) so reading a card is immersive and the
  // 3D scene behind it is hidden. requestFullscreen can reject (e.g. without a user gesture); swallow
  // it — the windowed panel is a fine fallback.
  const toggleFullscreen = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void el.requestFullscreen().catch(() => {});
    }
  }, []);

  if (card === null) {
    return null;
  }

  const hasStack = card.stack !== undefined && card.stack.length > 0;
  const hasHighlights = card.highlights !== undefined && card.highlights.length > 0;
  const hasLinks = card.links !== undefined && card.links.length > 0;

  return (
    <aside
      ref={panelRef}
      className={[
        "fixed right-0 top-0 z-40 h-dvh overflow-hidden bg-[#11100e]/94 text-stone-100 shadow-[0_0_80px_rgba(0,0,0,0.58)] backdrop-blur-xl",
        fullscreen
          ? "w-dvw"
          : "w-full border-l border-amber-100/16 sm:w-[72vw] lg:w-[66.666vw] xl:w-[64vw]",
      ].join(" ")}
      aria-label={`${card.title} portfolio card`}
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-end gap-2 border-b border-white/10 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-full border border-white/14 bg-white/7 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-200 transition hover:border-amber-200/38 hover:bg-amber-200/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200/55"
          >
            {fullscreen ? "Panel" : "Fullscreen"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close portfolio card"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/14 bg-white/7 text-xl leading-none text-stone-200 transition hover:border-amber-200/38 hover:bg-amber-200/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200/55"
          >
            <span aria-hidden="true">x</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <article className="mx-auto max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/82">
              {card.eyebrow}
            </p>
            <h2 className="text-4xl font-semibold leading-[1.02] text-stone-50 sm:text-5xl lg:text-6xl">
              {card.title}
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-200/84 sm:text-xl sm:leading-9">
              {card.summary}
            </p>

            {hasStack ? (
              <section className="mt-10" aria-labelledby={`${card.id}-stack-heading`}>
                <h3
                  id={`${card.id}-stack-heading`}
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400"
                >
                  Stack
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2.5">
                  {card.stack?.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-amber-100/18 bg-amber-100/9 px-3 py-1.5 text-sm text-amber-50/88"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasHighlights ? (
              <section className="mt-10" aria-labelledby={`${card.id}-highlights-heading`}>
                <h3
                  id={`${card.id}-highlights-heading`}
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400"
                >
                  Highlights
                </h3>
                <ul className="mt-5 space-y-4">
                  {card.highlights?.map((highlight) => (
                    <li key={highlight} className="flex gap-4 text-base leading-7 text-stone-200/86">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.46)]"
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasLinks ? (
              <section className="mt-11" aria-labelledby={`${card.id}-links-heading`}>
                <h3 id={`${card.id}-links-heading`} className="sr-only">
                  Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {card.links?.map((link) => (
                    <a
                      key={`${link.label}-${link.href}`}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-amber-200/32 bg-amber-200/12 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:border-amber-100/60 hover:bg-amber-200/20 focus:outline-none focus:ring-2 focus:ring-amber-200/55"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </aside>
  );
}

export default PortfolioCardPanel;
