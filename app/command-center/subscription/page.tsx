import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterSubscription } from "@/lib/commandCenterData";

export default async function CommandCenterSubscriptionPage() {
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const { organization, usage, invoiceEvents } = await getCommandCenterSubscription(organizationId);

  return (
    <section>
      <h3>Subscription and Usage</h3>
      <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
        {organization?.name || organizationId} | plan={usage.plan} | month={usage.month}
      </p>

      <div className="ops-metrics-grid">
        <article className="control-card ops-metric-card">
          <small className="control-meta">Reports Used</small>
          <strong>{usage.usage.reports}</strong>
          <small className="control-meta">Limit: {usage.limits.monthlyReports}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Messages Used</small>
          <strong>{usage.usage.messages}</strong>
          <small className="control-meta">Limit: {usage.limits.monthlyMessages}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Report Utilization</small>
          <strong>{Math.round(usage.utilization.reports * 100)}%</strong>
          <small className="control-meta">Tier: {usage.plan}</small>
        </article>
        <article className="control-card ops-metric-card">
          <small className="control-meta">Message Utilization</small>
          <strong>{Math.round(usage.utilization.messages * 100)}%</strong>
          <small className="control-meta">Tier: {usage.plan}</small>
        </article>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Invoice Events</h3>
      <div className="control-list">
        {invoiceEvents.map((event) => (
          <article key={event.id} className="control-card" style={{ padding: "0.75rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{event.event_type}</strong> ${event.amount_usd}
            </p>
            <small className="control-meta" style={{ display: "block" }}>
              {new Date(event.created_at).toLocaleString()}
            </small>
            <small className="control-meta" style={{ display: "block" }}>{event.details}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
