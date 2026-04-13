/**
 * Session Revocation Endpoint
 *
 * Force logout of a specific session by ID.
 * Only admins can revoke sessions.
 *
 * Request body:
 *   - sessionId: string (required)
 *   - reason?: string (optional, logged for audit)
 *
 * Response: { success: boolean, message?: string }
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { revokeSession, getSessionRecord } from "@/lib/sessionActivityStore";
import { logSecurityEvent } from "@/lib/securityLogger";

export const dynamic = "force-dynamic";

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
    const { sessionId, reason } = await request.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "sessionId is required",
        },
        { status: 400 }
      );
    }

    const session = await getSessionRecord(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: `Session ${sessionId} not found`,
        },
        { status: 404 }
      );
    }

    const revoked = await revokeSession(sessionId);

    if (revoked) {
      // Log the revocation as a security event
      logSecurityEvent(request, {
        event: "session.revoked",
        level: "info",
        outcome: "success",
        reason: reason || "admin_action",
        metadata: {
          revokedSessionId: sessionId,
          revokedOrganization: session.organizationId,
          revokedScope: session.scope,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Session ${sessionId} revoked`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Session could not be revoked",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Session revocation error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to process session revocation",
      },
      { status: 500 }
    );
  }
}
