import { NextRequest, NextResponse } from "next/server";
import { verifyBackupCode } from "@/lib/mfa";
import { decryptData } from "@/lib/encryption";
import { hasAdminAccess, MFA_VERIFIED_COOKIE_NAME, getMFASessionCookieOptions } from "@/lib/access";
import { getUserByUsername } from "@/lib/localDataStore";
import {
  checkSecurityRateLimit,
  clearSecurityFailures,
  getClientIp,
  registerSecurityFailure,
} from "@/lib/securityRateLimit";
import { logSecurityEvent } from "@/lib/securityLogger";

export async function POST(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    logSecurityEvent(request, {
      event: "mfa.backup",
      level: "warn",
      outcome: "failure",
      reason: "unauthorized",
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientIp = getClientIp(request);
    const precheck = checkSecurityRateLimit("mfa_backup", clientIp);

    if (!precheck.allowed) {
      logSecurityEvent(request, {
        event: "mfa.backup",
        level: "warn",
        outcome: "failure",
        reason: "rate_limited",
        metadata: { retryAfterSeconds: precheck.retryAfterSeconds },
      });

      return NextResponse.json(
        { error: "Too many backup-code attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(precheck.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await request.json()) as {
      username?: string;
      backup_code?: string;
    };

    const username = body.username || "command-center";
    const backupCode = body.backup_code?.trim();

    if (!backupCode) {
      logSecurityEvent(request, {
        event: "mfa.backup",
        level: "warn",
        outcome: "failure",
        reason: "missing_backup_code",
      });

      return NextResponse.json(
        { error: "Backup code required" },
        { status: 400 }
      );
    }

    const user = getUserByUsername(username);

    if (!user || !user.backup_codes_encrypted) {
      return NextResponse.json(
        { error: "User or backup codes not found" },
        { status: 404 }
      );
    }

    // Decrypt backup codes
    const decrypted = decryptData(user.backup_codes_encrypted);

    if (!decrypted) {
      return NextResponse.json(
        { error: "Failed to decrypt backup codes" },
        { status: 500 }
      );
    }

    const backupCodes: string[] = JSON.parse(decrypted);
    const isValid = verifyBackupCode(backupCode, backupCodes);

    if (!isValid) {
      const failure = registerSecurityFailure("mfa_backup", clientIp);

      logSecurityEvent(request, {
        event: "mfa.backup",
        level: "warn",
        outcome: "failure",
        reason: "invalid_backup_code",
        metadata: {
          remainingAttempts: failure.remainingAttempts,
          locked: failure.locked,
          retryAfterSeconds: failure.retryAfterSeconds,
        },
      });

      return NextResponse.json(
        { error: "Invalid backup code" },
        { status: 401 }
      );
    }

    clearSecurityFailures("mfa_backup", clientIp);

    logSecurityEvent(request, {
      event: "mfa.backup",
      level: "info",
      outcome: "success",
      user: username,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Backup code verified",
    });

    // Set MFA verified cookie
    response.cookies.set(
      MFA_VERIFIED_COOKIE_NAME,
      "verified",
      getMFASessionCookieOptions()
    );

    return response;
  } catch (error) {
    logSecurityEvent(request, {
      event: "mfa.backup",
      level: "error",
      outcome: "failure",
      reason: "exception",
      metadata: { message: error instanceof Error ? error.message : "unknown" },
    });

    const message = error instanceof Error ? error.message : "Backup code verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
