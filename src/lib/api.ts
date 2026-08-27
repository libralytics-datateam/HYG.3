const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Normalize away a trailing slash or a trailing /v1 so every caller can
// consistently write apiFetch('/v1/...') regardless of how VITE_API_URL is set.
export const API_BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/v1$/, '');

const TOKEN_KEY = 'hyg3_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  // Don't set Content-Type for FormData — the browser needs to add its own
  // multipart boundary, which it can only do if the header is left unset.
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
