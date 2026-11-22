# ChatFXP Cloudflare deployment

## Current architecture

- GitHub repository: `ainotchatbot-cmd/ChatFxp-22_11_2026`
- Production Worker: `chatfxp-com`
- Production hostnames: `chatfxp.com` and `www.chatfxp.com` (the Worker redirects www to apex)
- Frontend build: Vite `npm run build` → `dist`
- Worker entry point: `src/worker.ts`
- Database: Cloudflare D1 `chatfxp-production` (APAC)
- AI: Cloudflare Workers AI binding `AI`

The Worker serves static Vite assets and handles API routes in `src/worker-api.ts`. The Node/Express `server.ts` is for local development/legacy Node deployment and is not the production entry point.

## GitHub Actions deployment

Workflow: `.github/workflows/deploy-cloudflare.yml`

On pushes to `main`, it builds the app. If the following GitHub repository secrets exist, it also applies the idempotent D1 schema and deploys the Worker:

- `CF_API_TOKEN`: Cloudflare API token with Workers Scripts Write, D1 Write, and Workers Routes permissions for this account/zone.
- `CF_ACCOUNT_ID`: Cloudflare account ID.

You can also run the workflow manually from GitHub Actions.

## Production database

A new, isolated D1 database was provisioned for this repository: `chatfxp-production`. Its schema from `drizzle/d1_full_schema.sql` has been applied. Existing databases were intentionally not reused because their schemas belong to other projects.

The SQL file uses `CREATE TABLE/INDEX IF NOT EXISTS`, so the workflow can safely reapply it.

## Secrets and integrations still needed

Configure Worker secrets in Cloudflare (Worker → Settings → Variables and Secrets) before enabling the corresponding features:

- `SHADOW_HMAC_SECRET`: use a long random secret; do not leave the ephemeral fallback in production.
- `OAUTH_SESSION_SECRET`: long random secret for OAuth state/session signing.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: optional GitHub OAuth.
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`: optional Discord OAuth.
- `SUPER_ADMIN_EMAILS`: comma-separated verified administrator emails; do not rely on sample/demo users.
- AI provider credentials: only add the credentials for providers you actually enable.

Firebase's client config is public by design; still configure the authorized domain list in Firebase Authentication to include `chatfxp.com` and `www.chatfxp.com`.

## Storage limitation

R2 is not currently activated on this Cloudflare account, so the Worker is deployed without an R2 binding. Media upload/storage features need R2 enabled and a bucket/binding added later. Do not store credentials in Git.

## Production checklist

- [ ] Add `CF_API_TOKEN` and `CF_ACCOUNT_ID` to GitHub repository secrets.
- [ ] Trigger the deployment workflow and verify the build and Worker deployment succeed.
- [ ] Confirm `https://chatfxp.com` and `https://www.chatfxp.com` load; www redirects to apex.
- [ ] Verify `GET /api/health`, portal bootstrap, sign-in, a database write/read, and WebSocket behavior.
- [ ] Configure OAuth and administrator secrets; test the auth callback.
- [ ] Enable R2 and test media upload/download.
- [ ] Review seeded demo data and admin-role setup before opening the site to public users.

Never commit production credentials, API keys, or service-account JSON files.
