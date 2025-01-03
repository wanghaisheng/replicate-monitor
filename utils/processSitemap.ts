import { parseSitemap } from './sitemapParser';

export async function handleSitemapProcessing(db: D1Database, env: { SITEMAP_URL: string }): Promise<number> {
  const sitemapUrl = env.SITEMAP_URL;
  const domain = new URL(sitemapUrl).hostname;
  const entries = await parseSitemap(sitemapUrl);
  const currentDate = new Date().toISOString().split('T')[0];

  let processedCount = 0;

  for (const entry of entries) {
    try {
      const urlWithoutDomain = entry.loc.replace(`https://${domain}`, '');
      
      await db
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

  return processedCount;
}