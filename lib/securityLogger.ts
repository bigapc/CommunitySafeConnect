import { NextRequest } from "next/server";
import { createSecurityEvent } from "@/lib/localDataStore";

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
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  createSecurityEvent({
    organization_id: event.organizationId || null,
    event: event.event,
    level: event.level,
    outcome: event.outcome,
    reason: event.reason || null,
    request_id: requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip_address: ip,
    user_agent: userAgent,
    scope: event.scope || null,
    username: event.user || null,
    metadata_json: event.metadata ? JSON.stringify(event.metadata) : null,
  });

  const payload = {
    timestamp: new Date().toISOString(),
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip,
    userAgent,
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
