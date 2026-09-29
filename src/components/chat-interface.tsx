"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Streamdown } from "streamdown";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function ChatInterface(props: {
  conversationId: string;
  title: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(props.initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const aiId = crypto.randomUUID();
    setInput("");
    setError(null);
    setLoading(true);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content },
      { id: aiId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: props.conversationId, content }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Codsiga waa fashilmay");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === aiId ? { ...x, content: x.content + text } : x)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cilad ayaa dhacday");
      setMessages((m) => m.filter((x) => !(x.id === aiId && x.content === "")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-rose-600 text-white">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold">{props.title}</h1>
            <p className="text-xs text-rose-600">Chat with AI Assistant</p>
          </div>
        </div>
        <Link href="/" className="rounded-md border px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
          Back to Dashboard
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex items-start justify-end gap-2">
                <div className="rounded-2xl bg-rose-600 px-4 py-2 text-sm text-white">{m.content}</div>
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-600 text-white">
                  <User size={14} />
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600">
                  <Bot size={14} />
                </div>
                <div className="min-w-0 rounded-2xl bg-rose-50/60 px-4 py-3 text-sm leading-relaxed">
                  {m.content ? <Streamdown>{m.content}</Streamdown> : <span className="text-zinc-400">Thinking…</span>}
                </div>
              </div>
            )
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="border-t px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="grid size-10 place-items-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
