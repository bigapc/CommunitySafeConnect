"use client";

import { useState } from "react";

export default function ReportForm() {
  const [description, setDescription] = useState("");
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
      body: JSON.stringify({ description }),
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
        <p style={{ color: "#86efac", marginBottom: "0.75rem" }}>
          Report submitted securely.
        </p>
      )}
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Describe the situation..."
        value={description}
        onChange={(event) => { setDescription(event.target.value); setSubmitted(false); }}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      {errorMessage && <p style={{ color: "#fca5a5" }}>{errorMessage}</p>}
    </form>
    </>
  );
}
