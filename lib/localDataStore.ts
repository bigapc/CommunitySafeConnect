import { computeAuditIntegrityHash } from "@/lib/auditIntegrity";

export interface ReportRow {
  id: string;
  organization_id: string;
  description: string | null;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ChatMessageRow {
  id: string;
  organization_id: string;
  username: string;
  message: string;
  created_at: string;
  flagged: boolean;
  flagged_at: string | null;
  flagged_reason: string | null;
  flagged_by: string | null;
}

export interface AccessAuditLogRow {
  id: string;
  organization_id: string;
  action: string;
  scope: string;
  retention_mode: string;
  retained_until: string | null;
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  previous_hash: string | null;
  integrity_hash: string;
  created_at: string;
}

export interface SecurityEventRow {
  id: string;
  organization_id: string | null;
  event: string;
  level: "info" | "warn" | "error";
  outcome: "success" | "failure";
  reason: string | null;
  request_id: string;
  method: string;
  path: string;
  ip_address: string | null;
  user_agent: string | null;
  scope: string | null;
  username: string | null;
  metadata_json: string | null;
  created_at: string;
}

export type UserRole = "user" | "operator" | "admin";

export interface UserRow {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  mfa_enabled: boolean;
  mfa_secret_encrypted: string | null;
  backup_codes_encrypted: string | null;
  last_login: string | null;
  created_at: string;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const reports: ReportRow[] = [
  {
    id: createId("rep"),
    organization_id: "community-demo-org",
    description: "Broken streetlight at 7th and Maple; area is very dark at night.",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    id: createId("rep"),
    organization_id: "community-demo-org",
    description: "Suspicious vehicle circling the school zone after hours.",
    created_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    reviewed: true,
    reviewed_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reviewed_by: "command-center",
  },
];

const chatMessages: ChatMessageRow[] = [
  {
    id: createId("msg"),
    organization_id: "community-demo-org",
    username: "NeighborWatch01",
    message: "We just saw a blocked crosswalk near the market.",
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  },
  {
    id: createId("msg"),
    organization_id: "community-demo-org",
    username: "CommunityLead",
    message: "Reminder: safety walk starts at 6pm in Zone B.",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  },
];

const auditLogs: AccessAuditLogRow[] = [];
const securityEvents: SecurityEventRow[] = [];

function sortByCreatedAt<T extends { created_at: string }>(items: T[], ascending: boolean) {
  return [...items].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return ascending ? diff : -diff;
  });
}

