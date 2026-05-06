import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { reviewEvidenceRequest } from "@/lib/localDataStore";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/evidence";
  }

  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireRoleForApi("super_admin");

  if (!access) {
    return NextResponse.json({ error: "Super admin authorization required." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);
    const status = formData.get("status")?.toString() === "rejected" ? "rejected" : "approved";
    const reviewNotes = formData.get("reviewNotes")?.toString() || null;

    const updated = reviewEvidenceRequest(access.organizationId, id, {
      status,
      reviewedBy: access.role,
      reviewNotes,
    });

    if (!updated) {
      return NextResponse.json({ error: "Evidence request not found." }, { status: 404 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review evidence request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
