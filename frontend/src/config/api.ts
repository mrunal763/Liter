export const getApiUrl = (): string => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').trim();
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // Ensure it ends with /api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};
