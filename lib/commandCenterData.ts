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

interface SuppressedSecurityAlert extends SecurityAlert {
  suppressedAt: string;
  nextEligibleAt: string;
}

const alertLastEmittedAt = new Map<string, number>();

function readPositiveNumber(value: string | undefined, fallbackValue: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

function getAlertConfig() {
  return {
    failedLoginWindowMinutes: readPositiveNumber(
      process.env.SEC_ALERT_FAILED_LOGIN_WINDOW_MINUTES,
      15
    ),
    failedLoginThreshold: readPositiveNumber(
      process.env.SEC_ALERT_FAILED_LOGIN_THRESHOLD,
      5
    ),
    failedMfaWindowMinutes: readPositiveNumber(
      process.env.SEC_ALERT_FAILED_MFA_WINDOW_MINUTES,
      15
    ),
    failedMfaThreshold: readPositiveNumber(
      process.env.SEC_ALERT_FAILED_MFA_THRESHOLD,
      5
    ),
    crossTenantWindowMinutes: readPositiveNumber(
      process.env.SEC_ALERT_CROSS_TENANT_WINDOW_MINUTES,
      30
    ),
    crossTenantOrgThreshold: readPositiveNumber(
      process.env.SEC_ALERT_CROSS_TENANT_ORG_THRESHOLD,
      3
    ),
    suppressionMinutes: readPositiveNumber(
      process.env.SEC_ALERT_SUPPRESSION_MINUTES,
      10
    ),
  };
}

function applyAlertSuppression(
  organizationId: string,
  alerts: SecurityAlert[],
  suppressionMinutes: number
) {
  const now = Date.now();
  const suppressionMs = suppressionMinutes * 60 * 1000;
  const emitted: SecurityAlert[] = [];
  const suppressed: SuppressedSecurityAlert[] = [];

  for (const alert of alerts) {
    const key = `${organizationId}:${alert.id}`;
    const lastEmitted = alertLastEmittedAt.get(key) || 0;

    if (now - lastEmitted < suppressionMs) {
      suppressed.push({
        ...alert,
        suppressedAt: new Date(now).toISOString(),
        nextEligibleAt: new Date(lastEmitted + suppressionMs).toISOString(),
      });
      continue;
    }

    alertLastEmittedAt.set(key, now);
    emitted.push(alert);
  }

  return {
    activeAlerts: emitted,
    suppressedAlerts: suppressed,
  };
}

function detectSecurityAlerts(organizationId: string) {
  const config = getAlertConfig();
  const now = Date.now();
  const allRecent = listSecurityEvents({ limit: 500 });
  const orgRecent = allRecent.filter((event) => event.organization_id === organizationId);

  const failedLoginWindowEvents = orgRecent.filter(
    (event) =>
      now - new Date(event.created_at).getTime() <=
      config.failedLoginWindowMinutes * 60 * 1000
  );

  const failedMfaWindowEvents = orgRecent.filter(
    (event) =>
      now - new Date(event.created_at).getTime() <=
      config.failedMfaWindowMinutes * 60 * 1000
  );

  const failedLogins = failedLoginWindowEvents.filter(
    (event) => event.event === "auth.login" && event.outcome === "failure"
  );

  const failedMfa = failedMfaWindowEvents.filter(
    (event) =>
      (event.event === "mfa.verify" || event.event === "mfa.backup") &&
      event.outcome === "failure"
  );

  const successfulLoginsCrossTenantWindow = allRecent.filter(
    (event) =>
      event.event === "auth.login" &&
      event.outcome === "success" &&
      now - new Date(event.created_at).getTime() <=
        config.crossTenantWindowMinutes * 60 * 1000
  );

  const ipToOrgs = new Map<string, Set<string>>();

  for (const event of successfulLoginsCrossTenantWindow) {
    if (!event.ip_address || !event.organization_id) {
      continue;
    }

    const orgs = ipToOrgs.get(event.ip_address) || new Set<string>();
    orgs.add(event.organization_id);
    ipToOrgs.set(event.ip_address, orgs);
  }

  const suspiciousIpCount = [...ipToOrgs.values()].filter(
    (orgs) => orgs.size >= config.crossTenantOrgThreshold
  ).length;

  const alerts: SecurityAlert[] = [];

  if (failedLogins.length >= config.failedLoginThreshold) {
    alerts.push({
      id: "failed-logins-spike",
      severity: "high",
      title: "Failed login spike detected",
      description: `${failedLogins.length} failed login attempts in the last ${config.failedLoginWindowMinutes} minutes.`,
    });
  }

  if (failedMfa.length >= config.failedMfaThreshold) {
    alerts.push({
      id: "failed-mfa-spike",
      severity: "high",
      title: "MFA abuse pattern detected",
      description: `${failedMfa.length} failed MFA attempts in the last ${config.failedMfaWindowMinutes} minutes.`,
    });
  }

  if (suspiciousIpCount > 0) {
    alerts.push({
      id: "cross-tenant-ip-pattern",
      severity: "medium",
      title: "Suspicious cross-tenant login pattern",
      description: `${suspiciousIpCount} IP address(es) logged into ${config.crossTenantOrgThreshold}+ tenants within ${config.crossTenantWindowMinutes} minutes.`,
    });
  }

  return applyAlertSuppression(
    organizationId,
    alerts,
    config.suppressionMinutes
  );
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
  const { activeAlerts, suppressedAlerts } = detectSecurityAlerts(organizationId);

  return {
    auditLogs,
    integrity,
    alerts: activeAlerts,
    alertHistory: {
      active: activeAlerts,
      suppressed: suppressedAlerts,
    },
    error: null,
  };
}