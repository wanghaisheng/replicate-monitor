import { handleSitemapProcessing } from '../../utils/processSitemap'

interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
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

  if (context.request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

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