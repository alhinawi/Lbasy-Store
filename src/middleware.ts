import { NextResponse, type NextRequest } from "next/server";

// Kept as middleware.ts (Edge runtime) instead of proxy.ts: the Cloudflare adapter
// fully supports Edge middleware, while Node.js proxy support there is experimental.
// Arabic is the default language and lives at the root (/shop, /product/...).
// English lives under /en. Internally both are served by app/[lang].
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/ar${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api|admin|og|_next|products|brand|icons|favicon.ico|icon|apple-icon|opengraph-image|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
