import { NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { getOrganizationUsageSnapshot } from "@/lib/localDataStore";
import { listOrganizations } from "@/lib/tenancy";

export async function GET() {
  const access = await requireRoleForApi("super_admin");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organizations = listOrganizations().map((organization) => ({
    ...organization,
    usage: getOrganizationUsageSnapshot(organization.id),
  }));

  return NextResponse.json({ organizations });
}
