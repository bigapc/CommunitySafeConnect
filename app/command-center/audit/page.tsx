import { getCommandCenterAuditLogs } from "@/lib/commandCenterData";
import { getCurrentOrganizationId, hasAdminAccess } from "@/lib/access";
import SessionManagementPanel from "@/components/SessionManagementPanel";
import { getActiveSessions } from "@/lib/sessionActivityStore";
import { getSecurityHealthSnapshot } from "@/lib/securityHealth";

interface CommandCenterAuditPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterAuditPage({ searchParams }: CommandCenterAuditPageProps) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const organizationId = await getCurrentOrganizationId();
  const isAdmin = await hasAdminAccess();
  const securityHealth = await getSecurityHealthSnapshot();
  const initialSessions = await getActiveSessions(undefined, isAdmin ? undefined : "organization");
  const sessionRedisRequestedButUnavailable =
    securityHealth.checks.sessionState.requestedDriver === "redis" &&
    !securityHealth.checks.sessionState.distributedConsistency;

  const { auditLogs, integrity, alerts, alertHistory, error } = await getCommandCenterAuditLogs(organizationId, query);

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
      {sessionRedisRequestedButUnavailable && (
        <div
          style={{
            marginTop: "0.7rem",
            marginBottom: "0.8rem",
            padding: "0.8rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(251, 191, 36, 0.5)",
            background: "rgba(120, 53, 15, 0.35)",
            color: "#fde68a",
          }}
        >
          <strong>Session Consistency Warning:</strong>{" "}
          Redis-backed session consistency is configured but not currently available. Session revocation is enforced,
          but only within this instance until Redis connectivity is restored.
        </div>
      )}
      <div style={{ marginTop: "0.8rem", marginBottom: "0.8rem" }}>
        <h4 style={{ marginBottom: "0.4rem" }}>Security Readiness</h4>
        <p style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
          Schema version: {securityHealth.schemaVersion}
        </p>
        <p style={{ margin: "0.3rem 0", color: securityHealth.status === "ok" ? "#86efac" : "#ffd88a" }}>
          Status: <strong>{securityHealth.status.toUpperCase()}</strong>
        </p>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          Overall severity: <strong>{securityHealth.overallSeverity.toUpperCase()}</strong>
        </p>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          Overall severity score: <strong>{securityHealth.overallSeverityScore}</strong>
        </p>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          Degradation reason: {securityHealth.primaryDegradationReason || "none"}
        </p>
        {securityHealth.degradationReasons.length > 1 && (
          <p style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
            All reasons: {securityHealth.degradationReasons.join(", ")}
          </p>
        )}
        {securityHealth.degradationReasonSeverities.length > 0 && (
          <p style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
            Reason severities: {securityHealth.degradationReasonSeverities
              .map((entry) => `${entry.reason}:${entry.severity}`)
              .join(", ")}
          </p>
        )}
        {securityHealth.recommendedActions.length > 0 && (
          <p style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
            Recommended actions: {securityHealth.recommendedActions.join(" | ")}
          </p>
        )}
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          Alert state: driver={securityHealth.checks.alertState.driver} connected={String(securityHealth.checks.alertState.connected)}
          {" "}redisConfigured={String(securityHealth.checks.alertState.redisConfigured)}
        </p>
        <div
          style={{
            marginTop: "0.7rem",
            padding: "0.75rem",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: "0.75rem",
            background: "rgba(15, 23, 42, 0.35)",
          }}
        >
          <h5 style={{ margin: "0 0 0.45rem", color: "#e2e8f0" }}>Session Enforcement</h5>
          <p style={{ margin: "0.25rem 0", color: "#cbd5e1" }}>
            Requested driver: <strong>{securityHealth.checks.sessionState.requestedDriver}</strong>
            {" "}| Active driver: <strong>{securityHealth.checks.sessionState.activeDriver}</strong>
          </p>
          <p style={{ margin: "0.25rem 0", color: "#cbd5e1" }}>
            Backend connected: <strong>{String(securityHealth.checks.sessionState.connected)}</strong>
            {" "}| Redis configured: <strong>{String(securityHealth.checks.sessionState.redisConfigured)}</strong>
          </p>
          <p style={{ margin: "0.25rem 0", color: "#cbd5e1" }}>
            Revocation enforced: <strong>{String(securityHealth.checks.sessionState.revocationEnforced)}</strong>
            {" "}| Distributed consistency: <strong>{String(securityHealth.checks.sessionState.distributedConsistency)}</strong>
          </p>
          <p
            style={{
              margin: "0.35rem 0 0",
              color:
                securityHealth.checks.sessionState.distributedConsistency
                  ? "#86efac"
                  : securityHealth.checks.sessionState.requestedDriver === "redis"
                    ? "#ffd88a"
                    : "#94a3b8",
            }}
          >
            {securityHealth.checks.sessionState.distributedConsistency
              ? "Session revocation is shared across instances."
              : securityHealth.checks.sessionState.requestedDriver === "redis"
                ? "Redis-backed session consistency was requested but is not currently available."
                : "Session revocation is enforced locally within this app instance."}
          </p>
        </div>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          OIDC configured: {String(securityHealth.checks.oidc.configured)} discoveryConnected={String(securityHealth.checks.oidc.discoveryConnected)}
          {" "}jwksConnected={String(securityHealth.checks.oidc.jwksConnected)}
        </p>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          OIDC latency: discoveryMs={String(securityHealth.checks.oidc.discoveryLatencyMs)}
          {" "}jwksMs={String(securityHealth.checks.oidc.jwksLatencyMs)} thresholdMs={securityHealth.checks.oidc.slowThresholdMs}
        </p>
        <p style={{ margin: "0.3rem 0", color: "#cbd5e1" }}>
          OIDC slow flags: discoverySlow={String(securityHealth.checks.oidc.discoverySlow)}
          {" "}jwksSlow={String(securityHealth.checks.oidc.jwksSlow)}
        </p>
        {securityHealth.checks.oidc.discoveredJwksUri && (
          <p style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
            discoveredJwksUri={securityHealth.checks.oidc.discoveredJwksUri}
          </p>
        )}
      </div>
      <SessionManagementPanel initialSessions={initialSessions} isAdmin={isAdmin} />
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
      {alerts.length > 0 && (
        <div style={{ marginTop: "0.8rem", marginBottom: "0.8rem" }}>
          <h4 style={{ marginBottom: "0.4rem" }}>Security Alerts ({alerts.length})</h4>
          {alerts.map((alert) => (
            <p
              key={alert.id}
              style={{
                margin: "0.3rem 0",
                color:
                  alert.severity === "high"
                    ? "#ffb3bf"
                    : alert.severity === "medium"
                      ? "#ffd88a"
                      : "#c7d2fe",
              }}
            >
              [{alert.severity.toUpperCase()}] <strong>{alert.title}</strong>: {alert.description}
            </p>
          ))}
        </div>
      )}
      {alerts.length === 0 && (
        <p style={{ color: "#86efac" }}>No active anomaly alerts detected.</p>
      )}
      {alertHistory.suppressed.length > 0 && (
        <div style={{ marginTop: "0.8rem", marginBottom: "0.8rem" }}>
          <h4 style={{ marginBottom: "0.4rem" }}>
            Recently Suppressed Alerts ({alertHistory.suppressed.length})
          </h4>
          {alertHistory.suppressed.map((alert) => (
            <p key={`suppressed-${alert.id}`} style={{ margin: "0.3rem 0", color: "#94a3b8" }}>
              [{alert.severity.toUpperCase()}] <strong>{alert.title}</strong>: {alert.description}
              {" "}(next eligible {new Date(alert.nextEligibleAt).toLocaleTimeString()})
            </p>
          ))}
        </div>
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