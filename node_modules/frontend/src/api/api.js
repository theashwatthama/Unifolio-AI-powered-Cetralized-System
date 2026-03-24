import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const resolvedBaseUrl = isLocalhost
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: resolvedBaseUrl,
});

export default api;
