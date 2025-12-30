import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error" }));
    throw new Error(err.detail ?? "Error");
  }

  return res.json();
}