export function listReports(
  organizationId: string,
  options?: { ascending?: boolean; limit?: number }
) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    reports.filter((report) => report.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createReport(organizationId: string, description: string) {
  const report: ReportRow = {
    id: createId("rep"),
    organization_id: organizationId,
    description,
    created_at: new Date().toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  };

  reports.unshift(report);
  return report;
}

export function markReportReviewed(
  organizationId: string,
  id: string,
  reviewedBy = "command-center"
) {
  const report = reports.find(
    (item) => item.id === id && item.organization_id === organizationId
  );

  if (!report) {
    return false;
  }

  report.reviewed = true;
  report.reviewed_at = new Date().toISOString();
  report.reviewed_by = reviewedBy;
  return true;
}

export function listChatMessages(
  organizationId: string,
  options?: { ascending?: boolean; limit?: number }
) {
  const ascending = options?.ascending ?? true;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    chatMessages.filter((message) => message.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createChatMessage(organizationId: string, username: string, message: string) {
  const chatMessage: ChatMessageRow = {
    id: createId("msg"),
    organization_id: organizationId,
    username,
    message,
    created_at: new Date().toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  };

  chatMessages.push(chatMessage);
  return chatMessage;
}

export function setMessageFlag(
  organizationId: string,
  id: string,
  mode: "flag" | "unflag"
) {
  const chatMessage = chatMessages.find(
    (item) => item.id === id && item.organization_id === organizationId
  );

  if (!chatMessage) {
    return false;
  }

  if (mode === "flag") {
    chatMessage.flagged = true;
    chatMessage.flagged_at = new Date().toISOString();
    chatMessage.flagged_reason = "manual command-center review";
    chatMessage.flagged_by = "command-center";
    return true;
  }

  chatMessage.flagged = false;
  chatMessage.flagged_at = null;
  chatMessage.flagged_reason = null;
  chatMessage.flagged_by = null;
  return true;
}

export function listAuditLogs(
  organizationId: string,
  options?: { ascending?: boolean; limit?: number }
) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    auditLogs.filter((log) => log.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createAuditLog(
  organizationId: string,
  entry: Omit<
    AccessAuditLogRow,
    "id" | "created_at" | "organization_id" | "previous_hash" | "integrity_hash"
  >
) {
  const previousLog = auditLogs.find((log) => log.organization_id === organizationId);
  const previousHash = previousLog?.integrity_hash || null;
  const createdAt = new Date().toISOString();
  const id = createId("audit");

  const integrityHash = computeAuditIntegrityHash({
    organizationId,
    id,
    action: entry.action,
    scope: entry.scope,
    retentionMode: entry.retention_mode,
    retainedUntil: entry.retained_until,
    requestPath: entry.request_path,
    ipAddress: entry.ip_address,
    userAgent: entry.user_agent,
    createdAt,
    previousHash,
  });

  const log: AccessAuditLogRow = {
    id,
    organization_id: organizationId,
    created_at: createdAt,
    previous_hash: previousHash,
    integrity_hash: integrityHash,
    ...entry,
  };

  auditLogs.unshift(log);
  return log;
}

export function verifyAuditLogChain(organizationId: string) {
  const scopedLogs = auditLogs
    .filter((log) => log.organization_id === organizationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let expectedPreviousHash: string | null = null;

  for (const log of scopedLogs) {
    if (log.previous_hash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenLogId: log.id,
        reason: "previous_hash_mismatch",
      };
    }

    const expectedIntegrity = computeAuditIntegrityHash({
      organizationId: log.organization_id,
      id: log.id,
      action: log.action,
      scope: log.scope,
      retentionMode: log.retention_mode,
      retainedUntil: log.retained_until,
      requestPath: log.request_path,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      previousHash: log.previous_hash,
    });

    if (expectedIntegrity !== log.integrity_hash) {
      return {
        valid: false,
        brokenLogId: log.id,
        reason: "integrity_hash_mismatch",
      };
    }

    expectedPreviousHash = log.integrity_hash;
  }

  return {
    valid: true,
    brokenLogId: null,
    reason: null,
  };
}

export function createSecurityEvent(
  entry: Omit<SecurityEventRow, "id" | "created_at">
) {
  const event: SecurityEventRow = {
    id: createId("sec"),
    created_at: new Date().toISOString(),
    ...entry,
  };

  securityEvents.unshift(event);
  return event;
}

export function listSecurityEvents(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 200;
  const organizationId = options?.organizationId;

  const scoped = organizationId
    ? securityEvents.filter((event) => event.organization_id === organizationId)
    : [...securityEvents];

  return sortByCreatedAt(scoped, ascending).slice(0, limit);
}

// ============ User Management & RBAC ============

const users: UserRow[] = [
  {
    id: createId("usr"),
    username: "community-admin",
    email: "admin@communitysafeconnect.local",
    role: "admin",
    mfa_enabled: false,
    mfa_secret_encrypted: null,
    backup_codes_encrypted: null,
    last_login: null,
    created_at: new Date().toISOString(),
  },
  {
    id: createId("usr"),
    username: "command-center",
    email: "operator@communitysafeconnect.local",
    role: "operator",
    mfa_enabled: false,
    mfa_secret_encrypted: null,
    backup_codes_encrypted: null,
    last_login: null,
    created_at: new Date().toISOString(),
  },
];

export function getUserByUsername(username: string): UserRow | undefined {
  return users.find((u) => u.username === username);
}

export function createUser(username: string, email: string, role: UserRole): UserRow {
  const user: UserRow = {
    id: createId("usr"),
    username,
    email,
    role,
    mfa_enabled: false,
    mfa_secret_encrypted: null,
    backup_codes_encrypted: null,
    last_login: null,
    created_at: new Date().toISOString(),
  };

  users.push(user);
  return user;
}

export function updateUserMFA(
  username: string,
  mfaSecret: string,
  backupCodes: string[],
  encryptFn: (data: string) => string
): boolean {
  const user = getUserByUsername(username);

  if (!user) {
    return false;
  }

  user.mfa_secret_encrypted = encryptFn(mfaSecret);
  user.backup_codes_encrypted = encryptFn(JSON.stringify(backupCodes));
  user.mfa_enabled = true;

  return true;
}

export function disableUserMFA(username: string): boolean {
  const user = getUserByUsername(username);

  if (!user) {
    return false;
  }

  user.mfa_enabled = false;
  user.mfa_secret_encrypted = null;
  user.backup_codes_encrypted = null;

  return true;
}

export function updateUserLastLogin(username: string): boolean {
  const user = getUserByUsername(username);

  if (!user) {
    return false;
  }

  user.last_login = new Date().toISOString();
  return true;
}

export function updateUserRole(username: string, newRole: UserRole): boolean {
  const user = getUserByUsername(username);

  if (!user) {
    return false;
  }

  user.role = newRole;
  return true;
}

export function listUsers(): UserRow[] {
  return [...users];
}
