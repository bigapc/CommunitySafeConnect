import ChatClient from "@/components/ChatClient";
import { getCurrentAccessContext, requireOrganizationAccess } from "@/lib/access";
import { listChatMessages } from "@/lib/localDataStore";

export default async function ChatPage() {
  await requireOrganizationAccess("/chat");
  const context = await getCurrentAccessContext();
  const organizationId = context?.organizationId;

  const messages = listChatMessages({ organizationId, ascending: true, limit: 100 });
  return <ChatClient initialMessages={messages} />;
}
