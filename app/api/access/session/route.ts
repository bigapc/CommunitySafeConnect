import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  AccessScope,
  ORGANIZATION_CONTEXT_COOKIE_NAME,
  ORGANIZATION_COOKIE_NAME,
  createOrganizationContextCookieValue,
  createSessionCookieValue,
  getCurrentOrganizationId,
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
import { logSecurityEvent } from "@/lib/securityLogger";
import { recordSessionActivity } from "@/lib/sessionActivityStore";

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const precheck = checkSecurityRateLimit("access_login", clientIp);

    if (!precheck.allowed) {
      logSecurityEvent(request, {
        event: "auth.login",
        level: "warn",
        outcome: "failure",
        reason: "rate_limited",
        metadata: { retryAfterSeconds: precheck.retryAfterSeconds },
      });

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

    const body = (await request.json()) as {
      code?: string;
      scope?: AccessScope;
      organizationId?: string;
    };
    const code = body.code?.trim();
    const scope: AccessScope = body.scope === "admin" ? "admin" : "organization";
    const organizationId = (body.organizationId || "community-demo-org").trim().toLowerCase();

    if (!code) {
      logSecurityEvent(request, {
        event: "auth.login",
        level: "warn",
        outcome: "failure",
        reason: "missing_access_code",
      });

      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    if (code !== getExpectedAccessCode(scope)) {
      const failure = registerSecurityFailure("access_login", clientIp);

      logSecurityEvent(request, {
        event: "auth.login",
        level: "warn",
        outcome: "failure",
        reason: "invalid_access_code",
        scope,
        metadata: {
          remainingAttempts: failure.remainingAttempts,
          locked: failure.locked,
          retryAfterSeconds: failure.retryAfterSeconds,
        },
      });

      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }

    clearSecurityFailures("access_login", clientIp);

    const response = NextResponse.json({ ok: true });
    const cookieOptions = getSessionCookieOptions();

    response.cookies.set(ORGANIZATION_COOKIE_NAME, createSessionCookieValue("organization"), cookieOptions);

    if (scope === "admin") {
      response.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue("admin"), cookieOptions);
    }

    response.cookies.set(
      ORGANIZATION_CONTEXT_COOKIE_NAME,
      createOrganizationContextCookieValue(organizationId),
      cookieOptions
    );

    // Record this session in the activity store for audit/revocation
    const userAgent = request.headers.get("user-agent") || "unknown";
    recordSessionActivity(organizationId, scope, clientIp, userAgent);

    logSecurityEvent(request, {
      event: "auth.login",
      level: "info",
      outcome: "success",
      scope,
      organizationId,
    });

    return response;
  } catch (error) {
    logSecurityEvent(request, {
      event: "auth.login",
      level: "error",
      outcome: "failure",
      reason: "exception",
      metadata: { message: error instanceof Error ? error.message : "unknown" },
    });

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
  const organizationId = await getCurrentOrganizationId();

  createAuditLog(organizationId, {
    action: "logout",
    scope,
    retention_mode: retentionMode,
    retained_until: retainedUntil,
    request_path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    ip_address: getClientIp(request),
    user_agent: request.headers.get("user-agent"),
  });

  logSecurityEvent(request, {
    event: "auth.logout",
    level: "info",
    outcome: "success",
    scope,
    organizationId,
    metadata: { retentionMode },
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

    response.cookies.set(
      ORGANIZATION_CONTEXT_COOKIE_NAME,
      createOrganizationContextCookieValue(organizationId),
      policyCookieOptions
    );

    return response;
  }

  response.cookies.delete(ORGANIZATION_COOKIE_NAME);
  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete(ORGANIZATION_CONTEXT_COOKIE_NAME);

  return response;
}