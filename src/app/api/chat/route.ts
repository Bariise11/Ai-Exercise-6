import OpenAI from "openai";
import { conversationService } from "@/services/conversation.service";
import { messageService } from "@/services/message.service";

export const runtime = "nodejs";

function friendlyError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return "OPENAI_API_KEY waa khalad ama waa la tirtiray. Samee key cusub oo ku qor .env.local.";
    if (err.status === 429) return "OpenAI: quota ama lacag kuguma harin (429). Ku dar lacag akoonkaaga platform.openai.com/settings/organization/billing.";
    if (err.status === 404) return "OpenAI: model-ka lama helin. Ku qor OPENAI_MODEL=gpt-4o-mini ee .env.local.";
    return `OpenAI (${err.status}): ${err.message}`;
  }
  return err instanceof Error ? err.message : "Cilad aan la garanayn";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY lama helin. Ku qor .env.local (galka mashruuca), kadib dib u bilow npm run dev." },
        { status: 500 }
      );
    }

    const { conversationId, content } = (await req.json()) as {
      conversationId?: string;
      content?: string;
    };
    if (!conversationId || !content?.trim()) {
      return Response.json({ error: "conversationId iyo content waa loo baahan yahay" }, { status: 400 });
    }

    const conversation = await conversationService.getById(conversationId);
    if (!conversation) return Response.json({ error: "Wada-hadalka lama helin" }, { status: 404 });

    await messageService.create({ conversationId, role: "user", content });
    if (conversation.title === "New Conversation") {
      await conversationService.rename(conversationId, content.slice(0, 50));
    }

    const history = await messageService.listByConversation(conversationId);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      stream: true,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    const encoder = new TextEncoder();
    let full = "";

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (!token) continue;
            full += token;
            controller.enqueue(encoder.encode(token));
          }
          if (full) await messageService.create({ conversationId, role: "assistant", content: full });
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return Response.json({ error: friendlyError(err) }, { status: 500 });
  }
}