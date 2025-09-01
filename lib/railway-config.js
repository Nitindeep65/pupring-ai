/**
 * Railway Python Service Integration Configuration
 * This file handles the connection between Next.js frontend and Railway-deployed Python services
 */

// Railway Python Service Configuration
export const RAILWAY_CONFIG = {
  // Base URL for Railway Python service (from environment variables)
  baseUrl: process.env.PYTHON_SERVICE_URL || process.env.NEXT_PUBLIC_PYTHON_API_URL,
  
  // API endpoints on Railway Python service
  endpoints: {
    health: '/health',
    services: '/services',
    removeBackground: '/remove-background',
    vectorize: '/vectorize',
    professionalEngraving: '/professional-engraving'
  },
  
  // Request configuration
  timeout: 60000, // 60 seconds for AI processing
  retries: 3,
  retryDelay: 2000,
  
  // Headers for requests to Railway service
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
    'User-Agent': 'PupRing-Frontend/1.0'
  }
};

// Helper function to construct full Railway service URLs
export function getRailwayUrl(endpoint) {
  if (!RAILWAY_CONFIG.baseUrl) {
    console.warn('Railway Python service URL not configured. Please set PYTHON_SERVICE_URL or NEXT_PUBLIC_PYTHON_API_URL');
    return null;
  }
  
  const baseUrl = RAILWAY_CONFIG.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const endpointPath = RAILWAY_CONFIG.endpoints[endpoint] || endpoint;
  
  return `${baseUrl}${endpointPath}`;
}

// Health check function for Railway service
export async function checkRailwayHealth() {
  try {
    const healthUrl = getRailwayUrl('health');
    if (!healthUrl) return { healthy: false, error: 'Service URL not configured' };
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout for health check
    });
    
    if (!response.ok) {
      return { 
        healthy: false, 
        error: `HTTP ${response.status}: ${response.statusText}`,
        url: healthUrl
      };
    }
    
    const data = await response.json();
    return { 
      healthy: true, 
      data,
      url: healthUrl,
      responseTime: response.headers.get('x-response-time') || 'unknown'
    };
    
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message,
      url: getRailwayUrl('health')
    };
  }
}

// Make request to Railway Python service with retry logic
export async function requestRailwayService(endpoint, options = {}) {
  const url = getRailwayUrl(endpoint);
  if (!url) {
    throw new Error('Railway Python service URL not configured');
  }
  
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = RAILWAY_CONFIG.timeout,
    retries = RAILWAY_CONFIG.retries,
    retryDelay = RAILWAY_CONFIG.retryDelay
  } = options;
  
  // Merge headers
  const requestHeaders = {
    ...RAILWAY_CONFIG.headers,
    ...headers
  };
  
  // Remove Content-Type if body is FormData (let browser set it)
  if (body instanceof FormData) {
    delete requestHeaders['Content-Type'];
  }
  
  let lastError;
  
  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Railway API request (attempt ${attempt + 1}/${retries + 1}):`, {
        url,
        method,
        hasBody: !!body
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway API Error ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      
      console.log('Railway API response:', {
        status: response.status,
        success: responseData.success !== false
      });
      
      return responseData;
      
    } catch (error) {
      lastError = error;
      
      console.error(`Railway API request failed (attempt ${attempt + 1}):`, {
        error: error.message,
        url
      });
      
      // Don't retry on certain errors
      if (error.name === 'AbortError' || attempt >= retries) {
        break;
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError || new Error('Railway service request failed after retries');
}

// Specific functions for each Railway service endpoint

export async function removeBackgroundViaRailway(imageFile, options = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  if (options.petName) {
    formData.append('pet_name', options.petName);
  }
  
  return await requestRailwayService('removeBackground', {
    method: 'POST',
    body: formData,
    timeout: 90000 // 90 seconds for background removal
  });
}

export async function createProfessionalEngravingViaRailway(imageFile, options = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  if (options.petName) {
    formData.append('pet_name', options.petName);
  }
  
  if (options.style) {
    formData.append('style', options.style);
  }
  
  return await requestRailwayService('professionalEngraving', {
    method: 'POST',
    body: formData,
    timeout: 120000 // 2 minutes for engraving processing
  });
}

export async function vectorizeImageViaRailway(imageFile, options = {}) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  if (options.format) {
    formData.append('format', options.format);
  }
  
  return await requestRailwayService('vectorize', {
    method: 'POST',
    body: formData,
    timeout: 60000 // 60 seconds for vectorization
  });
}

// Utility function to validate Railway service configuration
export function validateRailwayConfig() {
  const issues = [];
  
  if (!RAILWAY_CONFIG.baseUrl) {
    issues.push('Missing Railway service URL (PYTHON_SERVICE_URL or NEXT_PUBLIC_PYTHON_API_URL)');
  }
  
  if (RAILWAY_CONFIG.baseUrl && !RAILWAY_CONFIG.baseUrl.includes('railway.app')) {
    issues.push('Railway URL should contain "railway.app" domain');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    config: {
      baseUrl: RAILWAY_CONFIG.baseUrl,
      hasTimeout: !!RAILWAY_CONFIG.timeout,
      hasRetry: !!RAILWAY_CONFIG.retries
    }
  };
}

// Export default configuration
export default RAILWAY_CONFIG;