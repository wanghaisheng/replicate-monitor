import { D1Database } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { searchParams } = new URL(context.request.url)
    const timeframe = searchParams.get('timeframe') || 'daily'

    // Get new models in last 24 hours
    const newModelsResult = await context.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM urls 
      WHERE firstAppeared >= datetime('now', '-1 day')
    `).first()

    // Get total run count
    const totalRunsResult = await context.env.DB.prepare(`
      SELECT SUM(runCount) as total 
      FROM urls
    `).first()

    // Get top models by run count
    const topModels = await context.env.DB.prepare(`
      SELECT modelName, runCount,
        (runCount - LAG(runCount) OVER (ORDER BY runCount DESC)) * 100.0 / 
        NULLIF(LAG(runCount) OVER (ORDER BY runCount DESC), 0) as changePercent
      FROM urls
      ORDER BY runCount DESC
      LIMIT 10
    `).all()

    // Get trending models by recent increase
    const trendingModels = await context.env.DB.prepare(`
      SELECT modelName, runCount,
        (runCount - LAG(runCount) OVER (ORDER BY firstAppeared DESC)) * 100.0 / 
        NULLIF(LAG(runCount) OVER (ORDER BY firstAppeared DESC), 0) as changePercent
      FROM urls
      WHERE firstAppeared >= datetime('now', '-7 days')
      ORDER BY changePercent DESC
      LIMIT 10
    `).all()

    // Get time-based stats
    const timeQuery = timeframe === 'monthly' 
      ? "strftime('%Y-%m', firstAppeared) as date"
      : timeframe === 'weekly'
      ? "strftime('%Y-%W', firstAppeared) as date"
      : "date(firstAppeared) as date"

    const statsQuery = `
      SELECT ${timeQuery}, COUNT(*) as count
      FROM urls
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `

    const stats = await context.env.DB.prepare(statsQuery).all()

    return new Response(JSON.stringify({
      newModels: newModelsResult.count,
      totalRunCount: totalRunsResult.total,
      topModels: topModels.results,
      trendingModels: trendingModels.results,
      [`${timeframe}Stats`]: stats.results,
    }), { headers: corsHeaders })

  } catch (error) {
    console.error('Analytics API Error:', error)
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }), { 
      status: 500,
      headers: corsHeaders
    })
  }
}