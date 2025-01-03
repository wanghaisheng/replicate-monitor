import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

export function SitemapProcessor() {
  const [sitemapUrl, setSitemapUrl] = useState('https://replicate.com/sitemap-models.xml')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch('https://your-worker-url.workers.dev/process-sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sitemapUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process sitemap')
      }

      console.log(`Processed ${result.processedUrls} URLs`)
    } catch (error) {
      console.error('Error processing sitemap:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="url"
          placeholder="Enter sitemap URL"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleProcess} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Process Sitemap'}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

