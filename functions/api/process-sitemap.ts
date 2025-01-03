import { parseSitemap } from '../../utils/sitemapParser';
import { insertOrUpdateUrlInfo } from '../../utils/d1Database';

interface Env {
  DB: D1Database;
}

interface RequestBody {
  sitemapUrl: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json",
};

  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (context.request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { 
          status: 405,
          headers: corsHeaders
        }
      );
    }

    const body = await context.request.json() as RequestBody;
    
    if (!body?.sitemapUrl) {
    return new Response(
        JSON.stringify({ error: "Missing sitemapUrl parameter" }),
      { 
          status: 400,
        headers: corsHeaders
      }
    );
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

    return new Response(
      JSON.stringify({ processedUrls: processedCount }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
};