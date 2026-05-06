import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import {
  createCommandChannel,
  type CommandChannelKind,
  listCommandChannels,
  listCommandChannelMessages,
} from "@/lib/localDataStore";
import { getOrganizationById, mapOrganizationPlanToBilling } from "@/lib/tenancy";

function isEliteOrganization(organizationId: string) {
  const organization = getOrganizationById(organizationId);
  return organization ? mapOrganizationPlanToBilling(organization.plan) === "elite" : false;
}

function parseChannelKind(value: unknown): CommandChannelKind {
  if (value === "alerts" || value === "tasks" || value === "emergency" || value === "debrief" || value === "drill") {
    return value;
  }

  return "alerts";
}

export async function GET() {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isEliteOrganization(access.organizationId)) {
    return NextResponse.json({ error: "Organization Command Channels require Elite billing." }, { status: 403 });
  }

  const channels = listCommandChannels({ organizationId: access.organizationId, ascending: false, limit: 100 });
  const channelMessagesById: Record<string, ReturnType<typeof listCommandChannelMessages>> = {};

  for (const channel of channels) {
    channelMessagesById[channel.id] = listCommandChannelMessages(access.organizationId, channel.id, {
      ascending: false,
      limit: 40,
    });
  }

  return NextResponse.json({
    channels,
    channelMessagesById,
  });
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isEliteOrganization(access.organizationId)) {
    return NextResponse.json({ error: "Organization Command Channels require Elite billing." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      kind?: CommandChannelKind;
      isEmergency?: boolean;
    };

    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
    }

    const channel = createCommandChannel(access.organizationId, {
      name,
      kind: parseChannelKind(body.kind),
      isEmergency: body.isEmergency === true,
      createdBy: access.role,
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create command channel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
