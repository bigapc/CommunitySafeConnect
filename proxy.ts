import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildContentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'";
  const connectSrc = isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    connectSrc,
    "form-action 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
  ].filter(Boolean);

  return directives.join("; ");
}

export function proxy(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isMutating = MUTATING_METHODS.has(request.method.toUpperCase());

  // CSRF protection: for browser-based state-changing API requests,
  // require Origin to match the current app origin.
  if (isApiRoute && isMutating) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const expectedOrigin = request.nextUrl.origin;

    if (origin && origin !== expectedOrigin) {
      return NextResponse.json(
        { error: "CSRF check failed (origin mismatch)." },
        { status: 403 }
      );
    }

    if (!origin && fetchSite === "cross-site") {
      return NextResponse.json(
        { error: "CSRF check failed (cross-site request blocked)." },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Apply CSP to all non-API requests.
  if (!isApiRoute) {
    response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
