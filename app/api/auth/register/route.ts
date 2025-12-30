import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8000";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // {name,email,password} o lo que pida tu backend

    const r = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json({ detail: data?.detail ?? "No se pudo registrar" }, { status: r.status });
    }

    // si tu backend regresa token al registrar, lo guardamos
    const token = data?.access_token ?? data?.token;
    const res = NextResponse.json({ ok: true });

    if (token) {
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ detail: "Error en registro", error: String(e?.message ?? e) }, { status: 500 });
  }
}
