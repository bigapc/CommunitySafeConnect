import {
  getAlertStateDriver,
  getAlertStateHealth,
  isRedisAlertStateConfigured,
} from "@/lib/alertStateStore";
import { getSsoConfig } from "@/lib/sso";

function hasOidcConfigured() {
  return Boolean(
    process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_ISSUER_URL &&
      process.env.OIDC_CLIENT_SECRET
  );
}

interface OidcConnectivity {
  discoveryConnected: boolean;
  jwksConnected: boolean;
  discoveredJwksUri: string | null;
  discoveryLatencyMs: number | null;
  jwksLatencyMs: number | null;
  discoverySlow: boolean;
  jwksSlow: boolean;
}

interface ProbeResult {
  payload: unknown;
  latencyMs: number | null;
  timedOut: boolean;
}

type SecurityDegradationReason =
  | "alert_state_redis_disconnected"
  | "oidc_discovery_unreachable"
  | "oidc_jwks_unreachable"
  | "oidc_discovery_slow"
  | "oidc_jwks_slow";

type SecurityDegradationSeverity = "warning" | "critical";

const SECURITY_REASON_SEVERITY: Record<SecurityDegradationReason, SecurityDegradationSeverity> = {
  alert_state_redis_disconnected: "critical",
  oidc_discovery_unreachable: "critical",
  oidc_jwks_unreachable: "critical",
  oidc_discovery_slow: "warning",
  oidc_jwks_slow: "warning",
};

const SECURITY_REASON_ACTION: Record<SecurityDegradationReason, string> = {
  alert_state_redis_disconnected: "Check ALERT_STATE_REDIS_REST_URL/TOKEN and Redis network reachability.",
  oidc_discovery_unreachable: "Verify OIDC_ISSUER_URL and IdP availability for discovery endpoint.",
  oidc_jwks_unreachable: "Verify OIDC_JWKS_URI or IdP JWKS endpoint availability.",
  oidc_discovery_slow: "Investigate IdP discovery latency and upstream network performance.",
  oidc_jwks_slow: "Investigate IdP JWKS latency and consider CDN/cache strategy.",
};

const SECURITY_HEALTH_SCHEMA_VERSION = "2026-04-13.1";
const SECURITY_HEALTH_SCHEMA_PATH = "/api/health/security/schema";

function getOverallSeverity(
  reasonSeverities: Array<{ reason: SecurityDegradationReason; severity: SecurityDegradationSeverity }>
) {
  if (reasonSeverities.some((item) => item.severity === "critical")) {
    return "critical" as const;
  }

  if (reasonSeverities.some((item) => item.severity === "warning")) {
    return "warning" as const;
  }

  return "none" as const;
}

function getOverallSeverityScore(overallSeverity: "none" | "warning" | "critical") {
  if (overallSeverity === "critical") {
    return 2;
  }

  if (overallSeverity === "warning") {
    return 1;
  }

  return 0;
}

