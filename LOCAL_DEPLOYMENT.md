# ChatFXP local PostgreSQL + full-stack server

This repo contains an Express API and a WebSocket server. Cloudflare Pages only hosts the static Vite build; it does not run this Node server or provide a PostgreSQL process. Use this Docker Compose stack to run the complete app together.

## Start locally

1. Install Docker Desktop.
2. Copy `.env.example` to `.env` if you need optional secrets.
3. Set a strong `POSTGRES_PASSWORD` in `.env` (never commit the file).
4. Run:

```sh
docker compose up --build -d
docker compose logs -f app
```

5. Open http://localhost:3000. The Express server serves the Vite build, routes `/api/*`, and handles WebSocket upgrades at `/ws` on the same origin.

The app container waits for PostgreSQL health, applies the Drizzle PostgreSQL schema with `drizzle-kit push`, then starts Express. Database files persist in the `chatfxp_pgdata` Docker volume.

## Useful commands

```sh
docker compose logs -f app
docker compose exec db psql -U chatfxp -d chatfxp
docker compose down
```

To remove the local database permanently (destructive):

```sh
docker compose down -v
```

## Required authentication setup

Firebase client config is in `firebase-applet-config.json`. Server-side Firebase Admin currently initializes using Application Default Credentials. For a self-hosted server, provide a Firebase service-account JSON as a secret file and set `GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-service-account.json`. Do not put the service-account JSON in Git. Add a Docker secret or mount the file read-only.

Set `SUPER_ADMIN_EMAILS` to the exact administrator email(s). Keep any AI API keys in environment secrets.

## Production note

This is a runnable local/self-hosted stack, not a Cloudflare Pages backend deployment. To make the public domain use this stack, deploy the Docker app to a reachable Node host with persistent disk/networking, then point the domain to that host. Keep the Pages deployment as a static preview until the Node host is live. WebSockets require the host/proxy to support HTTP Upgrade. A local database on a personal PC is not publicly reachable unless you deliberately expose it through a secure tunnel/VPN; do not expose PostgreSQL port 5432 publicly.
