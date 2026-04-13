import { NextRequest, NextResponse } from "next/server";
import { hasOrganizationAccess } from "@/lib/access";
import { createReport } from "@/lib/localDataStore";

export async function POST(request: NextRequest) {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { description?: string };
    const description = body.description?.trim();

    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    createReport(description);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}