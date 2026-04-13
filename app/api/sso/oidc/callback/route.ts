import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ORGANIZATION_CONTEXT_COOKIE_NAME,
  ORGANIZATION_COOKIE_NAME,
  createOrganizationContextCookieValue,
  createSessionCookieValue,
  getSessionCookieOptions,
} from "@/lib/access";
import { createAuditLog } from "@/lib/localDataStore";
import { getClientIp } from "@/lib/securityRateLimit";
import { getSsoConfig, validateOidcIdToken, verifyOidcState } from "@/lib/sso";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const context = verifyOidcState(state);

  if (!context) {
    return NextResponse.redirect(new URL("/access?sso_error=invalid_state", request.url), 303);
  }

  if (error || !code) {
    const redirectUrl = new URL("/access", request.url);
    redirectUrl.searchParams.set("next", context.nextPath);
    redirectUrl.searchParams.set("sso_error", error || "missing_code");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const config = getSsoConfig(request.nextUrl.origin);

  if (!config.mockMode && (!config.clientId || !config.clientSecret || !config.tokenEndpoint || !config.redirectUri)) {
    const redirectUrl = new URL("/access", request.url);
    redirectUrl.searchParams.set("next", context.nextPath);
    redirectUrl.searchParams.set("sso_error", "oidc_not_configured");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!config.mockMode) {
    try {
      const tokenResponse = await fetch(config.tokenEndpoint as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId as string,
          client_secret: config.clientSecret as string,
          redirect_uri: config.redirectUri as string,
        }),
      });

      if (!tokenResponse.ok) {
        const redirectUrl = new URL("/access", request.url);
        redirectUrl.searchParams.set("next", context.nextPath);
        redirectUrl.searchParams.set("sso_error", "token_exchange_failed");
        return NextResponse.redirect(redirectUrl, 303);
      }

      const tokenPayload = (await tokenResponse.json()) as {
        id_token?: string;
        access_token?: string;
        token_type?: string;
        expires_in?: number;
      };

      const validation = await validateOidcIdToken(
        request.nextUrl.origin,
        tokenPayload,
        context.nonce
      );

      if (!validation.valid) {
        const redirectUrl = new URL("/access", request.url);
        redirectUrl.searchParams.set("next", context.nextPath);
        redirectUrl.searchParams.set("sso_error", validation.error);
        return NextResponse.redirect(redirectUrl, 303);
      }
    } catch {
      const redirectUrl = new URL("/access", request.url);
      redirectUrl.searchParams.set("next", context.nextPath);
      redirectUrl.searchParams.set("sso_error", "oidc_validation_failed");
      return NextResponse.redirect(redirectUrl, 303);
    }
  }

  const cookieOptions = getSessionCookieOptions();
  const redirectUrl = new URL(context.nextPath, request.url);
  const response = NextResponse.redirect(redirectUrl, 303);

  response.cookies.set(
    ORGANIZATION_COOKIE_NAME,
    createSessionCookieValue("organization"),
    cookieOptions
  );

  if (context.scope === "admin") {
    response.cookies.set(
      ADMIN_COOKIE_NAME,
      createSessionCookieValue("admin"),
      cookieOptions
    );
  }

  response.cookies.set(
    ORGANIZATION_CONTEXT_COOKIE_NAME,
    createOrganizationContextCookieValue(context.organizationId),
    cookieOptions
  );

  createAuditLog(context.organizationId, {
    action: "sso_login",
    scope: context.scope,
    retention_mode: "hard",
    retained_until: null,
    request_path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ip_address: getClientIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  return response;
}
