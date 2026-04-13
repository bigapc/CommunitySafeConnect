/**
 * Security Configuration Audit Schema Endpoint
 *
 * Serves the JSON Schema describing the security config response format.
 * Publicly cacheable.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://communitysafeconnect.local/schemas/security-config.schema.json",
  title: "Security Configuration Audit",
  description: "Real-time snapshot of security features enabled/configured in the environment",
  type: "object",
  required: [
    "configVersion",
    "configPath",
    "timestamp",
    "features",
    "alertStateDriver",
    "alertStateRedisConfigured",
    "oidcConfigured",
    "rbacEnabled",
    "tenantIsolationEnabled",
  ],
  properties: {
    configVersion: {
      type: "string",
      description: "Semantic version of the config schema format",
      pattern: "^\\d{4}-\\d{2}-\\d{2}\\.\\d+$",
    },
    configPath: {
      type: "string",
      description: "API endpoint path for this configuration",
      const: "/api/security/config",
    },
    timestamp: {
      type: "string",
      description: "ISO 8601 timestamp when the config was generated",
      format: "date-time",
    },
    features: {
      type: "array",
      description: "Array of security features with their status",
      items: {
        type: "object",
        required: ["feature", "enabled"],
        properties: {
          feature: {
            type: "string",
            enum: [
              "mfa_enabled",
              "oidc_enabled",
              "audit_logging_enabled",
              "audit_chain_integrity",
              "anomaly_detection_enabled",
              "alert_suppression_enabled",
              "rate_limiting_enabled",
              "session_secure_flags",
            ],
            description: "The security feature name",
          },
          enabled: {
            type: "boolean",
            description: "Whether this feature is enabled",
          },
          version: {
            type: "string",
            description: "Optional version or standard identifier for the feature",
          },
          details: {
            type: "string",
            description: "Optional human-readable details about the feature",
          },
        },
      },
    },
    alertStateDriver: {
      type: "string",
      enum: ["file", "redis_rest"],
      description: "Which backend is used for alert state persistence",
    },
    alertStateRedisConfigured: {
      type: "boolean",
      description: "Whether Redis REST URL/token is configured",
    },
    oidcConfigured: {
      type: "boolean",
      description: "Whether OIDC is fully configured",
    },
    rbacEnabled: {
      type: "boolean",
      description: "Whether role-based access control is active",
    },
    tenantIsolationEnabled: {
      type: "boolean",
      description: "Whether multi-tenant data isolation is active",
    },
  },
};

export async function GET() {
  const configVersion = "2026-04-13.1";

  return NextResponse.json(SCHEMA, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "X-Security-Config-Version": configVersion,
      "Link": `</api/security/config/schema>; rel="self"; type="application/schema+json"`,
    },
  });
}

export async function HEAD() {
  const configVersion = "2026-04-13.1";

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300",
      "X-Security-Config-Version": configVersion,
      "Link": `</api/security/config/schema>; rel="self"; type="application/schema+json"`,
    },
  });
}
