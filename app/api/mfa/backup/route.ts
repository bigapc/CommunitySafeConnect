import { NextRequest, NextResponse } from "next/server";
import { verifyBackupCode } from "@/lib/mfa";
import { decryptData } from "@/lib/encryption";
import { hasAdminAccess, MFA_VERIFIED_COOKIE_NAME, getMFASessionCookieOptions } from "@/lib/access";
import { getUserByUsername } from "@/lib/localDataStore";

export async function POST(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      backup_code?: string;
    };

    const username = body.username || "command-center";
    const backupCode = body.backup_code?.trim();

    if (!backupCode) {
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
      return NextResponse.json(
        { error: "Invalid backup code" },
        { status: 401 }
      );
    }

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
    const message = error instanceof Error ? error.message : "Backup code verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
