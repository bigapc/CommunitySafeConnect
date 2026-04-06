import { getCommandCenterAuditLogs } from "@/lib/commandCenterData";

interface CommandCenterAuditPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterAuditPage({ searchParams }: CommandCenterAuditPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();

  const { auditLogs, error } = await getCommandCenterAuditLogs(query);

  return (
    <section>
      <form action="/command-center/audit" method="get" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search audit logs"
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
      {error && (
        <p style={{ color: "#fca5a5" }}>
          Audit logs could not be loaded. Apply the audit migration if needed.
        </p>
      )}

      <h3 style={{ marginTop: "1rem" }}>Audit Events ({auditLogs.length})</h3>
      {auditLogs.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No audit events found.</p>
      ) : (
        auditLogs.map((log) => (
          <article
            key={log.id}
            style={{
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              background: "#1e293b",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong style={{ color: "#00c2ff" }}>{log.action}</strong>
              {" "}scope={log.scope} mode={log.retention_mode}
            </p>
            <small style={{ color: "#94a3b8", display: "block" }}>
              {new Date(log.created_at).toLocaleString()}
            </small>
            <small style={{ color: "#94a3b8", display: "block" }}>
              path={log.request_path || "n/a"} ip={log.ip_address || "n/a"}
            </small>
            {log.retained_until && (
              <small style={{ color: "#94a3b8", display: "block" }}>
                retained until {new Date(log.retained_until).toLocaleString()}
              </small>
            )}
          </article>
        ))
      )}
    </section>
  );
}