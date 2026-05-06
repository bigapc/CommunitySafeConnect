import { createHash, createHmac } from "node:crypto";
import { BillingPlanCode, getDefaultOrganizationId, getOrganizationById, getPlanLimits } from "@/lib/tenancy";
import type { UserRole } from "@/lib/access";

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

export type CommandChannelKind = "alerts" | "tasks" | "emergency" | "debrief" | "drill";

export interface CommandChannelRow {
  id: string;
  organization_id: string;
  name: string;
  kind: CommandChannelKind;
  is_emergency: boolean;
  created_at: string;
  created_by: string;
  last_message_at: string | null;
}

export interface CommandChannelMessageRow {
  id: string;
  organization_id: string;
  channel_id: string;
  sender: string;
  body: string;
  priority: "normal" | "high" | "critical";
  created_at: string;
}

export interface CommandChannelTemplate {
  kind: CommandChannelKind;
  label: string;
  defaultName: string;
  defaultPriority: "normal" | "high" | "critical";
  allowedPriorities: Array<"normal" | "high" | "critical">;
  isEmergencyByDefault: boolean;
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
  target_type: "report" | "message" | "incident" | "billing" | "system" | "channel";
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
  version: number;
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

export type EvidenceDataset = "messages" | "reports" | "mixed";
export type EvidenceRequestStatus = "pending" | "approved" | "rejected" | "exported";

export interface EvidenceRequestRow {
  id: string;
  organization_id: string;
  dataset: EvidenceDataset;
  reason: string;
  case_reference: string | null;
  requested_by: string;
  requested_at: string;
  status: EvidenceRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  exported_at: string | null;
  export_hash: string | null;
  export_signature: string | null;
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

const commandChannels: CommandChannelRow[] = [
  {
    id: createId("chn"),
    organization_id: getDefaultOrganizationId(),
    name: "Emergency Coordination",
    kind: "emergency",
    is_emergency: true,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    created_by: "org_admin",
    last_message_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: createId("chn"),
    organization_id: getDefaultOrganizationId(),
    name: "Safety Drill Ops",
    kind: "drill",
    is_emergency: false,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    created_by: "moderator",
    last_message_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
];

const commandChannelMessages: CommandChannelMessageRow[] = [
  {
    id: createId("chmsg"),
    organization_id: getDefaultOrganizationId(),
    channel_id: commandChannels[0].id,
    sender: "ops-lead",
    body: "Perimeter team rerouted to east gate. Awaiting confirmation from unit 2.",
    priority: "critical",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: createId("chmsg"),
    organization_id: getDefaultOrganizationId(),
    channel_id: commandChannels[1].id,
    sender: "drill-coordinator",
    body: "Fire drill debrief starts in 10 minutes in briefing room B.",
    priority: "normal",
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
];

const commandChannelTemplates: CommandChannelTemplate[] = [
  {
    kind: "alerts",
    label: "Alerts",
    defaultName: "Operations Alerts",
    defaultPriority: "high",
    allowedPriorities: ["normal", "high", "critical"],
    isEmergencyByDefault: false,
  },
  {
    kind: "tasks",
    label: "Task Dispatch",
    defaultName: "Task Dispatch",
    defaultPriority: "normal",
    allowedPriorities: ["normal", "high"],
    isEmergencyByDefault: false,
  },
  {
    kind: "emergency",
    label: "Emergency",
    defaultName: "Emergency Coordination",
    defaultPriority: "critical",
    allowedPriorities: ["normal", "high", "critical"],
    isEmergencyByDefault: true,
  },
  {
    kind: "debrief",
    label: "Debrief",
    defaultName: "Debrief Thread",
    defaultPriority: "normal",
    allowedPriorities: ["normal", "high"],
    isEmergencyByDefault: false,
  },
  {
    kind: "drill",
    label: "Drill Coordination",
    defaultName: "Safety Drill Ops",
    defaultPriority: "high",
    allowedPriorities: ["normal", "high"],
    isEmergencyByDefault: false,
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
    version: 1,
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
    version: 1,
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

const evidenceRequests: EvidenceRequestRow[] = [
  {
    id: createId("evidence"),
    organization_id: getDefaultOrganizationId(),
    dataset: "messages",
    reason: "Historical records requested for official incident follow-up.",
    case_reference: "CASE-2026-0411",
    requested_by: "org_admin",
    requested_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    exported_at: null,
    export_hash: null,
    export_signature: null,
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

function getEvidenceSigningSecret() {
  return process.env.ACCESS_SESSION_SECRET || "communitysafeconnect-dev-secret";
}

function createEvidenceDigest(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}

function signEvidenceDigest(digest: string) {
  return createHmac("sha256", getEvidenceSigningSecret()).update(digest).digest("hex");
}

function verifyEvidenceDigestSignature(digest: string, signature: string) {
  return signEvidenceDigest(digest) === signature;
}

function buildEvidenceSnapshot(organizationId: string, request: EvidenceRequestRow) {
  const includeMessages = request.dataset === "messages" || request.dataset === "mixed";
  const includeReports = request.dataset === "reports" || request.dataset === "mixed";

  const scopedMessages = includeMessages
    ? chatMessages
      .filter((item) => item.organization_id === organizationId)
      .map((item) => ({
        id: item.id,
        username: item.username,
        message: item.message,
        created_at: item.created_at,
        flagged: item.flagged,
      }))
    : [];

  const scopedReports = includeReports
    ? reports
      .filter((item) => item.organization_id === organizationId)
      .map((item) => ({
        id: item.id,
        description: item.description,
        severity: item.severity,
        created_at: item.created_at,
        reviewed: item.reviewed,
      }))
    : [];

  return {
    request_id: request.id,
    organization_id: organizationId,
    dataset: request.dataset,
    case_reference: request.case_reference,
    requested_at: request.requested_at,
    exported_at: new Date().toISOString(),
    report_count: scopedReports.length,
    message_count: scopedMessages.length,
    reports: scopedReports,
    messages: scopedMessages,
  };
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

export function listCommandChannels(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 50;

  return sortByCreatedAt(
    commandChannels.filter((channel) => channel.organization_id === organizationId),
    ascending
  ).slice(0, limit);
}

export function listCommandChannelTemplates() {
  return commandChannelTemplates;
}

export function getCommandChannelTemplate(kind: CommandChannelKind) {
  return commandChannelTemplates.find((template) => template.kind === kind) || commandChannelTemplates[0];
}

export function getCommandChannelPermissions(role: UserRole) {
  return {
    canRead: true,
    canPost: role !== "analyst",
    canCreate: role === "org_admin" || role === "super_admin",
    canManage: role === "org_admin" || role === "super_admin",
  };
}

export function createCommandChannel(
  organizationId: string,
  input: {
    name?: string;
    kind: CommandChannelKind;
    isEmergency?: boolean;
    createdBy: string;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const template = getCommandChannelTemplate(input.kind);
  const defaultNameSuffix = new Date().toISOString().slice(0, 10);
  const normalizedName = input.name?.trim() || `${template.defaultName} ${defaultNameSuffix}`;

  const channel: CommandChannelRow = {
    id: createId("chn"),
    organization_id: scopedOrgId,
    name: normalizedName,
    kind: input.kind,
    is_emergency: input.isEmergency ?? template.isEmergencyByDefault,
    created_at: new Date().toISOString(),
    created_by: input.createdBy,
    last_message_at: null,
  };

  commandChannels.unshift(channel);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "command_channel_created",
    target_type: "channel",
    target_id: channel.id,
    details: `kind=${channel.kind} createdBy=${channel.created_by}`,
  });

  return channel;
}

export function listCommandChannelMessages(
  organizationId: string,
  channelId: string,
  options?: { ascending?: boolean; limit?: number }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;

  return sortByCreatedAt(
    commandChannelMessages.filter(
      (message) => message.organization_id === scopedOrgId && message.channel_id === channelId
    ),
    ascending
  ).slice(0, limit);
}

export function createCommandChannelMessage(
  organizationId: string,
  channelId: string,
  input: {
    sender: string;
    body: string;
    priority: "normal" | "high" | "critical";
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const channel = commandChannels.find(
    (item) => item.id === channelId && item.organization_id === scopedOrgId
  );

  if (!channel) {
    return null;
  }

  const template = getCommandChannelTemplate(channel.kind);
  if (!template.allowedPriorities.includes(input.priority)) {
    return {
      error: `Priority ${input.priority} is not allowed for ${channel.kind} channels.`,
      allowedPriorities: template.allowedPriorities,
    };
  }

  const message: CommandChannelMessageRow = {
    id: createId("chmsg"),
    organization_id: scopedOrgId,
    channel_id: channelId,
    sender: input.sender,
    body: input.body,
    priority: input.priority,
    created_at: new Date().toISOString(),
  };

  commandChannelMessages.unshift(message);
  channel.last_message_at = message.created_at;

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "command_channel_message_posted",
    target_type: "channel",
    target_id: channelId,
    details: `priority=${input.priority} sender=${input.sender}`,
  });

  return message;
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
    version: 1,
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
    expectedVersion?: number;
    updatedBy?: string;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const incident = incidents.find(
    (item) => item.id === incidentId && item.organization_id === scopedOrgId
  );

  if (!incident) {
    return null;
  }

  if (
    typeof updates.expectedVersion === "number" &&
    updates.expectedVersion !== incident.version
  ) {
    return {
      conflict: true as const,
      expectedVersion: updates.expectedVersion,
      actualVersion: incident.version,
    };
  }

  const changes: string[] = [];

  if (updates.status && updates.status !== incident.status) {
    changes.push(`status:${incident.status}->${updates.status}`);
    incident.status = updates.status;
  }

  if (updates.assignee !== undefined && updates.assignee !== incident.assignee) {
    const previousAssignee = incident.assignee || "unassigned";
    const nextAssignee = updates.assignee || "unassigned";
    changes.push(`assignee:${previousAssignee}->${nextAssignee}`);
    incident.assignee = updates.assignee;
  }

  if (updates.escalated !== undefined && updates.escalated !== incident.escalated) {
    changes.push(`escalated:${incident.escalated}->${updates.escalated}`);
    incident.escalated = updates.escalated;
  }

  if (changes.length === 0) {
    return incident;
  }

  incident.version += 1;
  incident.updated_at = new Date().toISOString();

  const updatedBy = updates.updatedBy?.trim() || "moderator";

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "incident_updated",
    target_type: "incident",
    target_id: incident.id,
    details: `${updatedBy} updated ${changes.join(" | ")}`,
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

export function requestDataRemoval(
  organizationId: string,
  input: {
    requestedBy: string;
    dataset: "messages" | "reports";
    reason: string;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);

  return createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "data_removal_requested",
    target_type: "system",
    target_id: null,
    details: `${input.dataset} requestedBy=${input.requestedBy} reason=${input.reason}`,
  });
}

export function requestSubscriptionPlanChange(
  organizationId: string,
  input: {
    requestedBy: string;
    fromPlan: BillingPlanCode;
    toPlan: BillingPlanCode;
    reason: string;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);

  if (input.fromPlan === input.toPlan) {
    return {
      error: "Requested plan is already active.",
    };
  }

  const event = createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "subscription_plan_change_requested",
    target_type: "billing",
    target_id: null,
    details: `from=${input.fromPlan} to=${input.toPlan} requestedBy=${input.requestedBy} reason=${input.reason}`,
  });

  return {
    ok: true,
    event,
  };
}

export function listEvidenceRequests(options?: {
  organizationId?: string;
  ascending?: boolean;
  limit?: number;
}) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const ascending = options?.ascending ?? false;
  const limit = options?.limit ?? 100;
  return sortByCreatedAt(
    evidenceRequests
      .filter((request) => request.organization_id === organizationId)
      .map((request) => ({ ...request, created_at: request.requested_at })),
    ascending
  )
    .slice(0, limit)
    .map(({ created_at: _createdAt, ...request }) => request);
}

export function createEvidenceRequest(
  organizationId: string,
  input: {
    dataset: EvidenceDataset;
    reason: string;
    caseReference?: string | null;
    requestedBy: string;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request: EvidenceRequestRow = {
    id: createId("evidence"),
    organization_id: scopedOrgId,
    dataset: input.dataset,
    reason: input.reason,
    case_reference: input.caseReference?.trim() || null,
    requested_by: input.requestedBy,
    requested_at: new Date().toISOString(),
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    exported_at: null,
    export_hash: null,
    export_signature: null,
  };

  evidenceRequests.unshift(request);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "evidence_request_created",
    target_type: "system",
    target_id: request.id,
    details: `dataset=${request.dataset} requestedBy=${request.requested_by}`,
  });

  return request;
}

export function reviewEvidenceRequest(
  organizationId: string,
  requestId: string,
  input: {
    status: "approved" | "rejected";
    reviewedBy: string;
    reviewNotes?: string | null;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request = evidenceRequests.find(
    (item) => item.id === requestId && item.organization_id === scopedOrgId
  );

  if (!request) {
    return null;
  }

  request.status = input.status;
  request.reviewed_by = input.reviewedBy;
  request.reviewed_at = new Date().toISOString();
  request.review_notes = input.reviewNotes?.trim() || null;

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "evidence_request_reviewed",
    target_type: "system",
    target_id: request.id,
    details: `status=${request.status} reviewedBy=${request.reviewed_by}`,
  });

