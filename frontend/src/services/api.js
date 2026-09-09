const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }, ...options });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.message || 'Request failed');
  return body.data;
}

