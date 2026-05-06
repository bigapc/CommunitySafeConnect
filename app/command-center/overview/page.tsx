import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterOverviewByOrganization } from "@/lib/commandCenterData";
import { getEscalationPriorityState, getEscalationSlaState } from "@/lib/escalationSla";
import Link from "next/link";

export default async function CommandCenterOverviewPage() {
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const { organization, metrics, usage, recentEvents, recentEscalations, escalationSla, escalationPriority } = await getCommandCenterOverviewByOrganization(organizationId);

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
        <article className="control-card ops-metric-card">
          <small className="control-meta">Evidence Requests</small>
          <strong>{metrics.totalEvidenceRequests}</strong>
          <small className="control-meta">Pending: {metrics.pendingEvidenceRequests}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Evidence Ready/Exported</small>
          <strong>{metrics.approvedEvidenceRequests + metrics.exportedEvidenceRequests}</strong>
          <small className="control-meta">
            Approved: {metrics.approvedEvidenceRequests} | Exported: {metrics.exportedEvidenceRequests}
          </small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.pendingPlanChangeRequests > 0 ? { borderLeft: "3px solid var(--warning, #f59e0b)" } : {}}>
          <small className="control-meta">Plan Change Requests</small>
          <strong>{metrics.pendingPlanChangeRequests}</strong>
          <small className="control-meta">
            {metrics.pendingPlanChangeRequests > 0 ? "⚠ Awaiting approval" : "No pending requests"}
          </small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Command Channels</small>
          <strong>{metrics.totalCommandChannels}</strong>
          <small className="control-meta">Active in 24h: {metrics.activeCommandChannels24h}</small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.criticalChannelMessages24h > 0 ? { borderLeft: "3px solid #b91c1c" } : {}}>
          <small className="control-meta">Critical Channel Posts</small>
          <strong>{metrics.criticalChannelMessages24h}</strong>
          <small className="control-meta">Last 24h operations alerts</small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.unresolvedTaskChannels > 0 ? { borderLeft: "3px solid #b45309" } : {}}>
          <small className="control-meta">Unresolved Task Channels</small>
          <strong>{metrics.unresolvedTaskChannels}</strong>
          <small className="control-meta">Task channels with state open or in_progress</small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.dueSoonTaskChannels > 0 ? { borderLeft: "3px solid #f59e0b" } : {}}>
          <small className="control-meta">Task SLA Due Soon</small>
          <strong>{metrics.dueSoonTaskChannels}</strong>
          <small className="control-meta">Due within 2 hours</small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.overdueTaskChannels > 0 ? { borderLeft: "3px solid #b91c1c" } : {}}>
          <small className="control-meta">Task SLA Overdue</small>
          <strong>{metrics.overdueTaskChannels}</strong>
          <small className="control-meta">Unresolved tasks beyond due date</small>
        </article>
        <article className="control-card ops-metric-card" style={metrics.pendingEscalationRequests > 0 ? { borderLeft: "3px solid #d1495b" } : {}}>
          <small className="control-meta">Security Escalations</small>
          <strong>{metrics.pendingEscalationRequests}</strong>
          <small className="control-meta">
            {metrics.pendingEscalationRequests > 0 ? "Leadership review required" : "No active escalations"}
          </small>
        </article>
        <article className="control-card ops-metric-card" style={escalationPriority.critical > 0 ? { borderLeft: "3px solid #991b1b" } : escalationPriority.high > 0 ? { borderLeft: "3px solid #b45309" } : {}}>
          <small className="control-meta">Priority Escalations</small>
          <strong>{escalationPriority.critical + escalationPriority.high}</strong>
          <small className="control-meta">
            Critical: {escalationPriority.critical} | High: {escalationPriority.high} | Standard: {escalationPriority.standard}
          </small>
        </article>
        <article className="control-card ops-metric-card" style={escalationSla.overdue > 0 ? { borderLeft: "3px solid #b91c1c" } : escalationSla.dueSoon > 0 ? { borderLeft: "3px solid #f59e0b" } : {}}>
          <small className="control-meta">Escalation SLA</small>
          <strong>{escalationSla.overdue}</strong>
          <small className="control-meta">
            Overdue: {escalationSla.overdue} | Due soon: {escalationSla.dueSoon} | Awaiting schedule: {escalationSla.awaitingSchedule}
          </small>
        </article>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Restricted Access Escalation Queue</h3>
      <div className="control-list">
        {recentEscalations.length === 0 ? (
          <article className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>No escalations right now. Stay aware. Stay safe.</p>
          </article>
        ) : (
          recentEscalations.map((request) => (
            <article key={request.id} className="control-card" style={{ padding: "0.75rem" }}>
              {(() => {
                const priority = getEscalationPriorityState(request);
                const sla = getEscalationSlaState(request);
                return (
                  <div className="escalation-pill-row">
                    <span className={`priority-pill priority-${priority.level}`}>{priority.label}</span>
                    <span className={`sla-pill sla-${sla.level}`}>{sla.label}</span>
                  </div>
                );
              })()}
              <p style={{ margin: 0 }}>
                <strong>{request.category.replaceAll("_", " ")}</strong>
                {" "}
                status={request.status}
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                {request.contact_name} | {request.contact_email} | requestedBy={request.requested_by_role}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                {new Date(request.created_at).toLocaleString()}
              </small>
              <small className="control-meta" style={{ display: "block", marginTop: "0.35rem" }}>
                {request.reason}
              </small>
              {request.status !== "resolved" && (
                <form action={`/api/command-center/escalation/${request.id}/review`} method="post" className="queue-review-form">
                  <input type="hidden" name="returnTo" value="/command-center/overview" />
                  <textarea
                    name="resolutionNotes"
                    rows={2}
                    placeholder="Add review notes for leadership handoff"
                    className="queue-review-notes"
                  />
                  <div className="queue-review-actions">
                    <button type="submit" name="status" value="under_review">
                      Mark under review
                    </button>
                    <button type="submit" name="status" value="resolved">
                      Resolve request
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))
        )}
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
        <Link href="/command-center/channels">Command Channels</Link>
        <Link href="/command-center/reports">Review Reports</Link>
        <Link href="/command-center/evidence">Handle Evidence</Link>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Governance Actions</h3>
      <div className="control-room-action-row">
        <Link href="/command-center/escalations">Mark as resolved</Link>
        <Link href="/command-center/escalations">Escalate for security review</Link>
        <Link href="/command-center/evidence">Export documentation</Link>
        <Link href="/command-center/escalations">Request restricted access</Link>
        <Link href="/command-center/escalations">Submit to compliance review</Link>
      </div>
    </section>
  );
}
