import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  hasOrganizationAccess,
  requireRoleForApi,
} from "@/lib/access";
import { createChatMessage, listChatMessages, requestDataRemoval } from "@/lib/localDataStore";

export async function GET() {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const context = await getCurrentAccessContext();

    if (!context) {
      return NextResponse.json({ error: "Organization context not found." }, { status: 401 });
    }

    const cutoffIso = getOrganizationHistoryCutoffIso();
    const historyWindowHours = getOrganizationHistoryWindowHours();
    const recentMessages = listChatMessages({ organizationId: context.organizationId, ascending: true, limit: 100 })
      .filter((item) => item.created_at >= cutoffIso);

    return NextResponse.json({
      messages: recentMessages,
      policy: {
        historyWindowHours,
        contactCommandCenterForHistoricalEvidence: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load chat messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const context = await getCurrentAccessContext();

    if (!context) {
      return NextResponse.json({ error: "Organization context not found." }, { status: 401 });
    }

    const body = (await request.json()) as { username?: string; message?: string };
    const username = body.username?.trim();
    const message = body.message?.trim();

    if (!username || !message) {
      return NextResponse.json({ error: "Username and message are required." }, { status: 400 });
    }

    const data = createChatMessage(context.organizationId, username, message);

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireRoleForApi("super_admin");

  if (!access) {
    return NextResponse.json(
      { error: "Deletion is restricted. Only project authority can submit escalation for Armstrong senior security review." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { reason?: string };
    const reason = body.reason?.trim();

    if (!reason) {
      return NextResponse.json({ error: "A reason is required for removal review." }, { status: 400 });
    }

    requestDataRemoval(access.organizationId, {
      requestedBy: access.role,
      dataset: "messages",
      reason,
    });

    return NextResponse.json({
      ok: true,
      deleted: false,
      message: "Data was preserved. Escalation request submitted for Armstrong Pack Company senior security review.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit removal request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}