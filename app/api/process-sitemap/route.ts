import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { sitemapUrl } = await request.json()

    if (!sitemapUrl) {
      return NextResponse.json({ error: 'Missing sitemapUrl' }, { status: 400 })
    }

    const workerResponse = await fetch('https://your-worker-url.workers.dev/process-sitemap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sitemapUrl }),
    })

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text()
      console.error('Worker response not OK:', workerResponse.status, errorText)
      throw new Error(`Worker failed to process sitemap: ${errorText}`)
    }

    const result = await workerResponse.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing sitemap:', error)
    return NextResponse.json({ error: 'Failed to process sitemap', details: error.message }, { status: 500 })
  }
}

