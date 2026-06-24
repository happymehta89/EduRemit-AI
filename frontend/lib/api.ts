import type { ApiError } from "./types";

const BASE = "/api/backend";

class ApiClientError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("eduremit_token");
}

export function setToken(token: string) {
  localStorage.setItem("eduremit_token", token);
}

export function clearToken() {
  localStorage.removeItem("eduremit_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: ApiError = { error: `Request failed with status ${res.status}` };
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new ApiClientError(body.error || "Something went wrong.", res.status, body.detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { ApiClientError };
