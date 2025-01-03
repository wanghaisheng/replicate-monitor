import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

interface ApiResponse {
  processedUrls?: number;
  error?: string;
}

export function SitemapProcessor() {
  const [sitemapUrl, setSitemapUrl] = useState('https://replicate.com/sitemap-models.xml')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleProcess = async () => {
    setIsProcessing(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/process-sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sitemapUrl }),
      })

      const data = await response.json() as ApiResponse

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process sitemap')
      }

      setResult(`Processed ${data.processedUrls} URLs`)
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
      {result && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
