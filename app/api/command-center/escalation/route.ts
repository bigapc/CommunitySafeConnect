import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccessContext, hasOrganizationAccess } from "@/lib/access";
import { createEscalationRequest, listEscalationRequests, EscalationCategory } from "@/lib/localDataStore";

const VALID_CATEGORIES: EscalationCategory[] = [
  "restricted_access_review",
  "exceptional_data_review",
  "redaction_review",
  "sensitive_compliance",
  "legal_coordination",
];

export async function GET() {
  const context = await getCurrentAccessContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requests = listEscalationRequests({ organizationId: context.organizationId });
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  if (!(await hasOrganizationAccess())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const context = await getCurrentAccessContext();
  if (!context) {
    return NextResponse.json({ error: "Session context not found." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    category?: string;
    reason?: string;
    contactName?: string;
    contactEmail?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Request body is required." }, { status: 400 });
  }

  const { category, reason, contactName, contactEmail } = body;

  if (!category || !VALID_CATEGORIES.includes(category as EscalationCategory)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}.` },
      { status: 400 }
    );
  }

  const trimmedReason = reason?.trim();
  const trimmedName = contactName?.trim();
  const trimmedEmail = contactEmail?.trim();

  if (!trimmedReason || trimmedReason.length < 10) {
    return NextResponse.json(
      { error: "Reason is required and must be at least 10 characters." },
      { status: 400 }
    );
  }

  if (!trimmedName) {
    return NextResponse.json({ error: "Contact name is required." }, { status: 400 });
  }

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "A valid contact email is required." }, { status: 400 });
  }

  const escalation = createEscalationRequest(context.organizationId, {
    category: category as EscalationCategory,
    reason: trimmedReason,
    contactName: trimmedName,
    contactEmail: trimmedEmail,
    requestedByRole: context.role,
  });

  return NextResponse.json(
    {
      ok: true,
      escalationId: escalation.id,
      status: escalation.status,
      message:
        "Escalation request submitted. Armstrong Pack Company senior security will coordinate a scheduled online video review.",
    },
    { status: 201 }
  );
}
