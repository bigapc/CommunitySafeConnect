import ChatClient from "@/components/ChatClient";
import { requireOrganizationAccess } from "@/lib/access";
import { listChatMessages } from "@/lib/localDataStore";

export default async function ChatPage() {
  await requireOrganizationAccess("/chat");

  const messages = listChatMessages({ ascending: true, limit: 100 });
  return <ChatClient initialMessages={messages} />;
}
