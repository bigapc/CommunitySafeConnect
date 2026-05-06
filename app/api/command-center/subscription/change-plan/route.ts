import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { requestSubscriptionPlanChange } from "@/lib/localDataStore";
import { BillingPlanCode, getOrganizationById, mapOrganizationPlanToBilling } from "@/lib/tenancy";

function parsePlan(value: unknown): BillingPlanCode | null {
  if (value === "basic" || value === "premium" || value === "elite") {
    return value;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organization = getOrganizationById(access.organizationId);
  const fromPlan = organization ? mapOrganizationPlanToBilling(organization.plan) : "basic";

  try {
    const body = (await request.json()) as {
      toPlan?: BillingPlanCode;
      reason?: string;
    };

    const toPlan = parsePlan(body.toPlan);
    const reason = body.reason?.trim() || "Requested through command center subscription planner.";

    if (!toPlan) {
      return NextResponse.json({ error: "A valid target plan is required." }, { status: 400 });
    }

    const result = requestSubscriptionPlanChange(access.organizationId, {
      requestedBy: access.role,
      fromPlan,
      toPlan,
      reason,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, event: result.event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request plan change.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
