import Link from "next/link";
import { redirect } from "next/navigation";
import { conversationService } from "@/services/conversation.service";

export const dynamic = "force-dynamic";

async function newChat() {
  "use server";
  const c = await conversationService.create();
  redirect(`/chat/${c.id}`);
}

export default async function Dashboard() {
  const list = await conversationService.list();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <form action={newChat}>
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
            New chat
          </button>
        </form>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">No conversations yet. Start one with New chat.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`} className="block px-4 py-3 text-sm hover:bg-rose-50">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
