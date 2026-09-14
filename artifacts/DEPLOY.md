# Deploy HeyMia to Cloudflare

`heymia-worker.js` is in the repo root. No base64 rebuild is required.

## 1. Cloudflare Workers

1. [Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Import a repository**
2. Select **jmorganegypt-source/heymia**
3. Deploy command: `npx wrangler deploy`
4. Or from this folder:

```bash
npm i
npx wrangler login
npx wrangler deploy
```

## 2. Bindings

- R2 bucket binding name: **VAULT** → bucket `heymia-vault` (create the bucket first)
- AI binding: **AI**

## 3. Secrets

See `ENV.md`. Minimum for a green status check is the R2 binding. Chat, voice, avatars, and Stripe light up as each secret is added.

## 4. Custom domain

Attach `heymia.lensflow.au` to the Worker. `PUBLIC_DOMAIN` is already set in `wrangler.toml`.

## 5. Verify

```bash
curl https://heymia.lensflow.au/api/status
```

Expect `"vault": "bound"`.

Then publish a site from `/` → **Deploy websites**, and open `/s/<slug>/`.
