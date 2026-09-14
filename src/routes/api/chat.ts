import { createFileRoute } from "@tanstack/react-router";

const SYSTEM =
  "You are Mia, powered by Grok 4.5 — John Morgan's full assistant for LensFlow, Glimr, Missing Cash and HeyMia. Same class as Grok in the xAI app: reason, write, design, debug, ship. Do not play small. Do not say you only route files. If they want a live publish, tell them to open the Sites tab or deploy Worker v3.2 with XAI_API_KEY. Never invent that a secret is set.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json({ ok: false, error: "AI is not available" }, { status: 503 });
        }
        const body = (await request.json().catch(() => ({}))) as {
          message?: string;
          messages?: { role?: string; content?: string }[];
        };
        const messages = Array.isArray(body.messages) && body.messages.length
          ? body.messages
          : [{ role: "user", content: String(body.message || "") }];
        const last = String(messages.at(-1)?.content || "").slice(0, 2000);
        if (!last) return Response.json({ ok: false, error: "message required" }, { status: 400 });
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 1200,
            messages: [
              { role: "system", content: SYSTEM },
              ...messages.slice(-12).map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: String(m.content || "").slice(0, 2000),
              })),
            ],
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
          choices?: { message?: { content?: string } }[];
        };
        if (!res.ok) {
          return Response.json(
            { ok: false, error: data.error?.message || "xAI HTTP " + res.status },
            { status: 502 },
          );
        }
        const text = data.choices?.[0]?.message?.content || "";
        return Response.json({
          ok: true,
          reply: text,
          response: text,
          model: "grok-4.5",
          grok: true,
        });
      },
    },
  },
});
