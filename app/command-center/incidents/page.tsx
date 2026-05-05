import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterIncidents } from "@/lib/commandCenterData";

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

  const { incidents, error } = await getCommandCenterIncidents(organizationId, query);

  return (
    <section>
      <form action="/command-center/incidents" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search incidents"
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load incidents.</p>}

      <h3 style={{ marginTop: "1rem" }}>Incidents ({incidents.length})</h3>
      {incidents.length === 0 ? (
        <p>No incidents found.</p>
      ) : (
        <div className="control-list">
          {incidents.map((incident) => (
            <article key={incident.id} className="control-card" style={{ padding: "0.75rem" }}>
              <p style={{ margin: 0 }}>
                <strong>{incident.title}</strong>
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                severity={incident.severity} status={incident.status} escalated={incident.escalated ? "yes" : "no"}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                assignee={incident.assignee || "unassigned"} | SLA={incident.sla_due_at ? new Date(incident.sla_due_at).toLocaleString() : "n/a"}
              </small>
              <p style={{ marginTop: "0.4rem" }}>{incident.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
