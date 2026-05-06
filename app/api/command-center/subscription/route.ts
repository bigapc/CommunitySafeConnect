import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { createInvoiceEvent, getOrganizationUsageSnapshot, listInvoiceEvents } from "@/lib/localDataStore";
import {
  BillingPlanCode,
  getBillingPlanByCode,
  getOrganizationById,
  listBillingPlans,
  mapOrganizationPlanToBilling,
} from "@/lib/tenancy";

export async function GET() {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    organization: getOrganizationById(access.organizationId),
    usage: getOrganizationUsageSnapshot(access.organizationId),
    invoices: listInvoiceEvents({ organizationId: access.organizationId, ascending: false, limit: 20 }),
    billingPlans: listBillingPlans(),
  });
}

export async function POST(request: Request) {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const snapshot = getOrganizationUsageSnapshot(access.organizationId);
  const organization = getOrganizationById(access.organizationId);
  const defaultPlanCode = organization ? mapOrganizationPlanToBilling(organization.plan) : "basic";

  let selectedPlan: BillingPlanCode = defaultPlanCode;
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { plan?: BillingPlanCode };
      if (body.plan === "basic" || body.plan === "premium" || body.plan === "elite") {
        selectedPlan = body.plan;
      }
    } else {
      const formData = await request.formData();
      const planValue = formData.get("plan")?.toString();
      if (planValue === "basic" || planValue === "premium" || planValue === "elite") {
        selectedPlan = planValue;
      }
    }
  } catch {
    // Keep default mapped billing plan when no JSON payload is provided.
  }

  const planProfile = getBillingPlanByCode(selectedPlan);

  if (!planProfile) {
    return NextResponse.json({ error: "Invalid billing plan." }, { status: 400 });
  }

  const rawAmount =
    planProfile.monthlyBaseUsd +
    snapshot.usage.reports * planProfile.reportUnitUsd +
    snapshot.usage.messages * planProfile.messageUnitUsd;
  const amount = Math.max(planProfile.monthlyBaseUsd, Math.round(rawAmount));

  const invoice = createInvoiceEvent(
    access.organizationId,
    "invoice_preview",
    amount,
    `Automated preview for ${planProfile.label} generated from current monthly usage.`
  );

  return NextResponse.json(
    {
      invoice,
      plan: planProfile,
      usage: snapshot.usage,
      formula: {
        base: planProfile.monthlyBaseUsd,
        reportUnitUsd: planProfile.reportUnitUsd,
        messageUnitUsd: planProfile.messageUnitUsd,
      },
    },
    { status: 201 }
  );
}
