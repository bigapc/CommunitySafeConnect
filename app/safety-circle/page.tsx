import ChatClient from "@/components/ChatClient";
import Link from "next/link";
import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { buildJourneyQuery, getJourneyContext } from "@/lib/journey";
import { listChatMessages } from "@/lib/localDataStore";

interface SafetyCirclePageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function SafetyCirclePage({ searchParams }: SafetyCirclePageProps) {
  await requireOrganizationAccess("/safety-circle");
  const journey = getJourneyContext(searchParams);
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
      <p className="journey-context" style={{ marginTop: "-0.1rem" }}>
        Journey {journey.journeyId} | Mode: {journey.mode === "silent" ? "Silent" : "Standard"}
      </p>
      <div className="org-quick-actions" style={{ marginBottom: "1rem" }}>
        <Link href={`/incident-log${buildJourneyQuery(journey)}`}>Next: Create Incident Log</Link>
        <Link href={`/safe-zones${buildJourneyQuery(journey)}`}>Then: Navigate Safe Zones</Link>
      </div>
      <ChatClient initialMessages={messages} historyWindowHours={historyWindowHours} />
    </main>
  );
}
