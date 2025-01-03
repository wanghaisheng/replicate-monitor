interface Env {
  DB: D1Database
}

import { handleSitemapProcessing } from '../utils/processSitemap'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Handle CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  if (new URL(context.request.url).pathname === '/process-sitemap') {
    try {
      const { sitemapUrl } = await context.request.json()
    
      if (!sitemapUrl) {
        return new Response(JSON.stringify({ error: 'Missing sitemapUrl' }), { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        })
      }

      const processedUrls = await handleSitemapProcessing(context.env.DB, { SITEMAP_URL: sitemapUrl })
      return new Response(JSON.stringify({ processedUrls }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      })
    } catch (error) {
      console.error('Error processing sitemap:', error)
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
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