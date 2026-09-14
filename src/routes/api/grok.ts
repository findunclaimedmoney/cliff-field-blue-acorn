import { createFileRoute } from "@tanstack/react-router";

const SYSTEM =
  "You are Grok, embedded in HeyMia as the troubleshooter. Diagnose Worker, R2 vault, Gemini, deploy, DNS 1014, multipart FormBoundary junk, empty /files. Short numbered steps. Never invent secrets.";

export const Route = createFileRoute("/api/grok")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          grok: Boolean(process.env.XAI_API_KEY),
          model: "grok-4.5",
        }),
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { ok: false, error: "AI is not available in this environment" },
            { status: 503 },
          );
        }
        const body = (await request.json().catch(() => ({}))) as {
          question?: string;
          message?: string;
          context?: string;
        };
        const question = String(body.question || body.message || "").slice(0, 2000);
        if (!question) {
          return Response.json({ ok: false, error: "question required" }, { status: 400 });
        }
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 700,
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content:
                  question +
                  (body.context ? "\n\nContext:\n" + String(body.context).slice(0, 2500) : ""),
              },
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
        return Response.json({ ok: true, text, reply: text, response: text, model: "grok-4.5" });
      },
    },
  },
});
