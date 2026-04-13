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
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getOidcConnectivity(): Promise<OidcConnectivity> {
  const config = getSsoConfig();

  if (!hasOidcConfigured() || !config.issuerUrl) {
    return {
      discoveryConnected: false,
      jwksConnected: false,
      discoveredJwksUri: null,
    };
  }

  const issuer = config.issuerUrl.replace(/\/$/, "");
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const discoveryPayload = await fetchJsonWithTimeout(discoveryUrl);

  if (!discoveryPayload || typeof discoveryPayload !== "object") {
    return {
      discoveryConnected: false,
      jwksConnected: false,
      discoveredJwksUri: null,
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
    };
  }

  const jwksPayload = await fetchJsonWithTimeout(jwksUrl);
  const jwksConnected =
    !!jwksPayload &&
    typeof jwksPayload === "object" &&
    Array.isArray((jwksPayload as { keys?: unknown }).keys);

  return {
    discoveryConnected: true,
    jwksConnected,
    discoveredJwksUri,
  };
}

export async function getSecurityHealthSnapshot() {
  const alertState = await getAlertStateHealth();
  const oidcConfigured = hasOidcConfigured();
  const oidcConnectivity = await getOidcConnectivity();

  const hasAlertStateIssue = alertState.driver === "redis" && !alertState.connected;
  const hasOidcIssue =
    oidcConfigured &&
    (!oidcConnectivity.discoveryConnected || !oidcConnectivity.jwksConnected);

  const status = hasAlertStateIssue || hasOidcIssue ? "degraded" : "ok";

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
        discoveryConnected: oidcConnectivity.discoveryConnected,
        jwksConnected: oidcConnectivity.jwksConnected,
        discoveredJwksUri: oidcConnectivity.discoveredJwksUri,
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
