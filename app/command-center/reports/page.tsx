import { getCommandCenterReports } from "@/lib/commandCenterData";
import { getCurrentOrganizationId } from "@/lib/access";

interface CommandCenterReportsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterReportsPage({ searchParams }: CommandCenterReportsPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const organizationId = await getCurrentOrganizationId();
  const returnTo = `/command-center/reports${params.q ? `?q=${encodeURIComponent(params.q)}` : ""}`;

  const { reports, error } = await getCommandCenterReports(organizationId, query);

  return (
    <section>
      <form action="/command-center/reports" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search reports"
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load reports.</p>}

      <h3 style={{ marginTop: "1rem" }}>Reports ({reports.length})</h3>
      {reports.length === 0 ? (
        <p>No reports found.</p>
      ) : (
        <div className="control-list">
        {reports.map((report) => (
          <article key={report.id} className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>{report.description || "(No description)"}</p>
            <small className="control-meta">{new Date(report.created_at).toLocaleString()}</small>
            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className={`status-pill ${report.reviewed ? "reviewed" : "pending"}`}>
                {report.reviewed
                  ? `Reviewed${report.reviewed_at ? ` ${new Date(report.reviewed_at).toLocaleString()}` : ""}`
                  : "Pending"}
              </span>
              {!report.reviewed && (
                <form action={`/api/command-center/reports/${report.id}/review`} method="post">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit">Mark reviewed</button>
                </form>
              )}
            </div>
          </article>
        ))}
        </div>
      )}
    </section>
  );
}