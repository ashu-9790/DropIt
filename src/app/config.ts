/**
 * Application configuration
 * Can be overridden by environment variables or build-time configuration
 */

export const environment = {
  production: false,
  apiBaseUrl: getApiBaseUrl(),
};

function getApiBaseUrl(): string {
  // Try to get from window object (set by index.html or build process)
  if (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) {
    return (window as any).__API_BASE_URL__;
  }

  // Default based on environment
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // If running on localhost, use port 5000 for backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:5000`;
    }

    // Production: use Render backend URL
    if (hostname === 'dropitt.me' || hostname === 'www.dropitt.me' || hostname.includes('vercel.app')) {
      return 'https://drop-it-backend.onrender.com';
    }

    // Otherwise, use same origin
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  return 'http://localhost:5000';
}