function getOidcSlowThresholdMs() {
  const parsed = Number(process.env.OIDC_HEALTH_SLOW_THRESHOLD_MS);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1500;
  }

  return Math.floor(parsed);
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4000): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        payload: null,
        latencyMs: Date.now() - startTime,
        timedOut: false,
      };
    }

    return {
      payload: await response.json(),
      latencyMs: Date.now() - startTime,
      timedOut: false,
    };
  } catch (error) {
    return {
      payload: null,
      latencyMs: Date.now() - startTime,
      timedOut: error instanceof Error && error.name === "AbortError",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getOidcConnectivity(): Promise<OidcConnectivity> {
  const config = getSsoConfig();
  const slowThresholdMs = getOidcSlowThresholdMs();

  if (!hasOidcConfigured() || !config.issuerUrl) {
    return {
      discoveryConnected: false,
      jwksConnected: false,
      discoveredJwksUri: null,
      discoveryLatencyMs: null,
      jwksLatencyMs: null,
      discoverySlow: false,
      jwksSlow: false,
    };
  }

  const issuer = config.issuerUrl.replace(/\/$/, "");
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const discoveryProbe = await fetchJsonWithTimeout(discoveryUrl);
  const discoveryPayload = discoveryProbe.payload;
  const discoverySlow =
    !discoveryProbe.timedOut &&
    typeof discoveryProbe.latencyMs === "number" &&
    discoveryProbe.latencyMs > slowThresholdMs;

  if (!discoveryPayload || typeof discoveryPayload !== "object") {
    return {
      discoveryConnected: false,
      jwksConnected: false,
      discoveredJwksUri: null,
      discoveryLatencyMs: discoveryProbe.latencyMs,
      jwksLatencyMs: null,
      discoverySlow,
      jwksSlow: false,
    };
  }

  const discoveredJwksUri =
    typeof (discoveryPayload as { jwks_uri?: unknown }).jwks_uri === "string"
      ? (discoveryPayload as { jwks_uri: string }).jwks_uri
      : null;

  const jwksUrl = config.jwksUri || discoveredJwksUri;

  if (!jwksUrl) {
    return {
      discoveryConnected: true,
      jwksConnected: false,
      discoveredJwksUri,
      discoveryLatencyMs: discoveryProbe.latencyMs,
      jwksLatencyMs: null,
      discoverySlow,
      jwksSlow: false,
    };
  }

  const jwksProbe = await fetchJsonWithTimeout(jwksUrl);
  const jwksPayload = jwksProbe.payload;
  const jwksConnected =
    !!jwksPayload &&
    typeof jwksPayload === "object" &&
    Array.isArray((jwksPayload as { keys?: unknown }).keys);
  const jwksSlow =
    !jwksProbe.timedOut &&
    typeof jwksProbe.latencyMs === "number" &&
    jwksProbe.latencyMs > slowThresholdMs;

  return {
    discoveryConnected: true,
    jwksConnected,
    discoveredJwksUri,
    discoveryLatencyMs: discoveryProbe.latencyMs,
    jwksLatencyMs: jwksProbe.latencyMs,
    discoverySlow,
    jwksSlow,
  };
}

export async function getSecurityHealthSnapshot() {
  const alertState = await getAlertStateHealth();
  const oidcConfigured = hasOidcConfigured();
  const oidcConnectivity = await getOidcConnectivity();
  const degradationReasons: SecurityDegradationReason[] = [];

  if (alertState.driver === "redis" && !alertState.connected) {
    degradationReasons.push("alert_state_redis_disconnected");
  }

  if (oidcConfigured) {
    if (!oidcConnectivity.discoveryConnected) {
      degradationReasons.push("oidc_discovery_unreachable");
    }

    if (!oidcConnectivity.jwksConnected) {
      degradationReasons.push("oidc_jwks_unreachable");
    }

    if (oidcConnectivity.discoverySlow) {
      degradationReasons.push("oidc_discovery_slow");
    }

    if (oidcConnectivity.jwksSlow) {
      degradationReasons.push("oidc_jwks_slow");
    }
  }

  const status = degradationReasons.length > 0 ? "degraded" : "ok";
  const degradationReasonSeverities = degradationReasons.map((reason) => ({
    reason,
    severity: SECURITY_REASON_SEVERITY[reason],
  }));
  const overallSeverity = getOverallSeverity(degradationReasonSeverities);
  const overallSeverityScore = getOverallSeverityScore(overallSeverity);
  const recommendedActions = degradationReasons.map((reason) => SECURITY_REASON_ACTION[reason]);

  return {
    schemaVersion: SECURITY_HEALTH_SCHEMA_VERSION,
    schemaPath: SECURITY_HEALTH_SCHEMA_PATH,
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
        discoveryConnected: oidcConnectivity.discoveryConnected,
        jwksConnected: oidcConnectivity.jwksConnected,
        discoveredJwksUri: oidcConnectivity.discoveredJwksUri,
        discoveryLatencyMs: oidcConnectivity.discoveryLatencyMs,
        jwksLatencyMs: oidcConnectivity.jwksLatencyMs,
        discoverySlow: oidcConnectivity.discoverySlow,
        jwksSlow: oidcConnectivity.jwksSlow,
        slowThresholdMs: getOidcSlowThresholdMs(),
      },
      securityTelemetry: {
        requestIdsEnabled: true,
        structuredLoggingEnabled: true,
        anomalyDetectionEnabled: true,
        auditHashChainEnabled: true,
      },
    },
    degradationReasons,
    degradationReasonSeverities,
    primaryDegradationReason: degradationReasons[0] || null,
    overallSeverity,
    overallSeverityScore,
    recommendedActions,
    timestamp: new Date().toISOString(),
  };
}
