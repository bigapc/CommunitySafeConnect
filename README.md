# CommunitySafeConnect

## Access Configuration

- Set `ORGANIZATION_ACCESS_CODE` in `.env.local` to protect report, dashboard, and chat access.
- Set `ADMIN_ACCESS_CODE` in `.env.local` to protect `/admin` (also used by `/command-center`).
- Set `ACCESS_SESSION_SECRET` in `.env.local` so access cookies are signed server-side.
- Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` so the server can read and write protected data.
- Optional: set `ACCESS_SESSION_MAX_AGE_SECONDS` to control standard access session duration.
- Optional: set `ACCESS_POLICY_RETENTION_SECONDS` to control policy-retained access duration after logout.

## Logout Policy Mode

- `DELETE /api/access/session` performs a hard logout and clears organization/admin cookies.
- `DELETE /api/access/session?retain=policy&scope=organization` keeps organization access for the policy retention window.
- `DELETE /api/access/session?retain=policy&scope=admin` keeps both organization and admin access for the policy retention window.
- The navigation now includes `Logout Now` and `Logout with Policy Retention` actions for command-center operations.

## Command Center Route

- Use `/command-center` as the primary command center entry path.
- `/command-center` redirects to `/command-center/reports`.
- `/admin` now redirects to `/command-center` for compatibility.
- Command center subroutes:
	- `/command-center/reports`
	- `/command-center/messages`
	- `/command-center/audit`

## Access Audit Trail

- Logout actions are recorded in `public.access_audit_logs` with action, scope, retention mode, request path, IP, user-agent, and timestamp.
- Run migration `20260406_create_access_audit_logs.sql` before relying on production audit entries.

## Enterprise SSO Scaffold

- OIDC start endpoint: `GET /api/sso/oidc/start`
- OIDC callback endpoint: `GET /api/sso/oidc/callback`
- SAML-ready placeholder endpoint: `GET /api/sso/saml/start`

Set these variables in `.env.local` for real IdP integration:

- `OIDC_ISSUER_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_AUTHORIZATION_ENDPOINT` (optional override)
- `OIDC_TOKEN_ENDPOINT` (optional override)
- `OIDC_JWKS_URI` (optional override)
- `OIDC_REDIRECT_URI` (optional override)

For local testing only, `OIDC_MOCK_MODE=true` can be used to bypass real token exchange.

In non-mock mode, callback handling enforces strict ID token verification:

- Signature validation against JWKS
- `iss` and `aud` validation
- `exp` validation (via JWT verification)
- `nonce` binding between start and callback

## CSRF Protection

- Global same-origin CSRF checks are enforced for mutating API methods: `POST`, `PUT`, `PATCH`, `DELETE`.
- Requests to `/api/*` are rejected with `403` when `Origin` does not match the app origin.
- Requests marked as `sec-fetch-site: cross-site` are rejected when `Origin` is absent.
- This protection is applied centrally via `proxy.ts`.

## Security Observability

- A correlation ID (`x-request-id`) is attached to every request in `proxy.ts` and returned in responses.
- Structured JSON security logs are emitted for high-risk auth paths:
	- Access login/logout
	- MFA verify/backup verification
	- OIDC callback success/failure paths
- Logs include timestamp, request ID, method, path, source IP, user-agent, outcome, and reason.

Security health endpoint:

- `GET /api/health/security` returns security readiness checks, including alert-state driver connectivity.
- `GET /api/health/security/schema` returns the canonical JSON schema for readiness responses.
- The endpoint is admin-only and also reports live OIDC discovery/JWKS connectivity when OIDC is configured.
- The endpoint sets `Cache-Control: no-store` so readiness data is always fresh.
- The endpoint also sets `X-Security-Health-Schema-Version` and a `Link rel=describedby` header for contract discovery.
- Optional: `OIDC_HEALTH_SLOW_THRESHOLD_MS` (default: `1500`) to flag OIDC latency risk in readiness output.
- The response includes `degradationReasons` and `primaryDegradationReason` for machine-readable alert routing.
- The response also includes `degradationReasonSeverities` and `overallSeverity` (`none` | `warning` | `critical`).
- The response includes `overallSeverityScore` (`0` none, `1` warning, `2` critical) for numeric alert thresholds.
- The response includes `schemaVersion` and `recommendedActions` for stable parsing and operator remediation guidance.
- Canonical JSON schema for this response: `docs/security-health.schema.json`.
- Health responses include `schemaPath` so consumers can discover the active contract endpoint.

Security configuration audit endpoint:

- `GET /api/security/config` returns real-time snapshot of which security features are enabled/configured.
- `GET /api/security/config/schema` returns the canonical JSON schema for config responses.
- The endpoint is admin-only and useful for compliance verification and operational awareness.
- The endpoint sets `Cache-Control: no-store` so config changes are immediately visible.
- The endpoint also sets `X-Security-Config-Version` and a `Link rel=describedby` header for contract discovery.
- The response includes a `features` array listing 8 core security features with their enabled status:
  - `mfa_enabled`: TOTP-based multi-factor authentication
  - `oidc_enabled`: OIDC identity provider integration
  - `audit_logging_enabled`: Structured security event logging
  - `audit_chain_integrity`: Tamper-evident audit log chains (HMAC-SHA256)
  - `anomaly_detection_enabled`: Rule-based security anomaly detection
  - `alert_suppression_enabled`: Deduplication and alert suppression
  - `rate_limiting_enabled`: Per-tenant request rate limiting
  - `session_secure_flags`: Secure cookie flags (httpOnly, secure, sameSite=Strict)
- The response includes `alertStateDriver` (`file` or `redis_rest`) showing which backend persists alert state.
- The response includes `oidcConfigured`, `rbacEnabled`, and `tenantIsolationEnabled` for high-level capability discovery.
- Canonical JSON schema for this response: `docs/security-config.schema.json`.

## Release Notes

- See `CHANGELOG.md` for security readiness contract updates and version history.

## Tamper-Evident Audit Integrity

- Audit events are chained per organization with:
	- `previous_hash` (link to prior entry)
	- `integrity_hash` (HMAC-SHA256 signature of the event payload + previous hash)
- Chain verification is available in memory via `verifyAuditLogChain(organizationId)`.
- Command-center audit view now displays chain status and per-entry hash snippets.
- Optional secret for production hardening: `AUDIT_INTEGRITY_SECRET`.

## Security Anomaly Alerts

- Structured security events are persisted in-memory from auth/MFA/SSO security logger paths.
- Command center audit view surfaces active alerts from recent events:
	- Failed login spike (15 min window)
	- Failed MFA spike (15 min window)
	- Suspicious cross-tenant login pattern (same IP across 3+ tenants within 30 min)
- Command center audit view also shows recently suppressed alerts with the next eligible re-emit time.

Optional environment variables to tune alert sensitivity:

- `SEC_ALERT_FAILED_LOGIN_WINDOW_MINUTES` (default: `15`)
- `SEC_ALERT_FAILED_LOGIN_THRESHOLD` (default: `5`)
- `SEC_ALERT_FAILED_MFA_WINDOW_MINUTES` (default: `15`)
- `SEC_ALERT_FAILED_MFA_THRESHOLD` (default: `5`)
- `SEC_ALERT_CROSS_TENANT_WINDOW_MINUTES` (default: `30`)
- `SEC_ALERT_CROSS_TENANT_ORG_THRESHOLD` (default: `3`)
- `SEC_ALERT_SUPPRESSION_MINUTES` (default: `10`) to deduplicate repeat alerts
- `ALERT_STATE_FILE_PATH` (optional) path to persist alert suppression state across restarts

Optional shared-state settings for multi-instance consistency:

- `ALERT_STATE_DRIVER` (`file` or `redis`, default: `file`)
- `ALERT_STATE_NAMESPACE` (default: `csc_alert_state`)
- `ALERT_STATE_REDIS_REST_URL` (or `UPSTASH_REDIS_REST_URL`)
- `ALERT_STATE_REDIS_REST_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)

## Session Activity Ledger

Real-time session management for operational security and compliance:

- `GET /api/security/sessions` returns all active sessions (authenticated users).
  - Org users see their organization's sessions.
  - Admins see admin sessions.
  - Optional query param: `?scope=admin` or `?scope=organization` to filter.
  - Returns array of `SessionRecord` objects with: `sessionId`, `organizationId`, `scope`, `ipAddress`, `userAgent`, `createdAt`, `lastActivityAt`.
  - Admin-only effective filtering: admins see admin scope; org users see their org's sessions.
  - Response includes `X-Session-Count` header with total active session count.
  - Response sets `Cache-Control: no-store` for real-time visibility.
  - Access is enforced through a signed session-ledger cookie, so revoked sessions lose access on subsequent requests.

- `POST /api/security/sessions/revoke` force-logs out a specific session (admin-only).
  - Request body: `{ "sessionId": "...", "reason": "optional_reason" }`
  - Returns: `{ "success": true, "message": "Session revoked" }` on 200.
  - Returns 404 if session not found, 400 if sessionId missing, 403 if not admin.
  - Revocation is logged as a security event for compliance audit.

- `DELETE /api/access/session` now revokes the current signed session-ledger cookie on hard logout.
- `DELETE /api/access/session?retain=policy...` preserves the signed session-ledger cookie for the policy retention window.
- Session state driver configuration:
  - `SESSION_STATE_DRIVER` (`memory` or `redis`, default: `memory`)
  - `SESSION_STATE_NAMESPACE` (default: `csc_session_state`)
  - `SESSION_STATE_REDIS_REST_URL` (or `UPSTASH_REDIS_REST_URL`)
  - `SESSION_STATE_REDIS_REST_TOKEN` (or `UPSTASH_REDIS_REST_TOKEN`)
  - When Redis is configured, session listing and revocation work across multiple app instances.

Canonical JSON schema for sessions response: `docs/security-sessions.schema.json`.