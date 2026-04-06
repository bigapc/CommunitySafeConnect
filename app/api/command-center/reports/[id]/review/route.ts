import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/reports";
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

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("reports")
      .update({
        reviewed: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: "command-center",
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}