import { handleSitemapProcessing } from './processSitemap'

export interface Env {
  DB: D1Database
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    }

    if (request.method === 'POST' && new URL(request.url).pathname === '/process-sitemap') {
      try {
        const { sitemapUrl } = await request.json()
      
        if (!sitemapUrl) {
          return new Response(JSON.stringify({ error: 'Missing sitemapUrl' }), { 
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            }
          })
        }

        const processedUrls = await handleSitemapProcessing(env.DB, { SITEMAP_URL: sitemapUrl })
        return new Response(JSON.stringify({ processedUrls }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        })
      } catch (error) {
        console.error('Error processing sitemap:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        })
      }
    }

    return new Response('Not found', { 
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    })
  }
}

