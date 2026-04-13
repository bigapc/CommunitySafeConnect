import { NextRequest, NextResponse } from "next/server";
import { verifyTOTPToken, verifyBackupCode } from "@/lib/mfa";
import { encryptData, decryptData } from "@/lib/encryption";
import { hasAdminAccess, MFA_VERIFIED_COOKIE_NAME, getMFASessionCookieOptions } from "@/lib/access";
import { getUserByUsername, updateUserMFA } from "@/lib/localDataStore";

export async function POST(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      token?: string;
      secret?: string;
      backupCodes?: string[];
    };

    const username = body.username || "command-center";
    const token = body.token?.trim();
    const secret = body.secret?.trim();
    const backupCodes = body.backupCodes || [];

    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token and secret required" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    const isValid = verifyTOTPToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid MFA token" },
        { status: 401 }
      );
    }

    // Get user and update MFA settings
    const user = getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Store encrypted MFA secret and backup codes
    updateUserMFA(username, secret, backupCodes, encryptData);

    const response = NextResponse.json({
      ok: true,
      message: "MFA enabled successfully",
    });

    // Set MFA verified cookie
    response.cookies.set(
      MFA_VERIFIED_COOKIE_NAME,
      "verified",
      getMFASessionCookieOptions()
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MFA verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Check MFA token validity
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = request.nextUrl.searchParams.get("token");
    const secret = request.nextUrl.searchParams.get("secret");

    if (!token || !secret) {
      return NextResponse.json(
        { error: "Token and secret required" },
        { status: 400 }
      );
    }

    const isValid = verifyTOTPToken(token, secret);

    return NextResponse.json({ valid: isValid }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
