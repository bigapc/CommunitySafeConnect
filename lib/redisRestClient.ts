/**
 * Shared Redis REST client for Upstash-compatible endpoints.
 *
 * Provides a thin HTTP wrapper and convenience helpers for common Redis
 * commands. Config is caller-supplied so multiple stores can connect to
 * different namespaces or instances without sharing global state.
 */

export interface RedisRestConfig {
  baseUrl: string;
  token: string;
}

interface RedisRestResult<T> {
  result?: T;
}

/**
 * Resolves a RedisRestConfig by walking the supplied environment variable
 * name arrays in priority order. Returns null when either the URL or token
 * is absent.
 */
export function buildRedisRestConfig(
  urlEnvVars: string[],
  tokenEnvVars: string[]
): RedisRestConfig | null {
  const baseUrl = urlEnvVars.map((v) => process.env[v]).find(Boolean);
  const token = tokenEnvVars.map((v) => process.env[v]).find(Boolean);

  if (!baseUrl || !token) {
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), token };
}

/**
 * Low-level HTTP request to the Redis REST API.
 * Returns the parsed JSON body or null on any network / HTTP error.
 */
export async function fetchRedisRest<T>(
  config: RedisRestConfig,
  path: string
): Promise<T | null> {
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${config.token}` },
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

// ─── KV helpers ──────────────────────────────────────────────────────────────

export async function redisGet(
  config: RedisRestConfig,
  key: string
): Promise<string | null> {
  const payload = await fetchRedisRest<RedisRestResult<string | null>>(
    config,
    `/get/${encodeURIComponent(key)}`
  );
  return payload?.result ?? null;
}

export async function redisSet(
  config: RedisRestConfig,
  key: string,
  value: string
): Promise<void> {
  await fetchRedisRest(
    config,
    `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`
  );
}

export async function redisDel(
  config: RedisRestConfig,
  key: string
): Promise<void> {
  await fetchRedisRest(config, `/del/${encodeURIComponent(key)}`);
}

// ─── Hash helpers ─────────────────────────────────────────────────────────────

export async function redisHGet(
  config: RedisRestConfig,
  hash: string,
  field: string
): Promise<string | null> {
  const payload = await fetchRedisRest<RedisRestResult<string | null>>(
    config,
    `/hget/${encodeURIComponent(hash)}/${encodeURIComponent(field)}`
  );
  return payload?.result ?? null;
}

export async function redisHSet(
  config: RedisRestConfig,
  hash: string,
  field: string,
  value: string
): Promise<void> {
  await fetchRedisRest(
    config,
    `/hset/${encodeURIComponent(hash)}/${encodeURIComponent(field)}/${encodeURIComponent(value)}`
  );
}

export async function redisHDel(
  config: RedisRestConfig,
  hash: string,
  field: string
): Promise<void> {
  await fetchRedisRest(
    config,
    `/hdel/${encodeURIComponent(hash)}/${encodeURIComponent(field)}`
  );
}

/**
 * Calls HGETALL and converts the flat key/value array returned by the Redis
 * REST API into typed pairs. Returns an empty array on any error.
 */
export async function redisHGetAll(
  config: RedisRestConfig,
  hash: string
): Promise<Array<[string, string]>> {
  const payload = await fetchRedisRest<RedisRestResult<unknown>>(
    config,
    `/hgetall/${encodeURIComponent(hash)}`
  );

  const raw = payload?.result;

  if (!Array.isArray(raw)) {
    return [];
  }

  const entries: Array<[string, string]> = [];

  for (let i = 0; i < raw.length; i += 2) {
    const key = raw[i];
    const val = raw[i + 1];

    if (typeof key === "string" && typeof val === "string") {
      entries.push([key, val]);
    }
  }

  return entries;
}
