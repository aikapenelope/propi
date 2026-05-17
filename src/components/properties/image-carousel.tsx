"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";

interface ImageCarouselProps {
  images: { id: string; url: string }[];
  alt: string;
}

/**
 * Horizontal snap-scroll image carousel optimised for mobile touch and desktop.
 * Uses native CSS scroll-snap for smooth, 60 fps scrolling on all devices.
 * Arrow buttons appear on hover (desktop only). Dot indicators always visible.
 */
export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = images.length;

  /* ---- track which slide is visible via IntersectionObserver ---- */
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(
    (node: HTMLDivElement | null) => {
      // clean up previous observer
      observerRef.current?.disconnect();
      if (!node) return;

      trackRef.current = node;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(
                (entry.target as HTMLElement).dataset.index ?? 0,
              );
              setActive(idx);
            }
          }
        },
        { root: node, threshold: 0.6 },
      );

      // observe each slide
      for (const child of node.children) {
        observerRef.current.observe(child);
      }
    },
    // re-run when image count changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  /* ---- programmatic scroll ---- */
  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const prev = useCallback(() => {
    const next = active > 0 ? active - 1 : count - 1;
    scrollTo(next);
  }, [active, count, scrollTo]);

  const next = useCallback(() => {
    const n = active < count - 1 ? active + 1 : 0;
    scrollTo(n);
  }, [active, count, scrollTo]);

  /* ---- empty state ---- */
  if (count === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-gray-200 flex items-center justify-center">
        <Building2 className="h-16 w-16 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden">
      {/* Scrollable track */}
      <div
        ref={setupObserver}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            data-index={i}
            className="flex-none w-full snap-center aspect-[16/9] bg-gray-200"
          >
            {img.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={img.url}
                alt={`${alt} — ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Building2 className="h-12 w-12" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Arrow buttons — visible on hover (desktop) */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              aria-label={`Ir a imagen ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === active
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {count > 1 && (
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {active + 1} / {count}
        </div>
      )}
    </div>
  );
}
