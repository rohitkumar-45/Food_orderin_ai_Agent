import { AgentResponse, CheckoutOrder, OrderSession, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function createSession(location: string, latitude?: number, longitude?: number, userId?: string) {
  return request<{ session: OrderSession }>("/api/session", {
    method: "POST",
    body: JSON.stringify({ location, latitude, longitude, userId })
  });
}

export function getHealth() {
  return request<{ ok: boolean; mode: string }>("/api/health");
}

export function sendCommand(sessionId: string | undefined, command: string, location: string, latitude?: number, longitude?: number, userId?: string) {
  return request<AgentResponse>("/api/agent/command", {
    method: "POST",
    body: JSON.stringify({ sessionId, command, location, latitude, longitude, userId })
  });
}

export function checkout(sessionId: string) {
  return request<{ order: CheckoutOrder }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ sessionId })
  });
}

export function signup(name: string, email: string, password: string) {
  return request<{ user: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });
}

export function signin(email: string, password: string) {
  return request<{ user: User }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}
