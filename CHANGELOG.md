# Changelog

## 2026-04-13

### Security Readiness Contract Stabilization

- Added stable security health response contract for `GET /api/health/security`.
- Added admin-only endpoint behavior with `Cache-Control: no-store`.
- Added machine-readable diagnostics fields:
  - `degradationReasons`
  - `degradationReasonSeverities`
  - `primaryDegradationReason`
  - `overallSeverity`
  - `overallSeverityScore`
  - `recommendedActions`
- Added contract version marker: `schemaVersion` (`2026-04-13.1`).
- Added JSON schema file at `docs/security-health.schema.json` for integration consumers.
- Added schema endpoint at `GET /api/health/security/schema` and `schemaPath` field in health responses.
