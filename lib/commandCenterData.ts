import {
  listAuditLogs,
  listChatMessages,
  listReports,
  listSecurityEvents,
  verifyAuditLogChain,
} from "@/lib/localDataStore";

interface SecurityAlert {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
}

function detectSecurityAlerts(organizationId: string): SecurityAlert[] {
  const now = Date.now();
  const allRecent = listSecurityEvents({ limit: 500 });
  const orgRecent = allRecent.filter((event) => event.organization_id === organizationId);

  const last15m = orgRecent.filter(
    (event) => now - new Date(event.created_at).getTime() <= 15 * 60 * 1000
  );

  const failedLogins = last15m.filter(
    (event) => event.event === "auth.login" && event.outcome === "failure"
  );

  const failedMfa = last15m.filter(
    (event) =>
      (event.event === "mfa.verify" || event.event === "mfa.backup") &&
      event.outcome === "failure"
  );

  const successfulLogins30m = allRecent.filter(
    (event) =>
      event.event === "auth.login" &&
      event.outcome === "success" &&
      now - new Date(event.created_at).getTime() <= 30 * 60 * 1000
  );

  const ipToOrgs = new Map<string, Set<string>>();

  for (const event of successfulLogins30m) {
    if (!event.ip_address || !event.organization_id) {
      continue;
    }

    const orgs = ipToOrgs.get(event.ip_address) || new Set<string>();
    orgs.add(event.organization_id);
    ipToOrgs.set(event.ip_address, orgs);
  }

  const suspiciousIpCount = [...ipToOrgs.values()].filter((orgs) => orgs.size >= 3).length;

  const alerts: SecurityAlert[] = [];

  if (failedLogins.length >= 5) {
    alerts.push({
      id: "failed-logins-spike",
      severity: "high",
      title: "Failed login spike detected",
      description: `${failedLogins.length} failed login attempts in the last 15 minutes.`,
    });
  }

  if (failedMfa.length >= 5) {
    alerts.push({
      id: "failed-mfa-spike",
      severity: "high",
      title: "MFA abuse pattern detected",
      description: `${failedMfa.length} failed MFA attempts in the last 15 minutes.`,
    });
  }

  if (suspiciousIpCount > 0) {
    alerts.push({
      id: "cross-tenant-ip-pattern",
      severity: "medium",
      title: "Suspicious cross-tenant login pattern",
      description: `${suspiciousIpCount} IP address(es) logged into 3+ tenants within 30 minutes.`,
    });
  }

  return alerts;
}

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
  const alerts = detectSecurityAlerts(organizationId);

  return {
    auditLogs,
    integrity,
    alerts,
    error: null,
  };
}