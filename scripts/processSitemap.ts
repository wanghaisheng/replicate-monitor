import { parseSitemap, SitemapEntry } from '../utils/sitemapParser'
import { insertOrUpdateUrlInfo } from '../utils/d1Database'
import { D1Database } from '@cloudflare/workers-types'

async function processSitemap(db: D1Database, sitemapUrl: string, domain: string): Promise<number> {
  const entries = await parseSitemap(sitemapUrl)
  const currentDate = new Date().toISOString().split('T')[0]

  let processedCount = 0

  for (const entry of entries) {
    try {
      const urlWithoutDomain = entry.loc.replace(`https://${domain}`, '')
      
      const urlInfo = {
        sitename: domain,
        url: entry.loc,
        lastModified: entry.lastmod || currentDate,
        firstAppeared: currentDate,
        runCount: 0,
        modelName: urlWithoutDomain
      }

      await insertOrUpdateUrlInfo(db, urlInfo)
      processedCount++
    } catch (error) {
      console.error(`Error processing entry ${entry.loc}:`, error)
    }
  }

  console.log(`Processed ${processedCount} out of ${entries.length} URLs from ${sitemapUrl}`)
  return processedCount
}

export async function handleSitemapProcessing(db: D1Database, env: { SITEMAP_URL: string }): Promise<number> {
  const sitemapUrl = env.SITEMAP_URL
  const domain = new URL(sitemapUrl).hostname

  return await processSitemap(db, sitemapUrl, domain)
}

