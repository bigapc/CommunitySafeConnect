import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

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

function includesQuery(value: string | null | undefined, query: string) {
  if (!query) {
    return true;
  }

  return (value || "").toLowerCase().includes(query);
}

export async function getCommandCenterReports(query: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, description, created_at, reviewed, reviewed_at, reviewed_by")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = ((data || []) as ReportRow[]).filter((report) => {
    return includesQuery(report.description, query);
  });

  return {
    reports,
    error,
  };
}

export async function getCommandCenterMessages(query: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, username, message, created_at, flagged, flagged_at, flagged_reason, flagged_by")
    .order("created_at", { ascending: false })
    .limit(100);

  const messages = ((data || []) as ChatMessageRow[]).filter((message) => {
    return includesQuery(message.username, query) || includesQuery(message.message, query);
  });

  return {
    messages,
    error,
  };
}

export async function getCommandCenterAuditLogs(query: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("access_audit_logs")
    .select("id, action, scope, retention_mode, retained_until, request_path, ip_address, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const auditLogs = ((data || []) as AccessAuditLogRow[]).filter((log) => {
    return (
      includesQuery(log.action, query) ||
      includesQuery(log.scope, query) ||
      includesQuery(log.retention_mode, query) ||
      includesQuery(log.request_path, query)
    );
  });

  return {
    auditLogs,
    error,
  };
}