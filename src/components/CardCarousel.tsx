"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "./ProductImage";
import type { Lang } from "@/lib/types";
export function CardCarousel({
  images,
  alt,
  url,
  lang,
  sold,
  priority = false,
}: {
  images: string[];
  alt: string;
  url: string;
  lang: Lang;
  sold: boolean;
  priority?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const touch = useRef({ x: 0, moved: false });
  const photos = images.length ? images : ["/editorial/rack.webp"];
  const ar = lang === "ar";
  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    el.scrollTo({
      left: (ar ? -1 : 1) * next * el.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <div
      className="card-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div
        ref={track}
        className="card-carousel-track no-scrollbar"
        dir={ar ? "rtl" : "ltr"}
        onScroll={() => {
          const el = track.current;
          if (el?.clientWidth)
            setIndex(
              Math.min(
                photos.length - 1,
                Math.round(Math.abs(el.scrollLeft) / el.clientWidth),
              ),
            );
        }}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, moved: false };
        }}
        onTouchMove={(e) => {
          if (Math.abs(e.touches[0].clientX - touch.current.x) > 8)
            touch.current.moved = true;
        }}
        onClickCapture={(e) => {
          if (touch.current.moved) {
            e.preventDefault();
            touch.current.moved = false;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(index + ((e.key === "ArrowRight") !== ar ? 1 : -1));
          } else if (e.key === "Home") {
            e.preventDefault();
            go(0);
          } else if (e.key === "End") {
            e.preventDefault();
            go(photos.length - 1);
          }
        }}
      >
        {photos.map((src, i) => (
          <Link
            key={src + i}
            href={url}
            className="card-carousel-slide"
            tabIndex={i === index ? 0 : -1}
            aria-label={`${alt} (${i + 1}/${photos.length})`}
            aria-hidden={i !== index}
          >
            <ProductImage
              src={src}
              alt={`${alt} - ${ar ? "صورة" : "Photo"} ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover ${sold ? "opacity-60 grayscale-[40%]" : ""}`}
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : "lazy"}
              quality={70}
            />
          </Link>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="card-carousel-arrow card-carousel-prev"
            aria-label={ar ? "الصورة السابقة" : "Previous photo"}
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            type="button"
            className="card-carousel-arrow card-carousel-next"
            aria-label={ar ? "الصورة التالية" : "Next photo"}
            disabled={index === photos.length - 1}
            onClick={() => go(index + 1)}
          >
            {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <div
            className="card-carousel-dots"
            role="group"
            aria-label={ar ? "اختار صورة" : "Choose a photo"}
          >
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${ar ? "صورة" : "Photo"} ${i + 1}`}
                aria-pressed={index === i}
                className={index === i ? "active" : ""}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
