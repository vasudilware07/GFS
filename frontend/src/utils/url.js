/**
 * Get the full URL for an image/file
 * Handles both local paths (/uploads/...) and Cloudinary URLs (https://res.cloudinary.com/...)
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL (Cloudinary or other CDN), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, prepend the backend base URL
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

/**
 * Get the API base URL
 */
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

/**
 * Get the backend base URL (without /api)
 */
export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
};
