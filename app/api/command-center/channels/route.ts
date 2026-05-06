import { NextRequest, NextResponse } from "next/server";
import { hasMinimumRole, requireRoleForApi } from "@/lib/access";
import {
  createCommandChannel,
  getCommandChannelPermissions,
  getCommandChannelTemplate,
  listCommandChannelTemplates,
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
  const access = await requireRoleForApi("analyst");

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
    templates: listCommandChannelTemplates(),
    permissions: getCommandChannelPermissions(access.role),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("analyst");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isEliteOrganization(access.organizationId)) {
    return NextResponse.json({ error: "Organization Command Channels require Elite billing." }, { status: 403 });
  }

  if (!hasMinimumRole(access.role, "org_admin")) {
    return NextResponse.json({ error: "Only org_admin and super_admin can create channels." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      kind?: CommandChannelKind;
      isEmergency?: boolean;
    };

    const kind = parseChannelKind(body.kind);
    const template = getCommandChannelTemplate(kind);

    const channel = createCommandChannel(access.organizationId, {
      name: body.name?.trim(),
      kind,
      isEmergency: body.isEmergency ?? template.isEmergencyByDefault,
      createdBy: access.role,
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create command channel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
