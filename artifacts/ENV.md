# HeyMia Worker — Environment Keys

Set these in **Cloudflare Dashboard → Workers → heymia → Settings → Variables**.

## Secrets (Encrypt)

| Variable | Required | Purpose |
|----------|----------|---------|
| `LIVEAVATAR_API_KEY` | Recommended | LiveAvatar sessions + lip-sync |
| `STRIPE_SECRET_KEY` | For paid Fan Studio | Stripe Checkout |
| `ELEVENLABS_API_KEY` | For voice replies | TTS for Mia / Jess |
| `GEMINI_API_KEY` | Recommended | Server-side chat quality |

## Plain variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PUBLIC_DOMAIN` | Yes | `https://heymia.lensflow.au` |
| `STRIPE_PRICE_5MIN_PASS` | For Jess 5-min | Stripe Price ID |
| `AVATAR_EMBED_URL_JESS` | Fallback | Static LiveAvatar embed for Jess |
| `AVATAR_EMBED_URL_MIA` | Fallback | Static LiveAvatar embed for Mia |
| `AVATAR_EMBED_URL` | Optional | Shared embed fallback |
| `JESS_AVATAR_ID` | With API key | LiveAvatar avatar UUID (Jess) |
| `MIA_AVATAR_ID` | With API key | LiveAvatar avatar UUID (Mia) |

## Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `VAULT` | R2 bucket | File vault + published websites + sessions/rooms/CRM records |
| `AI` | Workers AI | Llama chat when Gemini is not used |

## Verify after deploy

```bash
curl https://YOUR-WORKER.workers.dev/api/status
curl https://heymia.lensflow.au/api/status
```

Expect `vault: "bound"`.

## Client-only keys (browser Settings)

These stay in localStorage — do **not** put them in Worker secrets:

- Gemini key (optional client path)
- Worker base URL override
- GitHub PAT (repo list)

## File vault

Upload and open: `.js` `.mjs` `.ts` `.tsx` `.py` `.go` `.rs` `.java` `.rb` `.php` `.sh` `.sql` `.json` `.yaml` `.md` `.html` `.css` `.env` media, PDF, and more. Code opens in a monospace preview with Copy + Download.

## Website deploy

Published sites live in R2 under `sites/<slug>/` and are served at `/s/<slug>/`.
No extra Cloudflare Pages project is required.
