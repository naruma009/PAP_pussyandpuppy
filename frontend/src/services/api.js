const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export async function getHealth(signal) {
  const response = await fetch(`${apiBase}/health`, { signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Health check failed (${response.status})`);
  return data;
}
