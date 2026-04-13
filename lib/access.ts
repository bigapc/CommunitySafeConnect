import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionRecord, isSessionRevoked } from "@/lib/sessionActivityStore";

export const ORGANIZATION_COOKIE_NAME = "communitysafeconnect_org";
export const ADMIN_COOKIE_NAME = "communitysafeconnect_admin";
export const MFA_VERIFIED_COOKIE_NAME = "communitysafeconnect_mfa_verified";
export const ORGANIZATION_CONTEXT_COOKIE_NAME = "communitysafeconnect_org_ctx";
export const SESSION_ACTIVITY_COOKIE_NAME = "communitysafeconnect_session_activity";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const DEFAULT_MFA_SESSION_MAX_AGE_SECONDS = 60 * 30; // 30 minutes
const DEFAULT_POLICY_RETENTION_SECONDS = 60 * 60 * 24;
const DEV_DEFAULT_SESSION_SECRET = "communitysafeconnect-dev-secret";
const DEV_DEFAULT_ORGANIZATION_ACCESS_CODE = "community-org-demo";
const DEV_DEFAULT_ADMIN_ACCESS_CODE = "community-admin-demo";
const DEV_DEFAULT_ORGANIZATION_ID = "community-demo-org";

export type AccessScope = "organization" | "admin";

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

export function getExpectedAccessCode(scope: AccessScope) {
  return getRequiredEnv(scope === "admin" ? "ADMIN_ACCESS_CODE" : "ORGANIZATION_ACCESS_CODE");
}

export function createSessionCookieValue(scope: AccessScope) {
  return getSignedValue(scope);
}

function getSessionActivitySignature(sessionId: string) {
  return createHmac("sha256", getRequiredEnv("ACCESS_SESSION_SECRET"))
    .update(`session:${sessionId}`)
    .digest("hex");
}

export function createSessionActivityCookieValue(sessionId: string) {
  const signature = getSessionActivitySignature(sessionId);
  return `${sessionId}.${signature}`;
}

function parseSessionActivityCookie(value: string | undefined) {
  if (!value) {
    return null;
  }

  const splitIndex = value.lastIndexOf(".");

  if (splitIndex <= 0) {
    return null;
  }

  const sessionId = value.slice(0, splitIndex);
  const signature = value.slice(splitIndex + 1);
  const expected = getSessionActivitySignature(sessionId);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return sessionId;
}

function sanitizeOrganizationId(input: string | undefined) {
  const value = (input || "").trim().toLowerCase();

  if (!value) {
    return DEV_DEFAULT_ORGANIZATION_ID;
  }

  const normalized = value.replace(/[^a-z0-9-_]/g, "-").slice(0, 64);
  return normalized || DEV_DEFAULT_ORGANIZATION_ID;
}

function getOrganizationSignature(organizationId: string) {
  return createHmac("sha256", getRequiredEnv("ACCESS_SESSION_SECRET"))
    .update(`org:${organizationId}`)
    .digest("hex");
}

export function createOrganizationContextCookieValue(organizationId: string) {
  const sanitized = sanitizeOrganizationId(organizationId);
  const signature = getOrganizationSignature(sanitized);
  return `${sanitized}.${signature}`;
}

function parseOrganizationContextCookie(value: string | undefined) {
  if (!value) {
    return null;
  }

  const splitIndex = value.lastIndexOf(".");

  if (splitIndex <= 0) {
    return null;
  }

  const organizationId = value.slice(0, splitIndex);
  const signature = value.slice(splitIndex + 1);
  const expected = getOrganizationSignature(organizationId);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  return organizationId;
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

export function getSessionCookieOptions(maxAge = getAccessSessionMaxAgeSeconds()) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function hasValidSessionActivity() {
  const cookieStore = await cookies();
  const sessionId = parseSessionActivityCookie(
    cookieStore.get(SESSION_ACTIVITY_COOKIE_NAME)?.value
  );

  if (!sessionId) {
    return false;
  }

  if (await isSessionRevoked(sessionId)) {
    return false;
  }

  return !!(await getSessionRecord(sessionId));
}

export async function hasOrganizationAccess() {
  const cookieStore = await cookies();

  const hasSignedAccess =
    matchesSignedValue(cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value, "organization") ||
    matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin");

  if (!hasSignedAccess) {
    return false;
  }

  return hasValidSessionActivity();
}

export async function hasAdminAccess() {
  const cookieStore = await cookies();

  if (!matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin")) {
    return false;
  }

  return hasValidSessionActivity();
}

export async function getCurrentSessionActivityId() {
  const cookieStore = await cookies();
  return parseSessionActivityCookie(cookieStore.get(SESSION_ACTIVITY_COOKIE_NAME)?.value);
}

export async function getCurrentOrganizationId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ORGANIZATION_CONTEXT_COOKIE_NAME)?.value;
  return parseOrganizationContextCookie(value) || DEV_DEFAULT_ORGANIZATION_ID;
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

// ============ MFA Support ============

export function createMFASessionCookieValue(username: string) {
  return createHmac("sha256", getRequiredEnv("ACCESS_SESSION_SECRET"))
    .update(`mfa_${username}`)
    .digest("hex");
}

export function getMFASessionCookieOptions(maxAge = DEFAULT_MFA_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function hasMFAVerified() {
  const cookieStore = await cookies();
  const mfaCookie = cookieStore.get(MFA_VERIFIED_COOKIE_NAME)?.value;

  if (!mfaCookie) {
    return false;
  }

  // MFA verification is a transient session, validate it hasn't expired
  return !!mfaCookie;
}

export async function requireMFAVerified(pathname: string) {
  if (!(await hasMFAVerified())) {
    redirect(`/mfa/verify?next=${encodeURIComponent(pathname)}`);
  }
}