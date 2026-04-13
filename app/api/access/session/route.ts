import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  AccessScope,
  ORGANIZATION_COOKIE_NAME,
  createSessionCookieValue,
  getExpectedAccessCode,
  getPolicyRetentionMaxAgeSeconds,
  getSessionCookieOptions,
} from "@/lib/access";
import { createAuditLog } from "@/lib/localDataStore";
import {
  checkSecurityRateLimit,
  clearSecurityFailures,
  getClientIp,
  registerSecurityFailure,
} from "@/lib/securityRateLimit";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const precheck = checkSecurityRateLimit("access_login", clientIp);

    if (!precheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(precheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await request.json()) as { code?: string; scope?: AccessScope };
    const code = body.code?.trim();
    const scope: AccessScope = body.scope === "admin" ? "admin" : "organization";

    if (!code) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    if (code !== getExpectedAccessCode(scope)) {
      const failure = registerSecurityFailure("access_login", clientIp);

      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }

    clearSecurityFailures("access_login", clientIp);

    const response = NextResponse.json({ ok: true });
    const cookieOptions = getSessionCookieOptions();

    response.cookies.set(ORGANIZATION_COOKIE_NAME, createSessionCookieValue("organization"), cookieOptions);

    if (scope === "admin") {
      response.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue("admin"), cookieOptions);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const retainPolicy = request.nextUrl.searchParams.get("retain") === "policy";
  const scopeParam = request.nextUrl.searchParams.get("scope");
  const scope: AccessScope = scopeParam === "admin" ? "admin" : "organization";
  const retentionMode = retainPolicy ? "policy" : "hard";

  const retentionSeconds = retainPolicy ? getPolicyRetentionMaxAgeSeconds() : null;
  const retainedUntil = retentionSeconds
    ? new Date(Date.now() + retentionSeconds * 1000).toISOString()
    : null;

  createAuditLog({
    action: "logout",
    scope,
    retention_mode: retentionMode,
    retained_until: retainedUntil,
    request_path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ip_address: getClientIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  const response = NextResponse.json({ ok: true, auditLogged: true });

  if (retainPolicy) {
    const policyCookieOptions = getSessionCookieOptions(retentionSeconds || undefined);

    response.cookies.set(
      ORGANIZATION_COOKIE_NAME,
      createSessionCookieValue("organization"),
      policyCookieOptions
    );

    if (scope === "admin") {
      response.cookies.set(
        ADMIN_COOKIE_NAME,
        createSessionCookieValue("admin"),
        policyCookieOptions
      );
    }

    return response;
  }

  response.cookies.delete(ORGANIZATION_COOKIE_NAME);
  response.cookies.delete(ADMIN_COOKIE_NAME);

  return response;
}