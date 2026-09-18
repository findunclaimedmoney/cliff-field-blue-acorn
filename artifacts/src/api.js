import { appPage } from "./ui.js";

const VERSION = "2.0.0";
const TEXT_EXT = new Set(["js","mjs","ts","tsx","py","go","rs","json","yaml","yml","md","html","css","env","txt","svg","sql","sh"]);
const MIME = {
  html:"text/html; charset=utf-8", css:"text/css; charset=utf-8",
  js:"text/javascript; charset=utf-8", json:"application/json; charset=utf-8",
  svg:"image/svg+xml", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg",
  webp:"image/webp", pdf:"application/pdf", txt:"text/plain; charset=utf-8",
  md:"text/markdown; charset=utf-8", mp3:"audio/mpeg", mp4:"video/mp4"
};

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (path === "/api/status" || path === "/health") return json(await statusPayload(env));
    if (path.startsWith("/api/vault")) return handleVault(request, env, path);
    if (path.startsWith("/api/sites")) return handleSites(request, env, path);
    if (path.startsWith("/api/sessions")) return handleJsonCol(request, env, "sessions", path, body => ({
      id: id("ses"), persona: body.persona || "mia", title: body.title || "New session", notes: body.notes || "", created: nowIso()
    }));
    if (path.startsWith("/api/rooms")) return handleJsonCol(request, env, "rooms", path, body => ({
      id: id("room"), name: body.name || "Fantasy room", theme: body.theme || "velvet-night", prompt: body.prompt || "", created: nowIso()
    }));
    if (path.startsWith("/api/crm")) return handleJsonCol(request, env, "crm", path, body => ({
      id: id("crm"), name: body.name || "Untitled", email: body.email || "", note: body.note || "", created: nowIso()
    }));
    if (path.startsWith("/api/chat")) return handleChat(request, env);
    if (path.startsWith("/api/tts")) return handleTts(request, env);
    if (path.startsWith("/api/checkout")) return handleCheckout(request, env);
    if (path.startsWith("/s/")) return handlePublishedSite(request, env, path);
    return html(appPage(env));
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Filename, X-Site, X-Path");
  return new Response(res.body, { status: res.status, headers: h });
}
function json(obj, status = 200) {
  return cors(new Response(JSON.stringify(obj, null, 2), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  }));
}
function html(body, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
function extOf(name) { const i = String(name || "").lastIndexOf("."); return i >= 0 ? name.slice(i + 1).toLowerCase() : ""; }
function mimeOf(name) { return MIME[extOf(name)] || "application/octet-stream"; }
function slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "site"; }
function vaultBound(env) { return !!(env && env.VAULT && typeof env.VAULT.put === "function"); }
function nowIso() { return new Date().toISOString(); }
function id(prefix) { return prefix + "-" + crypto.randomUUID().slice(0, 8); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }

async function statusPayload(env) {
  let vault = "missing";
  let vaultProbe = null;
  if (vaultBound(env)) {
    vault = "bound";
    try { const listed = await env.VAULT.list({ prefix: "", limit: 1 }); vaultProbe = { ok: true, truncated: !!listed.truncated }; }
    catch (e) { vault = "error"; vaultProbe = { ok: false, error: String(e.message || e) }; }
  }
  return {
    ok: vault === "bound", service: "heymia", version: VERSION, vault, vaultProbe,
    ai: env.AI ? "bound" : "missing",
    gemini: env.GEMINI_API_KEY ? "set" : "unset",
    elevenlabs: env.ELEVENLABS_API_KEY ? "set" : "unset",
    liveavatar: env.LIVEAVATAR_API_KEY ? "set" : "unset",
    stripe: env.STRIPE_SECRET_KEY ? "set" : "unset",
    domain: env.PUBLIC_DOMAIN || null, time: nowIso(),
    message: vault === "bound"
      ? "HeyMia is operational. Vault bound. Sites, rooms, and files are ready."
      : "Worker is running but R2 binding VAULT is missing. Create bucket heymia-vault and bind it as VAULT."
  };
}

async function readJson(request) {
  const text = await request.text();
  if (!text || !text.trim()) throw new Error("Empty body");
  return JSON.parse(text);
}

