import CryptoJS from "crypto-js";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      // Dev fallback: ensure consistent encryption in dev mode
      return "csc-dev-encryption-key-32-chars-xx";
    }

    throw new Error("ENCRYPTION_KEY environment variable is required in production");
  }

  return key;
}

/**
 * Encrypt sensitive data at rest
 */
export function encryptData(data: string): string {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypt sensitive data at rest
 */
export function decryptData(encrypted: string): string | null {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      return null;
    }

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Hash a string using SHA-256 (one-way, for comparison)
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);

  if (typeof window !== "undefined") {
    // Browser environment
    crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const { randomFillSync } = require("crypto");
    randomFillSync(array);
  }

  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
