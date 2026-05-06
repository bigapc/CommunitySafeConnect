import { requireOrganizationAccess } from "@/lib/access";
import EscalationRequestForm from "@/components/EscalationRequestForm";

export default async function EscalationRequestPage() {
  await requireOrganizationAccess("/escalation-request");

  return (
    <main className="container">
      <h2>Request Restricted Access</h2>
      <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
        For exceptional access, data review, compliance coordination, or sensitive escalations
        that cannot be handled through routine dashboard workflows.
      </p>

      <div className="control-card" style={{ marginTop: "1rem", maxWidth: "640px" }}>
        <p style={{ margin: "0 0 0.25rem" }}>
          <strong>This form creates an immutable record.</strong> All submissions are logged
          as audit events and cannot be withdrawn.
        </p>
        <p style={{ margin: "0 0 1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
          Armstrong Pack Company senior security leadership will review your request and
          contact you to arrange a scheduled online video review.
        </p>

        <EscalationRequestForm />
      </div>

      <div className="control-card" style={{ marginTop: "1rem", maxWidth: "640px" }}>
        <h3 style={{ marginTop: 0 }}>Escalation categories</h3>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 2 }}>
          <li><strong>Restricted access review</strong> — access to records outside standard window</li>
          <li><strong>Exceptional data review</strong> — extraordinary access to sensitive data sets</li>
          <li><strong>Redaction review</strong> — review of redaction or suppression requests</li>
          <li><strong>Sensitive compliance</strong> — regulatory or institutional compliance matter</li>
          <li><strong>Legal coordination</strong> — legal process, subpoena, or law enforcement coordination</li>
        </ul>
      </div>
    </main>
  );
}