async function handleVault(request, env, path) {
  if (!vaultBound(env)) return json({ ok: false, error: "VAULT is missing. Bind R2 bucket heymia-vault as VAULT." }, 503);
  if (path === "/api/vault" && request.method === "GET") {
    const listed = await env.VAULT.list({ prefix: "files/", limit: 1000 });
    const objects = (listed.objects || []).map(o => ({ key: o.key.replace(/^files\//, ""), size: o.size, uploaded: o.uploaded }));
    return json({ ok: true, objects, count: objects.length });
  }
  if (path === "/api/vault" && request.method === "POST") {
    const filename = request.headers.get("X-Filename") || "upload.bin";
    const body = await request.arrayBuffer();
    if (!body.byteLength) return json({ ok: false, error: "Upload body is empty." }, 400);
    const key = "files/" + filename.replace(/^\/+/, "").replace(/\.\./g, "");
    await env.VAULT.put(key, body, { httpMetadata: { contentType: mimeOf(filename) } });
    return json({ ok: true, key: filename, size: body.byteLength, message: "Uploaded " + filename + " (" + body.byteLength + " bytes)." });
  }
  const m = path.match(/^\/api\/vault\/(.+)$/);
  if (!m) return json({ ok: false, error: "Unknown vault route" }, 404);
  const fileKey = decodeURIComponent(m[1]);
  const key = "files/" + fileKey;
  if (request.method === "GET") {
    const obj = await env.VAULT.get(key);
    if (!obj) return json({ ok: false, error: "Not found: " + fileKey }, 404);
    const buf = await obj.arrayBuffer();
    if (TEXT_EXT.has(extOf(fileKey))) return json({ ok: true, name: fileKey, size: buf.byteLength, text: new TextDecoder().decode(buf), contentType: mimeOf(fileKey) });
    return cors(new Response(buf, { headers: { "content-type": mimeOf(fileKey), "content-disposition": "inline; filename=\"" + fileKey + "\"" } }));
  }
  if (request.method === "DELETE") { await env.VAULT.delete(key); return json({ ok: true, deleted: fileKey }); }
  return json({ ok: false, error: "Method not allowed" }, 405);
}

async function handleSites(request, env, path) {
  if (!vaultBound(env)) return json({ ok: false, error: "VAULT is missing. Cannot publish sites." }, 503);
  if (path === "/api/sites" && request.method === "GET") {
    const listed = await env.VAULT.list({ prefix: "sites/", limit: 1000 });
    const slugs = {};
    for (const o of listed.objects || []) {
      const slug = o.key.slice(6).split("/")[0];
      if (!slug) continue;
      slugs[slug] = slugs[slug] || { slug, files: 0, bytes: 0, updated: o.uploaded };
      slugs[slug].files += 1; slugs[slug].bytes += o.size || 0;
    }
    const items = Object.values(slugs).map(s => ({ ...s, url: (env.PUBLIC_DOMAIN || "") + "/s/" + s.slug + "/" }));
    return json({ ok: true, sites: items });
  }
  if (path === "/api/sites" && request.method === "POST") {
    const body = await readJson(request);
    const slug = slugify(body.slug || body.name);
    const files = Object.assign({}, body.files || {});
    if (body.html) files["index.html"] = body.html;
    if (!files["index.html"]) files["index.html"] = defaultSiteHtml(body.name || slug, body.tagline || "Published by HeyMia");
    const written = [];
    for (const [name, content] of Object.entries(files)) {
      const safe = name.replace(/^\/+/, "").replace(/\.\./g, "");
      await env.VAULT.put("sites/" + slug + "/" + safe, typeof content === "string" ? new TextEncoder().encode(content) : content, { httpMetadata: { contentType: mimeOf(safe) } });
      written.push(safe);
    }
    const url = (env.PUBLIC_DOMAIN || "") + "/s/" + slug + "/";
    return json({ ok: true, slug, url, files: written, message: "Site published at " + url });
  }
  const one = path.match(/^\/api\/sites\/([^/]+)$/);
  if (one && request.method === "DELETE") {
    const slug = slugify(one[1]);
    const listed = await env.VAULT.list({ prefix: "sites/" + slug + "/", limit: 1000 });
    for (const o of listed.objects || []) await env.VAULT.delete(o.key);
    return json({ ok: true, deleted: slug });
  }
  if (one && request.method === "GET") {
    const slug = slugify(one[1]);
    const listed = await env.VAULT.list({ prefix: "sites/" + slug + "/", limit: 1000 });
    return json({ ok: true, slug, url: (env.PUBLIC_DOMAIN || "") + "/s/" + slug + "/", files: (listed.objects || []).map(o => ({ path: o.key.slice(("sites/" + slug + "/").length), size: o.size })) });
  }
  return json({ ok: false, error: "Unknown sites route" }, 404);
}

async function handlePublishedSite(request, env, path) {
  if (!vaultBound(env)) return html("<h1>Vault not bound</h1>", 503);
  const parts = path.slice(3).split("/").filter(Boolean);
  if (!parts.length) return json({ ok: false, error: "Missing site slug" }, 400);
  const slug = slugify(parts[0]);
  let filePath = parts.slice(1).join("/") || "index.html";
  if (filePath.endsWith("/")) filePath += "index.html";
  let obj = await env.VAULT.get("sites/" + slug + "/" + filePath);
  if (!obj && !filePath.includes(".")) obj = await env.VAULT.get("sites/" + slug + "/" + filePath + "/index.html");
  if (!obj) return html("<!doctype html><meta charset=utf-8><title>404</title><body style='font-family:system-ui;background:#0b0b12;color:#eee;padding:48px'><h1>Not found</h1></body>", 404);
  return new Response(await obj.arrayBuffer(), { headers: { "content-type": mimeOf(filePath), "cache-control": "public, max-age=60" } });
}

function defaultSiteHtml(name, tagline) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(name)}</title>
<style>body{margin:0;font-family:system-ui;background:#07070c;color:#f4f1ea;min-height:100vh}.wrap{max-width:880px;margin:0 auto;padding:72px 24px}h1{font-size:64px;letter-spacing:-.04em}p{color:#9a96a8;font-size:20px}.badge{display:inline-block;border:1px solid #2a2a3a;padding:6px 10px;border-radius:999px;color:#e8c47a;letter-spacing:.12em;text-transform:uppercase;font-size:12px}</style>
</head><body><div class="wrap"><div class="badge">Published with HeyMia</div><h1>${escapeHtml(name)}</h1><p>${escapeHtml(tagline)}</p></div></body></html>`;
}

async function handleJsonCol(request, env, col, path, factory) {
  if (!vaultBound(env)) return json({ ok: false, error: "VAULT missing" }, 503);
  const keyName = col === "crm" ? "contacts" : col;
  if (request.method === "GET" && path === "/api/" + col) {
    const listed = await env.VAULT.list({ prefix: col + "/", limit: 500 });
    const items = [];
    for (const o of listed.objects || []) {
      const obj = await env.VAULT.get(o.key);
      if (!obj) continue;
      try { items.push(JSON.parse(await obj.text())); } catch {}
    }
    return json({ ok: true, [keyName]: items });
  }
  if (request.method === "POST" && path === "/api/" + col) {
    const rec = factory(await readJson(request));
    await env.VAULT.put(col + "/" + rec.id + ".json", JSON.stringify(rec), { httpMetadata: { contentType: "application/json" } });
    const singular = col === "sessions" ? "session" : col === "rooms" ? "room" : "contact";
    return json({ ok: true, [singular]: rec });
  }
  return json({ ok: false, error: "Unknown " + col + " route" }, 404);
}

async function handleChat(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const body = await readJson(request);
  const messages = body.messages || [{ role: "user", content: body.prompt || "" }];
  const persona = body.persona || "mia";
  const system = persona === "jess"
    ? "You are Jess on HeyMia. Be direct, witty, never a people-pleaser."
    : "You are Mia on HeyMia / Lensflow. Be clear, private, and useful. Never claim to be a therapist.";
  if (env.GEMINI_API_KEY) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content || "" }] }))
        })
      });
      const data = await r.json();
      const text = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      const joined = text.map(p => p.text || "").join("");
      if (joined) return json({ ok: true, text: joined, provider: "gemini" });
    } catch {}
  }
  if (env.AI) {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages: [{ role: "system", content: system }, ...messages] });
    return json({ ok: true, text: result.response || result.text || JSON.stringify(result), provider: "workers-ai" });
  }
  return json({ ok: true, text: "Chat backends are not configured yet. Set GEMINI_API_KEY or bind Workers AI.", provider: "fallback" });
}

async function handleTts(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!env.ELEVENLABS_API_KEY) return json({ ok: false, error: "ELEVENLABS_API_KEY unset" }, 501);
  const body = await readJson(request);
  const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + (body.voiceId || "21m00Tcm4TlvDq8ikWAM"), {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ text: body.text || "Hello from Mia.", model_id: "eleven_monolingual_v1" })
  });
  if (!r.ok) return json({ ok: false, error: "ElevenLabs " + r.status }, 502);
  return cors(new Response(await r.arrayBuffer(), { headers: { "content-type": "audio/mpeg" } }));
}

async function handleCheckout(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_5MIN_PASS) {
    return json({ ok: false, error: "Stripe is not configured." }, 501);
  }
  const domain = env.PUBLIC_DOMAIN || new URL(request.url).origin;
  const params = new URLSearchParams({
    mode: "payment", success_url: domain + "/?paid=1", cancel_url: domain + "/?paid=0",
    "line_items[0][price]": env.STRIPE_PRICE_5MIN_PASS, "line_items[0][quantity]": "1"
  });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, "content-type": "application/x-www-form-urlencoded" },
    body: params
  });
  const data = await r.json();
  if (!r.ok) return json({ ok: false, error: data.error && data.error.message || "Stripe error" }, 502);
  return json({ ok: true, url: data.url, id: data.id });
}
