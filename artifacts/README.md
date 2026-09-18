# HeyMia · Lensflow Cloudflare Worker

Production worker for **heymia.lensflow.au**

Version **2.0.0** — File Vault, sessions, fantasy rooms, CRM, chat, deploy health, and **static website publishing**.

## What it does

| Area | Route | Behaviour |
|------|--------|-----------|
| App UI | `/` | Studio: overview, sites, vault, rooms, sessions, talk, CRM, status |
| Health | `/api/status` | Returns `vault: "bound"` when R2 is connected |
| Vault | `/api/vault` | List / upload / preview / delete files in R2 |
| Websites | `/api/sites` | Create, list, update, delete published sites |
| Live sites | `/s/:slug/` | Public static hosting from the vault |
| Sessions | `/api/sessions` | Saved Mia / Jess session notes |
| Rooms | `/api/rooms` | Fantasy rooms with theme + prompt |
| Chat | `/api/chat` | Gemini, then Workers AI, then a safe fallback |
| CRM | `/api/crm` | Lightweight contacts |
| Voice | `/api/tts` | ElevenLabs when the secret is set |
| Checkout | `/api/checkout` | Stripe 5-minute pass when configured |

## Files

| File | Purpose |
|------|---------|
| `heymia-worker.js` | The Worker (routes + UI) |
| `wrangler.toml` | R2 `VAULT` + Workers AI + domain |
| `ENV.md` | Secrets and env vars |
| `DEPLOY.md` | Cloudflare import steps |
| `public/` | Optional static stubs |

## Deploy

```bash
npm i
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put LIVEAVATAR_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler deploy
```

Create the R2 bucket `heymia-vault` if it does not exist, and keep the `VAULT` binding in `wrangler.toml`.

## Verify

```bash
curl https://heymia.lensflow.au/api/status
```

Expect `"vault": "bound"` and a success message.

## Publish a website

From the **Deploy websites** tab, or:

```bash
curl -X POST https://heymia.lensflow.au/api/sites \
  -H 'content-type: application/json' \
  -d '{"name":"Studio","slug":"studio","tagline":"Live on the edge"}'
```

The site is then public at `https://heymia.lensflow.au/s/studio/`.
