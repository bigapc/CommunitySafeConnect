/**
 * Security Configuration Contract Test
 *
 * Validates that the /api/security/config endpoint maintains a stable schema.
 * Tests both the config endpoint and the schema discovery endpoint.
 */

import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || "community-admin-demo";

async function createAdminSession() {
  const sessionRes = await fetch(`${BASE_URL}/api/access/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: ADMIN_CODE,
      scope: "admin",
      organizationId: "community-demo-org",
    }),
  });

  if (!sessionRes.ok) {
    throw new Error(`Failed to create session: ${sessionRes.statusText}`);
  }

  const cookies = sessionRes.headers.getSetCookie();
  return cookies;
}

async function testConfigResponse(cookies) {
  const configRes = await fetch(`${BASE_URL}/api/security/config`, {
    headers: {
      Cookie: cookies.join("; "),
    },
  });

  assert.strictEqual(configRes.status, 200, "Config endpoint should return 200");

  const payload = await configRes.json();

  // Test required top-level fields
  const requiredFields = [
    "configVersion",
    "configPath",
    "timestamp",
    "features",
    "alertStateDriver",
    "alertStateRedisConfigured",
    "oidcConfigured",
    "rbacEnabled",
    "tenantIsolationEnabled",
  ];

  for (const field of requiredFields) {
    assert.ok(
      field in payload,
      `Missing required field: ${field}`
    );
  }

  // Test field types
  assert.strictEqual(typeof payload.configVersion, "string", "configVersion must be string");
  assert.strictEqual(typeof payload.configPath, "string", "configPath must be string");
  assert.strictEqual(typeof payload.timestamp, "string", "timestamp must be string");
  assert(Array.isArray(payload.features), "features must be array");
  assert.strictEqual(typeof payload.alertStateDriver, "string", "alertStateDriver must be string");
  assert.strictEqual(typeof payload.alertStateRedisConfigured, "boolean", "alertStateRedisConfigured must be boolean");
  assert.strictEqual(typeof payload.oidcConfigured, "boolean", "oidcConfigured must be boolean");
  assert.strictEqual(typeof payload.rbacEnabled, "boolean", "rbacEnabled must be boolean");
  assert.strictEqual(typeof payload.tenantIsolationEnabled, "boolean", "tenantIsolationEnabled must be boolean");

  // Test configPath value
  assert.strictEqual(payload.configPath, "/api/security/config", "configPath must be /api/security/config");

  // Test features array structure
  assert.ok(payload.features.length > 0, "features array must not be empty");

  const validFeatures = [
    "mfa_enabled",
    "oidc_enabled",
    "audit_logging_enabled",
    "audit_chain_integrity",
    "anomaly_detection_enabled",
    "alert_suppression_enabled",
    "rate_limiting_enabled",
    "session_secure_flags",
  ];

  for (const feature of payload.features) {
    assert.ok(feature.feature, "Feature must have feature name");
    assert.ok(validFeatures.includes(feature.feature), `Feature ${feature.feature} not in allowed list`);
    assert.strictEqual(typeof feature.enabled, "boolean", `Feature ${feature.feature}.enabled must be boolean`);
  }

  // Test alert state driver value
  assert.ok(
    ["file", "redis_rest"].includes(payload.alertStateDriver),
    "alertStateDriver must be 'file' or 'redis_rest'"
  );

  // Must have at least the core security features enabled
  const mfaFeature = payload.features.find(f => f.feature === "mfa_enabled");
  assert.ok(mfaFeature, "Must include mfa_enabled feature");
  assert.strictEqual(mfaFeature.enabled, true, "MFA should be enabled");

  const rbacFeature = payload.features.find(f => f.feature === "audit_logging_enabled");
  assert.ok(rbacFeature, "Must include audit_logging_enabled feature");
  assert.strictEqual(rbacFeature.enabled, true, "Audit logging should be enabled");

  return payload;
}

async function testConfigHeaders(cookies) {
  const configRes = await fetch(`${BASE_URL}/api/security/config`, {
    method: "HEAD",
    headers: {
      Cookie: cookies.join("; "),
    },
  });

  assert.strictEqual(configRes.status, 200, "Config endpoint HEAD should return 200");

  const cacheControl = configRes.headers.get("cache-control");
  assert.ok(cacheControl, "Missing Cache-Control header");
  assert.strictEqual(cacheControl, "no-store", "Cache-Control must be no-store");

  const configVersion = configRes.headers.get("x-security-config-version");
  assert.ok(configVersion, "Missing X-Security-Config-Version header");

  const link = configRes.headers.get("link");
  assert.ok(link, "Missing Link header");
  assert.ok(link.includes("rel=\"describedby\""), "Link header missing rel=describedby");
  assert.ok(link.includes("/api/security/config/schema"), "Link header should point to schema endpoint");
}

async function testConfigSchemaEndpoint() {
  const schemaRes = await fetch(`${BASE_URL}/api/security/config/schema`);

  assert.strictEqual(schemaRes.status, 200, "Config schema endpoint should return 200");

  const schema = await schemaRes.json();

  assert.ok(schema.$schema, "Schema missing $schema");
  assert.ok(schema.title, "Schema missing title");
  assert(Array.isArray(schema.required), "Schema required must be array");

  const requiredInSchema = [
    "configVersion",
    "configPath",
    "timestamp",
    "features",
  ];

  for (const field of requiredInSchema) {
    assert.ok(
      schema.required.includes(field),
      `Schema missing required field definition: ${field}`
    );
  }

  const cacheControl = schemaRes.headers.get("cache-control");
  assert.ok(cacheControl, "Schema missing Cache-Control header");
  assert.ok(cacheControl.includes("max-age"), "Schema Cache-Control should include max-age");

  const configVersion = schemaRes.headers.get("x-security-config-version");
  assert.ok(configVersion, "Schema missing X-Security-Config-Version header");

  const link = schemaRes.headers.get("link");
  assert.ok(link, "Schema missing Link header");
  assert.ok(link.includes("rel=\"self\""), "Schema Link header missing rel=self");
}

async function testUnauthorizedAccess() {
  const configRes = await fetch(`${BASE_URL}/api/security/config`);

  assert.strictEqual(configRes.status, 403, "Config endpoint should return 403 for unauthenticated");
}

async function runTests() {
  console.log("Starting security config contract tests...\n");

  try {
    console.log("Test 1: Checking unauthorized access...");
    await testUnauthorizedAccess();
    console.log("  ✓ Config endpoint properly gated with 403\n");

    console.log("Test 2: Creating admin session...");
    const cookies = await createAdminSession();
    console.log("  ✓ Session created\n");

    console.log("Test 3: Checking config response fields...");
    const payload = await testConfigResponse(cookies);
    console.log("  ✓ All required fields present");
    console.log(`  ✓ configVersion: ${payload.configVersion}`);
    console.log(`  ✓ alertStateDriver: ${payload.alertStateDriver}`);
    console.log(`  ✓ features count: ${payload.features.length}\n`);

    console.log("Test 4: Checking config response headers...");
    await testConfigHeaders(cookies);
    console.log("  ✓ Cache-Control: no-store");
    console.log("  ✓ X-Security-Config-Version present");
    console.log("  ✓ Link rel=describedby header present\n");

    console.log("Test 5: Checking config schema endpoint...");
    await testConfigSchemaEndpoint();
    console.log("  ✓ Schema endpoint responds");
    console.log("  ✓ Schema structure valid");
    console.log("  ✓ Schema headers valid\n");

    console.log("✅ All security config contract tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
