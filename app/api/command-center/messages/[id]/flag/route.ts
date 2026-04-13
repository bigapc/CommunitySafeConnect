import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganizationId, hasAdminAccess } from "@/lib/access";
import { setMessageFlag } from "@/lib/localDataStore";

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
  const organizationId = await getCurrentOrganizationId();
  const formData = await request.formData();
  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);
  const mode = formData.get("mode")?.toString() === "unflag" ? "unflag" : "flag";

  try {
    const updated = setMessageFlag(organizationId, id, mode);

    if (!updated) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update message state.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}