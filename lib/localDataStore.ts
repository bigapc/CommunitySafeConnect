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
  entry: Omit<AccessAuditLogRow, "id" | "created_at" | "organization_id">
) {
  const log: AccessAuditLogRow = {
    id: createId("audit"),
    organization_id: organizationId,
    created_at: new Date().toISOString(),
    ...entry,
  };

  auditLogs.unshift(log);
  return log;
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
