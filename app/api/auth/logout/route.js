import { NextResponse } from "next/server";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // borra cookie (mismo nombre y path)
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
