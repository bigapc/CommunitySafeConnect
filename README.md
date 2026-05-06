# CommunitySafeConnect

## Access Configuration

- Set `ORGANIZATION_ACCESS_CODE` in `.env.local` to protect report, dashboard, and chat access.
- Set `ADMIN_ACCESS_CODE` in `.env.local` to protect `/admin` (also used by `/command-center`).
- Demo fallback credentials are disabled. Access code configuration is required for sign-in.
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
	- `/command-center/overview`
	- `/command-center/reports`
	- `/command-center/incidents`
	- `/command-center/messages`
	- `/command-center/evidence`
	- `/command-center/audit`
	- `/command-center/subscription`

## Incident Operations

- Use `/command-center/incidents` to create incidents with title, description, severity, and assignee.
- Moderators and above can update incident status, assignment, and escalation directly from the incidents console.
- Incident actions are tracked in command center events for operational visibility.
- The incidents console auto-refreshes every 10 seconds and shows recent per-incident activity history.

## Concurrent Edit Conflict Detection

- When multiple moderators edit the same incident simultaneously, the system detects conflicts on refresh.
- Conflicting incidents are highlighted with a gold border and banner indicating which fields changed.
- Operators can choose to **Reload** (discard local changes) or **Overwrite** (save local changes) when conflicts occur.
- Fields are locked during conflict resolution to prevent accidental unsaved edits.

## Access Audit Trail

- Logout actions are recorded in `public.access_audit_logs` with action, scope, retention mode, request path, IP, user-agent, and timestamp.
- Run migration `20260406_create_access_audit_logs.sql` before relying on production audit entries.

## Data Security Policy

- Hard deletion of reports and messages is not available through organization-facing APIs.
- Limited removal review can only be requested by organization authority (`org_admin` and above):
	- `DELETE /api/reports` with JSON body `{ "reason": "..." }`
	- `DELETE /api/chat/messages` with JSON body `{ "reason": "..." }`
- These endpoints do not delete data. They create a command-center review event for policy handling.
- Organization-facing views expose only recent history (`ORGANIZATION_HISTORY_WINDOW_HOURS`, default `24`).
- Historical evidence access must be requested from the command center for emergency and legal workflows.

## Evidence Workflow

- `/command-center/evidence` is the queue for legal and emergency evidence access requests.
- Moderators and above can create evidence requests with dataset, reason, and case reference.
- Only `super_admin` can approve/reject requests and generate export packages.
- Export packages are tamper-evident: each export stores a SHA-256 hash and HMAC signature.
- Evidence lifecycle actions are recorded as command center events:
	- `evidence_request_created`
	- `evidence_request_reviewed`
	- `evidence_export_generated`
	- `evidence_export_verified`
- Exported evidence packages can be integrity-verified from the queue (`Verify Export Integrity`).