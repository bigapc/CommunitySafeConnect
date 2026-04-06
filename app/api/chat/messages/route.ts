import { NextRequest, NextResponse } from "next/server";
import { hasOrganizationAccess } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, username, message, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
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
    const body = (await request.json()) as { username?: string; message?: string };
    const username = body.username?.trim();
    const message = body.message?.trim();

    if (!username || !message) {
      return NextResponse.json({ error: "Username and message are required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([{ username, message }])
      .select("id, username, message, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}