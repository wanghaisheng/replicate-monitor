import { handleSitemapProcessing } from '../scripts/processSitemap';

export interface Env {
  DB: D1Database;
  SITEMAP_URL: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await handleSitemapProcessing(env.DB, env);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // This is just a simple endpoint to manually trigger the processing
    if (request.method === 'POST' && new URL(request.url).pathname === '/process-sitemap') {
      await handleSitemapProcessing(env.DB, env);
      return new Response('Sitemap processing completed', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }
};

