export interface ReportRow {
  id: string;
  description: string | null;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface ChatMessageRow {
  id: string;
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
  action: string;
  scope: string;
  retention_mode: string;
  retained_until: string | null;
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CommandCenterEventRow {
  id: string;
  action: string;
  target_type: "report" | "message" | "system";
  target_id: string | null;
  details: string | null;
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
    description: "Broken streetlight at 7th and Maple; area is very dark at night.",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    id: createId("rep"),
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

const commandCenterEvents: CommandCenterEventRow[] = [
  {
    id: createId("event"),
    action: "ops_console_initialized",
    target_type: "system",
    target_id: null,
    details: "Command center demo mode initialized.",
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

function sortByCreatedAt<T extends { created_at: string }>(items: T[], ascending: boolean) {
  return [...items].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return ascending ? diff : -diff;
  });
}

export function listReports(options?: { ascending?: boolean; limit?: number }) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(reports, ascending).slice(0, limit);
}

export function createReport(description: string) {
  const report: ReportRow = {
    id: createId("rep"),
    description,
    created_at: new Date().toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  };

  reports.unshift(report);
  createCommandCenterEvent({
    action: "report_received",
    target_type: "report",
    target_id: report.id,
    details: "A new community report was submitted.",
  });
  return report;
}

export function markReportReviewed(id: string, reviewedBy = "command-center") {
  const report = reports.find((item) => item.id === id);

  if (!report) {
    return false;
  }

  report.reviewed = true;
  report.reviewed_at = new Date().toISOString();
  report.reviewed_by = reviewedBy;
  createCommandCenterEvent({
    action: "report_reviewed",
    target_type: "report",
    target_id: id,
    details: `Report marked reviewed by ${reviewedBy}.`,
  });
  return true;
}

export function listChatMessages(options?: { ascending?: boolean; limit?: number }) {
  const ascending = options?.ascending ?? true;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(chatMessages, ascending).slice(0, limit);
}

export function createChatMessage(username: string, message: string) {
  const chatMessage: ChatMessageRow = {
    id: createId("msg"),
    username,
    message,
    created_at: new Date().toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  };

  chatMessages.push(chatMessage);
  createCommandCenterEvent({
    action: "chat_message_received",
    target_type: "message",
    target_id: chatMessage.id,
    details: `New chat message from ${username}.`,
  });
  return chatMessage;
}

export function setMessageFlag(id: string, mode: "flag" | "unflag") {
  const chatMessage = chatMessages.find((item) => item.id === id);

  if (!chatMessage) {
    return false;
  }

  if (mode === "flag") {
    chatMessage.flagged = true;
    chatMessage.flagged_at = new Date().toISOString();
    chatMessage.flagged_reason = "manual command-center review";
    chatMessage.flagged_by = "command-center";
    createCommandCenterEvent({
      action: "message_flagged",
      target_type: "message",
      target_id: id,
      details: "Message flagged by command center.",
    });
    return true;
  }

  chatMessage.flagged = false;
  chatMessage.flagged_at = null;
  chatMessage.flagged_reason = null;
  chatMessage.flagged_by = null;
  createCommandCenterEvent({
    action: "message_unflagged",
    target_type: "message",
    target_id: id,
    details: "Message cleared by command center.",
  });
  return true;
}

export function listAuditLogs(options?: { ascending?: boolean; limit?: number }) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(auditLogs, ascending).slice(0, limit);
}

export function createAuditLog(entry: Omit<AccessAuditLogRow, "id" | "created_at">) {
  const log: AccessAuditLogRow = {
    id: createId("audit"),
    created_at: new Date().toISOString(),
    ...entry,
  };

  auditLogs.unshift(log);
  return log;
}

export function createCommandCenterEvent(
  entry: Omit<CommandCenterEventRow, "id" | "created_at">
) {
  const event: CommandCenterEventRow = {
    id: createId("event"),
    created_at: new Date().toISOString(),
    ...entry,
  };

  commandCenterEvents.unshift(event);
  return event;
}

export function listCommandCenterEvents(options?: { ascending?: boolean; limit?: number }) {
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 50;
  return sortByCreatedAt(commandCenterEvents, ascending).slice(0, limit);
}

export function getCommandCenterMetrics() {
  const pendingReports = reports.filter((report) => !report.reviewed).length;
  const reviewedReports = reports.length - pendingReports;
  const flaggedMessages = chatMessages.filter((message) => message.flagged).length;

  return {
    totalReports: reports.length,
    pendingReports,
    reviewedReports,
    totalMessages: chatMessages.length,
    flaggedMessages,
    accessAuditEvents: auditLogs.length,
    commandCenterEvents: commandCenterEvents.length,
  };
}
