import Link from "next/link";
import { requireOrganizationAccess } from "@/lib/access";

export default async function SosPage() {
  await requireOrganizationAccess("/sos");

  return (
    <main className="container">
      <h2>Emergency Activation</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Activate emergency response quickly with clear choices and documented escalation.
      </p>

      <div className="mission-grid" style={{ marginTop: "1rem" }}>
        <article className="mission-card" style={{ borderColor: "#7f1d1d", background: "#2b1111" }}>
          <h3 style={{ color: "#fecaca" }}>Activate SOS</h3>
          <p style={{ color: "#fca5a5" }}>
            Immediate alert workflow with rapid incident handoff to your organization response team.
          </p>
          <p><Link href="/incident-log">Start Emergency Log</Link></p>
        </article>

        <article className="mission-card" style={{ borderColor: "#1e3a8a", background: "#0f1c3a" }}>
          <h3 style={{ color: "#bfdbfe" }}>Silent Mode</h3>
          <p style={{ color: "#93c5fd" }}>
            Use discreet activation during sensitive scenarios and continue in the incident log flow.
          </p>
          <p><Link href="/incident-log">Activate Silent Flow</Link></p>
        </article>
      </div>

      <div className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/safety-circle">Notify Safety Circle</Link>
        <Link href="/safe-zones">Navigate Safe Zones</Link>
        <Link href="/organization-dashboard">Open Organization Dashboard</Link>
      </div>
    </main>
  );
}
