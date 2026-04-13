import { NextRequest } from "next/server";

type SecurityAction = "access_login" | "mfa_verify" | "mfa_backup" | "mfa_setup";

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  lockoutMs: number;
}

interface AttemptState {
  windowStart: number;
  failures: number;
  lockoutUntil: number;
}

const DEFAULT_CONFIG: Record<SecurityAction, RateLimitConfig> = {
  access_login: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
    lockoutMs: 30 * 60 * 1000,
  },
  mfa_verify: {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 6,
    lockoutMs: 30 * 60 * 1000,
  },
  mfa_backup: {
    windowMs: 30 * 60 * 1000,
    maxAttempts: 5,
    lockoutMs: 2 * 60 * 60 * 1000,
  },
  mfa_setup: {
    windowMs: 10 * 60 * 1000,
    maxAttempts: 5,
    lockoutMs: 20 * 60 * 1000,
  },
};

const attempts = new Map<string, AttemptState>();

function getStateKey(action: SecurityAction, principal: string) {
  return `${action}:${principal}`;
}

function now() {
  return Date.now();
}

function getOrCreateState(action: SecurityAction, principal: string): AttemptState {
  const key = getStateKey(action, principal);
  const existing = attempts.get(key);

  if (existing) {
    return existing;
  }

  const created: AttemptState = {
    windowStart: now(),
    failures: 0,
    lockoutUntil: 0,
  };

  attempts.set(key, created);
  return created;
}

function resetWindowIfExpired(state: AttemptState, config: RateLimitConfig) {
  if (now() - state.windowStart >= config.windowMs) {
    state.windowStart = now();
    state.failures = 0;
    state.lockoutUntil = 0;
  }
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function checkSecurityRateLimit(action: SecurityAction, principal: string) {
  const config = DEFAULT_CONFIG[action];
  const state = getOrCreateState(action, principal);

  resetWindowIfExpired(state, config);

  if (state.lockoutUntil > now()) {
    const retryAfterSeconds = Math.ceil((state.lockoutUntil - now()) / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - state.failures),
  };
}

export function registerSecurityFailure(action: SecurityAction, principal: string) {
  const config = DEFAULT_CONFIG[action];
  const state = getOrCreateState(action, principal);

  resetWindowIfExpired(state, config);

  state.failures += 1;

  if (state.failures >= config.maxAttempts) {
    state.lockoutUntil = now() + config.lockoutMs;
  }

  return {
    locked: state.lockoutUntil > now(),
    retryAfterSeconds:
      state.lockoutUntil > now() ? Math.ceil((state.lockoutUntil - now()) / 1000) : 0,
    remainingAttempts: Math.max(0, config.maxAttempts - state.failures),
  };
}

export function clearSecurityFailures(action: SecurityAction, principal: string) {
  const key = getStateKey(action, principal);
  attempts.delete(key);
}
