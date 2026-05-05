import { getDefaultOrganizationId, getOrganizationById, getPlanLimits } from "@/lib/tenancy";

export interface ReportRow {
  id: string;
  organization_id: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
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

export interface CommandCenterEventRow {
  id: string;
  organization_id: string;
  action: string;
  target_type: "report" | "message" | "incident" | "billing" | "system";
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "new" | "triaged" | "in_progress" | "resolved";

export interface IncidentRow {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignee: string | null;
  escalated: boolean;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageEventRow {
  id: string;
  organization_id: string;
  metric: "reports" | "messages";
  quantity: number;
  created_at: string;
}

export interface InvoiceEventRow {
  id: string;
  organization_id: string;
  event_type: "invoice_preview" | "invoice_issued" | "payment_received";
  amount_usd: number;
  details: string;
  created_at: string;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getScopedOrgId(organizationId?: string) {
  const normalized = (organizationId || getDefaultOrganizationId()).trim();
  if (!getOrganizationById(normalized)) {
    return getDefaultOrganizationId();
  }
  return normalized;
}

const reports: ReportRow[] = [
  {
    id: createId("rep"),
    organization_id: getDefaultOrganizationId(),
    description: "Broken streetlight at 7th and Maple; area is very dark at night.",
    severity: "medium",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    id: createId("rep"),
    organization_id: getDefaultOrganizationId(),
    description: "Suspicious vehicle circling the school zone after hours.",
    severity: "high",
    created_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    reviewed: true,
    reviewed_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reviewed_by: "command-center",
  },
];

const chatMessages: ChatMessageRow[] = [
  {
    id: createId("msg"),
    organization_id: getDefaultOrganizationId(),
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
    organization_id: getDefaultOrganizationId(),
    username: "CommunityLead",
    message: "Reminder: safety walk starts at 6pm in Zone B.",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  },
];

const incidents: IncidentRow[] = [
  {
    id: createId("inc"),
    organization_id: getDefaultOrganizationId(),
    title: "Campus perimeter lighting outage",
    description: "Multiple cameras and lights offline on the east perimeter.",
    severity: "critical",
    status: "in_progress",
    assignee: "ops-shift-alpha",
    escalated: true,
    sla_due_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: createId("inc"),
    organization_id: getDefaultOrganizationId(),
    title: "Event crowd control complaint",
    description: "North entrance bottleneck reported by two volunteers.",
    severity: "medium",
    status: "triaged",
    assignee: "ops-moderation",
    escalated: false,
    sla_due_at: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

const usageEvents: UsageEventRow[] = [];

const invoiceEvents: InvoiceEventRow[] = [
  {
    id: createId("inv"),
    organization_id: getDefaultOrganizationId(),
    event_type: "invoice_preview",
    amount_usd: 1499,
    details: "Enterprise monthly base preview generated.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const auditLogs: AccessAuditLogRow[] = [];

const commandCenterEvents: CommandCenterEventRow[] = [
  {
    id: createId("event"),
    organization_id: getDefaultOrganizationId(),
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

function createSlaDueAt(severity: IncidentSeverity) {
  const now = Date.now();
  const minutesBySeverity: Record<IncidentSeverity, number> = {
    low: 24 * 60,
    medium: 8 * 60,
    high: 2 * 60,
    critical: 60,
  };

  return new Date(now + minutesBySeverity[severity] * 60 * 1000).toISOString();
}

function createUsageEvent(organizationId: string, metric: "reports" | "messages", quantity: number) {
  usageEvents.push({
    id: createId("usage"),
    organization_id: organizationId,
    metric,
    quantity,
    created_at: new Date().toISOString(),
  });
}

function getCurrentMonthKey(value: Date = new Date()) {
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}`;
}

function getMonthlyUsage(organizationId: string) {
  const key = getCurrentMonthKey();
  const reportUsage = usageEvents
    .filter((event) => event.organization_id === organizationId && event.metric === "reports")
    .filter((event) => event.created_at.startsWith(key))
    .reduce((sum, event) => sum + event.quantity, 0);
  const messageUsage = usageEvents
    .filter((event) => event.organization_id === organizationId && event.metric === "messages")
    .filter((event) => event.created_at.startsWith(key))
    .reduce((sum, event) => sum + event.quantity, 0);

  return {
    reports: reportUsage,
    messages: messageUsage,
  };
}

function assertPlanLimit(organizationId: string, metric: "reports" | "messages") {
  const organization = getOrganizationById(organizationId);

  if (!organization) {
    throw new Error("Unknown organization context.");
  }

  const limits = getPlanLimits(organization.plan);
  const usage = getMonthlyUsage(organizationId);

  if (metric === "reports" && usage.reports >= limits.monthlyReports) {
    throw new Error("Monthly report limit reached for current plan.");
  }

  if (metric === "messages" && usage.messages >= limits.monthlyMessages) {
    throw new Error("Monthly message limit reached for current plan.");
  }
}

export function listReports(options?: { organizationId?: string; ascending?: boolean; limit?: number }) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    reports.filter((report) => report.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createReport(
  organizationId: string,
  description: string,
  severity: IncidentSeverity = "medium"
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  assertPlanLimit(scopedOrgId, "reports");

  const report: ReportRow = {
    id: createId("rep"),
    organization_id: scopedOrgId,
    description,
    severity,
    created_at: new Date().toISOString(),
    reviewed: false,
    reviewed_at: null,
    reviewed_by: null,
  };

  reports.unshift(report);
  createUsageEvent(scopedOrgId, "reports", 1);
  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "report_received",
    target_type: "report",
    target_id: report.id,
    details: `New ${severity} report received.`,
  });

  if (severity === "high" || severity === "critical") {
    createIncident(scopedOrgId, {
      title: `Escalated report ${report.id.slice(0, 8)}`,
      description: description || "Auto-escalated from report intake.",
      severity,
      assignee: "ops-intake",
      sourceReportId: report.id,
    });
  }

  return report;
}

export function markReportReviewed(
  organizationId: string,
  id: string,
  reviewedBy = "command-center"
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const report = reports.find((item) => item.id === id && item.organization_id === scopedOrgId);

  if (!report) {
    return false;
  }

  report.reviewed = true;
  report.reviewed_at = new Date().toISOString();
  report.reviewed_by = reviewedBy;
  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "report_reviewed",
    target_type: "report",
    target_id: id,
    details: `Report marked reviewed by ${reviewedBy}.`,
  });
  return true;
}

export function listChatMessages(options?: { organizationId?: string; ascending?: boolean; limit?: number }) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? true;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    chatMessages.filter((message) => message.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createChatMessage(organizationId: string, username: string, message: string) {
  const scopedOrgId = getScopedOrgId(organizationId);
  assertPlanLimit(scopedOrgId, "messages");

  const chatMessage: ChatMessageRow = {
    id: createId("msg"),
    organization_id: scopedOrgId,
    username,
    message,
    created_at: new Date().toISOString(),
    flagged: false,
    flagged_at: null,
    flagged_reason: null,
    flagged_by: null,
  };

  chatMessages.push(chatMessage);
  createUsageEvent(scopedOrgId, "messages", 1);
  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "chat_message_received",
    target_type: "message",
    target_id: chatMessage.id,
    details: `New chat message from ${username}.`,
  });
  return chatMessage;
}

export function setMessageFlag(
  organizationId: string,
  id: string,
  mode: "flag" | "unflag"
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const chatMessage = chatMessages.find(
    (item) => item.id === id && item.organization_id === scopedOrgId
  );

  if (!chatMessage) {
    return false;
  }

  if (mode === "flag") {
    chatMessage.flagged = true;
    chatMessage.flagged_at = new Date().toISOString();
    chatMessage.flagged_reason = "manual command-center review";
    chatMessage.flagged_by = "command-center";
    createCommandCenterEvent({
      organization_id: scopedOrgId,
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
    organization_id: scopedOrgId,
    action: "message_unflagged",
    target_type: "message",
    target_id: id,
    details: "Message cleared by command center.",
  });
  return true;
}

export function listAuditLogs(options?: { organizationId?: string; ascending?: boolean; limit?: number }) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    auditLogs.filter((log) => log.organization_id === organizationId),
    ascending
  ).slice(0, limit);
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

export function listCommandCenterEvents(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 50;
  return sortByCreatedAt(
    commandCenterEvents.filter((event) => event.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function listIncidents(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    incidents.filter((incident) => incident.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createIncident(
  organizationId: string,
  input: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    assignee?: string | null;
    sourceReportId?: string | null;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const incident: IncidentRow = {
    id: createId("inc"),
    organization_id: scopedOrgId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: "new",
    assignee: input.assignee || null,
    escalated: input.severity === "critical",
    sla_due_at: createSlaDueAt(input.severity),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  incidents.unshift(incident);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "incident_created",
    target_type: "incident",
    target_id: incident.id,
    details: input.sourceReportId
      ? `Incident created from report ${input.sourceReportId}.`
      : `Incident created at severity ${input.severity}.`,
  });

  return incident;
}

export function updateIncident(
  organizationId: string,
  incidentId: string,
  updates: {
    status?: IncidentStatus;
    assignee?: string | null;
    escalated?: boolean;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const incident = incidents.find(
    (item) => item.id === incidentId && item.organization_id === scopedOrgId
  );

  if (!incident) {
    return null;
  }

  if (updates.status) {
    incident.status = updates.status;
  }

  if (updates.assignee !== undefined) {
    incident.assignee = updates.assignee;
  }

  if (updates.escalated !== undefined) {
    incident.escalated = updates.escalated;
  }

  incident.updated_at = new Date().toISOString();

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "incident_updated",
    target_type: "incident",
    target_id: incident.id,
    details: `status=${incident.status} escalated=${incident.escalated}`,
  });

  return incident;
}

export function listInvoiceEvents(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 30;
  return sortByCreatedAt(
    invoiceEvents.filter((event) => event.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function createInvoiceEvent(
  organizationId: string,
  eventType: InvoiceEventRow["event_type"],
  amountUsd: number,
  details: string
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const event: InvoiceEventRow = {
    id: createId("inv"),
    organization_id: scopedOrgId,
    event_type: eventType,
    amount_usd: amountUsd,
    details,
    created_at: new Date().toISOString(),
  };

  invoiceEvents.unshift(event);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "billing_event_recorded",
    target_type: "billing",
    target_id: event.id,
    details: `${eventType} $${amountUsd}`,
  });

  return event;
}

export function getOrganizationUsageSnapshot(organizationId: string) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const organization = getOrganizationById(scopedOrgId);

  if (!organization) {
    throw new Error("Unknown organization context.");
  }

  const limits = getPlanLimits(organization.plan);
  const usage = getMonthlyUsage(scopedOrgId);

  return {
    month: getCurrentMonthKey(),
    plan: organization.plan,
    limits,
    usage,
    utilization: {
      reports: limits.monthlyReports === 0 ? 0 : usage.reports / limits.monthlyReports,
      messages: limits.monthlyMessages === 0 ? 0 : usage.messages / limits.monthlyMessages,
    },
  };
}

export function getCommandCenterMetrics(organizationId: string) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const scopedReports = reports.filter((report) => report.organization_id === scopedOrgId);
  const scopedMessages = chatMessages.filter((message) => message.organization_id === scopedOrgId);
  const scopedAudits = auditLogs.filter((log) => log.organization_id === scopedOrgId);
  const scopedEvents = commandCenterEvents.filter((event) => event.organization_id === scopedOrgId);
  const scopedIncidents = incidents.filter((incident) => incident.organization_id === scopedOrgId);

  const pendingReports = scopedReports.filter((report) => !report.reviewed).length;
  const reviewedReports = scopedReports.length - pendingReports;
  const flaggedMessages = scopedMessages.filter((message) => message.flagged).length;
  const openIncidents = scopedIncidents.filter((incident) => incident.status !== "resolved").length;
  const escalatedIncidents = scopedIncidents.filter((incident) => incident.escalated).length;

  return {
    totalReports: scopedReports.length,
    pendingReports,
    reviewedReports,
    totalMessages: scopedMessages.length,
    flaggedMessages,
    totalIncidents: scopedIncidents.length,
    openIncidents,
    escalatedIncidents,
    accessAuditEvents: scopedAudits.length,
    commandCenterEvents: scopedEvents.length,
  };
}
