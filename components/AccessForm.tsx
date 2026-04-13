"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface AccessFormProps {
  nextPath: string;
}

export default function AccessForm({ nextPath }: AccessFormProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isDevelopment = process.env.NODE_ENV !== "production";

  const scope = useMemo(
    () => (nextPath.startsWith("/admin") || nextPath.startsWith("/command-center") ? "admin" : "organization"),
    [nextPath]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const response = await fetch("/api/access/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: accessCode,
        scope,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setErrorMessage(payload?.error || "Access was denied.");
      setIsSubmitting(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="container">
      <h2>{scope === "admin" ? "Admin Access" : "Organization Access"}</h2>
      <p>
        Enter the {scope === "admin" ? "admin" : "organization"} access code to continue.
      </p>
      {isDevelopment && (
        <p style={{ color: "#94a3b8", marginTop: "-0.25rem" }}>
          Demo code: {scope === "admin" ? "community-admin-demo" : "community-org-demo"}
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", maxWidth: "520px" }}>
        <input
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Access code"
          required
          style={{
            padding: "10px",
            flex: 1,
            background: "#1e293b",
            border: "1px solid #334155",
            color: "white",
          }}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Continue"}
        </button>
      </form>
      {errorMessage && <p style={{ color: "#fca5a5" }}>{errorMessage}</p>}
    </main>
  );
}