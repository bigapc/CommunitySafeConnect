import { getCommandCenterAuditLogs } from "@/lib/commandCenterData";
import { getCurrentOrganizationId } from "@/lib/access";

interface CommandCenterAuditPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterAuditPage({ searchParams }: CommandCenterAuditPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const organizationId = await getCurrentOrganizationId();

  const { auditLogs, integrity, error } = await getCommandCenterAuditLogs(organizationId, query);

  return (
    <section>
      <form action="/command-center/audit" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search audit logs"
        />
        <button type="submit">Search</button>
      </form>
      {error && (
        <p style={{ color: "#ffb3bf" }}>
          Audit logs could not be loaded. Apply the audit migration if needed.
        </p>
      )}
      {integrity && !integrity.valid && (
        <p style={{ color: "#ffb3bf" }}>
          Audit integrity warning: chain validation failed at log {integrity.brokenLogId || "unknown"} ({integrity.reason || "unknown reason"}).
        </p>
      )}
      {integrity && integrity.valid && (
        <p style={{ color: "#86efac" }}>
          Audit integrity: verified (tamper-evident chain intact).
        </p>
      )}

      <h3 style={{ marginTop: "1rem" }}>Audit Events ({auditLogs.length})</h3>
      {auditLogs.length === 0 ? (
        <p>No audit events found.</p>
      ) : (
        <div className="control-list">
        {auditLogs.map((log) => (
          <article key={log.id} className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{log.action}</strong>
              {" "}scope={log.scope} mode={log.retention_mode}
            </p>
            <small className="control-meta" style={{ display: "block" }}>
              {new Date(log.created_at).toLocaleString()}
            </small>
            <small className="control-meta" style={{ display: "block" }}>
              path={log.request_path || "n/a"} ip={log.ip_address || "n/a"}
            </small>
            <small className="control-meta" style={{ display: "block" }}>
              hash={log.integrity_hash.slice(0, 16)}... prev={log.previous_hash ? `${log.previous_hash.slice(0, 16)}...` : "genesis"}
            </small>
            {log.retained_until && (
              <small className="control-meta" style={{ display: "block" }}>
                retained until {new Date(log.retained_until).toLocaleString()}
              </small>
            )}
          </article>
        ))}
        </div>
      )}
    </section>
  );
}