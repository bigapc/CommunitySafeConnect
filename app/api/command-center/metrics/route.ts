import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { getCommandCenterMetrics, listCommandCenterEvents } from "@/lib/localDataStore";

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    metrics: getCommandCenterMetrics(),
    recentEvents: listCommandCenterEvents({ ascending: false, limit: 8 }),
  });
}
