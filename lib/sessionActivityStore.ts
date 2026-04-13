/**
 * Session Activity Store
 *
 * Tracks active sessions in memory for real-time visibility and revocation.
 * Populated when sessions are created; cleared when sessions are destroyed or expire.
 */

import { randomBytes } from "node:crypto";

export type SessionScope = "organization" | "admin";

export interface SessionRecord {
  sessionId: string;
  organizationId: string;
  scope: SessionScope;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivityAt: string;
}

// In-memory store: sessionId -> SessionRecord
const ACTIVE_SESSIONS = new Map<string, SessionRecord>();

// Track revoked session IDs for a short window to prevent race conditions
const REVOKED_SESSION_IDS = new Map<string, string>(); // sessionId -> revocationTime

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

export function recordSessionActivity(
  organizationId: string,
  scope: SessionScope,
  ipAddress: string,
  userAgent: string
): string {
  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  const record: SessionRecord = {
    sessionId,
    organizationId,
    scope,
    ipAddress,
    userAgent,
    createdAt: now,
    lastActivityAt: now,
  };

  ACTIVE_SESSIONS.set(sessionId, record);

  // Clean up old revoked session IDs after 1 hour
  for (const [id, revocationTime] of REVOKED_SESSION_IDS.entries()) {
    const revocationAge = Date.now() - new Date(revocationTime).getTime();
    if (revocationAge > 60 * 60 * 1000) {
      REVOKED_SESSION_IDS.delete(id);
    }
  }

  return sessionId;
}

export function updateSessionActivity(sessionId: string): void {
  const session = ACTIVE_SESSIONS.get(sessionId);
  if (session) {
    session.lastActivityAt = new Date().toISOString();
  }
}

export function getSessionRecord(sessionId: string): SessionRecord | null {
  return ACTIVE_SESSIONS.get(sessionId) || null;
}

export function isSessionRevoked(sessionId: string): boolean {
  return REVOKED_SESSION_IDS.has(sessionId);
}

export function revokeSession(sessionId: string): boolean {
  if (ACTIVE_SESSIONS.has(sessionId)) {
    ACTIVE_SESSIONS.delete(sessionId);
    REVOKED_SESSION_IDS.set(sessionId, new Date().toISOString());
    return true;
  }
  return false;
}

export function revokeSessionsByOrganization(organizationId: string): number {
  let count = 0;
  for (const [sessionId, record] of ACTIVE_SESSIONS.entries()) {
    if (record.organizationId === organizationId) {
      revokeSession(sessionId);
      count++;
    }
  }
  return count;
}

export function revokeSessionsByScope(scope: SessionScope): number {
  let count = 0;
  for (const [sessionId, record] of ACTIVE_SESSIONS.entries()) {
    if (record.scope === scope) {
      revokeSession(sessionId);
      count++;
    }
  }
  return count;
}

export function getActiveSessions(organizationId?: string, scope?: SessionScope): SessionRecord[] {
  const sessions: SessionRecord[] = [];

  for (const record of ACTIVE_SESSIONS.values()) {
    if (organizationId && record.organizationId !== organizationId) {
      continue;
    }
    if (scope && record.scope !== scope) {
      continue;
    }
    sessions.push(record);
  }

  // Sort by last activity descending (most recent first)
  return sessions.sort((a, b) => {
    return (
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  });
}

export function getSessionCount(organizationId?: string, scope?: SessionScope): number {
  return getActiveSessions(organizationId, scope).length;
}

export function clearAllSessions(): void {
  ACTIVE_SESSIONS.clear();
  REVOKED_SESSION_IDS.clear();
}

export function getSessionStatistics() {
  const allSessions = Array.from(ACTIVE_SESSIONS.values());

  const byOrg = new Map<string, number>();
  const byScope = new Map<SessionScope, number>();

  for (const session of allSessions) {
    byOrg.set(session.organizationId, (byOrg.get(session.organizationId) || 0) + 1);
    byScope.set(session.scope, (byScope.get(session.scope) || 0) + 1);
  }

  return {
    totalSessions: allSessions.length,
    byOrganization: Object.fromEntries(byOrg),
    byScope: Object.fromEntries(byScope),
  };
}
