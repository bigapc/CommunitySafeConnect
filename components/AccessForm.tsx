"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface AccessFormProps {
  nextPath: string;
  organizations: Array<{
    id: string;
    name: string;
  }>;
}

export default function AccessForm({ nextPath, organizations }: AccessFormProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "metro-city-university");
  const [role, setRole] = useState<"analyst" | "moderator" | "org_admin" | "super_admin">("analyst");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scope = useMemo(
    () => (nextPath.startsWith("/admin") || nextPath.startsWith("/command-center") ? "admin" : "organization"),
    [nextPath]
  );

  const roleOptions = useMemo(() => {
    if (scope === "admin") {
      return ["moderator", "org_admin", "super_admin"] as const;
    }

    return ["analyst", "moderator", "org_admin"] as const;
  }, [scope]);

  useEffect(() => {
    if (!roleOptions.some((option) => option === role)) {
      setRole(roleOptions[0]);
    }
  }, [role, roleOptions]);

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
        organizationId,
        role,
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
      <form onSubmit={handleSubmit} className="access-form-row">
        <select
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
          aria-label="Organization"
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          aria-label="Role"
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Access code"
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Continue"}
        </button>
      </form>
      {errorMessage && <p className="report-feedback error">{errorMessage}</p>}
    </main>
  );
}