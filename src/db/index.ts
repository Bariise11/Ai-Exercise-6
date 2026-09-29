import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Database-ku waa hal fayl: local.db (waxaa la abuuraa si toos ah).
// Haddii aad rabto meel kale: DB_FILE_NAME=file:C:/meel/kale/chat.db
const url = process.env.DB_FILE_NAME ?? "file:local.db";

const globalForDb = globalThis as unknown as { client?: ReturnType<typeof createClient> };
const client = globalForDb.client ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

// Jadwalada si toos ah ayaa loo abuuraa marka app-ku bilaabmo (ma jiro db:setup).
await client.executeMultiple(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
`);

export const db = drizzle(client, { schema });
