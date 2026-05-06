import Link from "next/link";
import { requireOrganizationAccess } from "@/lib/access";
import { buildJourneyQuery, getJourneyContext } from "@/lib/journey";
import SosActivationPanel from "@/components/SosActivationPanel";

interface SosPageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function SosPage({ searchParams }: SosPageProps) {
  await requireOrganizationAccess("/sos");
  const journey = getJourneyContext(searchParams);
  const standardQuery = buildJourneyQuery({ ...journey, mode: "standard" });
  const silentQuery = buildJourneyQuery({ ...journey, mode: "silent" });

  return (
    <main className="container">
      <div className="response-journey" style={{ marginBottom: "0.8rem" }}>
        <span className="response-step active">1. SOS</span>
        <span className="response-step">2. Safe Walk</span>
        <span className="response-step">3. Safety Circle</span>
        <span className="response-step">4. Incident Log</span>
        <span className="response-step">5. Safe Zones</span>
        <span className="response-step">6. Organization Dashboard</span>
      </div>
      <h2>Emergency Activation</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Calm, immediate activation for trusted response, clear next steps, and documented follow-through.
      </p>
      <p className="journey-context" style={{ marginTop: "-0.1rem" }}>
        Journey {journey.journeyId} | Mode: {journey.mode === "silent" ? "Silent" : "Standard"}
      </p>

      <SosActivationPanel standardHref={`/safety-circle${standardQuery}`} silentHref={`/safety-circle${silentQuery}`} />

      <div className="mission-grid" style={{ marginTop: "1rem" }}>
        <article className="mission-card sos-support-card">
          <h3>Trusted response</h3>
          <p>Your circle can be notified first so help reaches you without unnecessary noise or confusion.</p>
        </article>
        <article className="mission-card sos-support-card">
          <h3>Documentation stays intact</h3>
          <p>Every step moves into the recorded incident flow so leaders can review, export, and coordinate safely.</p>
        </article>
      </div>

      <div className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/safe-walk">Open Safe Walk Alert</Link>
        <Link href={`/safety-circle${buildJourneyQuery(journey)}`}>Next: Notify Safety Circle</Link>
        <Link href={`/incident-log${buildJourneyQuery(journey)}`}>Jump to Incident Log</Link>
        <Link href={`/organization-dashboard${buildJourneyQuery(journey)}`}>Open Organization Dashboard</Link>
      </div>
    </main>
  );
}
