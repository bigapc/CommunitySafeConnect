import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterEscalations } from "@/lib/commandCenterData";
import { getEscalationSlaState, summarizeEscalationSla } from "@/lib/escalationSla";

interface CommandCenterEscalationsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

function normalizeStatus(value: string | undefined): "all" | "submitted" | "under_review" | "resolved" {
  if (value === "submitted" || value === "under_review" || value === "resolved") {
    return value;
  }

  return "all";
}

export default async function CommandCenterEscalationsPage({ searchParams }: CommandCenterEscalationsPageProps) {
  const params = await searchParams;
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const query = (params.q || "").trim().toLowerCase();
  const status = normalizeStatus(params.status);
  const returnParams = new URLSearchParams();

  if (params.q) {
    returnParams.set("q", params.q);
  }

  if (status !== "all") {
    returnParams.set("status", status);
  }

  const returnTo = `/command-center/escalations${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;
  const { requests, error } = await getCommandCenterEscalations(organizationId, query, status);
  const activeRequests = requests.filter((request) => request.status !== "resolved");
  const resolvedRequests = requests.filter((request) => request.status === "resolved");
  const slaSummary = summarizeEscalationSla(requests);

  return (
    <section>
      <form action="/command-center/escalations" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search escalations"
        />
        <select name="status" defaultValue={status}>
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="resolved">Resolved</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load escalation requests.</p>}

      <div className="escalation-sla-summary">
        <span className="sla-pill sla-overdue">Overdue {slaSummary.overdue}</span>
        <span className="sla-pill sla-due_soon">Due soon {slaSummary.dueSoon}</span>
        <span className="sla-pill sla-awaiting_schedule">Awaiting schedule {slaSummary.awaitingSchedule}</span>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Active Escalations ({activeRequests.length})</h3>
      {activeRequests.length === 0 ? (
        <p>No active escalation requests found.</p>
      ) : (
        <div className="control-list">
          {activeRequests.map((request) => (
            <article key={request.id} className="control-card" style={{ padding: "0.75rem" }}>
              {(() => {
                const sla = getEscalationSlaState(request);
                return <span className={`sla-pill sla-${sla.level}`}>{sla.label}</span>;
              })()}
              <p style={{ margin: 0 }}>
                <strong>{request.category.replaceAll("_", " ")}</strong>
                {" "}
                <span className={`status-pill ${request.status === "under_review" ? "flagged" : "pending"}`}>
                  {request.status.replaceAll("_", " ")}
                </span>
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                {request.contact_name} | {request.contact_email} | requestedBy={request.requested_by_role}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                {new Date(request.created_at).toLocaleString()}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                Owner: {request.assigned_to || "Unassigned"}
                {request.verification_call_at
                  ? ` | Verification call ${new Date(request.verification_call_at).toLocaleString()}`
                  : " | Verification call not scheduled"}
              </small>
              <p style={{ marginBottom: 0 }}>{request.reason}</p>
              <form action={`/api/command-center/escalation/${request.id}/review`} method="post" className="queue-review-form">
                <input type="hidden" name="returnTo" value={returnTo} />
                <div className="queue-review-grid">
                  <input
                    type="text"
                    name="assignedTo"
                    placeholder="Assign owner"
                    defaultValue={request.assigned_to || ""}
                  />
                  <input
                    type="datetime-local"
                    name="verificationCallAt"
                    defaultValue={request.verification_call_at ? request.verification_call_at.slice(0, 16) : ""}
                  />
                </div>
                <textarea
                  name="resolutionNotes"
                  rows={2}
                  placeholder="Add review notes, verification call details, or resolution summary"
                  className="queue-review-notes"
                  defaultValue={request.resolution_notes || ""}
                />
                <div className="queue-review-actions">
                  <button type="submit" name="status" value="under_review">Mark under review</button>
                  <button type="submit" name="status" value="resolved">Resolve request</button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: "1.25rem" }}>Resolved Archive ({resolvedRequests.length})</h3>
      {resolvedRequests.length === 0 ? (
        <p>No resolved escalation requests found.</p>
      ) : (
        <div className="control-list">
          {resolvedRequests.map((request) => (
            <article key={request.id} className="control-card" style={{ padding: "0.75rem" }}>
              <p style={{ margin: 0 }}>
                <strong>{request.category.replaceAll("_", " ")}</strong>
                {" "}
                <span className="status-pill reviewed">resolved</span>
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                {request.contact_name} | {request.contact_email}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                submitted {new Date(request.created_at).toLocaleString()}
                {request.resolved_at ? ` | resolved ${new Date(request.resolved_at).toLocaleString()}` : ""}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                Owner: {request.assigned_to || "Unassigned"}
                {request.verification_call_at
                  ? ` | Verification call ${new Date(request.verification_call_at).toLocaleString()}`
                  : " | Verification call not scheduled"}
              </small>
              <p style={{ marginBottom: request.resolution_notes ? "0.35rem" : 0 }}>{request.reason}</p>
              {request.resolution_notes && (
                <small className="control-meta" style={{ display: "block" }}>
                  Resolution notes: {request.resolution_notes}
                </small>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}