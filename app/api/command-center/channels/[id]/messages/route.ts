import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
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
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isEliteOrganization(access.organizationId)) {
    return NextResponse.json({ error: "Organization Command Channels require Elite billing." }, { status: 403 });
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

    const message = createCommandChannelMessage(access.organizationId, id, {
      sender,
      body: messageBody,
      priority: parsePriority(body.priority),
    });

    if (!message) {
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to post channel message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
