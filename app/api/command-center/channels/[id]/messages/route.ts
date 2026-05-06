import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, requireRoleForApi } from "@/lib/access";
import { createCommandChannelMessage } from "@/lib/localDataStore";
import { getOrganizationById, mapOrganizationPlanToBilling } from "@/lib/tenancy";

function isEliteOrganization(organizationId: string) {
  const organization = getOrganizationById(organizationId);
  return organization ? mapOrganizationPlanToBilling(organization.plan) === "elite" : false;
}

function parsePriority(value: unknown): "normal" | "high" | "critical" {
  if (value === "high" || value === "critical") {
    return value;
  }

  return "normal";
}

export async function POST(
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

  if (!hasMinimumRole(access.role, "moderator")) {
    return NextResponse.json({ error: "Analyst role is read-only for command channels." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      sender?: string;
      body?: string;
      priority?: "normal" | "high" | "critical";
    };

    const sender = body.sender?.trim();
    const messageBody = body.body?.trim();

    if (!sender || !messageBody) {
      return NextResponse.json({ error: "Sender and message body are required." }, { status: 400 });
    }

    const result = createCommandChannelMessage(access.organizationId, id, {
      sender,
      body: messageBody,
      priority: parsePriority(body.priority),
    });

    if (!result) {
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    }

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          allowedPriorities: result.allowedPriorities,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to post channel message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
