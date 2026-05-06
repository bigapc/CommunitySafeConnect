import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterEvidenceRequests } from "@/lib/commandCenterData";

interface CommandCenterEvidencePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterEvidencePage({ searchParams }: CommandCenterEvidencePageProps) {
  const params = await searchParams;
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const query = (params.q || "").trim().toLowerCase();
  const returnTo = `/command-center/evidence${params.q ? `?q=${encodeURIComponent(params.q)}` : ""}`;
  const canFinalize = context?.role === "super_admin";

  const { requests, error } = await getCommandCenterEvidenceRequests(organizationId, query);

  return (
    <section>
      <h3>Evidence Requests</h3>
      <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
        Historical evidence and legal export actions are command-center controlled.
      </p>

      <form action="/command-center/evidence" method="get" className="control-search">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search evidence requests"
        />
        <button type="submit">Search</button>
      </form>

      <form className="control-card evidence-create-form" action="/api/command-center/evidence" method="post">
        <h4 style={{ marginTop: 0, marginBottom: "0.6rem" }}>Create Evidence Request</h4>
        <p className="control-meta" style={{ marginTop: "-0.25rem" }}>
          For legal, emergency, or compliance retrieval. No direct hard delete is allowed.
        </p>
        <div className="incident-grid">
          <select name="dataset" defaultValue="mixed" aria-label="Dataset">
            <option value="messages">messages</option>
            <option value="reports">reports</option>
            <option value="mixed">mixed</option>
          </select>
          <input type="text" name="caseReference" placeholder="Case reference (optional)" />
        </div>
        <textarea
          name="reason"
          rows={3}
          required
          placeholder="Reason for evidence retrieval or legal hold"
        />
        <input type="hidden" name="returnTo" value={returnTo} />
        <small className="control-meta" style={{ display: "block", marginTop: "0.45rem" }}>
          API note: this form uses browser POST. Use API with JSON when integrating external tools.
        </small>
        <div style={{ marginTop: "0.5rem" }}>
          <button type="submit">Submit Request</button>
        </div>
      </form>

      {error && <p style={{ color: "#ffb3bf" }}>Could not load evidence requests.</p>}

      <h3 style={{ marginTop: "1rem" }}>Request Queue ({requests.length})</h3>
      {requests.length === 0 ? (
        <p>No evidence requests found.</p>
      ) : (
        <div className="control-list">
          {requests.map((request) => (
            <article key={request.id} className="control-card" style={{ padding: "0.75rem" }}>
              <p style={{ margin: 0 }}>
                <strong>{request.dataset}</strong> | status={request.status}
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                requestedBy={request.requested_by} at {new Date(request.requested_at).toLocaleString()}
              </small>
              {request.case_reference && (
                <small className="control-meta" style={{ display: "block" }}>
                  case={request.case_reference}
                </small>
              )}
              <p style={{ marginTop: "0.5rem" }}>{request.reason}</p>

              <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  className={`status-pill ${
                    request.status === "approved" || request.status === "exported"
                      ? "reviewed"
                      : request.status === "rejected"
                        ? "flagged"
                        : "pending"
                  }`}
                >
                  {request.status}
                </span>
                {request.reviewed_by && (
                  <small className="control-meta">
                    reviewedBy={request.reviewed_by}
                  </small>
                )}
                {request.exported_at && (
                  <small className="control-meta">
                    exportedAt={new Date(request.exported_at).toLocaleString()}
                  </small>
                )}
                {request.export_hash && (
                  <small className="control-meta" style={{ display: "block" }}>
                    hash={request.export_hash}
                  </small>
                )}
                {request.export_signature && (
                  <small className="control-meta" style={{ display: "block" }}>
                    signature={request.export_signature}
                  </small>
                )}
              </div>

              {canFinalize && request.status === "pending" && (
                <div className="evidence-action-row">
                  <form action={`/api/command-center/evidence/${request.id}/review`} method="post">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit">Approve</button>
                  </form>
                  <form action={`/api/command-center/evidence/${request.id}/review`} method="post">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit">Reject</button>
                  </form>
                </div>
              )}

              {canFinalize && request.status === "approved" && (
                <div className="evidence-action-row">
                  <form action={`/api/command-center/evidence/${request.id}/export`} method="post">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button type="submit">Generate Export Package</button>
                  </form>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
