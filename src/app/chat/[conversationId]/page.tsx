import { ChatWindow } from "../../../../components/ChatWindow";

type ChatPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="flex w-full max-w-[800px] flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            AI Admin Assistant
          </h1>
          <p className="text-sm text-zinc-500">
            Ask questions, review context, and continue the conversation.
          </p>
        </div>

        <ChatWindow initialConversationId={conversationId} />
      </div>
    </main>
  );
}