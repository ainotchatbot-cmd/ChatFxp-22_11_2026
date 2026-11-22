# ChatFXP Cloudflare deployment

## Frontend hosting

- Cloudflare Pages project: `chatfxp-portal`
- GitHub source: `ainotchatbot-cmd/ChatFxp-22_11_2026`
- Production branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Production domains: `https://chatfxp.com` and `https://www.chatfxp.com` (www redirects to the apex domain)

Pushing to `main` triggers a production Pages build and deployment.

## Important: backend is not deployed by Pages

This repository also contains a Node/Express API, a PostgreSQL/Drizzle data layer, Firebase Admin authentication, and a WebSocket server. The current Pages project is configured as a static Vite deployment and has no Pages Functions/Worker runtime (`uses_functions: false`). The Pages build does **not** run `server.ts`, PostgreSQL, or the `/ws` WebSocket endpoint. The configured D1 binding does not automatically translate the PostgreSQL/Drizzle code to D1.

Consequently, the public frontend can load from Pages, but database-backed features, API requests under `/api/*`, and real-time features will not work until the backend is separately deployed and the frontend's same-origin API/WebSocket paths are routed to it.

## Backend requirements before declaring the full app production-ready

1. Deploy the existing Node server to a Node-compatible host (or port the API deliberately to Cloudflare Workers/Pages Functions and D1). A static Pages deployment alone is insufficient.
2. Provide a managed PostgreSQL database reachable from that backend, or complete and test a migration of the schema and repository layer to D1.
3. Configure secrets outside Git: `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`, Firebase Admin service-account credentials, and any required AI/API credentials.
4. Set Firebase authorized domains to `chatfxp.com` and `www.chatfxp.com`.
5. Route `/api/*` and `/ws` from the public domain to the backend; preserve WebSocket upgrades.
6. Verify `GET /api/health`, sign-in, bootstrap, write operations, and WebSocket authentication before calling the full application live.

Never commit production credentials or service-account JSON files.
