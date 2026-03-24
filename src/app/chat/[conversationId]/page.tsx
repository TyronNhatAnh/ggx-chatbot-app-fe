import { ChatWindow } from "@/components/chat/chat-window";

type ChatPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;

  return (
    <main className="h-screen overflow-hidden bg-[#111214]">
      <ChatWindow initialConversationId={conversationId} />
    </main>
  );
}