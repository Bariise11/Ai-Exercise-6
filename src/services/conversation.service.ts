import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, type Conversation } from "@/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const conversationService = {
  async create(title = "New Conversation"): Promise<Conversation> {
    const [row] = await db.insert(conversations).values({ title }).returning();
    return row;
  },

  async getById(id: string): Promise<Conversation | null> {
    if (!UUID_RE.test(id)) return null; // /chat/abc -> 404 halkii uu ka noqon lahaa 500
    const [row] = await db.select().from(conversations).where(eq(conversations.id, id));
    return row ?? null;
  },

  async list(): Promise<Conversation[]> {
    try {
      return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    } catch (e) {
      console.error("DB CAUSE:", (e as { cause?: unknown }).cause ?? e);
      throw new Error("Database-ka (local.db) lama akhrin karo");
    }
  },

  async rename(id: string, title: string) {
    await db.update(conversations).set({ title, updatedAt: new Date() }).where(eq(conversations.id, id));
  },

  async touch(id: string) {
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
  },

  async remove(id: string) {
    await db.delete(conversations).where(eq(conversations.id, id));
  },
};
