import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterOverviewByOrganization } from "@/lib/commandCenterData";
import Link from "next/link";

export default async function CommandCenterOverviewPage() {
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const { organization, metrics, usage, recentEvents } = await getCommandCenterOverviewByOrganization(organizationId);

  return (
    <section>
      <p className="control-meta" style={{ marginTop: 0 }}>
        Tenant: {organization?.name || organizationId} | Plan: {usage.plan} | Month: {usage.month}
      </p>
      <h3>Operational Overview</h3>
      <div className="ops-metrics-grid">
        <article className="control-card ops-metric-card">
          <small className="control-meta">Reports</small>
          <strong>{metrics.totalReports}</strong>
          <small className="control-meta">Pending: {metrics.pendingReports}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Reviewed Reports</small>
          <strong>{metrics.reviewedReports}</strong>
          <small className="control-meta">Quality triage complete</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Chat Messages</small>
          <strong>{metrics.totalMessages}</strong>
          <small className="control-meta">Flagged: {metrics.flaggedMessages}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Audit and Ops Events</small>
          <strong>{metrics.accessAuditEvents + metrics.commandCenterEvents}</strong>
          <small className="control-meta">
            Access: {metrics.accessAuditEvents} | Ops: {metrics.commandCenterEvents}
          </small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Open Incidents</small>
          <strong>{metrics.openIncidents}</strong>
          <small className="control-meta">Escalated: {metrics.escalatedIncidents}</small>
        </article>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Recent Operational Events</h3>
      <div className="control-list">
        {recentEvents.map((event) => (
          <article key={event.id} className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{event.action}</strong>
              {" "}
              target={event.target_type}
            </p>
            <small className="control-meta" style={{ display: "block" }}>
              {new Date(event.created_at).toLocaleString()}
            </small>
            {event.details && (
              <small className="control-meta" style={{ display: "block" }}>
                {event.details}
              </small>
            )}
          </article>
        ))}
      </div>

      <h3 style={{ marginTop: "1rem" }}>Quick Ops Actions</h3>
      <div className="control-room-action-row">
        <Link href="/command-center/incidents">Manage Incidents</Link>
        <Link href="/command-center/messages">Moderate Messages</Link>
        <Link href="/command-center/reports">Review Reports</Link>
        <Link href="/command-center/evidence">Handle Evidence</Link>
      </div>
    </section>
  );
}
