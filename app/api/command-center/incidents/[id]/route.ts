import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { updateIncident } from "@/lib/localDataStore";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      status?: "new" | "triaged" | "in_progress" | "resolved";
      assignee?: string | null;
      escalated?: boolean;
    };

    const updated = updateIncident(access.organizationId, id, {
      status: body.status,
      assignee: body.assignee,
      escalated: body.escalated,
    });

    if (!updated) {
      return NextResponse.json({ error: "Incident not found." }, { status: 404 });
    }

    return NextResponse.json({ incident: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update incident.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
