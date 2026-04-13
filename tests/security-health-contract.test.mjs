/**
 * Security Health Contract Test
 *
 * Validates that the /api/health/security endpoint maintains a stable schema.
 * Runs against a local instrumented server to check field presence, types, and HTTP headers.
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

async function testHealthResponse(cookies) {
  const healthRes = await fetch(`${BASE_URL}/api/health/security`, {
    headers: {
      Cookie: cookies.join("; "),
    },
  });

  assert.strictEqual(healthRes.status, 200, "Health endpoint should return 200");

  const payload = await healthRes.json();

  // Test required top-level fields
  const topLevelFields = [
    "schemaVersion",
    "schemaPath",
    "status",
    "checks",
    "degradationReasons",
    "degradationReasonSeverities",
    "primaryDegradationReason",
    "overallSeverity",
    "overallSeverityScore",
    "recommendedActions",
    "timestamp",
  ];

  for (const field of topLevelFields) {
    assert.ok(
      field in payload,
      `Missing required field: ${field}`
    );
  }

  // Test field types
  assert.strictEqual(typeof payload.schemaVersion, "string", "schemaVersion must be string");
  assert.strictEqual(typeof payload.schemaPath, "string", "schemaPath must be string");
  assert.strictEqual(typeof payload.status, "string", "status must be string");
  assert.strictEqual(typeof payload.checks, "object", "checks must be object");
  assert(Array.isArray(payload.degradationReasons), "degradationReasons must be array");
  assert(Array.isArray(payload.degradationReasonSeverities), "degradationReasonSeverities must be array");
  assert.strictEqual(typeof payload.overallSeverity, "string", "overallSeverity must be string");
  assert.strictEqual(typeof payload.overallSeverityScore, "number", "overallSeverityScore must be number");
  assert(Array.isArray(payload.recommendedActions), "recommendedActions must be array");
  assert.strictEqual(typeof payload.timestamp, "string", "timestamp must be string");

  // Test checks object structure
  const checksRequiredFields = ["alertState", "sessionState", "oidc", "securityTelemetry"];
  for (const field of checksRequiredFields) {
    assert.ok(field in payload.checks, `Missing field in checks: ${field}`);
  }

  assert.strictEqual(typeof payload.checks.sessionState.requestedDriver, "string", "sessionState.requestedDriver must be string");
  assert.strictEqual(typeof payload.checks.sessionState.activeDriver, "string", "sessionState.activeDriver must be string");
  assert.strictEqual(typeof payload.checks.sessionState.connected, "boolean", "sessionState.connected must be boolean");
  assert.strictEqual(typeof payload.checks.sessionState.revocationEnforced, "boolean", "sessionState.revocationEnforced must be boolean");
  assert.strictEqual(typeof payload.checks.sessionState.distributedConsistency, "boolean", "sessionState.distributedConsistency must be boolean");

  // Test severity score range
  assert.ok([0, 1, 2].includes(payload.overallSeverityScore), "overallSeverityScore must be 0, 1, or 2");

  return payload;
}

async function testHealthHeaders(cookies) {
  const healthRes = await fetch(`${BASE_URL}/api/health/security`, {
    method: "HEAD",
    headers: {
      Cookie: cookies.join("; "),
    },
  });

  assert.strictEqual(healthRes.status, 200, "Health endpoint HEAD should return 200");

  const cacheControl = healthRes.headers.get("cache-control");
  assert.ok(cacheControl, "Missing Cache-Control header");
  assert.strictEqual(cacheControl, "no-store", "Cache-Control must be no-store");

  const schemaVersion = healthRes.headers.get("x-security-health-schema-version");
  assert.ok(schemaVersion, "Missing X-Security-Health-Schema-Version header");
  assert.strictEqual(schemaVersion, "2026-04-13.2", "Schema version mismatch");

  const link = healthRes.headers.get("link");
  assert.ok(link, "Missing Link header");
  assert.ok(link.includes("rel=\"describedby\""), "Link header missing rel=describedby");
  assert.ok(link.includes("type=\"application/schema+json\""), "Link header missing type");
}

async function testSchemaEndpoint() {
  const schemaRes = await fetch(`${BASE_URL}/api/health/security/schema`);

  assert.strictEqual(schemaRes.status, 200, "Schema endpoint should return 200");

  const schema = await schemaRes.json();

  assert.ok(schema.$schema, "Schema missing $schema");
  assert.ok(schema.title, "Schema missing title");
  assert(Array.isArray(schema.required), "Schema required must be array");

  const requiredInSchema = [
    "schemaVersion",
    "schemaPath",
    "status",
    "checks",
    "degradationReasons",
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

  const schemaVersion = schemaRes.headers.get("x-security-health-schema-version");
  assert.ok(schemaVersion, "Schema missing X-Security-Health-Schema-Version header");

  const link = schemaRes.headers.get("link");
  assert.ok(link, "Schema missing Link header");
  assert.ok(link.includes("rel=\"self\""), "Schema Link header missing rel=self");
}

async function runTests() {
  console.log("Starting security health contract tests...\n");

  try {
    console.log("Test 1: Creating admin session...");
    const cookies = await createAdminSession();
    console.log("  ✓ Session created\n");

    console.log("Test 2: Checking health response fields...");
    const payload = await testHealthResponse(cookies);
    console.log("  ✓ All required fields present");
    console.log(`  ✓ schemaVersion: ${payload.schemaVersion}`);
    console.log(`  ✓ status: ${payload.status}`);
    console.log(`  ✓ overallSeverityScore: ${payload.overallSeverityScore}\n`);

    console.log("Test 3: Checking health response headers...");
    await testHealthHeaders(cookies);
    console.log("  ✓ Cache-Control: no-store");
    console.log("  ✓ X-Security-Health-Schema-Version present");
    console.log("  ✓ Link rel=describedby header present\n");

    console.log("Test 4: Checking schema endpoint...");
    await testSchemaEndpoint();
    console.log("  ✓ Schema endpoint responds");
    console.log("  ✓ Schema structure valid");
    console.log("  ✓ Schema headers valid\n");

    console.log("✅ All security health contract tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runTests();
