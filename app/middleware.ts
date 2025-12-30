import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Protege /main y todo lo que cuelgue de /main
  const isMain = req.nextUrl.pathname.startsWith("/main");
  if (!isMain) return NextResponse.next();

  // 1) Si no hay token -> login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2) Si hay token -> validar si ya tiene quiz
  try {
    const quizCheck = await fetch(new URL("/api/quiz/me", req.url), {
      method: "GET",
      headers: {
        // Pasamos cookies para que tu route handler pueda leer el token del cookie
        cookie: req.headers.get("cookie") ?? "",
      },
    });

    // 200 = ya tiene quiz -> permitir /main
    if (quizCheck.status === 200) {
      return NextResponse.next();
    }

    // 404 = quiz no hecho, 401 = no auth (token inválido/expirado), etc -> mandarlo a /quiz
    return NextResponse.redirect(new URL("/quiz", req.url));
  } catch {
    // Si falla el check por red/servidor, mejor mandarlo a /quiz (flujo seguro)
    return NextResponse.redirect(new URL("/quiz", req.url));
  }
}

export const config = {
  matcher: ["/main/:path*"],
};
