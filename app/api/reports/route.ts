import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccessContext, hasOrganizationAccess, requireRoleForApi } from "@/lib/access";
import { createReport, requestDataRemoval } from "@/lib/localDataStore";

export async function POST(request: NextRequest) {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      description?: string;
      severity?: "low" | "medium" | "high" | "critical";
    };
    const description = body.description?.trim();
    const severity = body.severity || "medium";
    const context = await getCurrentAccessContext();

    if (!context) {
      return NextResponse.json({ error: "Organization context not found." }, { status: 401 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    createReport(context.organizationId, description, severity);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json(
      { error: "Only organization authority can request limited data removal review." },
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
      dataset: "reports",
      reason,
    });

    return NextResponse.json({
      ok: true,
      deleted: false,
      message: "Data was not deleted. Command center review has been requested.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit removal request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}