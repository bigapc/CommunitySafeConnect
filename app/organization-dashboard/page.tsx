import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { buildJourneyQuery, createJourneyContext, getJourneyContext } from "@/lib/journey";
import Link from "next/link";
import { listReports } from "@/lib/localDataStore";
import { GOVERNANCE_ROLES } from "@/lib/securityGovernance";

interface OrganizationDashboardPageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function OrganizationDashboardPage({ searchParams }: OrganizationDashboardPageProps) {
  await requireOrganizationAccess("/organization-dashboard");
  const journey = getJourneyContext(searchParams);
  const restartJourney = createJourneyContext("standard");
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;
  const historyWindowHours = getOrganizationHistoryWindowHours();
  const cutoffIso = getOrganizationHistoryCutoffIso();

  const reports = listReports({ organizationId, ascending: false, limit: 100 }).filter(
    (item) => item.created_at >= cutoffIso
  );
  const pendingReports = reports.filter((report) => !report.reviewed).length;
  const criticalReports = reports.filter((report) => report.severity === "critical").length;
  const highReports = reports.filter((report) => report.severity === "high").length;

  return (
    <main className="container">
      <div className="response-journey" style={{ marginBottom: "0.8rem" }}>
        <span className="response-step">1. SOS</span>
        <span className="response-step">2. Safety Circle</span>
        <span className="response-step">3. Incident Log</span>
        <span className="response-step">4. Safe Zones</span>
        <span className="response-step active">5. Organization Dashboard</span>
      </div>
      <h2>Organization Dashboard</h2>
      <p style={{ color: "#f5d08a", marginTop: "-0.2rem" }}>
        Policy: only recent records from the last {historyWindowHours} hours are shown. For historical
        records needed for emergencies or legal processes, contact the command center.
      </p>
      <p className="journey-context" style={{ marginTop: "-0.1rem" }}>
        Journey {journey.journeyId} | Mode: {journey.mode === "silent" ? "Silent" : "Standard"}
      </p>
      <div className="org-kpi-grid">
        <article className="org-kpi-card">
          <small>Visible Reports</small>
          <strong>{reports.length}</strong>
        </article>
        <article className="org-kpi-card">
          <small>Pending Review</small>
          <strong>{pendingReports}</strong>
        </article>
        <article className="org-kpi-card">
          <small>Critical / High</small>
          <strong>{criticalReports} / {highReports}</strong>
        </article>
      </div>
      <div className="org-quick-actions">
        <Link href={`/sos${buildJourneyQuery(restartJourney)}`}>New Emergency Journey</Link>
        <Link href={`/incident-log${buildJourneyQuery(journey)}`}>Submit New Incident Log</Link>
        <Link href={`/safety-circle${buildJourneyQuery(journey)}`}>Open Safety Circle</Link>
        <Link href={`/safe-zones${buildJourneyQuery(journey)}`}>View Safe Zones</Link>
        <Link href="/access?next=/command-center/evidence">Request Historical Evidence</Link>
        <Link href="/escalation-request">Request Restricted Access</Link>
      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Role and Capability Matrix</h3>
      <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "-0.2rem" }}>
        CommunitySafetyConnect follows a strict non-deletable documentation model.
        Roles determine what you can see and do, never what can be removed.
      </p>
      <div className="capability-matrix">
        {GOVERNANCE_ROLES.map((role) => (
          <article key={role.key} className={`capability-row capability-cat-${role.category}`}>
            <div className="capability-role">
              <strong>{role.label}</strong>
              <span className={`capability-badge cap-cat-${role.category}`}>{role.category}</span>
            </div>
            <ul className="capability-list">
              {role.permissions.map((perm) => (
                <li key={perm}>{perm.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.5rem" }}>
        Exceptional access, redaction review, and legal coordination require direct coordination with
        Armstrong Pack Company senior security leadership. <Link href="/escalation-request">Submit an escalation request →</Link>
      </p>
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
          </article>
        ))
      )}
    </main>
  );
}
