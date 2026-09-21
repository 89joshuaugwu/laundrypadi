import { getFirebaseAuth } from "./firebase";

/** Calls one of our API routes with the signed-in user's Firebase ID token. Throws Error(message) on failure. */
export async function apiFetch<T = Record<string, unknown>>(
  path: string,
  init: { method?: "POST" | "PATCH" | "PUT"; body?: unknown } = {},
): Promise<T> {
  const user = getFirebaseAuth()?.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}
