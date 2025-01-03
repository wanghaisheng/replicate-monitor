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
        { status: 405, headers: corsHeaders }
      );
    }

    const body = await context.request.json() as RequestBody;
    
    if (!body?.sitemapUrl) {
    return new Response(
        JSON.stringify({ error: "Missing sitemapUrl parameter" }),
        { status: 400, headers: corsHeaders }
      );
  }

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), 25000); // 25-second timeout
    });

    // Fetch and parse sitemap with timeout
    const entries = await Promise.race([
      parseSitemap(body.sitemapUrl),
      timeoutPromise
    ]) as Array<{ loc: string; lastmod?: string }>;

    // Limit the number of entries to process
    const MAX_ENTRIES = 100; // Adjust this number based on your needs
    const entriesToProcess = entries.slice(0, MAX_ENTRIES);
    
    const currentDate = new Date().toISOString().split('T')[0];
    const domain = new URL(body.sitemapUrl).hostname;
    let processedCount = 0;

    // Process entries in smaller batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < entriesToProcess.length; i += BATCH_SIZE) {
      const batch = entriesToProcess.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (entry) => {
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
      }));
      }

    return new Response(
      JSON.stringify({ 
        processedUrls: processedCount,
        totalUrls: entries.length,
        message: processedCount < entries.length ? 
          `Processed first ${processedCount} URLs out of ${entries.length} total URLs` :
          `Processed all ${processedCount} URLs`
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const isTimeout = errorMessage.includes('timed out');
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Operation timed out" : "Internal Server Error",
        details: errorMessage,
        suggestion: isTimeout ? 
          "The sitemap processing took too long. Try processing a smaller sitemap or fewer URLs." :
          "Please try again with fewer URLs or contact support if the problem persists."
      }),
      { 
        status: isTimeout ? 408 : 500,
        headers: corsHeaders
  }
    );
  }
};