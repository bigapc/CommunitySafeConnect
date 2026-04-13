import { encryptData, decryptData } from "@/lib/encryption";

/**
 * Safe field encryption wrapper
 * Handles null values and encryption failures gracefully
 */
export class EncryptedField {
  /**
   * Encrypt a field value, handling null and empty cases
   */
  static encrypt(value: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      return encryptData(value);
    } catch (error) {
      console.error("Field encryption failed:", error);
      // In production, return null; in dev, could return the value
      return process.env.NODE_ENV === "production" ? null : value;
    }
  }

  /**
   * Decrypt a field value, handling null and decryption failures
   */
  static decrypt(encrypted: string | null): string | null {
    if (!encrypted) {
      return null;
    }

    try {
      return decryptData(encrypted);
    } catch (error) {
      console.error("Field decryption failed:", error);
      return null;
    }
  }
}

/**
 * Schema for which fields should be encrypted
 * This allows selective encryption for performance
 */
export const ENCRYPTED_FIELDS = {
  reports: ["description"] as const,
  chatMessages: ["message"] as const,
  auditLogs: ["request_path", "ip_address", "user_agent"] as const,
  users: [] as const, // Usernames/emails not encrypted for lookup
} as const;

/**
 * Encryption configuration context
 * Allows enabling/disabling encryption per deployment
 */
export interface EncryptionConfig {
  enabled: boolean;
  algorithm: "aes-256" | "none";
  keyDerivation: "pbkdf2" | "argon2";
}

export function getEncryptionConfig(): EncryptionConfig {
  const enabled = process.env.ENABLE_DATA_ENCRYPTION !== "false";

  return {
    enabled,
    algorithm: "aes-256",
    keyDerivation: "pbkdf2",
  };
}

/**
 * Utility to encrypt reports at rest
 * Usage: encryptReport(report) before storing, decryptReport(report) when retrieving
 */
export function encryptReport(report: {
  description: string | null;
}): {
  description_encrypted: string | null;
} {
  const config = getEncryptionConfig();

  if (!config.enabled) {
    return {
      description_encrypted: report.description,
    };
  }

  return {
    description_encrypted: EncryptedField.encrypt(report.description),
  };
}

export function decryptReport(report: {
  description_encrypted: string | null;
}): {
  description: string | null;
} {
  const config = getEncryptionConfig();

  if (!config.enabled) {
    return {
      description: report.description_encrypted,
    };
  }

  return {
    description: EncryptedField.decrypt(report.description_encrypted),
  };
}

/**
 * Utility to encrypt audit logs at rest
 */
export function encryptAuditLog(log: {
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
}) {
  const config = getEncryptionConfig();

  if (!config.enabled) {
    return log;
  }

  return {
    ...log,
    request_path: EncryptedField.encrypt(log.request_path),
    ip_address: EncryptedField.encrypt(log.ip_address),
    user_agent: EncryptedField.encrypt(log.user_agent),
  };
}

export function decryptAuditLog(log: {
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
}) {
  const config = getEncryptionConfig();

  if (!config.enabled) {
    return log;
  }

  return {
    ...log,
    request_path: EncryptedField.decrypt(log.request_path),
    ip_address: EncryptedField.decrypt(log.ip_address),
    user_agent: EncryptedField.decrypt(log.user_agent),
  };
}
