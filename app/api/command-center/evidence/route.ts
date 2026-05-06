import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { createEvidenceRequest, listEvidenceRequests } from "@/lib/localDataStore";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/command-center")) {
    return "/command-center/evidence";
  }

  return value;
}

export async function GET() {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    requests: listEvidenceRequests({ organizationId: access.organizationId, ascending: false, limit: 100 }),
  });
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let dataset: "messages" | "reports" | "mixed" = "mixed";
    let reason: string | undefined;
    let caseReference: string | undefined;
    let returnTo: string | null = null;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        dataset?: "messages" | "reports" | "mixed";
        reason?: string;
        caseReference?: string;
      };
      dataset = body.dataset || "mixed";
      reason = body.reason?.trim();
      caseReference = body.caseReference?.trim();
    } else {
      const formData = await request.formData();
      const datasetValue = formData.get("dataset")?.toString();
      dataset = datasetValue === "messages" || datasetValue === "reports" ? datasetValue : "mixed";
      reason = formData.get("reason")?.toString().trim();
      caseReference = formData.get("caseReference")?.toString().trim();
      returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString() || null);
    }

    if (!reason) {
      return NextResponse.json({ error: "Reason is required." }, { status: 400 });
    }

    const evidenceRequest = createEvidenceRequest(access.organizationId, {
      dataset,
      reason,
      caseReference: caseReference || null,
      requestedBy: access.role,
    });

    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL(returnTo || "/command-center/evidence", request.url), 303);
    }

    return NextResponse.json({ request: evidenceRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create evidence request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
