import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { listReports } from "@/lib/localDataStore";

export default async function Dashboard() {
  await requireOrganizationAccess("/dashboard");
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;
  const historyWindowHours = getOrganizationHistoryWindowHours();
  const cutoffIso = getOrganizationHistoryCutoffIso();

  const reports = listReports({ organizationId, ascending: false, limit: 100 })
    .filter((item) => item.created_at >= cutoffIso);

  return (
    <main className="container">
      <h2>Organization Reports</h2>
      <p style={{ color: "#f5d08a", marginTop: "-0.2rem" }}>
        Policy: only recent records from the last {historyWindowHours} hours are shown. For historical
        records needed for emergencies or legal processes, contact the command center.
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
