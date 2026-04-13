import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ORGANIZATION_COOKIE_NAME = "communitysafeconnect_org";
export const ADMIN_COOKIE_NAME = "communitysafeconnect_admin";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const DEFAULT_POLICY_RETENTION_SECONDS = 60 * 60 * 24;
const DEV_DEFAULT_SESSION_SECRET = "communitysafeconnect-dev-secret";
const DEV_DEFAULT_ORGANIZATION_ACCESS_CODE = "community-org-demo";
const DEV_DEFAULT_ADMIN_ACCESS_CODE = "community-admin-demo";

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

export async function hasOrganizationAccess() {
  const cookieStore = await cookies();

  return (
    matchesSignedValue(cookieStore.get(ORGANIZATION_COOKIE_NAME)?.value, "organization") ||
    matchesSignedValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value, "admin")
  );
}

export async function hasAdminAccess() {
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