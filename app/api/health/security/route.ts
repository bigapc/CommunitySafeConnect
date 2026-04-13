import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import {
  getSecurityHealthSnapshot,
  SECURITY_HEALTH_SCHEMA_PATH,
  SECURITY_HEALTH_SCHEMA_VERSION,
} from "@/lib/securityHealth";

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json(await getSecurityHealthSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Security-Health-Schema-Version": SECURITY_HEALTH_SCHEMA_VERSION,
      Link: `<${SECURITY_HEALTH_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
    },
  });
}
