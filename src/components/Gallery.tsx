"use client";

import { useRef, useState } from "react";
import { ProductImage } from "./ProductImage";

export function Gallery({ images, alt, sold, soldLabel }: { images: string[]; alt: string; sold: boolean; soldLabel: string }) {
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setIdx(i);
  };

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  return (
    <div className="md:sticky md:top-24">
      <div className="relative -mx-4 sm:mx-0">
        <div ref={track} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-[24px]">
          {images.map((src, i) => (
            <div key={src + i} className="relative aspect-[4/5] w-full shrink-0 snap-start bg-sand">
              <ProductImage
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className={`object-cover ${sold ? "opacity-70" : ""}`}
                quality={85}
              />
            </div>
          ))}
        </div>
        {sold && (
          <span className="absolute start-4 top-4 rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-cream sm:start-5">{soldLabel}</span>
        )}
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`} />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 hidden gap-3 sm:flex">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => go(i)}
              className={`relative aspect-[4/5] w-20 overflow-hidden rounded-xl border-2 transition ${i === idx ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
              aria-label={`${i + 1}`}
            >
              <ProductImage src={src} alt="" fill sizes="80px" className="object-cover" quality={70} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
