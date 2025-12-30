import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8000";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

// Cambia esto si tu backend usa otra ruta:
const LOGIN_PATH = "/auth/login";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // -------- Intento 1: JSON {email,password} o {username,password} --------
    const tryJson = async (payload: any) => {
      return fetch(`${API_URL}${LOGIN_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ por consistencia
        credentials: "include",
        body: JSON.stringify(payload),
      });
    };

    // -------- Intento 2: OAuth2 form-url-encoded (FastAPI OAuth2PasswordRequestForm) --------
    const tryForm = async (username: string, password: string) => {
      const form = new URLSearchParams();
      form.set("username", username);
      form.set("password", password);

      return fetch(`${API_URL}${LOGIN_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: form.toString(),
      });
    };

    // payload base
    const email = String(body?.email ?? "").trim();
    const username = String(body?.username ?? "").trim() || email;
    const password = String(body?.password ?? "");

    // 1) JSON con email/password si hay email
    let upstream = await tryJson(email ? { email, password } : { username, password });
    let data: any = await upstream.json().catch(() => ({}));

    // Si falla, reintenta JSON con username/password (por si backend espera username)
    if (!upstream.ok && email) {
      upstream = await tryJson({ username: email, password });
      data = await upstream.json().catch(() => ({}));
    }

    // Si falla, reintenta como OAuth2 form
    if (!upstream.ok) {
      upstream = await tryForm(username, password);
      data = await upstream.json().catch(() => ({}));
    }

    // Si sigue fallando, devuelve el error tal cual
    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          detail: data?.detail ?? "No se pudo iniciar sesión",
          status: upstream.status,
          backend: data,
        },
        { status: upstream.status }
      );
    }

    // ✅ Token: soporta varias claves comunes
    const token =
      data?.access_token ??
      data?.token ??
      data?.jwt ??
      data?.accessToken ??
      null;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          ok: false,
          detail: "Login OK pero el backend no devolvió un token (access_token/token/jwt).",
          backend: data,
        },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ ok: true });

    // ✅ Cookie correcta para localhost
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // ✅ NO secure en localhost
      path: "/", // ✅ IMPORTANTÍSIMO
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
