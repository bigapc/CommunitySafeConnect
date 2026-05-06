import Link from "next/link";
import AccessSessionControls from "@/components/AccessSessionControls";
import { getCurrentAccessContext, hasAdminAccess } from "@/lib/access";

export default async function Navbar() {
  const isAdmin = await hasAdminAccess();
  const context = await getCurrentAccessContext();
  const accessLabel = context ? `${context.scope} | ${context.role}` : "not signed in";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <h1 className="navbar-brand">CommunitySafetyConnect</h1>
        <div className="navbar-links">
          <Link href="/sos">SOS</Link>
          <Link href="/safe-zones">Safe Zones</Link>
          <Link href="/safety-circle">Safety Circle</Link>
          <Link href="/incident-log">Incident Log</Link>
          <Link href="/security-governance">Governance</Link>
          {isAdmin && <Link href="/command-center">Command Center</Link>}
          <Link href="/access?next=/organization-dashboard">Sign In</Link>
        </div>
        <div className="session-badges">
          <span className="session-badge">Access: {accessLabel}</span>
          {context?.organizationId && <span className="session-badge">Org: {context.organizationId}</span>}
        </div>
        <AccessSessionControls />
      </div>
    </nav>
  );
}