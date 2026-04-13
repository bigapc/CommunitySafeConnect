import {
  getAlertStateDriver,
  getAlertStateHealth,
  isRedisAlertStateConfigured,
} from "@/lib/alertStateStore";

function hasOidcConfigured() {
  return Boolean(
    process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_ISSUER_URL &&
      process.env.OIDC_CLIENT_SECRET
  );
}

export async function getSecurityHealthSnapshot() {
  const alertState = await getAlertStateHealth();
  const oidcConfigured = hasOidcConfigured();

  const status =
    alertState.driver === "redis" && !alertState.connected ? "degraded" : "ok";

  return {
    status,
    checks: {
      alertState: {
        driver: getAlertStateDriver(),
        configured: alertState.configured,
        connected: alertState.connected,
        redisConfigured: isRedisAlertStateConfigured(),
      },
      oidc: {
        configured: oidcConfigured,
      },
      securityTelemetry: {
        requestIdsEnabled: true,
        structuredLoggingEnabled: true,
        anomalyDetectionEnabled: true,
        auditHashChainEnabled: true,
      },
    },
    timestamp: new Date().toISOString(),
  };
}
