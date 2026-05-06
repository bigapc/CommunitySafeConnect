import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, requireRoleForApi } from "@/lib/access";
import { updateCommandChannelTaskState } from "@/lib/localDataStore";
import { getOrganizationById, mapOrganizationPlanToBilling } from "@/lib/tenancy";

function isEliteOrganization(organizationId: string) {
  const organization = getOrganizationById(organizationId);
  return organization ? mapOrganizationPlanToBilling(organization.plan) === "elite" : false;
}

function parseState(value: unknown): "open" | "in_progress" | "resolved" | null {
  if (value === "open" || value === "in_progress" || value === "resolved") {
    return value;
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireRoleForApi("analyst");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isEliteOrganization(access.organizationId)) {
    return NextResponse.json({ error: "Organization Command Channels require Elite billing." }, { status: 403 });
  }

  if (!hasMinimumRole(access.role, "org_admin")) {
    return NextResponse.json({ error: "Only org_admin and super_admin can manage task state." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      state?: "open" | "in_progress" | "resolved";
    };

    const state = parseState(body.state);

    if (!state) {
      return NextResponse.json({ error: "Valid task state is required." }, { status: 400 });
    }

    const result = updateCommandChannelTaskState(access.organizationId, id, {
      state,
      updatedBy: access.role,
    });

    if (!result) {
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ channel: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update task state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
