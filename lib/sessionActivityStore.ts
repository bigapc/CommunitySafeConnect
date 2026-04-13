/**
 * Session Activity Store
 *
 * Tracks active sessions for real-time visibility and revocation.
 * Uses in-memory storage by default and can use Redis REST when configured.
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

export type SessionStateDriver = "memory" | "redis";

interface RedisResult<T> {
  result?: T;
}

const DEFAULT_REVOKED_SESSION_RETENTION_MS = 60 * 60 * 1000;

function getConfiguredSessionStateDriver(): SessionStateDriver {
  const driver = (process.env.SESSION_STATE_DRIVER || "memory").toLowerCase();
  return driver === "redis" ? "redis" : "memory";
}

function getSessionStateNamespace() {
  return process.env.SESSION_STATE_NAMESPACE || "csc_session_state";
}

function getRedisConfig() {
  const baseUrl = process.env.SESSION_STATE_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.SESSION_STATE_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    token,
  };
}

export function isRedisSessionStateConfigured() {
  return !!getRedisConfig();
}

export function getSessionStateDriver(): SessionStateDriver {
  return getConfiguredSessionStateDriver() === "redis" && isRedisSessionStateConfigured()
    ? "redis"
    : "memory";
}

function getSessionHashKey() {
  return `${getSessionStateNamespace()}:sessions`;
}

function getRevokedHashKey() {
  return `${getSessionStateNamespace()}:revoked`;
}

async function fetchRedis<T>(path: string): Promise<T | null> {
  const config = getRedisConfig();

  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function parseHashResult(result: unknown) {
  if (!Array.isArray(result)) {
    return [] as Array<[string, string]>;
  }

  const entries: Array<[string, string]> = [];

  for (let index = 0; index < result.length; index += 2) {
    const key = result[index];
    const value = result[index + 1];

    if (typeof key === "string" && typeof value === "string") {
      entries.push([key, value]);
    }
  }

  return entries;
}

async function getSessionRecordFromRedis(sessionId: string): Promise<SessionRecord | null> {
  const payload = await fetchRedis<RedisResult<string | null>>(
    `/hget/${encodeURIComponent(getSessionHashKey())}/${encodeURIComponent(sessionId)}`
  );

  if (!payload?.result || typeof payload.result !== "string") {
    return null;
  }

  try {
    return JSON.parse(payload.result) as SessionRecord;
  } catch {
    return null;
  }
}

async function saveSessionRecordToRedis(record: SessionRecord) {
  await fetchRedis(
    `/hset/${encodeURIComponent(getSessionHashKey())}/${encodeURIComponent(record.sessionId)}/${encodeURIComponent(
      JSON.stringify(record)
    )}`
  );
}

async function deleteSessionRecordFromRedis(sessionId: string) {
  await fetchRedis(
    `/hdel/${encodeURIComponent(getSessionHashKey())}/${encodeURIComponent(sessionId)}`
  );
}

async function getRevokedSessionTimestampFromRedis(sessionId: string) {
  const payload = await fetchRedis<RedisResult<string | null>>(
    `/hget/${encodeURIComponent(getRevokedHashKey())}/${encodeURIComponent(sessionId)}`
  );

  if (!payload?.result || typeof payload.result !== "string") {
    return 0;
  }

  const parsed = Number(payload.result);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function saveRevokedSessionToRedis(sessionId: string, timestamp: number) {
  await fetchRedis(
    `/hset/${encodeURIComponent(getRevokedHashKey())}/${encodeURIComponent(sessionId)}/${encodeURIComponent(String(timestamp))}`
  );
}

async function loadSessionsFromRedis(): Promise<SessionRecord[]> {
  const payload = await fetchRedis<RedisResult<unknown>>(
    `/hgetall/${encodeURIComponent(getSessionHashKey())}`
  );

  const entries = parseHashResult(payload?.result);
  const sessions: SessionRecord[] = [];

  for (const [, value] of entries) {
    try {
      sessions.push(JSON.parse(value) as SessionRecord);
    } catch {
      continue;
    }
  }

  return sessions;
}

async function clearRedisSessions() {
  await fetchRedis(`/del/${encodeURIComponent(getSessionHashKey())}`);
  await fetchRedis(`/del/${encodeURIComponent(getRevokedHashKey())}`);
}

function pruneExpiredRevocationsInMemory() {
  const now = Date.now();

  for (const [id, revocationTime] of REVOKED_SESSION_IDS.entries()) {
    const revocationAge = now - new Date(revocationTime).getTime();
    if (revocationAge > DEFAULT_REVOKED_SESSION_RETENTION_MS) {
      REVOKED_SESSION_IDS.delete(id);
    }
  }
}

// In-memory store: sessionId -> SessionRecord
const ACTIVE_SESSIONS = new Map<string, SessionRecord>();

// Track revoked session IDs for a short window to prevent race conditions
const REVOKED_SESSION_IDS = new Map<string, string>(); // sessionId -> revocationTime

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

export async function recordSessionActivity(
  organizationId: string,
  scope: SessionScope,
  ipAddress: string,
  userAgent: string
): Promise<string> {
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

  if (getSessionStateDriver() === "redis") {
    await saveSessionRecordToRedis(record);
  } else {
    ACTIVE_SESSIONS.set(sessionId, record);
    pruneExpiredRevocationsInMemory();
  }

  return sessionId;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = await getSessionRecord(sessionId);
  if (session) {
    session.lastActivityAt = new Date().toISOString();

    if (getSessionStateDriver() === "redis") {
      await saveSessionRecordToRedis(session);
    } else {
      ACTIVE_SESSIONS.set(sessionId, session);
    }
  }
}

export async function getSessionRecord(sessionId: string): Promise<SessionRecord | null> {
  if (getSessionStateDriver() === "redis") {
    return getSessionRecordFromRedis(sessionId);
  }

  return ACTIVE_SESSIONS.get(sessionId) || null;
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (getSessionStateDriver() === "redis") {
    return (await getRevokedSessionTimestampFromRedis(sessionId)) > 0;
  }

  pruneExpiredRevocationsInMemory();
  return REVOKED_SESSION_IDS.has(sessionId);
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const session = await getSessionRecord(sessionId);

  if (!session) {
    return false;
  }

  if (getSessionStateDriver() === "redis") {
    await deleteSessionRecordFromRedis(sessionId);
    await saveRevokedSessionToRedis(sessionId, Date.now());
    return true;
  }

  ACTIVE_SESSIONS.delete(sessionId);
  REVOKED_SESSION_IDS.set(sessionId, new Date().toISOString());
  pruneExpiredRevocationsInMemory();
  return true;
}

export async function revokeSessionsByOrganization(organizationId: string): Promise<number> {
  let count = 0;
  const sessions = await getActiveSessions(organizationId);

  for (const record of sessions) {
    const revoked = await revokeSession(record.sessionId);
    if (revoked) {
      count++;
    }
  }

  return count;
}

export async function revokeSessionsByScope(scope: SessionScope): Promise<number> {
  let count = 0;
  const sessions = await getActiveSessions(undefined, scope);

  for (const record of sessions) {
    const revoked = await revokeSession(record.sessionId);
    if (revoked) {
      count++;
    }
  }

  return count;
}

export async function getActiveSessions(
  organizationId?: string,
  scope?: SessionScope
): Promise<SessionRecord[]> {
  const allSessions = getSessionStateDriver() === "redis"
    ? await loadSessionsFromRedis()
    : Array.from(ACTIVE_SESSIONS.values());
  const sessions: SessionRecord[] = [];

  for (const record of allSessions) {
    if (organizationId && record.organizationId !== organizationId) {
      continue;
    }
    if (scope && record.scope !== scope) {
      continue;
    }
    sessions.push(record);
  }

  return sessions.sort((a, b) => {
    return (
      new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
  });
}

export async function getSessionCount(organizationId?: string, scope?: SessionScope): Promise<number> {
  return (await getActiveSessions(organizationId, scope)).length;
}

export async function clearAllSessions(): Promise<void> {
  if (getSessionStateDriver() === "redis") {
    await clearRedisSessions();
    return;
  }

  ACTIVE_SESSIONS.clear();
  REVOKED_SESSION_IDS.clear();
}

export async function getSessionStatistics() {
  const allSessions = await getActiveSessions();

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
