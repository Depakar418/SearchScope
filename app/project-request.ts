import { ERROR_STATES } from "../lib/app-errors";

export async function projectRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw Object.assign(Error(data.error || (ERROR_STATES[response.status] || ERROR_STATES[500]).description), { status: response.status });
  return data;
}
