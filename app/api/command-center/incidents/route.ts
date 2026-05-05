import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";
import { createIncident, listIncidents } from "@/lib/localDataStore";
import { getIncidentEventsById } from "@/lib/commandCenterData";

export async function GET() {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const incidents = listIncidents({ organizationId: access.organizationId, ascending: false, limit: 100 });
  const incidentEventsById = getIncidentEventsById(
    access.organizationId,
    incidents.map((incident) => incident.id)
  );

  return NextResponse.json({
    incidents,
    incidentEventsById,
  });
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      severity?: "low" | "medium" | "high" | "critical";
      assignee?: string;
    };

    const title = body.title?.trim();
    const description = body.description?.trim();
    const severity = body.severity || "medium";

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const incident = createIncident(access.organizationId, {
      title,
      description,
      severity,
      assignee: body.assignee?.trim() || null,
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create incident.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
