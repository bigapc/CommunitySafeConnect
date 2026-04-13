import ChatClient from "@/components/ChatClient";
import { getCurrentOrganizationId, requireOrganizationAccess } from "@/lib/access";
import { listChatMessages } from "@/lib/localDataStore";

export default async function ChatPage() {
  await requireOrganizationAccess("/chat");
  const organizationId = await getCurrentOrganizationId();

  const messages = listChatMessages(organizationId, { ascending: true, limit: 100 });
  return <ChatClient initialMessages={messages} />;
}
