/**
 * Session Activity Store
 *
 * Tracks active sessions for real-time visibility and revocation.
 * Uses in-memory storage by default and can use Redis REST when configured.
 */

import { randomBytes } from "node:crypto";
import {
  buildRedisRestConfig,
  redisDel,
  redisHDel,
  redisHGet,
  redisHGetAll,
  redisHSet,
  type RedisRestConfig,
} from "./redisRestClient";

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

const DEFAULT_REVOKED_SESSION_RETENTION_MS = 60 * 60 * 1000;

function getConfiguredSessionStateDriver(): SessionStateDriver {
  const driver = (process.env.SESSION_STATE_DRIVER || "memory").toLowerCase();
  return driver === "redis" ? "redis" : "memory";
}

async function deleteRevokedSessionFromRedis(sessionId: string) {
  const config = getRedisClientConfig();
  if (!config) return;
  await redisHDel(config, getRevokedHashKey(), sessionId);
}

function getSessionStateNamespace() {
  return process.env.SESSION_STATE_NAMESPACE || "csc_session_state";
}

function getRedisClientConfig(): RedisRestConfig | null {
  return buildRedisRestConfig(
    ["SESSION_STATE_REDIS_REST_URL", "UPSTASH_REDIS_REST_URL"],
    ["SESSION_STATE_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]
  );
}

export function isRedisSessionStateConfigured() {
  return !!getRedisClientConfig();
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

async function getSessionRecordFromRedis(sessionId: string): Promise<SessionRecord | null> {
  const config = getRedisClientConfig();
  if (!config) return null;

  const value = await redisHGet(config, getSessionHashKey(), sessionId);
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionRecord;
  } catch {
    return null;
  }
}

async function saveSessionRecordToRedis(record: SessionRecord) {
  const config = getRedisClientConfig();
  if (!config) return;
  await redisHSet(config, getSessionHashKey(), record.sessionId, JSON.stringify(record));
}

async function deleteSessionRecordFromRedis(sessionId: string) {
  const config = getRedisClientConfig();
  if (!config) return;
  await redisHDel(config, getSessionHashKey(), sessionId);
}

async function getRevokedSessionTimestampFromRedis(sessionId: string) {
  const config = getRedisClientConfig();
  if (!config) return 0;

  const value = await redisHGet(config, getRevokedHashKey(), sessionId);
  if (!value) return 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function saveRevokedSessionToRedis(sessionId: string, timestamp: number) {
  const config = getRedisClientConfig();
  if (!config) return;
  await redisHSet(config, getRevokedHashKey(), sessionId, String(timestamp));
}

async function loadSessionsFromRedis(): Promise<SessionRecord[]> {
  const config = getRedisClientConfig();
  if (!config) return [];

  const entries = await redisHGetAll(config, getSessionHashKey());
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
  const config = getRedisClientConfig();
  if (!config) return;
  await redisDel(config, getSessionHashKey());
  await redisDel(config, getRevokedHashKey());
}

export async function getSessionStateHealth() {
  const requestedDriver = getConfiguredSessionStateDriver();
  const activeDriver = getSessionStateDriver();
  const redisConfigured = isRedisSessionStateConfigured();

  if (activeDriver === "memory") {
    return {
      requestedDriver,
      activeDriver,
      configured: requestedDriver === "memory" || redisConfigured,
      connected: requestedDriver === "memory",
      redisConfigured,
      revocationEnforced: true,
      distributedConsistency: false,
    };
  }

  try {
    const probeKey = `health_probe_${Date.now()}`;
    await saveRevokedSessionToRedis(probeKey, Date.now());
    const value = await getRevokedSessionTimestampFromRedis(probeKey);
    await deleteRevokedSessionFromRedis(probeKey);

    return {
      requestedDriver,
      activeDriver,
      configured: redisConfigured,
      connected: value > 0,
      redisConfigured,
      revocationEnforced: true,
      distributedConsistency: value > 0,
    };
  } catch {
    return {
      requestedDriver,
      activeDriver,
      configured: redisConfigured,
      connected: false,
      redisConfigured,
      revocationEnforced: true,
      distributedConsistency: false,
    };
  }
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