  return request;
}

export function exportEvidenceRequest(
  organizationId: string,
  requestId: string,
  exportedBy: string
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request = evidenceRequests.find(
    (item) => item.id === requestId && item.organization_id === scopedOrgId
  );

  if (!request) {
    return null;
  }

  if (request.status !== "approved" && request.status !== "exported") {
    return {
      error: "Evidence request must be approved before export.",
    };
  }

  const snapshot = buildEvidenceSnapshot(scopedOrgId, request);
  const serializedSnapshot = JSON.stringify(snapshot);
  const digest = createEvidenceDigest(serializedSnapshot);
  const signature = signEvidenceDigest(digest);

  request.status = "exported";
  request.exported_at = snapshot.exported_at;
  request.reviewed_by = request.reviewed_by || exportedBy;
  request.reviewed_at = request.reviewed_at || new Date().toISOString();
  request.export_hash = digest;
  request.export_signature = signature;

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "evidence_export_generated",
    target_type: "system",
    target_id: request.id,
    details: `exportedBy=${exportedBy} dataset=${request.dataset} hash=${digest.slice(0, 12)}`,
  });

  return request;
}

export function verifyEvidenceExportIntegrity(
  organizationId: string,
  requestId: string,
  verifiedBy: string
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request = evidenceRequests.find(
    (item) => item.id === requestId && item.organization_id === scopedOrgId
  );

  if (!request) {
    return null;
  }

  if (!request.export_hash || !request.export_signature) {
    return {
      ok: false,
      reason: "No export artifact is available for this request.",
    };
  }

  const signatureValid = verifyEvidenceDigestSignature(request.export_hash, request.export_signature);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "evidence_export_verified",
    target_type: "system",
    target_id: request.id,
    details: `verifiedBy=${verifiedBy} ok=${signatureValid}`,
  });

  return {
    ok: signatureValid,
    reason: signatureValid ? null : "Stored signature does not match stored hash.",
  };
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
  const scopedChannels = commandChannels.filter((channel) => channel.organization_id === scopedOrgId);
  const scopedChannelMessages = commandChannelMessages.filter(
    (message) => message.organization_id === scopedOrgId
  );
  const scopedAudits = auditLogs.filter((log) => log.organization_id === scopedOrgId);
  const scopedEvents = commandCenterEvents.filter((event) => event.organization_id === scopedOrgId);
  const scopedIncidents = incidents.filter((incident) => incident.organization_id === scopedOrgId);
  const scopedEvidenceRequests = evidenceRequests.filter(
    (request) => request.organization_id === scopedOrgId
  );
  const scopedEscalationRequests = escalationRequests.filter(
    (request) => request.organization_id === scopedOrgId
  );

  const pendingReports = scopedReports.filter((report) => !report.reviewed).length;
  const reviewedReports = scopedReports.length - pendingReports;
  const flaggedMessages = scopedMessages.filter((message) => message.flagged).length;
  const openIncidents = scopedIncidents.filter((incident) => incident.status !== "resolved").length;
  const escalatedIncidents = scopedIncidents.filter((incident) => incident.escalated).length;
  const pendingEvidenceRequests = scopedEvidenceRequests.filter(
    (request) => request.status === "pending"
  ).length;
  const approvedEvidenceRequests = scopedEvidenceRequests.filter(
    (request) => request.status === "approved"
  ).length;
  const exportedEvidenceRequests = scopedEvidenceRequests.filter(
    (request) => request.status === "exported"
  ).length;
  const pendingPlanChangeRequests = scopedEvents.filter(
    (event) => event.action === "subscription_plan_change_requested"
  ).length;
  const pendingEscalationRequests = scopedEscalationRequests.filter(
    (request) => request.status !== "resolved"
  ).length;
  const cutoff24hMs = Date.now() - 24 * 60 * 60 * 1000;
  const activeCommandChannels24h = scopedChannels.filter((channel) => {
    if (!channel.last_message_at) {
      return false;
    }
    return new Date(channel.last_message_at).getTime() >= cutoff24hMs;
  }).length;
  const criticalChannelMessages24h = scopedChannelMessages.filter((message) => {
    return message.priority === "critical" && new Date(message.created_at).getTime() >= cutoff24hMs;
  }).length;
  const unresolvedTaskChannels = scopedChannels.filter((channel) => {
    if (channel.kind !== "tasks") {
      return false;
    }

    const latestMessage = scopedChannelMessages
      .filter((message) => message.channel_id === channel.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    if (!latestMessage) {
      return true;
    }

    const normalizedBody = latestMessage.body.toLowerCase();
    return !normalizedBody.includes("resolved") && !normalizedBody.includes("closed") && !normalizedBody.includes("done");
  }).length;

  return {
    totalReports: scopedReports.length,
    pendingReports,
    reviewedReports,
    totalMessages: scopedMessages.length,
    flaggedMessages,
    totalCommandChannels: scopedChannels.length,
    activeCommandChannels24h,
    criticalChannelMessages24h,
    unresolvedTaskChannels,
    totalIncidents: scopedIncidents.length,
    openIncidents,
    escalatedIncidents,
    totalEvidenceRequests: scopedEvidenceRequests.length,
    pendingEvidenceRequests,
    approvedEvidenceRequests,
    exportedEvidenceRequests,
    accessAuditEvents: scopedAudits.length,
    commandCenterEvents: scopedEvents.length,
    pendingPlanChangeRequests,
    pendingEscalationRequests,
  };
}

