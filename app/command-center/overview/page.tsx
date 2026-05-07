import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterIncidents, getCommandCenterOverviewByOrganization } from "@/lib/commandCenterData";
import { getEscalationPriorityState, getEscalationSlaState } from "@/lib/escalationSla";
import Link from "next/link";
import LiveRefreshPill from "@/components/LiveRefreshPill";
import IncidentDrilldownPanel from "@/components/IncidentDrilldownPanel";
import RealtimeOpsCollaboration from "@/components/RealtimeOpsCollaboration";

export default async function CommandCenterOverviewPage() {
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const { organization, metrics, usage, recentEvents, recentEscalations, escalationSla, escalationPriority } = await getCommandCenterOverviewByOrganization(organizationId);
  const { incidents, incidentEventsById } = await getCommandCenterIncidents(organizationId, "");

  const incidentChart = [
    { label: "Open", value: metrics.openIncidents, tone: "bg-rose-500" },
    { label: "Escalated", value: metrics.escalatedIncidents, tone: "bg-orange-500" },
    { label: "Pending Reports", value: metrics.pendingReports, tone: "bg-amber-500" },
    { label: "Flagged Messages", value: metrics.flaggedMessages, tone: "bg-purple-500" },
  ];

  const slaChart = [
    { label: "Overdue", value: escalationSla.overdue, tone: "bg-red-600" },
    { label: "Due Soon", value: escalationSla.dueSoon, tone: "bg-amber-500" },
    { label: "Awaiting Schedule", value: escalationSla.awaitingSchedule, tone: "bg-slate-400" },
  ];

  const responderSla = [
    { label: "Task Due Soon", value: metrics.dueSoonTaskChannels, tone: "bg-amber-500" },
    { label: "Task Overdue", value: metrics.overdueTaskChannels, tone: "bg-red-600" },
    { label: "Escalated", value: metrics.escalatedTaskChannels, tone: "bg-rose-700" },
    { label: "Auto-Routed", value: metrics.routedTaskIncidentChannels, tone: "bg-violet-600" },
  ];

  const eventBuckets = bucketEventsByHour(recentEvents);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Operational Overview</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{organization?.name || organizationId}</h3>
            <p className="mt-1 text-sm text-slate-600">Plan: {usage.plan} | Billing Month: {usage.month}</p>
          </div>
          <LiveRefreshPill intervalMs={15000} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Incidents" value={metrics.openIncidents} hint={`Escalated: ${metrics.escalatedIncidents}`} tone="rose" trend={buildTrend(metrics.openIncidents)} />
        <MetricCard label="Pending Escalations" value={metrics.pendingEscalationRequests} hint={`Critical: ${escalationPriority.critical}`} tone="amber" trend={buildTrend(metrics.pendingEscalationRequests)} />
        <MetricCard label="Unresolved Task Channels" value={metrics.unresolvedTaskChannels} hint={`Due Soon: ${metrics.dueSoonTaskChannels}`} tone="violet" trend={buildTrend(metrics.unresolvedTaskChannels)} />
        <MetricCard label="Critical Channel Posts (24h)" value={metrics.criticalChannelMessages24h} hint={`Active Channels: ${metrics.activeCommandChannels24h}`} tone="blue" trend={buildTrend(metrics.criticalChannelMessages24h)} />
      </div>

      <RealtimeOpsCollaboration />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Incident Pressure" subtitle="Live incident load by source" trend={buildTrend(metrics.openIncidents + metrics.escalatedIncidents)}>
          <HorizontalBars rows={incidentChart} showDeltas />
        </ChartCard>
        <ChartCard title="Escalation SLA" subtitle="Responder queue SLA risk" trend={buildTrend(escalationSla.overdue + escalationSla.dueSoon)}>
          <HorizontalBars rows={slaChart} showDeltas />
        </ChartCard>
        <ChartCard title="Responder SLA Flow" subtitle="Task dispatch lifecycle" trend={buildTrend(metrics.overdueTaskChannels + metrics.escalatedTaskChannels)}>
          <HorizontalBars rows={responderSla} showDeltas />
        </ChartCard>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900">Event Velocity (last snapshots)</h4>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {eventBuckets.map((bucket) => (
            <div key={bucket.label} className="flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-blue-500/80"
                style={{ height: `${Math.max(10, bucket.value * 14)}px` }}
                title={`${bucket.label}: ${bucket.value} events`}
              />
              <span className="text-[11px] text-slate-500">{bucket.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-900">Incident Drill-Down</h3>
      <IncidentDrilldownPanel incidents={incidents} incidentEventsById={incidentEventsById} />

      <h3 className="text-xl font-semibold text-slate-900">Restricted Access Escalation Queue</h3>
      <div className="space-y-3">
        {recentEscalations.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="m-0 text-slate-700">No escalations right now. Stay aware. Stay safe.</p>
          </article>
        ) : (
          recentEscalations.map((request) => (
            <article key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {(() => {
                const priority = getEscalationPriorityState(request);
                const sla = getEscalationSlaState(request);
                return (
                  <div className="mb-2 flex gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">{priority.label}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{sla.label}</span>
                  </div>
                );
              })()}
              <p className="m-0 text-slate-900">
                <strong>{request.category.replaceAll("_", " ")}</strong>
                {" "}
                status={request.status}
              </p>
              <small className="block text-slate-500">
                {request.contact_name} | {request.contact_email} | requestedBy={request.requested_by_role}
              </small>
              <small className="block text-slate-500">
                {new Date(request.created_at).toLocaleString()}
              </small>
              <small className="mt-1 block text-slate-500">
                {request.reason}
              </small>
              {request.status !== "resolved" && (
                <form action={`/api/command-center/escalation/${request.id}/review`} method="post" className="mt-3 space-y-2">
                  <input type="hidden" name="returnTo" value="/command-center/overview" />
                  <textarea
                    name="resolutionNotes"
                    rows={2}
                    placeholder="Add review notes for leadership handoff"
                    className="w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" name="status" value="under_review" className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600">
                      Mark under review
                    </button>
                    <button type="submit" name="status" value="resolved" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                      Resolve request
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))
        )}
      </div>

      <h3 className="text-xl font-semibold text-slate-900">Recent Operational Events</h3>
      <div className="space-y-2">
        {recentEvents.map((event) => (
          <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="m-0 text-slate-900">
              <strong>{event.action}</strong>
              {" "}
              target={event.target_type}
            </p>
            <small className="block text-slate-500">
              {new Date(event.created_at).toLocaleString()}
            </small>
            {event.details && (
              <small className="block text-slate-500">
                {event.details}
              </small>
            )}
          </article>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-slate-900">Quick Ops Actions</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <OpsLink href="/command-center/incidents" label="Manage Incidents" />
        <OpsLink href="/command-center/messages" label="Moderate Messages" />
        <OpsLink href="/command-center/channels" label="Command Channels" />
        <OpsLink href="/command-center/assistant" label="AI Assistant" />
        <OpsLink href="/live-map" label="Live Map" />
        <OpsLink href="/command-center/reports" label="Review Reports" />
        <OpsLink href="/command-center/evidence" label="Handle Evidence" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900">Governance Actions</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <OpsLink href="/command-center/escalations" label="Mark as Resolved" />
        <OpsLink href="/command-center/escalations" label="Escalate for Security Review" />
        <OpsLink href="/command-center/evidence" label="Export Documentation" />
        <OpsLink href="/command-center/escalations" label="Request Restricted Access" />
        <OpsLink href="/command-center/escalations" label="Submit to Compliance Review" />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone,
  trend,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "rose" | "amber" | "violet" | "blue";
  trend: number[];
}) {
  const toneMap: Record<string, string> = {
    rose: "border-rose-200 bg-rose-50/40 text-rose-700",
    amber: "border-amber-200 bg-amber-50/40 text-amber-700",
    violet: "border-violet-200 bg-violet-50/40 text-violet-700",
    blue: "border-blue-200 bg-blue-50/40 text-blue-700",
  };

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-slate-600">{hint}</p>
        </div>
        <MiniSparkline values={trend} />
      </div>
    </article>
  );
}

function ChartCard({ title, subtitle, children, trend }: { title: string; subtitle: string; children: React.ReactNode; trend: number[] }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <MiniSparkline values={trend} />
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function HorizontalBars({ rows, showDeltas = false }: { rows: Array<{ label: string; value: number; tone: string }>; showDeltas?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
            <span>{row.label}</span>
            <span className="font-semibold text-slate-800">
              {row.value}
              {showDeltas && <span className="ml-1 text-[10px] text-emerald-600">{formatDelta(row.value)}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${row.tone}`}
              style={{ width: `${Math.max(8, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);

  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((v, idx) => (
        <span
          key={`${idx}_${v}`}
          className="w-1.5 rounded-sm bg-blue-500/70"
          style={{ height: `${Math.max(4, Math.round((v / max) * 36))}px` }}
        />
      ))}
    </div>
  );
}

function formatDelta(value: number) {
  if (value === 0) {
    return "0%";
  }

  const delta = Math.min(32, value * 3 + 4);
  return `+${delta}%`;
}

function buildTrend(current: number) {
  const a = Math.max(0, current - 3);
  const b = Math.max(0, current - 2);
  const c = Math.max(0, current - 1);
  const d = current;

  return [a, b, c, d, Math.max(0, d + 1)];
}

function OpsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
      {label}
    </Link>
  );
}

function bucketEventsByHour(events: Array<{ created_at: string }>) {
  const now = Date.now();
  const buckets = [5, 4, 3, 2, 1, 0].map((hoursAgo) => {
    const label = `${hoursAgo}h`;
    const start = now - (hoursAgo + 1) * 60 * 60 * 1000;
    const end = now - hoursAgo * 60 * 60 * 1000;
    const value = events.filter((event) => {
      const created = new Date(event.created_at).getTime();
      return created >= start && created < end;
    }).length;

    return { label, value };
  });

  return buckets;
}
