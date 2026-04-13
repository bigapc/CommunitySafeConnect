import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId, hasAdminAccess } from "@/lib/access";
import { markReportReviewed } from "@/lib/localDataStore";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/reports";
  }

  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const organizationId = await getCurrentOrganizationId();
  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);

  try {
    const updated = markReportReviewed(organizationId, id, "command-center");

    if (!updated) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}