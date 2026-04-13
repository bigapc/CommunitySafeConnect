import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId, hasOrganizationAccess } from "@/lib/access";
import { createChatMessage, listChatMessages } from "@/lib/localDataStore";

export async function GET() {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const organizationId = await getCurrentOrganizationId();
    return NextResponse.json({ messages: listChatMessages(organizationId, { ascending: true, limit: 100 }) });
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
    const organizationId = await getCurrentOrganizationId();
    const body = (await request.json()) as { username?: string; message?: string };
    const username = body.username?.trim();
    const message = body.message?.trim();

    if (!username || !message) {
      return NextResponse.json({ error: "Username and message are required." }, { status: 400 });
    }

    const data = createChatMessage(organizationId, username, message);

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}