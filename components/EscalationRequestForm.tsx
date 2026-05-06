"use client";

import { FormEvent, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  restricted_access_review: "Restricted access review",
  exceptional_data_review: "Exceptional data review",
  redaction_review: "Redaction review",
  sensitive_compliance: "Sensitive compliance review",
  legal_coordination: "Legal coordination",
};

interface EscalationResult {
  escalationId: string;
  message: string;
}

export default function EscalationRequestForm() {
  const [category, setCategory] = useState("restricted_access_review");
  const [reason, setReason] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EscalationResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/command-center/escalation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, reason, contactName, contactEmail }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; escalationId?: string; message?: string; error?: string }
      | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      setError(payload?.error || "Unable to submit escalation request.");
      return;
    }

    setResult({ escalationId: payload.escalationId!, message: payload.message! });
    setReason("");
    setContactName("");
    setContactEmail("");
  }

  if (result) {
    return (
      <div className="escalation-success">
        <h4>Escalation request submitted</h4>
        <p>
          Your request <strong>{result.escalationId}</strong> has been logged and an immutable
          audit record created.
        </p>
        <p>{result.message}</p>
        <button
          type="button"
          onClick={() => setResult(null)}
          style={{ marginTop: "0.75rem" }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="escalation-form">
      <div className="access-form-grid">
        <label>
          <span>Request category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Your full name</span>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contact name for verification call"
            required
          />
        </label>

        <label>
          <span>Contact email</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="email@organization.com"
            required
          />
        </label>
      </div>

      <label style={{ display: "block", marginTop: "0.6rem" }}>
        <span>Reason for escalation request</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a clear and detailed reason. Minimum 10 characters."
          rows={4}
          required
          minLength={10}
          style={{ marginTop: "0.3rem" }}
        />
      </label>

      <p className="escalation-policy-note">
        By submitting this form, you acknowledge that your request will be logged as an immutable
        audit record. Armstrong Pack Company senior security leadership will contact you to arrange
        a scheduled online video review before any exceptional access is granted.
      </p>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit escalation request"}
      </button>

      {error && <p className="report-feedback error">{error}</p>}
    </form>
  );
}
