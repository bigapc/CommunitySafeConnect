"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AccessFormProps {
  nextPath: string;
  organizations: Array<{
    id: string;
    name: string;
  }>;
}

type AccessRole = "analyst" | "moderator" | "org_admin" | "super_admin";

const roleDisplayLabels: Record<AccessRole, string> = {
  analyst: "Community member",
  moderator: "Verified responder",
  org_admin: "Organization leader",
  super_admin: "Project authority",
};

export default function AccessForm({ nextPath, organizations }: AccessFormProps) {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "metro-city-university");
  const [role, setRole] = useState<AccessRole>("analyst");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scope = useMemo(
    () => (nextPath.startsWith("/admin") || nextPath.startsWith("/command-center") ? "admin" : "organization"),
    [nextPath]
  );
  const organizationAccessPath = scope === "organization" ? nextPath : "/dashboard";
  const adminAccessPath = scope === "admin" ? nextPath : "/command-center";

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
      <div className="access-panel">
        <h2>{scope === "admin" ? "Admin Access" : "Organization Access"}</h2>
        <div className="access-mode-switch" role="tablist" aria-label="Access type">
          <Link
            href={`/access?next=${encodeURIComponent(organizationAccessPath)}`}
            className={scope === "organization" ? "active" : ""}
            role="tab"
            aria-selected={scope === "organization"}
          >
            Organization Access
          </Link>
          <Link
            href={`/access?next=${encodeURIComponent(adminAccessPath)}`}
            className={scope === "admin" ? "active" : ""}
            role="tab"
            aria-selected={scope === "admin"}
          >
            Admin Access
          </Link>
        </div>
        <p className="access-subtitle">
          Sign in to continue to
          {" "}
          <strong>{nextPath}</strong>
          .
        </p>
        <p className="access-hint">
          Use an
          {" "}
          {scope === "admin" ? "admin" : "organization"}
          {" "}
          code for the selected organization.
        </p>

        <form onSubmit={handleSubmit} className="access-form-grid">
          <label>
            <span>Organization</span>
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
          </label>

          <label>
            <span>Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              aria-label="Role"
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {roleDisplayLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="access-code-row">
            <span>Access code</span>
            <input
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Enter access code"
              required
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Checking..." : "Continue"}
          </button>
        </form>

        {errorMessage && <p className="report-feedback error">{errorMessage}</p>}
      </div>
    </main>
  );
}