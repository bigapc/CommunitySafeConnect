import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccessContext, hasOrganizationAccess } from "@/lib/access";
import { createReport } from "@/lib/localDataStore";

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