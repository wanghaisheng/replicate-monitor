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

    const currentDate = new Date().toISOString().split('T')[0];
    const domain = new URL(body.sitemapUrl).hostname;
    let processedCount = 0;

      try {
      const response = await fetch(body.sitemapUrl);
      const xmlData = await response.text();
      const urlRegex = /<url>\s*<loc>(.*?)<\/loc>\s*(?:<lastmod>(.*?)<\/lastmod>)?\s*<\/url>/g;
      let match;

      while ((match = urlRegex.exec(xmlData)) !== null) {
        const loc = match[1];
        const lastmod = match[2] || currentDate;
        const urlWithoutDomain = loc.replace(`https://${domain}`, '');
        
        await context.env.DB
          .prepare(
            `INSERT INTO replicate_url_info (sitename, url, lastModified, firstAppeared, runCount, modelName) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(url) DO UPDATE SET lastModified = ?, runCount = runCount + 1`
          )
          .bind(
            domain,
            loc,
            lastmod,
            currentDate,
            0,
            urlWithoutDomain,
            lastmod
          )
          .run();

        processedCount++;
      }
  } catch (error) {
      console.error('Error processing sitemap:', error);
      throw error;
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