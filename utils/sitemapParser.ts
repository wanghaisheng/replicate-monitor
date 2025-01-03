import { XMLParser } from 'fast-xml-parser';

interface SitemapEntry {
  loc: string;
  lastmod: string;
}

export async function parseSitemap(url: string): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    
    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);
    
    return jsonObj.urlset.url.map((item: any) => ({
      loc: item.loc,
      lastmod: item.lastmod || ''
    }));
  } catch (error) {
    console.error('Error parsing sitemap:', error);
    return [];
  }
}

