import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP. Area /admin (sempre dinamica): script solo con nonce per richiesta.
 * Sito pubblico (pagine statiche, nessun nonce possibile): script inline consentiti, tutto il resto chiuso.
 */
function csp(nonce: string | null): string {
  const scripts = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-inline'`;
  return [
    `default-src 'self'`,
    `script-src ${scripts}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `media-src 'self'`,
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `frame-src https://maps.google.com https://www.google.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    const isLogin = pathname === "/admin/login";
    if (!session && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (session && isLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  const nonce = isAdmin ? Buffer.from(crypto.randomUUID()).toString("base64") : null;
  const policy = csp(nonce);
  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (isAdmin) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  matcher: [
    // Pagine e API; esclusi asset statici e prefetch (che non devono ricevere una nuova CSP/nonce).
    {
      source: "/((?!_next/static|_next/image|favicon.ico|videos/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
