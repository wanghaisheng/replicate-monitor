export const onRequest: PagesFunction = async ({ next }) => {
  const response = await next()
  
  // Clone the response so we can modify headers
  const newResponse = new Response(response.body, response)
  
  // Add CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  // If it's an OPTIONS request, return just the headers
  if (newResponse.status === 204) {
    return newResponse
  }
  
  // Ensure JSON content type for API responses
  newResponse.headers.set('Content-Type', 'application/json')
  
  return newResponse
}