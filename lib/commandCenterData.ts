import {
  listAuditLogs,
  listChatMessages,
  listReports,
  verifyAuditLogChain,
} from "@/lib/localDataStore";

function includesQuery(value: string | null | undefined, query: string) {
  if (!query) {
    return true;
  }

  return (value || "").toLowerCase().includes(query);
}

export async function getCommandCenterReports(organizationId: string, query: string) {
  const reports = listReports(organizationId, { ascending: false, limit: 100 }).filter((report) => {
    return includesQuery(report.description, query);
  });

  return {
    reports,
    error: null,
  };
}

export async function getCommandCenterMessages(organizationId: string, query: string) {
  const messages = listChatMessages(organizationId, { ascending: false, limit: 100 }).filter((message) => {
    return includesQuery(message.username, query) || includesQuery(message.message, query);
  });

  return {
    messages,
    error: null,
  };
}

export async function getCommandCenterAuditLogs(organizationId: string, query: string) {
  const auditLogs = listAuditLogs(organizationId, { ascending: false, limit: 100 }).filter((log) => {
    return (
      includesQuery(log.action, query) ||
      includesQuery(log.scope, query) ||
      includesQuery(log.retention_mode, query) ||
      includesQuery(log.request_path, query)
    );
  });
  const integrity = verifyAuditLogChain(organizationId);

  return {
    auditLogs,
    integrity,
    error: null,
  };
}