import Link from "next/link";
import { getCurrentAccessContext } from "@/lib/access";
import { getCommandCenterChannels } from "@/lib/commandCenterData";
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

  const { channels, channelMessagesById, error } = await getCommandCenterChannels(organizationId, query);

  return (
    <section>
      {error && <p style={{ color: "#ffb3bf" }}>Could not load command channels.</p>}
      <CommandChannelsConsole
        initialChannels={channels}
        initialChannelMessagesById={channelMessagesById}
        initialQuery={params.q || ""}
      />
    </section>
  );
}
