import { Capacitor } from "@capacitor/core";

const getApiBaseUrl = () => {
  // When running inside Android / Native mobile container:
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_MOBILE_API_URL || "http://10.0.2.2:4000/api/v1";
  }

  // When running inside Web Browser:
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${window.location.protocol}//${hostname}:4000/api/v1`;
    }
  }
  return "http://localhost:4000/api/v1";
};

const BASE_URL = getApiBaseUrl();
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
