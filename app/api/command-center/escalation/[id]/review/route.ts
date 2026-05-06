import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { updateEscalationRequest } from "@/lib/localDataStore";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/overview";
  }

  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Moderator authorization required." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);
    const rawStatus = formData.get("status")?.toString();
    const status = rawStatus === "resolved" ? "resolved" : "under_review";
    const resolutionNotes = formData.get("resolutionNotes")?.toString() || null;
    const assignedTo = formData.get("assignedTo")?.toString() || null;
    const verificationCallAt = formData.get("verificationCallAt")?.toString() || null;

    const updated = updateEscalationRequest(access.organizationId, id, {
      status,
      reviewedBy: access.role,
      resolutionNotes,
      assignedTo,
      verificationCallAt,
    });

    if (!updated) {
      return NextResponse.json({ error: "Escalation request not found." }, { status: 404 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update escalation request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
