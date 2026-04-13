"use client";

import { useMemo, useState } from "react";

type SessionScope = "organization" | "admin";
type ScopeFilter = "all" | SessionScope;

interface SessionRecord {
  sessionId: string;
  organizationId: string;
  scope: SessionScope;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
}

interface SessionManagementPanelProps {
  initialSessions: SessionRecord[];
  isAdmin: boolean;
}

export default function SessionManagementPanel({
  initialSessions,
  isAdmin,
}: SessionManagementPanelProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [activeRevokeId, setActiveRevokeId] = useState<string | null>(null);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });
  }, [sessions]);

  async function refreshSessions(nextFilter: ScopeFilter = scopeFilter) {
    setLoading(true);
    setError(null);

    try {
      const query = nextFilter === "all" ? "" : `?scope=${nextFilter}`;
      const response = await fetch(`/api/security/sessions${query}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load sessions (${response.status})`);
      }

      const payload = (await response.json()) as SessionRecord[];
      setSessions(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    if (!isAdmin) {
      setError("Only admins can revoke sessions.");
      return;
    }

    setActiveRevokeId(sessionId);
    setError(null);

    try {
      const response = await fetch("/api/security/sessions/revoke", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          reason: "command_center_manual_revoke",
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body.message === "string" ? body.message : "Failed to revoke session";
        throw new Error(`${message} (${response.status})`);
      }

      await refreshSessions();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke session");
    } finally {
      setActiveRevokeId(null);
    }
  }

  return (
    <div style={{ marginTop: "0.8rem", marginBottom: "0.8rem" }}>
      <h4 style={{ marginBottom: "0.4rem" }}>Active Session Management</h4>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
          Scope
          <select
            value={scopeFilter}
            onChange={(event) => {
              const next = event.target.value as ScopeFilter;
              setScopeFilter(next);
              void refreshSessions(next);
            }}
            style={{ marginLeft: "0.4rem" }}
          >
            <option value="all">all</option>
            <option value="admin">admin</option>
            <option value="organization">organization</option>
          </select>
        </label>
        <button type="button" onClick={() => void refreshSessions()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Sessions"}
        </button>
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
          Showing {sortedSessions.length} session{sortedSessions.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <p style={{ marginTop: "0.5rem", color: "#ffb3bf" }}>
          {error}
        </p>
      )}

      {sortedSessions.length === 0 ? (
        <p style={{ marginTop: "0.6rem", color: "#94a3b8" }}>No active sessions found for this filter.</p>
      ) : (
        <div className="control-list" style={{ marginTop: "0.7rem" }}>
          {sortedSessions.map((session) => (
            <article key={session.sessionId} className="control-card" style={{ padding: "0.75rem" }}>
              <p style={{ margin: 0, color: "#e2e8f0" }}>
                <strong>{session.scope.toUpperCase()}</strong> session
                {" "}org={session.organizationId}
              </p>
              <small className="control-meta" style={{ display: "block" }}>
                id={session.sessionId.slice(0, 16)}... created={new Date(session.createdAt).toLocaleString()}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                lastActivity={new Date(session.lastActivityAt).toLocaleString()} ip={session.ipAddress || "n/a"}
              </small>
              <small className="control-meta" style={{ display: "block" }}>
                userAgent={session.userAgent || "n/a"}
              </small>
              {isAdmin && (
                <div style={{ marginTop: "0.45rem" }}>
                  <button
                    type="button"
                    onClick={() => void revokeSession(session.sessionId)}
                    disabled={activeRevokeId === session.sessionId || loading}
                  >
                    {activeRevokeId === session.sessionId ? "Revoking..." : "Revoke Session"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