// ─── Escalation Requests ──────────────────────────────────────────────────

export type EscalationCategory =
  | "restricted_access_review"
  | "exceptional_data_review"
  | "redaction_review"
  | "sensitive_compliance"
  | "legal_coordination";

export type EscalationStatus = "submitted" | "under_review" | "resolved";

export interface EscalationRequestRow {
  id: string;
  organization_id: string;
  category: EscalationCategory;
  reason: string;
  contact_name: string;
  contact_email: string;
  requested_by_role: string;
  status: EscalationStatus;
  assigned_to: string | null;
  verification_call_at: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

const escalationRequests: EscalationRequestRow[] = [];

// Seed test data for escalation review workflow testing
if (escalationRequests.length === 0) {
  const defaultOrgId = getDefaultOrganizationId();
  const now = Date.now();

  // Critical priority: Legal coordination case (should surface first)
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "legal_coordination",
    reason: "Legal counsel needed for ongoing investigation into suspicious activity",
    contact_name: "Margaret Chen",
    contact_email: "m.chen@example.com",
    requested_by_role: "administrator",
    status: "submitted",
    assigned_to: null,
    verification_call_at: null,
    created_at: new Date(now - 1000 * 60 * 120).toISOString(),
    resolved_at: null,
    resolution_notes: null,
  });

  // Critical priority: Sensitive compliance case
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "sensitive_compliance",
    reason: "GDPR data deletion request requires immediate action",
    contact_name: "James Rodriguez",
    contact_email: "j.rodriguez@example.com",
    requested_by_role: "community_lead",
    status: "submitted",
    assigned_to: null,
    verification_call_at: null,
    created_at: new Date(now - 1000 * 60 * 90).toISOString(),
    resolved_at: null,
    resolution_notes: null,
  });

  // High priority: Exceptional data review
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "exceptional_data_review",
    reason: "Request for access to archived messages from restricted zone",
    contact_name: "Patricia Wilson",
    contact_email: "p.wilson@example.com",
    requested_by_role: "community_lead",
    status: "submitted",
    assigned_to: null,
    verification_call_at: null,
    created_at: new Date(now - 1000 * 60 * 45).toISOString(),
    resolved_at: null,
    resolution_notes: null,
  });

  // High priority: Redaction review (already assigned to test review workflow)
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "redaction_review",
    reason: "Sensitive content redaction needed before report release",
    contact_name: "Michael Torres",
    contact_email: "m.torres@example.com",
    requested_by_role: "administrator",
    status: "under_review",
    assigned_to: "Sarah_Kim_ComplianceLead",
    verification_call_at: new Date(now + 1000 * 60 * 60 * 2).toISOString(),
    created_at: new Date(now - 1000 * 60 * 30).toISOString(),
    resolved_at: null,
    resolution_notes: null,
  });

  // Standard priority: Restricted access (already resolved)
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "restricted_access_review",
    reason: "Access to secure zone for maintenance work approved",
    contact_name: "David Kim",
    contact_email: "d.kim@example.com",
    requested_by_role: "operations_staff",
    status: "resolved",
    assigned_to: "James_Wong_OpsDirector",
    verification_call_at: new Date(now - 1000 * 60 * 480).toISOString(),
    created_at: new Date(now - 1000 * 60 * 600).toISOString(),
    resolved_at: new Date(now - 1000 * 60 * 120).toISOString(),
    resolution_notes: "Access approved for 8-hour window, verified and revoked.",
  });

  // Standard priority: Restricted access (submitted, no owner)
  escalationRequests.push({
    id: createId("esc"),
    organization_id: defaultOrgId,
    category: "restricted_access_review",
    reason: "Temporary elevated access needed for incident investigation",
    contact_name: "Emily Jackson",
    contact_email: "e.jackson@example.com",
    requested_by_role: "community_member",
    status: "submitted",
    assigned_to: null,
    verification_call_at: null,
    created_at: new Date(now - 1000 * 60 * 15).toISOString(),
    resolved_at: null,
    resolution_notes: null,
  });
}

