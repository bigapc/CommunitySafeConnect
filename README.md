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
- The endpoint is admin-only and also reports live OIDC discovery/JWKS connectivity when OIDC is configured.
- Optional: `OIDC_HEALTH_SLOW_THRESHOLD_MS` (default: `1500`) to flag OIDC latency risk in readiness output.

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