export const onRequest: PagesFunction = async ({ next }) => {
  try {
  const response = await next()
  
  // Clone the response so we can modify headers
  const newResponse = new Response(response.body, response)
  
  // Add CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
    // Handle OPTIONS requests
    if (newResponse.status === 204 || newResponse.status === 200) {
    return newResponse
  }
  
  // Ensure JSON content type for API responses
    if (!newResponse.headers.get('content-type')) {
  newResponse.headers.set('Content-Type', 'application/json')
}
    
    return newResponse
  } catch (error) {
    // Handle any errors that occur during processing
    const errorResponse = {
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error occurred",
      status: 500
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}