import {
  getOrganizationUsageSnapshot,
  getCommandCenterMetrics,
  listIncidents,
  listInvoiceEvents,
  listEscalationRequests,
  listAuditLogs,
  listChatMessages,
  listCommandCenterEvents,
  listEvidenceRequests,
  listReports,
} from "@/lib/localDataStore";
import type { CommandCenterEventRow } from "@/lib/localDataStore";
import { sortEscalationsByUrgency, summarizeEscalationPriority, summarizeEscalationSla } from "@/lib/escalationSla";
import { getOrganizationById, listBillingPlans, mapOrganizationPlanToBilling } from "@/lib/tenancy";

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
  const allEscalations = sortEscalationsByUrgency(listEscalationRequests({ organizationId, limit: 200 }));
  const recentEscalations = allEscalations.slice(0, 6);
  const escalationSla = summarizeEscalationSla(allEscalations);
  const escalationPriority = summarizeEscalationPriority(allEscalations.filter((request) => request.status !== "resolved"));
  const usage = getOrganizationUsageSnapshot(organizationId);
  const organization = getOrganizationById(organizationId);

  return {
    organization,
    metrics,
    usage,
    recentEvents,
    recentEscalations,
    escalationSla,
    escalationPriority,
    error: null,
  };
}

export function getIncidentEventsById(
  organizationId: string,
  incidentIds: string[],
  maxEventsPerIncident = 4
) {
  const idSet = new Set(incidentIds);
  const incidentEvents = listCommandCenterEvents({ organizationId, ascending: false, limit: 500 }).filter(
    (event) => event.target_type === "incident" && !!event.target_id && idSet.has(event.target_id)
  );

  const incidentEventsById: Record<string, CommandCenterEventRow[]> = {};

  for (const event of incidentEvents) {
    const incidentId = event.target_id as string;
    const current = incidentEventsById[incidentId] || [];

    if (current.length >= maxEventsPerIncident) {
      continue;
    }

    incidentEventsById[incidentId] = [...current, event];
  }

  return incidentEventsById;
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

  const incidentEventsById = getIncidentEventsById(
    organizationId,
    incidents.map((incident) => incident.id)
  );

  return {
    incidents,
    incidentEventsById,
    error: null,
  };
}

export async function getCommandCenterSubscription(organizationId: string) {
  const organization = getOrganizationById(organizationId);
  const usage = getOrganizationUsageSnapshot(organizationId);
  const invoiceEvents = listInvoiceEvents({ organizationId, ascending: false, limit: 20 });
  const billingPlans = listBillingPlans();
  const currentBillingPlan = organization ? mapOrganizationPlanToBilling(organization.plan) : "basic";

  return {
    organization,
    usage,
    invoiceEvents,
    billingPlans,
    currentBillingPlan,
    error: null,
  };
}

export async function getCommandCenterEvidenceRequests(organizationId: string, query: string) {
  const requests = listEvidenceRequests({ organizationId, ascending: false, limit: 100 }).filter((request) => {
    return (
      includesQuery(request.dataset, query) ||
      includesQuery(request.reason, query) ||
      includesQuery(request.case_reference, query) ||
      includesQuery(request.requested_by, query) ||
      includesQuery(request.status, query)
    );
  });

  return {
    requests,
    error: null,
  };
}

export async function getCommandCenterEscalations(
  organizationId: string,
  query: string,
  status: "all" | "submitted" | "under_review" | "resolved"
) {
  const requests = sortEscalationsByUrgency(
    listEscalationRequests({ organizationId, limit: 200 }).filter((request) => {
      const matchesStatus = status === "all" ? true : request.status === status;
      return (
        matchesStatus && (
          includesQuery(request.category, query) ||
          includesQuery(request.reason, query) ||
          includesQuery(request.contact_name, query) ||
          includesQuery(request.contact_email, query) ||
          includesQuery(request.requested_by_role, query) ||
          includesQuery(request.status, query) ||
          includesQuery(request.resolution_notes, query)
        )
      );
    })
  );

  return {
    requests,
    error: null,
  };
}