const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
export async function api(
  path,
  { token, method = "GET", body, headers = {} } = {},
) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success)
    throw new Error(payload.message || "Request failed");
  return payload.data;
}
export const API_ORIGIN = BASE_URL.replace("/api/v1", "");
