import {
  getOrganizationUsageSnapshot,
  getCommandCenterMetrics,
  listIncidents,
  listInvoiceEvents,
  listAuditLogs,
  listChatMessages,
  listCommandCenterEvents,
  listReports,
} from "@/lib/localDataStore";
import { getOrganizationById } from "@/lib/tenancy";

function includesQuery(value: string | null | undefined, query: string) {
  if (!query) {
    return true;
  }

  return (value || "").toLowerCase().includes(query);
}

export async function getCommandCenterReports(organizationId: string, query: string) {
  const reports = listReports({ organizationId, ascending: false, limit: 100 }).filter((report) => {
    return includesQuery(report.description, query);
  });

  return {
    reports,
    error: null,
  };
}

export async function getCommandCenterMessages(organizationId: string, query: string) {
  const messages = listChatMessages({ organizationId, ascending: false, limit: 100 }).filter((message) => {
    return includesQuery(message.username, query) || includesQuery(message.message, query);
  });

  return {
    messages,
    error: null,
  };
}

export async function getCommandCenterAuditLogs(organizationId: string, query: string) {
  const auditLogs = listAuditLogs({ organizationId, ascending: false, limit: 100 }).filter((log) => {
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
  return getCommandCenterOverviewByOrganization("metro-city-university");
}

export async function getCommandCenterOverviewByOrganization(organizationId: string) {
  const metrics = getCommandCenterMetrics(organizationId);
  const recentEvents = listCommandCenterEvents({ organizationId, ascending: false, limit: 8 });
  const usage = getOrganizationUsageSnapshot(organizationId);
  const organization = getOrganizationById(organizationId);

  return {
    organization,
    metrics,
    usage,
    recentEvents,
    error: null,
  };
}

export async function getCommandCenterIncidents(organizationId: string, query: string) {
  const incidents = listIncidents({ organizationId, ascending: false, limit: 100 }).filter((incident) => {
    return (
      includesQuery(incident.title, query) ||
      includesQuery(incident.description, query) ||
      includesQuery(incident.status, query) ||
      includesQuery(incident.severity, query)
    );
  });

  return {
    incidents,
    error: null,
  };
}

export async function getCommandCenterSubscription(organizationId: string) {
  const organization = getOrganizationById(organizationId);
  const usage = getOrganizationUsageSnapshot(organizationId);
  const invoiceEvents = listInvoiceEvents({ organizationId, ascending: false, limit: 20 });

  return {
    organization,
    usage,
    invoiceEvents,
    error: null,
  };
}