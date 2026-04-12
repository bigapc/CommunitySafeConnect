import { randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3; // max sends per window
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // run cleanup every 15 minutes

interface OtpEntry {
  code: string;
  expiresAt: number;
}

interface RateEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, OtpEntry>();
const rateStore = new Map<string, RateEntry>();

// Periodically remove expired OTP and rate-limit entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
  for (const [key, entry] of rateStore) {
    if (now > entry.windowStart + RATE_LIMIT_WINDOW_MS) rateStore.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

/** Returns false when the email has exceeded the rate limit. */
export function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.windowStart + RATE_LIMIT_WINDOW_MS) {
    rateStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count += 1;
  return true;
}

export function saveOtp(email: string, code: string): void {
  store.set(email.toLowerCase(), { code, expiresAt: Date.now() + OTP_TTL_MS });
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = store.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return false;
  }
  if (entry.code !== code) return false;
  store.delete(email.toLowerCase());
  return true;
}
