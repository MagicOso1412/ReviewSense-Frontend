import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8000";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";
    const token = cookie
      .split(";")
      .map(s => s.trim())
      .find(s => s.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const upstream = await fetch(`${API_URL}/quiz/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Si tu backend lee cookie, esto no hace daño, pero lo clave es Authorization:
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ detail: "Server error" }, { status: 500 });
  }
}
