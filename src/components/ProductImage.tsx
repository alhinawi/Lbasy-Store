import Image, { type ImageProps } from "next/image";

/** next/image that also accepts data: and blob: URLs (photos added in demo mode). */
export function ProductImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const raw = src.startsWith("data:") || src.startsWith("blob:");
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} unoptimized={raw || props.unoptimized} />;
}
