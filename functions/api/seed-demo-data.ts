import { D1Database } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
}

const MODELS = [
  'stability-ai/sdxl',
  'stability-ai/stable-diffusion',
  'meta/llama-2-70b',
  'meta/llama-2-13b',
  'anthropic/claude-2',
  'openai/whisper',
  'midjourney/midjourney',
  'google/gemini-pro',
  'deepmind/alphafold',
  'runway/gen-2',
  'stability-ai/stable-diffusion-xl',
  'anthropic/claude-instant',
  'meta/segment-anything',
  'openai/dall-e-3',
  'mistral/mistral-7b'
]

function generateRandomData(modelName: string, daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  
  const baseRunCount = Math.floor(Math.random() * 10000) + 1000 // Base runs between 1000-11000
  const dailyVariation = Math.floor(Math.random() * 200) - 100 // Daily variation -100 to +100
  
  return {
    sitename: 'replicate.com',
    url: `https://replicate.com/${modelName}`,
    modelName,
    firstAppeared: date.toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    runCount: Math.max(0, baseRunCount + (dailyVariation * (30 - daysAgo))), // Ensure count doesn't go negative
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  }

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    // Clear existing data
    await context.env.DB.prepare(`DELETE FROM urls`).run()
    
    // Generate 30 days of data for each model
    const insertPromises = MODELS.flatMap(modelName => {
      return Array.from({ length: 30 }, (_, i) => {
        const data = generateRandomData(modelName, i)
        return context.env.DB.prepare(`
          INSERT INTO urls (sitename, url, modelName, firstAppeared, lastModified, runCount)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          data.sitename,
          data.url,
          data.modelName,
          data.firstAppeared,
          data.lastModified,
          data.runCount
        ).run()
      })
    })

    await Promise.all(insertPromises)

    // Get some stats to confirm the insertion
    const totalCount = await context.env.DB.prepare(`SELECT COUNT(*) as count FROM urls`).first()
    const totalRuns = await context.env.DB.prepare(`SELECT SUM(runCount) as total FROM urls`).first()
    const modelCount = await context.env.DB.prepare(`SELECT COUNT(DISTINCT modelName) as count FROM urls`).first()

    return new Response(JSON.stringify({
      message: "Demo data seeded successfully",
      stats: {
        totalRecords: totalCount.count,
        totalRuns: totalRuns.total,
        uniqueModels: modelCount.count
      }
    }), { headers: corsHeaders })

  } catch (error) {
    console.error('Seeding Error:', error)
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }), { 
      status: 500,
      headers: corsHeaders
    })
  }
}