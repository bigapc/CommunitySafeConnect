import { NextRequest, NextResponse } from "next/server";
import {
  buildOidcAuthorizationUrl,
  createOidcNonce,
  normalizeOrganizationId,
  normalizePath,
  normalizeScope,
} from "@/lib/sso";

export async function GET(request: NextRequest) {
  const nextPath = normalizePath(request.nextUrl.searchParams.get("next"));
  const scope = normalizeScope(request.nextUrl.searchParams.get("scope"));
  const organizationId = normalizeOrganizationId(request.nextUrl.searchParams.get("org"));

  const authUrl = buildOidcAuthorizationUrl(request.nextUrl.origin, {
    nextPath,
    organizationId,
    scope,
    nonce: createOidcNonce(),
    issuedAt: Date.now(),
  });

  if (!authUrl) {
    const redirectUrl = new URL("/access", request.url);
    redirectUrl.searchParams.set("next", nextPath);
    redirectUrl.searchParams.set("sso_error", "oidc_not_configured");
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(authUrl, 303);
}
