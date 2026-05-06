import ChatClient from "@/components/ChatClient";
import {
  getCurrentAccessContext,
  getOrganizationHistoryCutoffIso,
  getOrganizationHistoryWindowHours,
  requireOrganizationAccess,
} from "@/lib/access";
import { listChatMessages } from "@/lib/localDataStore";

export default async function SafetyCirclePage() {
  await requireOrganizationAccess("/safety-circle");
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;
  const historyWindowHours = getOrganizationHistoryWindowHours();
  const cutoffIso = getOrganizationHistoryCutoffIso();

  const messages = listChatMessages({ organizationId, ascending: true, limit: 100 }).filter(
    (item) => item.created_at >= cutoffIso
  );

  return <ChatClient initialMessages={messages} historyWindowHours={historyWindowHours} />;
}
