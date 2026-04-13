import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { buildRedisRestConfig, redisGet, redisSet, type RedisRestConfig } from "./redisRestClient";

interface AlertStateFile {
  version: number;
  updatedAt: string;
  entries: Record<string, number>;
}

const DEFAULT_ALERT_STATE_PATH = "/workspaces/codespaces-blank/CommunitySafeConnect/.data/alert-state.json";

type AlertStateDriver = "file" | "redis";

export function getAlertStateDriver(): AlertStateDriver {
  const driver = (process.env.ALERT_STATE_DRIVER || "file").toLowerCase();
  return driver === "redis" ? "redis" : "file";
}

function getAlertStateNamespace() {
  return process.env.ALERT_STATE_NAMESPACE || "csc_alert_state";
}

function getAlertRedisConfig(): RedisRestConfig | null {
  return buildRedisRestConfig(
    ["ALERT_STATE_REDIS_REST_URL", "UPSTASH_REDIS_REST_URL"],
    ["ALERT_STATE_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]
  );
}

export function isRedisAlertStateConfigured() {
  return !!getAlertRedisConfig();
}

function getRedisKey(key: string) {
  return `${getAlertStateNamespace()}:${key}`;
}

function getAlertStatePath() {
  return process.env.ALERT_STATE_FILE_PATH || DEFAULT_ALERT_STATE_PATH;
}

async function loadState(): Promise<AlertStateFile> {
  const filePath = getAlertStatePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AlertStateFile;

    if (!parsed || typeof parsed !== "object" || typeof parsed.entries !== "object") {
      return { version: 1, updatedAt: new Date().toISOString(), entries: {} };
    }

    return parsed;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), entries: {} };
  }
}

async function saveState(state: AlertStateFile) {
  const filePath = getAlertStatePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

async function getAlertLastEmittedAtFromRedis(key: string) {
  const config = getAlertRedisConfig();

  if (!config) {
    return 0;
  }

  const value = await redisGet(config, getRedisKey(key));
  const parsed = Number(value || 0);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.floor(parsed);
}

async function setAlertLastEmittedAtToRedis(key: string, timestamp: number) {
  const config = getAlertRedisConfig();

  if (!config) {
    return;
  }

  await redisSet(config, getRedisKey(key), String(timestamp));
}

export async function getAlertLastEmittedAt(key: string) {
  if (getAlertStateDriver() === "redis") {
    return getAlertLastEmittedAtFromRedis(key);
  }

  const state = await loadState();
  return state.entries[key] || 0;
}

export async function setAlertLastEmittedAt(key: string, timestamp: number) {
  if (getAlertStateDriver() === "redis") {
    await setAlertLastEmittedAtToRedis(key, timestamp);
    return;
  }

  const state = await loadState();
  state.entries[key] = timestamp;
  state.updatedAt = new Date().toISOString();
  await saveState(state);
}

export async function getAlertStateHealth() {
  const driver = getAlertStateDriver();

  if (driver === "file") {
    return {
      driver,
      configured: true,
      connected: true,
    };
  }

  const configured = isRedisAlertStateConfigured();

  if (!configured) {
    return {
      driver,
      configured,
      connected: false,
    };
  }

  try {
    const probeKey = `health_probe_${Date.now()}`;
    await setAlertLastEmittedAtToRedis(probeKey, Date.now());
    const value = await getAlertLastEmittedAtFromRedis(probeKey);

    return {
      driver,
      configured,
      connected: value > 0,
    };
  } catch {
    return {
      driver,
      configured,
      connected: false,
    };
  }
}
