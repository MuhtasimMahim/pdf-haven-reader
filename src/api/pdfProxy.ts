export const fetchPDFThroughProxy = async (url: string): Promise<Uint8Array> => {
  try {
    // Use a more reliable CORS proxy service
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Verify we got binary data
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf') && !contentType?.includes('application/octet-stream')) {
      console.warn('Warning: Response may not be a PDF. Content-Type:', contentType);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty response from proxy');
    }
    
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    // Enhance error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching PDF';
    console.error('PDF Proxy Error:', {
      message: errorMessage,
      url,
      error
    });
    throw new Error(`Failed to fetch PDF: ${errorMessage}`);
  }
};