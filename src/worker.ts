import {
  dispatchWorkerApi,
  jsonNoStore,
  withSecurityHeaders,
} from './worker-api.ts';
import type { CfExecutionContext, WorkerEnv } from './worker-api.ts';

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: CfExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const siteOrigin = (env.SITE_ORIGIN || 'https://chatfxp.com').replace(/\/+$/, '');

    // Canonicalize www.chatfxp.com -> chatfxp.com
    if (url.hostname === 'www.chatfxp.com') {
      return Response.redirect(`${siteOrigin}${url.pathname}${url.search}`, 301);
    }

    // SEO endpoints scoped to chatfxp.com
    if (url.pathname === '/robots.txt') {
      return new Response(`User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteOrigin}/</loc><priority>1.0</priority></url>
  <url><loc>${siteOrigin}/?section=forums</loc><priority>0.9</priority></url>
  <url><loc>${siteOrigin}/?section=fanbase</loc><priority>0.9</priority></url>
  <url><loc>${siteOrigin}/?section=marketplace</loc><priority>0.9</priority></url>
  <url><loc>${siteOrigin}/midnight-lounge.html</loc><priority>0.8</priority></url>
</urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
      );
    }

    // Native Cloudflare Workers APIs (Cloudflare D1 `env.DB`, R2 `env.MEDIA_BUCKET`, Workers AI `env.AI`)
    const apiResponse = await dispatchWorkerApi(request, url, env, ctx);
    if (apiResponse) {
      return apiResponse;
    }

    // Graceful edge response when /api/* is called without Cloudflare D1 bound yet
    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') {
      if (url.pathname === '/api/portal/bootstrap') {
        return jsonNoStore({
          viewer: null,
          categories: [],
          forums: [],
          threads: [],
          marketplaceListings: [],
          announcements: [],
          members: [],
          newsItems: [],
          fanBases: [],
          events: [],
          quests: [],
          settings: {
            origin_status: env.DB ? 'cloudflare-d1-native' : 'd1-binding-pending',
          },
        });
      }

      return jsonNoStore(
        {
          error:
            'Cloudflare D1 binding "DB" is not attached yet. Create the D1 database (`wrangler d1 create chatfxp-db`), set its database_id in wrangler.jsonc, and deploy.',
        },
        503
      );
    }

    // Serve Vite build & static public assets (with SPA fallback)
    const assetResponse = await env.ASSETS.fetch(request);
    return withSecurityHeaders(assetResponse);
  },
};
