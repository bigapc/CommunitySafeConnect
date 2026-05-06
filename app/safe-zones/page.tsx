import Link from "next/link";
import { requireOrganizationAccess } from "@/lib/access";

const defaultSafeZones = [
  {
    name: "North Campus Security Office",
    type: "School",
    status: "verified",
    notes: "24/7 staffed response point",
  },
  {
    name: "Harbor Community Church Annex",
    type: "Church",
    status: "verified",
    notes: "Emergency shelter and volunteer coordination",
  },
  {
    name: "Metro Business Park Operations Hub",
    type: "Business",
    status: "verified",
    notes: "Badge-controlled site with incident coordinator",
  },
];

export default async function SafeZonesPage() {
  await requireOrganizationAccess("/safe-zones");

  return (
    <main className="container">
      <div className="response-journey" style={{ marginBottom: "0.8rem" }}>
        <span className="response-step">1. SOS</span>
        <span className="response-step">2. Safety Circle</span>
        <span className="response-step">3. Incident Log</span>
        <span className="response-step active">4. Safe Zones</span>
        <span className="response-step">5. Organization Dashboard</span>
      </div>
      <h2>Safe Zones</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Verified locations for trusted shelter, response coordination, and resource support.
      </p>

      <div className="control-list" style={{ marginTop: "0.75rem" }}>
        {defaultSafeZones.map((zone) => (
          <article key={zone.name} className="control-card" style={{ padding: "0.9rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{zone.name}</strong>
            </p>
            <small className="control-meta" style={{ display: "block" }}>
              Type: {zone.type} | Status: {zone.status}
            </small>
            <small className="control-meta" style={{ display: "block" }}>
              {zone.notes}
            </small>
          </article>
        ))}
      </div>

      <div className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/organization-dashboard">Next: Organization Dashboard</Link>
        <Link href="/incident-log">Back: Incident Log</Link>
        <Link href="/sos">Restart Journey</Link>
      </div>
    </main>
  );
}
