import { createHmac } from "node:crypto";

export interface AuditIntegrityInput {
  organizationId: string;
  id: string;
  action: string;
  scope: string;
  retentionMode: string;
  retainedUntil: string | null;
  requestPath: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  previousHash: string | null;
}

function getAuditIntegritySecret() {
  return process.env.AUDIT_INTEGRITY_SECRET || "communitysafeconnect-dev-audit-integrity-secret";
}

function canonicalize(input: AuditIntegrityInput) {
  return [
    input.organizationId,
    input.id,
    input.action,
    input.scope,
    input.retentionMode,
    input.retainedUntil || "",
    input.requestPath || "",
    input.ipAddress || "",
    input.userAgent || "",
    input.createdAt,
    input.previousHash || "",
  ].join("|");
}

export function computeAuditIntegrityHash(input: AuditIntegrityInput) {
  return createHmac("sha256", getAuditIntegritySecret())
    .update(canonicalize(input))
    .digest("hex");
}
