import Link from "next/link";
import { DOCUMENTATION_POLICY, DASHBOARD_GOVERNANCE_ACTIONS, GOVERNANCE_CONTACT, GOVERNANCE_ROLES } from "@/lib/securityGovernance";

export default function SecurityGovernancePage() {
  const userRoles = GOVERNANCE_ROLES.filter((role) => role.category === "user");
  const organizationRoles = GOVERNANCE_ROLES.filter((role) => role.category === "organization");
  const armstrongRoles = GOVERNANCE_ROLES.filter((role) => role.category === "armstrong");

  return (
    <main className="container">
      <h2>Access Control and Security Governance</h2>
      <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
        CommunitySafetyConnect follows a documentation-first model designed for schools, campuses,
        churches, HOAs, and businesses with compliance and legal sensitivity.
      </p>

      <section className="control-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Access and Documentation Protection Policy</h3>
        <p>
          System records are preserved by default and are not subject to routine deletion.
          Incident records, alert logs, responder actions, and audit records are non-deletable at
          standard user and organization workflow levels.
        </p>
        <ul>
          <li>End users cannot delete records.</li>
          <li>Organization staff can view and annotate records.</li>
          <li>Organization leaders can review, export, and mark status.</li>
          <li>Project authorities can submit escalation requests only.</li>
          <li>Armstrong Pack Company senior security leadership is required for exceptional access.</li>
        </ul>
      </section>

      <section className="control-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Role Hierarchy</h3>
        <div className="governance-grid">
          <article>
            <h4>User roles</h4>
            <ul>
              {userRoles.map((role) => (
                <li key={role.key}>{role.label}</li>
              ))}
            </ul>
          </article>
          <article>
            <h4>Organization roles</h4>
            <ul>
              {organizationRoles.map((role) => (
                <li key={role.key}>{role.label}</li>
              ))}
            </ul>
          </article>
          <article>
            <h4>Armstrong Pack Company roles</h4>
            <ul>
              {armstrongRoles.map((role) => (
                <li key={role.key}>{role.label}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="control-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Restricted Deletion and Escalation Policy</h3>
        <p>
          Deletion, deep record modification, and exceptional access are unavailable in routine
          dashboards. Extended-access or sensitive requests require documented escalation and
          scheduled online review with Armstrong Pack Company senior security leadership.
        </p>
        <p>
          Security escalation contact: {GOVERNANCE_CONTACT.email} | {GOVERNANCE_CONTACT.phone}
        </p>
        <small className="control-meta" style={{ display: "block" }}>
          Policy mode: {DOCUMENTATION_POLICY.model} | Default retention: {DOCUMENTATION_POLICY.defaultRetention}
        </small>
      </section>

      <section className="control-card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Dashboard Action Language</h3>
        <p>Use these actions in place of destructive terminology:</p>
        <div className="governance-actions">
          {DASHBOARD_GOVERNANCE_ACTIONS.map((action) => (
            <span key={action} className="governance-tag">{action}</span>
          ))}
        </div>
      </section>

      <section className="org-quick-actions" style={{ marginTop: "1rem" }}>
        <Link href="/organization-dashboard">Open Organization Dashboard</Link>
        <Link href="/command-center/overview">Open Command Center Overview</Link>
        <Link href="/escalation-request" className="csc-btn csc-btn-primary" style={{ fontSize: "0.88rem", padding: "0.5rem 1rem" }}>Submit Escalation Request →</Link>
      </section>
    </main>
  );
}
