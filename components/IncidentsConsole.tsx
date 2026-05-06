"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  CommandCenterEventRow,
  IncidentRow,
  IncidentSeverity,
  IncidentStatus,
} from "@/lib/localDataStore";

interface IncidentsConsoleProps {
  initialIncidents: IncidentRow[];
  initialIncidentEventsById: Record<string, CommandCenterEventRow[]>;
  initialQuery: string;
}

type IncidentDraft = {
  status: IncidentStatus;
  assignee: string;
  escalated: boolean;
  version: number;
};

type IncidentConflict = {
  expectedVersion: number;
  actualVersion: number;
};

const severityOptions: IncidentSeverity[] = ["low", "medium", "high", "critical"];
const statusOptions: IncidentStatus[] = ["new", "triaged", "in_progress", "resolved"];

function defaultDraft(incident: IncidentRow): IncidentDraft {
  return {
    status: incident.status,
    assignee: incident.assignee || "",
    escalated: incident.escalated,
    version: incident.version,
  };
}

function sortByUpdatedAtDesc(items: IncidentRow[]) {
  return [...items].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function getIncidentPriorityScore(incident: IncidentRow, nowMs: number) {
  const severityScore: Record<IncidentSeverity, number> = {
    critical: 45,
    high: 35,
    medium: 25,
    low: 15,
  };

  const statusScore: Record<IncidentStatus, number> = {
    new: 25,
    triaged: 15,
    in_progress: 10,
    resolved: -50,
  };

  const slaDueMs = incident.sla_due_at ? new Date(incident.sla_due_at).getTime() : null;
  const isOverdue = incident.status !== "resolved" && typeof slaDueMs === "number" && slaDueMs < nowMs;
  const isAtRisk =
    incident.status !== "resolved" &&
    typeof slaDueMs === "number" &&
    slaDueMs >= nowMs &&
    slaDueMs - nowMs <= 30 * 60 * 1000;

  return (
    severityScore[incident.severity] +
    statusScore[incident.status] +
    (incident.escalated ? 15 : 0) +
    (incident.assignee ? 0 : 10) +
    (isAtRisk ? 30 : 0) +
    (isOverdue ? 60 : 0)
  );
}

function sortIncidentsByPriority(items: IncidentRow[]) {
  const nowMs = Date.now();
  return [...items].sort((a, b) => {
    const scoreDiff = getIncidentPriorityScore(b, nowMs) - getIncidentPriorityScore(a, nowMs);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function getSlaState(incident: IncidentRow) {
  if (!incident.sla_due_at || incident.status === "resolved") {
    return "none" as const;
  }

  const nowMs = Date.now();
  const dueMs = new Date(incident.sla_due_at).getTime();

  if (dueMs < nowMs) {
    return "overdue" as const;
  }

  if (dueMs - nowMs <= 30 * 60 * 1000) {
    return "risk" as const;
  }

  return "healthy" as const;
}

export default function IncidentsConsole({
  initialIncidents,
  initialIncidentEventsById,
  initialQuery,
}: IncidentsConsoleProps) {
  const [incidents, setIncidents] = useState<IncidentRow[]>(sortByUpdatedAtDesc(initialIncidents));
  const [incidentEventsById, setIncidentEventsById] = useState<Record<string, CommandCenterEventRow[]>>(
    initialIncidentEventsById
  );
  const [query, setQuery] = useState(initialQuery);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [onlySlaRisk, setOnlySlaRisk] = useState(false);
  const [operatorHandle, setOperatorHandle] = useState("moderator-on-duty");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [assignee, setAssignee] = useState("");

  const [drafts, setDrafts] = useState<Record<string, IncidentDraft>>(() => {
    return Object.fromEntries(initialIncidents.map((incident) => [incident.id, defaultDraft(incident)]));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [conflicts, setConflicts] = useState<Record<string, IncidentConflict>>({});

  const filteredIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = incidents.filter((incident) => {
      if (onlyOpen && incident.status === "resolved") {
        return false;
      }

      if (onlyUnassigned && !!incident.assignee) {
        return false;
      }

      if (onlySlaRisk) {
        const slaState = getSlaState(incident);
        if (slaState !== "risk" && slaState !== "overdue") {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        incident.title.toLowerCase().includes(normalizedQuery) ||
        incident.description.toLowerCase().includes(normalizedQuery) ||
        incident.status.toLowerCase().includes(normalizedQuery) ||
        incident.severity.toLowerCase().includes(normalizedQuery) ||
        (incident.assignee || "").toLowerCase().includes(normalizedQuery)
      );
    });

    return sortIncidentsByPriority(filtered);
  }, [incidents, onlyOpen, onlySlaRisk, onlyUnassigned, query]);

  function syncDraft(incident: IncidentRow) {
    setDrafts((current) => ({
      ...current,
      [incident.id]: defaultDraft(incident),
    }));
  }

  const refreshIncidents = useCallback(async () => {
    const response = await fetch("/api/command-center/incidents", {
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          incidents?: IncidentRow[];
          incidentEventsById?: Record<string, CommandCenterEventRow[]>;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.incidents) {
      setErrorMessage(payload?.error || "Could not refresh incidents.");
      return;
    }

    const sorted = sortByUpdatedAtDesc(payload.incidents);
    setIncidents(sorted);
    setIncidentEventsById(payload.incidentEventsById || {});
    setDrafts((current) => {
      const next: Record<string, IncidentDraft> = {};
      for (const incident of sorted) {
        next[incident.id] = current[incident.id] || defaultDraft(incident);
      }
      return next;
    });
    setConflicts({});
    setErrorMessage("");
  }, []);

  async function submitNewIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setErrorMessage("Title and description are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/command-center/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          assignee: assignee.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { incident?: IncidentRow; error?: string }
        | null;

      if (!response.ok || !payload?.incident) {
        setErrorMessage(payload?.error || "Unable to create incident.");
        return;
      }

      const nextIncident = payload.incident;
      setIncidents((current) => sortByUpdatedAtDesc([nextIncident, ...current]));
      syncDraft(nextIncident);
      await refreshIncidents();
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setAssignee("");
      setErrorMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveIncident(id: string, forceUpdate = false, draftOverride?: IncidentDraft) {
    const draft = draftOverride || drafts[id];

    if (!draft) {
      return;
    }

    setSavingId(id);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/command-center/incidents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          assignee: draft.assignee.trim() || null,
          escalated: draft.escalated,
          version: forceUpdate ? undefined : draft.version,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            incident?: IncidentRow;
            error?: string;
            conflict?: boolean;
            expectedVersion?: number;
            actualVersion?: number;
          }
        | null;

      if (response.status === 409 && payload?.conflict && !forceUpdate) {
        setConflicts((current) => ({
          ...current,
          [id]: {
            expectedVersion: payload.expectedVersion || 0,
            actualVersion: payload.actualVersion || 0,
          },
        }));
        setErrorMessage(payload.error || "Conflict detected. Refreshing latest data...");
        await refreshIncidents();
        return;
      }

      if (!response.ok || !payload?.incident) {
        setErrorMessage(payload?.error || "Unable to update incident.");
        return;
      }

      setIncidents((current) => {
        const updated = current.map((incident) => {
          return incident.id === id ? payload.incident as IncidentRow : incident;
        });
        return sortByUpdatedAtDesc(updated);
      });
      syncDraft(payload.incident);
      setConflicts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await refreshIncidents();
      setErrorMessage("");
    } finally {
      setSavingId(null);
    }
  }

  function claimIncident(id: string) {
    const incident = incidents.find((item) => item.id === id);
    if (!incident) {
      return;
    }

    const currentDraft = drafts[id] || defaultDraft(incident);
    const claimedBy = operatorHandle.trim() || "moderator-on-duty";
    const nextDraft: IncidentDraft = {
      ...currentDraft,
      assignee: claimedBy,
      status: currentDraft.status === "new" ? "triaged" : currentDraft.status,
    };

    setDrafts((current) => ({
      ...current,
      [id]: nextDraft,
    }));

    void saveIncident(id, false, nextDraft);
  }

  function resolveIncident(id: string) {
    const incident = incidents.find((item) => item.id === id);
    if (!incident) {
      return;
    }

    const currentDraft = drafts[id] || defaultDraft(incident);
    const nextDraft: IncidentDraft = {
      ...currentDraft,
      status: "resolved",
    };

    setDrafts((current) => ({
      ...current,
      [id]: nextDraft,
    }));

    void saveIncident(id, false, nextDraft);
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isSubmitting && !savingId) {
        void refreshIncidents();
      }
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSubmitting, refreshIncidents, savingId]);

  return (
    <section>
      <form onSubmit={submitNewIncident} className="control-card incident-create-form">
        <h3 style={{ marginTop: 0 }}>Create Incident</h3>
        <div className="incident-grid">
          <input
            type="text"
            placeholder="Incident title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as IncidentSeverity)}
            aria-label="Severity"
          >
            {severityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Assignee (optional)"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          />
        </div>
        <textarea
          placeholder="Describe what happened and immediate impact"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          required
        />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.6rem" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Incident"}
          </button>
          <button type="button" onClick={() => void refreshIncidents()} disabled={isSubmitting || !!savingId}>
            Refresh
          </button>
        </div>
      </form>

      <form className="control-search" style={{ marginTop: "1rem" }} onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search incidents"
          aria-label="Search incidents"
        />
      </form>
      <div className="incident-queue-controls">
        <label>
          <input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} />
          Open only
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlyUnassigned}
            onChange={(event) => setOnlyUnassigned(event.target.checked)}
          />
          Unassigned only
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlySlaRisk}
            onChange={(event) => setOnlySlaRisk(event.target.checked)}
          />
          SLA risk only
        </label>
        <input
          type="text"
          value={operatorHandle}
          onChange={(event) => setOperatorHandle(event.target.value)}
          placeholder="My handle"
          aria-label="My moderator handle"
        />
      </div>
      <small className="control-meta" style={{ display: "block", marginTop: "0.45rem" }}>
        Queue is priority-sorted with SLA-aware ordering. Incident data refreshes every 10 seconds.
      </small>

      {errorMessage && <p style={{ color: "#ffb3bf" }}>{errorMessage}</p>}

      <h3 style={{ marginTop: "1rem" }}>Incidents ({filteredIncidents.length})</h3>
      {filteredIncidents.length === 0 ? (
        <p>No incidents found for this query.</p>
      ) : (
        <div className="control-list">
          {filteredIncidents.map((incident) => {
            const draft = drafts[incident.id] || defaultDraft(incident);
            const isSaving = savingId === incident.id;
            const slaState = getSlaState(incident);

            return (
              <article
                key={incident.id}
                className={`control-card incident-card ${conflicts[incident.id] ? "has-conflict" : ""}`}
              >
                <p style={{ margin: 0 }}>
                  <strong>{incident.title}</strong>
                </p>
                <small className="control-meta" style={{ display: "block" }}>
                  created={new Date(incident.created_at).toLocaleString()} updated={new Date(incident.updated_at).toLocaleString()}
                </small>
                <p style={{ marginTop: "0.5rem", marginBottom: "0.6rem" }}>{incident.description}</p>

                <div className="incident-grid">
                  <select
                    value={draft.status}
                    onChange={(event) => {
                      const value = event.target.value as IncidentStatus;
                      setDrafts((current) => ({
                        ...current,
                        [incident.id]: {
                          ...draft,
                          status: value,
                        },
                      }));
                    }}
                    aria-label={`Status for ${incident.title}`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={draft.assignee}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDrafts((current) => ({
                        ...current,
                        [incident.id]: {
                          ...draft,
                          assignee: value,
                        },
                      }));
                    }}
                    placeholder="Assignee"
                  />

                  <label className="incident-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.escalated}
                      onChange={(event) => {
                        const value = event.target.checked;
                        setDrafts((current) => ({
                          ...current,
                          [incident.id]: {
                            ...draft,
                            escalated: value,
                          },
                        }));
                      }}
                    />
                    Escalated
                  </label>
                </div>

                <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className={`status-pill ${draft.status === "resolved" ? "reviewed" : "pending"}`}>
                    {draft.status}
                  </span>
                  <span className={`status-pill ${draft.escalated ? "flagged" : "clean"}`}>
                    {draft.escalated ? "Escalated" : "Normal"}
                  </span>
                  {slaState === "risk" && <span className="status-pill pending">SLA risk</span>}
                  {slaState === "overdue" && <span className="status-pill flagged">SLA overdue</span>}
                </div>

                <div className="incident-quick-actions">
                  <button type="button" onClick={() => claimIncident(incident.id)} disabled={isSaving || isSubmitting}>
                    {isSaving ? "Saving..." : "Claim"}
                  </button>
                  <button type="button" onClick={() => resolveIncident(incident.id)} disabled={isSaving || isSubmitting}>
                    {isSaving ? "Saving..." : "Resolve"}
                  </button>
                  {conflicts[incident.id] ? (
                    <button
                      type="button"
                      onClick={() => void saveIncident(incident.id, true)}
                      disabled={isSaving || isSubmitting}
                      className="conflict-button"
                    >
                      {isSaving ? "Forcing..." : "Force Update"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => void saveIncident(incident.id)} disabled={isSaving || isSubmitting}>
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>

                {conflicts[incident.id] && (
                  <div className="incident-conflict-banner">
                    <p>
                      <strong>⚠️ Edit Conflict</strong> Another user modified this incident (version {conflicts[incident.id].actualVersion}).
                      Your changes may override theirs. Click "Force Update" to proceed or "Refresh" to see latest changes.
                    </p>
                  </div>
                )}

                <div className="incident-history">
                  <small className="control-meta" style={{ display: "block" }}>
                    Recent activity
                  </small>
                  {(incidentEventsById[incident.id] || []).length === 0 ? (
                    <small className="control-meta">No activity yet.</small>
                  ) : (
                    <ul>
                      {(incidentEventsById[incident.id] || []).map((event) => (
                        <li key={event.id}>
                          <strong>{event.action}</strong>
                          <small className="control-meta" style={{ display: "block" }}>
                            {new Date(event.created_at).toLocaleString()}
                          </small>
                          {event.details && <small className="control-meta">{event.details}</small>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
