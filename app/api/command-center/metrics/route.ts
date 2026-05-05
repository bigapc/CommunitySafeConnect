import { NextResponse } from "next/server";
import { getCurrentAccessContext, hasAdminAccess } from "@/lib/access";
import { getCommandCenterMetrics, listCommandCenterEvents } from "@/lib/localDataStore";

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const context = await getCurrentAccessContext();

  if (!context) {
    return NextResponse.json({ error: "Organization context not found." }, { status: 401 });
  }

  return NextResponse.json({
    metrics: getCommandCenterMetrics(context.organizationId),
    recentEvents: listCommandCenterEvents({ organizationId: context.organizationId, ascending: false, limit: 8 }),
  });
}
