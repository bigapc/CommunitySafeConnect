/**
 * Active Sessions Endpoint
 *
 * List all active sessions for the current organization.
 * Admins can see their own admin sessions.
 * Organization users can see sessions within their organization.
 *
 * Query params:
 *   - scope: filter by scope ('admin' or 'organization')
 *
 * Response: Array of SessionRecord
 * Headers:
 *   - Cache-Control: no-store (session list changes constantly)
 *   - X-Session-Count: <total count>
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess, hasOrganizationAccess, getCurrentOrganizationId } from "@/lib/access";
import { getActiveSessions, type SessionScope, getSessionCount } from "@/lib/sessionActivityStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const hasAdmin = await hasAdminAccess();
  const hasOrg = await hasOrganizationAccess();

  if (!hasAdmin && !hasOrg) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "This endpoint requires authentication",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const scopeParam = searchParams.get("scope");
  const scopeFilter: SessionScope | null =
    scopeParam === "admin" || scopeParam === "organization" ? scopeParam : null;

  // Admins see all sessions by default; org users see only org-scoped sessions for their tenant.
  let sessions;
  if (hasAdmin) {
    sessions = await getActiveSessions(undefined, scopeFilter || undefined);
  } else {
    const orgId = await getCurrentOrganizationId();
    sessions = await getActiveSessions(orgId, scopeFilter || "organization");
  }

  const count = await getSessionCount();

  return NextResponse.json(sessions, {
    headers: {
      "Cache-Control": "no-store",
      "X-Session-Count": String(count),
    },
  });
}

export async function HEAD(request: NextRequest) {
  const hasAdmin = await hasAdminAccess();
  const hasOrg = await hasOrganizationAccess();

  if (!hasAdmin && !hasOrg) {
    return new NextResponse(null, { status: 403 });
  }

  const count = await getSessionCount();

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Session-Count": String(count),
    },
  });
}
