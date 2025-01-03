import { D1Database } from '@cloudflare/workers-types';

interface UrlInfo {
  sitename: string;
  url: string;
  lastModified: string;
  firstAppeared: string;
  runCount: number;
  modelName: string;
}

export async function insertOrUpdateUrlInfo(db: D1Database, urlInfo: UrlInfo): Promise<void> {
  const { sitename, url, lastModified, firstAppeared, runCount, modelName } = urlInfo;

  const existingEntry = await db
    .prepare('SELECT * FROM url_info WHERE url = ?')
    .bind(url)
    .first();

  if (existingEntry) {
    await db
      .prepare('UPDATE url_info SET lastModified = ?, runCount = ? WHERE url = ?')
      .bind(lastModified, runCount, url)
      .run();
  } else {
    await db
      .prepare('INSERT INTO url_info (sitename, url, lastModified, firstAppeared, runCount, modelName) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(sitename, url, lastModified, firstAppeared, runCount, modelName)
      .run();
  }
}

