import { parseSitemap } from '../../utils/sitemapParser';

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
    const { sitemapUrl } = await context.request.json<RequestBody>();
  
    if (!sitemapUrl) {
      return new Response(JSON.stringify({ error: 'Missing sitemapUrl' }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const entries = await parseSitemap(sitemapUrl);
    const currentDate = new Date().toISOString().split('T')[0];
    const domain = new URL(sitemapUrl).hostname;

    let processedCount = 0;

    for (const entry of entries) {
      try {
        const urlWithoutDomain = entry.loc.replace(`https://${domain}`, '');
        
        await context.env.DB
          .prepare(
            `INSERT INTO replicate_url_info (sitename, url, lastModified, firstAppeared, runCount, modelName) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(url) DO UPDATE SET lastModified = ?, runCount = runCount + 1`
          )
          .bind(
            domain,
            entry.loc,
            entry.lastmod || currentDate,
            currentDate,
            0,
            urlWithoutDomain,
            entry.lastmod || currentDate
          )
          .run();

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
    console.error('Error processing sitemap:', errorMessage);
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