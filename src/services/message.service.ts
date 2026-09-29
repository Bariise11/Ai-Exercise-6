import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, type Message, type Role } from "@/db/schema";
import { conversationService } from "./conversation.service";

export const messageService = {
  async create(input: { conversationId: string; role: Role; content: string }): Promise<Message> {
    const [row] = await db.insert(messages).values(input).returning();
    await conversationService.touch(input.conversationId);
    return row;
  },

  async listByConversation(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  },
};
