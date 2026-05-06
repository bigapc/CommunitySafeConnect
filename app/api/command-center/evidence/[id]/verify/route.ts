import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { verifyEvidenceExportIntegrity } from "@/lib/localDataStore";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/evidence";
  }

  return value;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Moderator authorization required." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);

    const result = verifyEvidenceExportIntegrity(access.organizationId, id, access.role);

    if (!result) {
      return NextResponse.json({ error: "Evidence request not found." }, { status: 404 });
    }

    const params = new URLSearchParams();
    params.set("verify", result.ok ? "ok" : "failed");
    params.set("verifyId", id);

    if (!result.ok && result.reason) {
      params.set("verifyReason", result.reason);
    }

    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(new URL(`${returnTo}${separator}${params.toString()}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify export integrity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
