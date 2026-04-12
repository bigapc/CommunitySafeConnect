const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpEntry>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
