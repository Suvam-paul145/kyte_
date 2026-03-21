import { getSavedAuth } from "../core/auth.js";

type JsonValue = Record<string, unknown> | undefined;

export async function postJson(url: string, body?: JsonValue): Promise<Response> {
  const auth = await getSavedAuth();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  return fetch(url, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
