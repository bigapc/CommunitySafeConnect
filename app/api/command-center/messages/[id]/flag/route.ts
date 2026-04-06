import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/messages";
  }

  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);
  const mode = formData.get("mode")?.toString() === "unflag" ? "unflag" : "flag";

  try {
    const supabase = createSupabaseAdminClient();
    const { error } =
      mode === "flag"
        ? await supabase
            .from("chat_messages")
            .update({
              flagged: true,
              flagged_at: new Date().toISOString(),
              flagged_reason: "manual command-center review",
              flagged_by: "command-center",
            })
            .eq("id", id)
        : await supabase
            .from("chat_messages")
            .update({
              flagged: false,
              flagged_at: null,
              flagged_reason: null,
              flagged_by: null,
            })
            .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update message state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}