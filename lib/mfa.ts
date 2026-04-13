import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerification {
  valid: boolean;
  remaining: number;
}

/**
 * Generate a new TOTP secret and QR code for MFA setup
 */
export async function generateMFASecret(username: string, issuer = "CommunitySafeConnect"): Promise<MFASetup> {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${username})`,
    issuer,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error("Failed to generate OTP auth URL");
  }

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  if (!token || !secret) {
    return false;
  }

  const tolerance = 1; // Allow 1 time window before/after current

  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: tolerance,
  });
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 })
      .map(() => Math.floor(Math.random() * 10))
      .join("");
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Verify a backup code and return if valid
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  const normalized = code.replace(/\s+/g, "").toUpperCase();

  return backupCodes.some((bc) => bc.replace(/\s+/g, "").toUpperCase() === normalized);
}
