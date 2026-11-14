import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Lang } from "@/lib/types";

export function SectionHead({
  title,
  eyebrow,
  more,
  moreLabel,
  lang,
}: {
  title: string;
  eyebrow?: string;
  more?: string;
  moreLabel?: string;
  lang: Lang;
}) {
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="h-display text-[26px] sm:text-3xl">{title}</h2>
      </div>
      {more && (
        <Link href={more} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink-soft hover:text-clay">
          {moreLabel}
          <Arrow className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
