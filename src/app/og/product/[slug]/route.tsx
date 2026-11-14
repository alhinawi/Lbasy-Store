import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/data";

/** Loads an image as a data URL. Local files come from the site's static assets. */
async function toDataUrl(src: string, reqUrl: string) {
  try {
    const url = new URL(src, reqUrl);
    let res: Response | undefined;
    if (src.startsWith("/")) {
      // On Cloudflare, read the file through the ASSETS binding instead of a network call.
      try {
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const { env } = await getCloudflareContext({ async: true });
        const assets = (env as { ASSETS?: { fetch: (u: string) => Promise<Response> } }).ASSETS;
        if (assets) res = await assets.fetch(url.toString());
      } catch {
        // Not running on Cloudflare (next dev / next start): fall back to a normal fetch.
      }
    }
    res ??= await fetch(url);
    if (!res.ok) return "";
    const type = res.headers.get("content-type") ?? "image/webp";
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${type};base64,${btoa(bin)}`;
  } catch {
    return "";
  }
}

// Share image for a product: the photo, the brand, size and price.
// Text is Latin only because the image renderer does not shape Arabic.
export async function GET(req: Request, ctx: RouteContext<"/og/product/[slug]">) {
  const { slug } = await ctx.params;
  const p = await getProduct(slug);
  if (!p) return new Response("Not found", { status: 404 });

  const img = p.images[0] ? await toDataUrl(p.images[0], req.url) : "";
  const price = new Intl.NumberFormat("en-EG").format(p.price);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f6f1e7", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 660, padding: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#b4502a" }} />
            <div style={{ fontSize: 34, letterSpacing: 6, color: "#17150f", fontWeight: 700 }}>LBASY</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, letterSpacing: 4, color: "#6f675a", textTransform: "uppercase" }}>{p.brand}</div>
            <div style={{ fontSize: 52, color: "#17150f", lineHeight: 1.1, marginTop: 10 }}>{p.name_en}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
              <div style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, border: "2px solid #ddd2bf", color: "#3a352b" }}>{`Size ${p.size}`}</div>
              <div style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, background: "#1d4b48", color: "#fbf8f2" }}>One of a kind</div>
            </div>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#b4502a" }}>{`EGP ${price}`}</div>
        </div>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={img} width={540} height={630} style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: 540, height: 630, background: "#ebe1cf" }} />
        )}
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
