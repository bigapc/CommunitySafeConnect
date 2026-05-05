import {
  AccessAuditLogRow,
  ChatMessageRow,
  CommandCenterEventRow,
  ReportRow,
  getCommandCenterMetrics,
  listAuditLogs,
  listChatMessages,
  listCommandCenterEvents,
  listReports,
} from "@/lib/localDataStore";

function includesQuery(value: string | null | undefined, query: string) {
  if (!query) {
    return true;
  }

  return (value || "").toLowerCase().includes(query);
}

export async function getCommandCenterReports(query: string) {
  const reports = listReports({ ascending: false, limit: 100 }).filter((report) => {
    return includesQuery(report.description, query);
  });

  return {
    reports,
    error: null,
  };
}

export async function getCommandCenterMessages(query: string) {
  const messages = listChatMessages({ ascending: false, limit: 100 }).filter((message) => {
    return includesQuery(message.username, query) || includesQuery(message.message, query);
  });

  return {
    messages,
    error: null,
  };
}

export async function getCommandCenterAuditLogs(query: string) {
  const auditLogs = listAuditLogs({ ascending: false, limit: 100 }).filter((log) => {
    return (
      includesQuery(log.action, query) ||
      includesQuery(log.scope, query) ||
      includesQuery(log.retention_mode, query) ||
      includesQuery(log.request_path, query)
    );
  });

  return {
    auditLogs,
    error: null,
  };
}

export async function getCommandCenterOverview() {
  const metrics = getCommandCenterMetrics();
  const recentEvents = listCommandCenterEvents({ ascending: false, limit: 8 });

  return {
    metrics,
    recentEvents,
    error: null,
  };
}