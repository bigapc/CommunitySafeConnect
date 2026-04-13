import { NextRequest, NextResponse } from "next/server";
import { generateMFASecret } from "@/lib/mfa";
import { hasAdminAccess } from "@/lib/access";
import { checkSecurityRateLimit, getClientIp } from "@/lib/securityRateLimit";

export async function POST(request: NextRequest) {
  // Only admin users can initiate MFA setup
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const precheck = checkSecurityRateLimit("mfa_setup", clientIp);

  if (!precheck.allowed) {
    return NextResponse.json(
      { error: "Too many MFA setup attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(precheck.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as { username?: string };
    const username = body.username || "command-center";

    const mfaSetup = await generateMFASecret(username, "CommunitySafeConnect");

    return NextResponse.json(mfaSetup, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate MFA setup";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
