import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterIncidents } from "@/lib/commandCenterData";
import IncidentsConsole from "@/components/IncidentsConsole";

interface CommandCenterIncidentsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterIncidentsPage({ searchParams }: CommandCenterIncidentsPageProps) {
  const params = await searchParams;
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const query = (params.q || "").trim().toLowerCase();

  const { incidents, incidentEventsById, error } = await getCommandCenterIncidents(organizationId, query);

  return (
    <section>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load incidents.</p>}
      <IncidentsConsole
        initialIncidents={incidents}
        initialIncidentEventsById={incidentEventsById}
        initialQuery={params.q || ""}
      />
    </section>
  );
}
