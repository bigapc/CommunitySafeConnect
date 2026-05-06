import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { buildJourneyQuery, createJourneyContext, getJourneyContext } from "@/lib/journey";
import { listReports } from "@/lib/localDataStore";

interface IncidentLogPageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function IncidentLogPage({ searchParams }: IncidentLogPageProps) {
  await requireOrganizationAccess("/incident-log");
  const journey = getJourneyContext(searchParams);
  const restartJourney = createJourneyContext("standard");

  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;
  const historyWindowHours = getOrganizationHistoryWindowHours();
  const cutoffIso = getOrganizationHistoryCutoffIso();

  const reports = listReports({ organizationId, ascending: false, limit: 25 }).filter(
    (item) => item.created_at >= cutoffIso
  );

  return (
    <main className="container">
      <div className="response-journey" style={{ marginBottom: "0.8rem" }}>
        <span className="response-step">1. SOS</span>
        <span className="response-step">2. Safety Circle</span>
        <span className="response-step active">3. Incident Log</span>
        <span className="response-step">4. Safe Zones</span>
        <span className="response-step">5. Organization Dashboard</span>
      </div>
      <h2>Incident Log</h2>
      <p style={{ color: "#f5d08a", marginTop: "-0.2rem" }}>
        Timestamped incident records stay visible for the last {historyWindowHours} hours in the
        organization view. Contact command center for legal/history export.
      </p>
      <p className="journey-context" style={{ marginTop: "-0.1rem" }}>
        Journey {journey.journeyId} | Mode: {journey.mode === "silent" ? "Silent" : "Standard"}
      </p>

      <ReportForm />

      <h3 style={{ marginTop: "1rem" }}>Recent Entries</h3>
      {reports.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No recent incidents logged.</p>
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
            <p style={{ margin: 0 }}><strong>{report.severity.toUpperCase()}</strong> - {report.description || "(No description)"}</p>
            <small style={{ color: "#94a3b8" }}>{new Date(report.created_at).toLocaleString()}</small>
          </article>
        ))
      )}

      <div className="org-quick-actions">
        <Link href={`/safe-zones${buildJourneyQuery(journey)}`}>Next: View Safe Zones</Link>
        <Link href={`/organization-dashboard${buildJourneyQuery(journey)}`}>Then: Open Organization Dashboard</Link>
        <Link href={`/sos${buildJourneyQuery(restartJourney)}`}>Restart Journey</Link>
      </div>
    </main>
  );
}
