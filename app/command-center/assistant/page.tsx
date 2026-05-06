import { getCurrentAccessContext, requireMinimumRole } from "@/lib/access";
import AiSafetyAssistant from "@/components/AiSafetyAssistant";

export default async function CommandCenterAssistantPage() {
  await requireMinimumRole("/command-center/assistant", "moderator");
  const context = await getCurrentAccessContext();

  return (
    <section>
      <p className="control-meta" style={{ marginTop: 0 }}>
        AI guidance mode active for {context?.organizationId || "organization"} | role={context?.role || "unknown"}
      </p>
      <AiSafetyAssistant />
    </section>
  );
}
