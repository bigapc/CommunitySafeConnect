import { getCommandCenterReports } from "@/lib/commandCenterData";

interface CommandCenterReportsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterReportsPage({ searchParams }: CommandCenterReportsPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const returnTo = `/command-center/reports${params.q ? `?q=${encodeURIComponent(params.q)}` : ""}`;

  const { reports, error } = await getCommandCenterReports(query);

  return (
    <section>
      <form action="/command-center/reports" method="get" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search reports"
          style={{
            padding: "10px",
            minWidth: "280px",
            background: "#1e293b",
            border: "1px solid #334155",
            color: "white",
          }}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "#fca5a5" }}>Could not load reports.</p>}

      <h3 style={{ marginTop: "1rem" }}>Reports ({reports.length})</h3>
      {reports.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No reports found.</p>
      ) : (
        reports.map((report) => (
          <article
            key={report.id}
            style={{
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              background: "#1e293b",
            }}
          >
            <p style={{ margin: 0 }}>{report.description || "(No description)"}</p>
            <small style={{ color: "#94a3b8" }}>
              {new Date(report.created_at).toLocaleString()}
            </small>
            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <small style={{ color: report.reviewed ? "#86efac" : "#fcd34d" }}>
                {report.reviewed
                  ? `Reviewed${report.reviewed_at ? ` at ${new Date(report.reviewed_at).toLocaleString()}` : ""}`
                  : "Pending review"}
              </small>
              {!report.reviewed && (
                <form action={`/api/command-center/reports/${report.id}/review`} method="post">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit">Mark reviewed</button>
                </form>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}