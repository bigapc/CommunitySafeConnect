import { createHmac, timingSafeEqual } from "node:crypto";

export type SsoScope = "organization" | "admin";

export interface OidcStartContext {
  nextPath: string;
  organizationId: string;
  scope: SsoScope;
  issuedAt: number;
}

interface SsoConfig {
  issuerUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  authEndpoint: string | null;
  tokenEndpoint: string | null;
  redirectUri: string | null;
  mockMode: boolean;
}

const DEV_DEFAULT_SESSION_SECRET = "communitysafeconnect-dev-secret";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function getSessionSecret() {
  return process.env.ACCESS_SESSION_SECRET || DEV_DEFAULT_SESSION_SECRET;
}

export function getSsoConfig(requestOrigin?: string): SsoConfig {
  const issuerUrl = process.env.OIDC_ISSUER_URL || null;
  const clientId = process.env.OIDC_CLIENT_ID || null;
  const clientSecret = process.env.OIDC_CLIENT_SECRET || null;

  const authEndpoint =
    process.env.OIDC_AUTHORIZATION_ENDPOINT ||
    (issuerUrl ? `${issuerUrl.replace(/\/$/, "")}/authorize` : null);

  const tokenEndpoint =
    process.env.OIDC_TOKEN_ENDPOINT ||
    (issuerUrl ? `${issuerUrl.replace(/\/$/, "")}/token` : null);

  const redirectUri =
    process.env.OIDC_REDIRECT_URI ||
    (requestOrigin ? `${requestOrigin.replace(/\/$/, "")}/api/sso/oidc/callback` : null);

  return {
    issuerUrl,
    clientId,
    clientSecret,
    authEndpoint,
    tokenEndpoint,
    redirectUri,
    mockMode: process.env.OIDC_MOCK_MODE === "true" || process.env.NODE_ENV !== "production",
  };
}

export function isOidcConfigured(requestOrigin?: string) {
  const config = getSsoConfig(requestOrigin);

  return Boolean(
    config.clientId &&
      config.authEndpoint &&
      config.tokenEndpoint &&
      config.redirectUri
  );
}

function encodeContext(context: OidcStartContext) {
  return Buffer.from(JSON.stringify(context)).toString("base64url");
}

function decodeContext(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OidcStartContext;
}

export function createOidcState(context: OidcStartContext) {
  const payload = encodeContext(context);
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyOidcState(state: string | null) {
  if (!state) {
    return null;
  }

  const splitIndex = state.lastIndexOf(".");

  if (splitIndex <= 0) {
    return null;
  }

  const payload = state.slice(0, splitIndex);
  const actualSig = state.slice(splitIndex + 1);
  const expectedSig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

  const actualBuffer = Buffer.from(actualSig);
  const expectedBuffer = Buffer.from(expectedSig);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const context = decodeContext(payload);

  if (Date.now() - context.issuedAt > STATE_MAX_AGE_MS) {
    return null;
  }

  return context;
}

export function buildOidcAuthorizationUrl(
  requestOrigin: string,
  context: OidcStartContext
) {
  const config = getSsoConfig(requestOrigin);

  if (!config.clientId || !config.authEndpoint || !config.redirectUri) {
    return null;
  }

  const state = createOidcState(context);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
  });

  return `${config.authEndpoint}?${params.toString()}`;
}

export function normalizePath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

export function normalizeScope(value: string | null | undefined): SsoScope {
  return value === "admin" ? "admin" : "organization";
}

export function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = (value || "community-demo-org")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .slice(0, 64);

  return normalized || "community-demo-org";
}
