import { D1Database } from '@cloudflare/workers-types'

interface UrlInfo {
  sitename: string
  url: string
  lastModified: string
  firstAppeared: string
  runCount: number
  modelName: string
}

export async function insertOrUpdateUrlInfo(db: D1Database, urlInfo: UrlInfo): Promise<void> {
  const { sitename, url, lastModified, firstAppeared, runCount, modelName } = urlInfo

  const existingEntry = await db
    .prepare('SELECT * FROM replicate_url_info WHERE url = ?')
    .bind(url)
    .first()

  if (existingEntry) {
    await db
      .prepare('UPDATE replicate_url_info SET lastModified = ?, runCount = runCount + 1 WHERE url = ?')
      .bind(lastModified, url)
      .run()
  } else {
    await db
      .prepare('INSERT INTO replicate_url_info (sitename, url, lastModified, firstAppeared, runCount, modelName) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(sitename, url, lastModified, firstAppeared, runCount, modelName)
      .run()
  }
}

