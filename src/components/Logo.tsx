import type { Lang } from "@/lib/types";

/** Tag-shaped mark: a clothing price tag with a hole, the brand's symbol. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 3.5 39 14v26.5a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V14L24 3.5Z"
        fill="var(--color-clay)"
      />
      <circle cx="24" cy="15" r="3.6" fill="var(--color-paper)" />
      <path
        d="M17 26.5c0 6.4 3 10 7.3 10 3.7 0 6.7-2.6 6.7-7.6v-5.6"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="31" cy="19.6" r="1.9" fill="var(--color-paper)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { lang: Lang; className?: string }) {
  return <span className={`fashion-wordmark ${className}`} dir="ltr">LBASY<small>PORT SAID · REWEAR</small></span>;
}
