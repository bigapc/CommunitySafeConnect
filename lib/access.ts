import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultOrganizationId, getOrganizationById } from "@/lib/tenancy";

export const ORGANIZATION_COOKIE_NAME = "communitysafeconnect_org";
export const ADMIN_COOKIE_NAME = "communitysafeconnect_admin";
export const SESSION_CONTEXT_COOKIE_NAME = "communitysafeconnect_context";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const DEFAULT_POLICY_RETENTION_SECONDS = 60 * 60 * 24;
const DEFAULT_ORGANIZATION_HISTORY_HOURS = 24;
const DEV_DEFAULT_SESSION_SECRET = "communitysafeconnect-dev-secret";
const DEV_DEFAULT_ORGANIZATION_ACCESS_CODE = "community-org-demo";
const DEV_DEFAULT_ADMIN_ACCESS_CODE = "community-admin-demo";

export type AccessScope = "organization" | "admin";
export type UserRole = "analyst" | "moderator" | "org_admin" | "super_admin";

export interface AccessContext {
  scope: AccessScope;
  organizationId: string;
  role: UserRole;
}

function getRequiredEnv(name: "ACCESS_SESSION_SECRET" | "ORGANIZATION_ACCESS_CODE" | "ADMIN_ACCESS_CODE") {
  const value = process.env[name];

  if (!value) {
    if (process.env.NODE_ENV !== "production") {
      if (name === "ACCESS_SESSION_SECRET") {
        return DEV_DEFAULT_SESSION_SECRET;
      }

      if (name === "ORGANIZATION_ACCESS_CODE") {
        return DEV_DEFAULT_ORGANIZATION_ACCESS_CODE;
      }

      return DEV_DEFAULT_ADMIN_ACCESS_CODE;
    }

    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getSignedValue(scope: AccessScope) {
  return createHmac("sha256", getRequiredEnv("ACCESS_SESSION_SECRET"))
    .update(scope)
    .digest("hex");
}

function getSignature(input: string) {
  return createHmac("sha256", getRequiredEnv("ACCESS_SESSION_SECRET")).update(input).digest("hex");
}

function matchesSignedValue(value: string | undefined, scope: AccessScope) {
  if (!value) {
    return false;
  }

  const actual = Buffer.from(value);
  const expected = Buffer.from(getSignedValue(scope));

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

function normalizeRole(scope: AccessScope, requestedRole?: string): UserRole {
  const validRoles: UserRole[] = ["analyst", "moderator", "org_admin", "super_admin"];

  if (requestedRole && validRoles.includes(requestedRole as UserRole)) {
    if (scope === "organization" && requestedRole === "super_admin") {
      return "org_admin";
    }

    return requestedRole as UserRole;
  }

  return scope === "admin" ? "org_admin" : "analyst";
}

export function getExpectedAccessCode(scope: AccessScope, organizationId = getDefaultOrganizationId()) {
  const organization = getOrganizationById(organizationId);

  if (organization) {
    return scope === "admin" ? organization.adminAccessCode : organization.organizationAccessCode;
  }

  return getRequiredEnv(scope === "admin" ? "ADMIN_ACCESS_CODE" : "ORGANIZATION_ACCESS_CODE");
}

export function createSessionCookieValue(scope: AccessScope) {
  return getSignedValue(scope);
}

export function createSessionContextCookieValue(context: AccessContext) {
  const payload = JSON.stringify(context);
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${getSignature(encoded)}`;
}

function parseSessionContextCookieValue(value: string | undefined): AccessContext | null {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const actual = Buffer.from(signature);
  const expected = Buffer.from(getSignature(encoded));

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<AccessContext>;
    const scope: AccessScope = parsed.scope === "admin" ? "admin" : "organization";
    const organizationId = typeof parsed.organizationId === "string" && parsed.organizationId.trim()
      ? parsed.organizationId
      : getDefaultOrganizationId();
    const role = normalizeRole(scope, parsed.role);

    return {
      scope,
      organizationId,
      role,
    };
  } catch {
    return null;
  }
}

const roleRank: Record<UserRole, number> = {
  analyst: 1,
  moderator: 2,
  org_admin: 3,
  super_admin: 4,
};

export function hasMinimumRole(role: UserRole, minimumRole: UserRole) {
  return roleRank[role] >= roleRank[minimumRole];
}

export function createAccessContext(scope: AccessScope, organizationId: string, role?: string): AccessContext {
  return {
    scope,
    organizationId,
    role: normalizeRole(scope, role),
  };
}

export async function getCurrentAccessContext(): Promise<AccessContext | null> {
  const cookieStore = await cookies();
  const context = parseSessionContextCookieValue(cookieStore.get(SESSION_CONTEXT_COOKIE_NAME)?.value);

  if (context) {
    return context;
  }

  if (matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin")) {
    return createAccessContext("admin", getDefaultOrganizationId(), "org_admin");
  }

  if (matchesSignedValue(cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value, "organization")) {
    return createAccessContext("organization", getDefaultOrganizationId(), "analyst");
  }

  return null;
}

function readPositiveNumber(value: string | undefined, fallbackValue: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

export function getAccessSessionMaxAgeSeconds() {
  return readPositiveNumber(
    process.env.ACCESS_SESSION_MAX_AGE_SECONDS,
    DEFAULT_SESSION_MAX_AGE_SECONDS
  );
}

export function getPolicyRetentionMaxAgeSeconds() {
  return readPositiveNumber(
    process.env.ACCESS_POLICY_RETENTION_SECONDS,
    DEFAULT_POLICY_RETENTION_SECONDS
  );
}

export function getOrganizationHistoryWindowHours() {
  return readPositiveNumber(
    process.env.ORGANIZATION_HISTORY_WINDOW_HOURS,
    DEFAULT_ORGANIZATION_HISTORY_HOURS
  );
}

export function getOrganizationHistoryCutoffIso(referenceTime = Date.now()) {
  const cutoffMs = referenceTime - getOrganizationHistoryWindowHours() * 60 * 60 * 1000;
  return new Date(cutoffMs).toISOString();
}

export function getSessionCookieOptions(maxAge = getAccessSessionMaxAgeSeconds()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function hasOrganizationAccess() {
  const context = await getCurrentAccessContext();

  if (context) {
    return context.scope === "organization" || context.scope === "admin";
  }

  const cookieStore = await cookies();

  return (
    matchesSignedValue(cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value, "organization") ||
    matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin")
  );
}

export async function hasAdminAccess() {
  const context = await getCurrentAccessContext();

  if (context) {
    return context.scope === "admin" && hasMinimumRole(context.role, "moderator");
  }

  const cookieStore = await cookies();

  return matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin");
}

export async function requireOrganizationAccess(pathname: string) {
  if (!(await hasOrganizationAccess())) {
    redirect(`/access?next=${encodeURIComponent(pathname)}`);
  }
}

export async function requireAdminAccess(pathname: string) {
  if (!(await hasAdminAccess())) {
    redirect(`/access?next=${encodeURIComponent(pathname)}`);
  }
}

export async function requireMinimumRole(pathname: string, minimumRole: UserRole) {
  const context = await getCurrentAccessContext();

  if (!context || !hasMinimumRole(context.role, minimumRole)) {
    redirect(`/access?next=${encodeURIComponent(pathname)}`);
  }
}

export async function requireRoleForApi(minimumRole: UserRole) {
  const context = await getCurrentAccessContext();

  if (!context || !hasMinimumRole(context.role, minimumRole)) {
    return null;
  }

  return context;
}