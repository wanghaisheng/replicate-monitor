import { parseSitemap } from '../../utils/sitemapParser';
import { insertOrUpdateUrlInfo } from '../../utils/d1Database';

interface Env {
  DB: D1Database;
}

interface RequestBody {
  sitemapUrl: string;
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
    });
  }

  if (context.request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await context.request.json() as RequestBody;
  
    if (!body.sitemapUrl) {
      return new Response(JSON.stringify({ error: 'Missing sitemapUrl' }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const entries = await parseSitemap(body.sitemapUrl);
    const currentDate = new Date().toISOString().split('T')[0];
    const domain = new URL(body.sitemapUrl).hostname;

    let processedCount = 0;

    for (const entry of entries) {
      try {
        const urlWithoutDomain = entry.loc.replace(`https://${domain}`, '');
        
        await insertOrUpdateUrlInfo(context.env.DB, {
          sitename: domain,
          url: entry.loc,
          lastModified: entry.lastmod || currentDate,
          firstAppeared: currentDate,
          runCount: 0,
          modelName: urlWithoutDomain
        });
        processedCount++;
  } catch (error) {
        console.error(`Error processing entry ${entry.loc}:`, error);
    }
    }

    return new Response(JSON.stringify({ processedUrls: processedCount }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
  }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }), { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
}
    });
  }
};