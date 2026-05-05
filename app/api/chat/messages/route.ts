import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccessContext, hasOrganizationAccess } from "@/lib/access";
import { createChatMessage, listChatMessages } from "@/lib/localDataStore";

export async function GET() {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const context = await getCurrentAccessContext();

    if (!context) {
      return NextResponse.json({ error: "Organization context not found." }, { status: 401 });
    }

    return NextResponse.json({
      messages: listChatMessages({ organizationId: context.organizationId, ascending: true, limit: 100 }),
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