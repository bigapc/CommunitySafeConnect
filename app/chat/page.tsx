import ChatClient from "@/components/ChatClient";
import { requireOrganizationAccess } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export default async function ChatPage() {
  await requireOrganizationAccess("/chat");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, username, message, created_at")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return (
      <main className="container">
        <h2>Organization Chat</h2>
        <p style={{ color: "#fca5a5" }}>Could not load chat messages.</p>
      </main>
    );
  }

  return <ChatClient initialMessages={data || []} />;
}
