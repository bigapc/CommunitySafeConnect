import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { getSecurityHealthSnapshot } from "@/lib/securityHealth";

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json(await getSecurityHealthSnapshot());
}
