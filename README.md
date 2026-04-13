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