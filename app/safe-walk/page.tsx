import Link from "next/link";
import { requireOrganizationAccess } from "@/lib/access";
import SafeWalkAlertPanel from "@/components/SafeWalkAlertPanel";

export default async function SafeWalkPage() {
  await requireOrganizationAccess("/safe-walk");

  return (
    <main className="container">
      <h2>SafeWalk Alert</h2>
      <p style={{ color: "#94a3b8", marginTop: "-0.2rem" }}>
        Start monitored walks with ETA tracking and automatic alert simulation for off-route or no-movement situations.
      </p>

      <SafeWalkAlertPanel />

      <div className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/sos">Back to SOS</Link>
        <Link href="/safety-circle">Open Safety Circle</Link>
        <Link href="/incident-log">Open Incident Log</Link>
      </div>
    </main>
  );
}