export function createEscalationRequest(
  organizationId: string,
  input: {
    category: EscalationCategory;
    reason: string;
    contactName: string;
    contactEmail: string;
    requestedByRole: string;
  }
): EscalationRequestRow {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request: EscalationRequestRow = {
    id: createId("esc"),
    organization_id: scopedOrgId,
    category: input.category,
    reason: input.reason,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    requested_by_role: input.requestedByRole,
    status: "submitted",
    assigned_to: null,
    verification_call_at: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolution_notes: null,
  };
  escalationRequests.push(request);

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: "escalation_request_submitted",
    target_type: "system",
    target_id: request.id,
    details: `category=${input.category} contactName=${input.contactName} requestedByRole=${input.requestedByRole}`,
  });

  return request;
}

export function listEscalationRequests(options?: { organizationId?: string; limit?: number }) {
  const organizationId = getScopedOrgId(options?.organizationId);
  const limit = options?.limit ?? 50;
  return [...escalationRequests]
    .filter((r) => r.organization_id === organizationId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function updateEscalationRequest(
  organizationId: string,
  escalationId: string,
  input: {
    status: EscalationStatus;
    reviewedBy: string;
    resolutionNotes?: string | null;
    assignedTo?: string | null;
    verificationCallAt?: string | null;
  }
) {
  const scopedOrgId = getScopedOrgId(organizationId);
  const request = escalationRequests.find(
    (item) => item.id === escalationId && item.organization_id === scopedOrgId
  );

  if (!request) {
    return null;
  }

  request.status = input.status;
  request.resolution_notes = input.resolutionNotes || null;
  request.assigned_to = input.assignedTo?.trim() || null;
  request.verification_call_at = input.verificationCallAt?.trim() || null;
  request.resolved_at = input.status === "resolved" ? new Date().toISOString() : null;

  createCommandCenterEvent({
    organization_id: scopedOrgId,
    action: `escalation_request_${input.status}`,
    target_type: "system",
    target_id: request.id,
    details: `reviewedBy=${input.reviewedBy} assignedTo=${input.assignedTo || "unassigned"} verificationCallAt=${input.verificationCallAt || "unscheduled"} notes=${input.resolutionNotes || "none"}`,
  });

  return request;
}
