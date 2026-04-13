import { NextRequest } from "next/server";

export interface SecurityLogEvent {
  event: string;
  level: "info" | "warn" | "error";
  outcome: "success" | "failure";
  reason?: string;
  organizationId?: string;
  scope?: string;
  user?: string;
  metadata?: Record<string, unknown>;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

export function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || "unknown-request";
}

export function logSecurityEvent(request: NextRequest, event: SecurityLogEvent) {
  const payload = {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(request),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    ...event,
  };

  const serialized = JSON.stringify(payload);

  if (event.level === "error") {
    console.error(serialized);
    return;
  }

  if (event.level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}
