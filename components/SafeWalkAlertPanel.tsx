"use client";

import { FormEvent, useMemo, useState } from "react";

type WalkMode = "standard" | "silent";

interface SafeWalkSession {
  startedAt: string;
  destination: string;
  etaMinutes: number;
  contact: string;
  mode: WalkMode;
}

function minutesRemaining(startedAtIso: string, etaMinutes: number) {
  const startedAtMs = new Date(startedAtIso).getTime();
  const elapsedMinutes = Math.floor((Date.now() - startedAtMs) / (60 * 1000));
  return Math.max(0, etaMinutes - elapsedMinutes);
}

export default function SafeWalkAlertPanel() {
  const [destination, setDestination] = useState("");
  const [etaMinutes, setEtaMinutes] = useState(15);
  const [contact, setContact] = useState("");
  const [mode, setMode] = useState<WalkMode>("standard");

  const [session, setSession] = useState<SafeWalkSession | null>(null);
  const [alertLog, setAlertLog] = useState<string[]>([]);

  const remaining = useMemo(() => {
    if (!session) {
      return null;
    }

    return minutesRemaining(session.startedAt, session.etaMinutes);
  }, [session]);

  function addAlert(message: string) {
    const stamp = new Date().toLocaleTimeString();
    setAlertLog((current) => [`${stamp} - ${message}`, ...current].slice(0, 8));
  }

  function startWalk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!destination.trim() || !contact.trim()) {
      return;
    }

    const nextSession: SafeWalkSession = {
      startedAt: new Date().toISOString(),
      destination: destination.trim(),
      etaMinutes: Math.max(1, Math.floor(etaMinutes)),
      contact: contact.trim(),
      mode,
    };

    setSession(nextSession);
    addAlert(`SafeWalk started to ${nextSession.destination}. Contact ${nextSession.contact} notified.`);
  }

  function triggerOffRoute() {
    if (!session) {
      return;
    }

    addAlert(`Off-route deviation detected. Alert sent to ${session.contact}.`);
  }

  function triggerStopped() {
    if (!session) {
      return;
    }

    addAlert(`No movement detected. Escalation alert sent to ${session.contact}.`);
  }

  function confirmArrival() {
    if (!session) {
      return;
    }

    addAlert(`Safe arrival confirmed at ${session.destination}. Monitoring ended.`);
    setSession(null);
  }

  return (
    <section>
      <form onSubmit={startWalk} className="control-card" style={{ padding: "0.85rem" }}>
        <h3 style={{ marginTop: 0 }}>Start SafeWalk Monitoring</h3>
        <div className="incident-grid">
          <input
            type="text"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination"
            required
          />
          <input
            type="number"
            min={1}
            max={240}
            value={etaMinutes}
            onChange={(event) => setEtaMinutes(Number(event.target.value) || 15)}
            placeholder="ETA minutes"
            required
          />
          <input
            type="text"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Trusted contact"
            required
          />
          <select value={mode} onChange={(event) => setMode(event.target.value as WalkMode)} aria-label="Walk mode">
            <option value="standard">standard</option>
            <option value="silent">silent</option>
          </select>
        </div>
        <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit">Start SafeWalk</button>
          {session && (
            <small className="control-meta">
              Active walk: {session.destination} | ETA remaining: {remaining} min | mode={session.mode}
            </small>
          )}
        </div>
      </form>

      {session && (
        <article className="control-card" style={{ marginTop: "0.8rem", padding: "0.85rem" }}>
          <h3 style={{ marginTop: 0 }}>Live SafeWalk Alerts</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" onClick={triggerOffRoute}>Trigger Off-Route Alert</button>
            <button type="button" onClick={triggerStopped}>Trigger No-Movement Alert</button>
            <button type="button" onClick={confirmArrival}>Confirm Safe Arrival</button>
          </div>
        </article>
      )}

      <article className="control-card" style={{ marginTop: "0.8rem", padding: "0.85rem" }}>
        <h3 style={{ marginTop: 0 }}>Alert Log</h3>
        {alertLog.length === 0 ? (
          <p style={{ margin: 0 }}>No SafeWalk alerts yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1rem" }}>
            {alertLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
