import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { createInvoiceEvent, getOrganizationUsageSnapshot, listInvoiceEvents } from "@/lib/localDataStore";
import { getOrganizationById } from "@/lib/tenancy";

export async function GET() {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    organization: getOrganizationById(access.organizationId),
    usage: getOrganizationUsageSnapshot(access.organizationId),
    invoices: listInvoiceEvents({ organizationId: access.organizationId, ascending: false, limit: 20 }),
  });
}

export async function POST() {
  const access = await requireRoleForApi("org_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const snapshot = getOrganizationUsageSnapshot(access.organizationId);
  const amount = Math.max(199, Math.round(snapshot.usage.reports * 2 + snapshot.usage.messages * 0.12));

  const invoice = createInvoiceEvent(
    access.organizationId,
    "invoice_preview",
    amount,
    "Automated preview generated from current monthly usage."
  );

  return NextResponse.json({ invoice }, { status: 201 });
}
