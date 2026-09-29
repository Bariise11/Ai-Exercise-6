import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { conversationService } from "@/services/conversation.service";
import { messageService } from "@/services/message.service";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await conversationService.getById(id);
  if (!conversation) notFound();

  const initial = await messageService.listByConversation(id);
  return (
    <ChatInterface
      conversationId={id}
      title={conversation.title}
      initialMessages={initial.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
    />
  );
}
