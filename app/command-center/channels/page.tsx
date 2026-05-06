import Link from "next/link";
import { hasMinimumRole } from "@/lib/access";
import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterChannels } from "@/lib/commandCenterData";
import { getCommandChannelPermissions } from "@/lib/localDataStore";
import { getOrganizationById, mapOrganizationPlanToBilling } from "@/lib/tenancy";
import CommandChannelsConsole from "@/components/CommandChannelsConsole";

interface CommandCenterChannelsPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function CommandCenterChannelsPage({ searchParams }: CommandCenterChannelsPageProps) {
  const params = await searchParams;
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId || "metro-city-university";
  const role = context?.role || "analyst";
  const query = (params.q || "").trim().toLowerCase();

  const organization = getOrganizationById(organizationId);
  const billingPlan = organization ? mapOrganizationPlanToBilling(organization.plan) : "basic";
  const isElite = billingPlan === "elite";

  if (!isElite) {
    return (
      <section>
        <h3>Organization Command Channels</h3>
        <p className="control-meta" style={{ marginTop: "0.2rem" }}>
          This feature is available on Elite billing plans.
        </p>
        <article className="control-card" style={{ padding: "0.85rem", marginTop: "0.8rem" }}>
          <p style={{ margin: 0 }}>
            Upgrade to Elite to unlock emergency channels, task dispatch streams, and internal safety coordination threads.
          </p>
          <div className="control-room-action-row" style={{ marginTop: "0.6rem" }}>
            <Link href="/command-center/subscription">Open Subscription Planner</Link>
          </div>
        </article>
      </section>
    );
  }

  const { channels, channelMessagesById, templates, error } = await getCommandCenterChannels(organizationId, query);
  const permissions = getCommandChannelPermissions(role);

  return (
    <section>
      {!hasMinimumRole(role, "moderator") && (
        <p className="control-meta" style={{ marginTop: 0.2 }}>
          You are viewing channels in read-only analyst mode.
        </p>
      )}
      {error && <p style={{ color: "#ffb3bf" }}>Could not load command channels.</p>}
      <CommandChannelsConsole
        initialChannels={channels}
        initialChannelMessagesById={channelMessagesById}
        templates={templates}
        permissions={permissions}
        initialQuery={params.q || ""}
      />
    </section>
  );
}
