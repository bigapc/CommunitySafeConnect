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
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string; scope?: AccessScope };
    const code = body.code?.trim();
    const scope: AccessScope = body.scope === "admin" ? "admin" : "organization";

    if (!code) {
      return NextResponse.json({ error: "Access code is required." }, { status: 400 });
    }

    if (code !== getExpectedAccessCode(scope)) {
      return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
    }

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

  let auditWarning = "";

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("access_audit_logs").insert([
      {
        action: "logout",
        scope,
        retention_mode: retentionMode,
        retained_until: retainedUntil,
        request_path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
        ip_address: getClientIp(request),
        user_agent: request.headers.get("user-agent"),
      },
    ]);

    if (error) {
      auditWarning = "Access updated, but audit logging failed.";
    }
  } catch {
    auditWarning = "Access updated, but audit logging failed.";
  }

  const response = NextResponse.json(
    auditWarning
      ? { ok: true, auditLogged: false, warning: auditWarning }
      : { ok: true, auditLogged: true }
  );

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