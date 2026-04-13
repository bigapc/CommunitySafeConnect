import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { getUserByUsername } from "@/lib/localDataStore";
import { decryptData } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const username = request.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    const user = getUserByUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        username: user.username,
        mfa_enabled: user.mfa_enabled,
        email: user.email,
        role: user.role,
        last_login: user.last_login,
        created_at: user.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check MFA status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
