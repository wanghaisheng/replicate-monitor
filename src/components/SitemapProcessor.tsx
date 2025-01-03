import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'

interface ApiResponse {
  processedUrls?: number;
  error?: string;
  details?: string;
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

    // Get the current hostname and use it to construct the API URL
    const apiUrl = `${window.location.origin}/api/process-sitemap`
    console.log('Sending request to:', apiUrl) // Debug log

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Explicitly request JSON response
        },
        body: JSON.stringify({ sitemapUrl }),
      })

      console.log('Response status:', response.status) // Debug log
      
      const contentType = response.headers.get('content-type')
      console.log('Response content type:', contentType) // Debug log

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response:', errorText) // Debug log
        
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || errorJson.details || 'Failed to process sitemap')
        } catch (e) {
          // If the response isn't JSON, provide more context in the error
          throw new Error(`Server error (${response.status}): ${response.statusText}. 
            Check the browser console for more details.`)
        }
      }

      const data = await response.json() as ApiResponse
      setResult(`Successfully processed ${data.processedUrls} URLs`)
    } catch (error) {
      console.error('Error processing sitemap:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold">Sitemap Processor</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter a sitemap URL to process and store its URLs in the database.
        </p>
        <div className="flex space-x-2">
          <Input
            type="url"
          placeholder="Enter sitemap URL"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          className="flex-grow"
            disabled={isProcessing}
        />
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? 'Processing...' : 'Process Sitemap'}
          </Button>
    </div>
    </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
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
