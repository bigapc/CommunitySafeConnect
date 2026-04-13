/**
 * Bulk Session Revocation Endpoint
 *
 * Force logout multiple sessions in one operation.
 * Only admins can revoke sessions in bulk.
 *
 * Request body:
 *   - scope: "admin" | "organization" | "all" (optional, default: "organization")
 *   - organizationId?: string (optional, applies to organization/all scope)
 *   - reason?: string (optional, logged for audit)
 *
 * Response:
 *   { success: true, revokedCount: number, scope: string, organizationId: string | null }
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { getActiveSessions, revokeSession, type SessionScope } from "@/lib/sessionActivityStore";
import { logSecurityEvent } from "@/lib/securityLogger";

export const dynamic = "force-dynamic";

type BulkScope = "admin" | "organization" | "all";

export async function POST(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "This endpoint requires admin access",
      },
      { status: 403 }
    );
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as {
      scope?: BulkScope;
      organizationId?: string;
      reason?: string;
    };

    const scope: BulkScope = payload.scope || "organization";

    if (scope !== "admin" && scope !== "organization" && scope !== "all") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "scope must be one of: admin, organization, all",
        },
        { status: 400 }
      );
    }

    const organizationId = (payload.organizationId || "").trim().toLowerCase() || null;
    const sessionScope: SessionScope | undefined = scope === "all" ? undefined : scope;
    const orgFilter = scope === "admin" ? undefined : organizationId || undefined;

    const targetSessions = await getActiveSessions(orgFilter, sessionScope);

    let revokedCount = 0;
    for (const session of targetSessions) {
      const revoked = await revokeSession(session.sessionId);
      if (revoked) {
        revokedCount++;
      }
    }

    logSecurityEvent(request, {
      event: "session.bulk_revoked",
      level: "info",
      outcome: "success",
      reason: payload.reason || "admin_bulk_action",
      metadata: {
        scope,
        organizationId,
        targetedCount: targetSessions.length,
        revokedCount,
      },
    });

    return NextResponse.json({
      success: true,
      revokedCount,
      scope,
      organizationId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Failed bulk session revocation",
      },
      { status: 500 }
    );
  }
}