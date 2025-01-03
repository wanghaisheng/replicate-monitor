import * as cheerio from 'cheerio';

export interface ModelData {
  url: string;
  name: string;
  callCount: number;
}

export async function processModelUrl(url: string): Promise<ModelData | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const name = $('h1').first().text().trim();
    const callCountText = $('.text-gray-500:contains("runs")').first().text();
    const callCount = parseInt(callCountText.replace(/\D/g, ''), 10) || 0;
    
    return { url, name, callCount };
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    return null;
  }
}
