import ChatClient from "@/components/ChatClient";
import Link from "next/link";
import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { listChatMessages } from "@/lib/localDataStore";

export default async function SafetyCirclePage() {
  await requireOrganizationAccess("/safety-circle");
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;
  const historyWindowHours = getOrganizationHistoryWindowHours();
  const cutoffIso = getOrganizationHistoryCutoffIso();

  const messages = listChatMessages({ organizationId, ascending: true, limit: 100 }).filter(
    (item) => item.created_at >= cutoffIso
  );

  return (
    <main className="container">
      <div className="response-journey" style={{ marginBottom: "0.8rem" }}>
        <span className="response-step">1. SOS</span>
        <span className="response-step active">2. Safety Circle</span>
        <span className="response-step">3. Incident Log</span>
        <span className="response-step">4. Safe Zones</span>
        <span className="response-step">5. Organization Dashboard</span>
      </div>
      <h2>Safety Circle</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Notify trusted contacts, coordinate response, then record details in the incident log.
      </p>
      <div className="org-quick-actions" style={{ marginBottom: "1rem" }}>
        <Link href="/incident-log">Next: Create Incident Log</Link>
        <Link href="/safe-zones">Then: Navigate Safe Zones</Link>
      </div>
      <ChatClient initialMessages={messages} historyWindowHours={historyWindowHours} />
    </main>
  );
}
