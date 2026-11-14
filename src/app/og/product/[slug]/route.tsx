import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getProduct } from "@/lib/data";

// Share image for a product: the photo, the brand, size and price.
// Text is Latin only because the image renderer does not shape Arabic.
export async function GET(_req: Request, ctx: RouteContext<"/og/product/[slug]">) {
  const { slug } = await ctx.params;
  const p = await getProduct(slug);
  if (!p) return new Response("Not found", { status: 404 });

  let img = p.images[0];
  if (img.startsWith("/")) {
    const buf = await readFile(path.join(process.cwd(), "public", img)).catch(() => null);
    img = buf ? `data:image/webp;base64,${buf.toString("base64")}` : "";
  }
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
              <div style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, border: "2px solid #ddd2bf", color: "#3a352b" }}>Size {p.size}</div>
              <div style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, background: "#1d4b48", color: "#fbf8f2" }}>One of a kind</div>
            </div>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#b4502a" }}>EGP {price}</div>
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
