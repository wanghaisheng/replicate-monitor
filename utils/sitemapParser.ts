export interface SitemapEntry {
  loc: string;
  lastmod: string;
}

export async function parseSitemap(url: string): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    
    const entries: SitemapEntry[] = [];
    const urlRegex = /<url>\s*<loc>(.*?)<\/loc>\s*(?:<lastmod>(.*?)<\/lastmod>)?\s*<\/url>/g;
    let match;

    while ((match = urlRegex.exec(xmlData)) !== null) {
      entries.push({
        loc: match[1],
        lastmod: match[2] || ''
      });
    }

    return entries;
  } catch (error) {
    console.error('Error parsing sitemap:', error);
    return [];
  }
}

