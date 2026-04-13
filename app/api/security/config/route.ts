/**
 * Security Configuration Audit Endpoint
 *
 * Exposes the security configuration status for operational awareness.
 * Requires admin access.
 *
 * Response: SecurityConfigAudit (JSON)
 * Headers:
 *   - Cache-Control: no-store (config changes should be immediately visible)
 *   - X-Security-Config-Version: <version>
 *   - Link: </api/security/config/schema>; rel="describedby"; type="application/schema+json"
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import {
  getSecurityConfigAudit,
  getSecurityConfigVersion,
  getSecurityConfigPath,
} from "@/lib/securityConfig";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "This endpoint requires admin access",
      },
      { status: 403 }
    );
  }

  const configVersion = getSecurityConfigVersion();
  const configPath = getSecurityConfigPath();

  const config = await getSecurityConfigAudit();

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
      "X-Security-Config-Version": configVersion,
      "Link": `<${configPath}/schema>; rel="describedby"; type="application/schema+json"`,
    },
  });
}

export async function HEAD(request: NextRequest) {
  if (!(await hasAdminAccess())) {
    return new NextResponse(null, { status: 403 });
  }

  const configVersion = getSecurityConfigVersion();
  const configPath = getSecurityConfigPath();

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Security-Config-Version": configVersion,
      "Link": `<${configPath}/schema>; rel="describedby"; type="application/schema+json"`,
    },
  });
}
