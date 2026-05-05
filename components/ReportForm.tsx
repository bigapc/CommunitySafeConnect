"use client";

import { useState } from "react";

export default function ReportForm() {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description, severity }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setErrorMessage(payload?.error || "Error submitting report.");
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setDescription("");
    setIsSubmitting(false);
  }

  return (
    <>
      {submitted && (
        <p className="report-feedback success">
          Report submitted securely.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Priority
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as typeof severity)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <textarea
          placeholder="Describe the situation..."
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setSubmitted(false);
          }}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        {errorMessage && <p className="report-feedback error">{errorMessage}</p>}
      </form>
    </>
  );
}
