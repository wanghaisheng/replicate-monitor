import { parseSitemap } from '../utils/sitemapParser';
import { insertOrUpdateUrlInfo } from '../utils/d1Database';
import { D1Database } from '@cloudflare/workers-types';

async function processSitemap(db: D1Database, sitemapUrl: string, domain: string) {
  const entries = await parseSitemap(sitemapUrl);
  const currentDate = new Date().toISOString().split('T')[0];

  for (const entry of entries) {
    const urlWithoutDomain = entry.loc.replace(`https://${domain}`, '');
    
    const urlInfo = {
      sitename: domain,
      url: entry.loc,
      lastModified: entry.lastmod || currentDate,
      firstAppeared: currentDate, // This will be overwritten if the entry already exists
      runCount: 0, // This will be updated if the entry already exists
      modelName: urlWithoutDomain
    };

    await insertOrUpdateUrlInfo(db, urlInfo);
  }

  console.log(`Processed ${entries.length} URLs from ${sitemapUrl}`);
}

// This function would be called from your Cloudflare Worker
export async function handleSitemapProcessing(db: D1Database, env: any) {
  const sitemapUrl = env.SITEMAP_URL || 'https://replicate.com/sitemap-models.xml';
  const domain = new URL(sitemapUrl).hostname;

  await processSitemap(db, sitemapUrl, domain);
}

