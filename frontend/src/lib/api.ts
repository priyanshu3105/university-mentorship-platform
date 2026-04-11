import { supabase } from "./supabase";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest(path: string, init: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function apiGet(path: string) {
  return apiRequest(path, { method: "GET" });
}

export async function apiPost(path: string, body: unknown) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut(path: string, body: unknown) {
  return apiRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiPatch(path: string, body: unknown) {
  return apiRequest(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string) {
  return apiRequest(path, { method: "DELETE" });
}
