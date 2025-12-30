import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8000";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

// /api/libros/<id>/resenas  -> extrae <id>
function extractBookId(req: Request) {
  const { pathname } = new URL(req.url);
  const parts = pathname.split("/").filter(Boolean);
  const i = parts.indexOf("libros");
  return (i >= 0 ? parts[i + 1] : "")?.trim() ?? "";
}

// Lee cookie del header "cookie" (sin usar next/headers cookies())
function getCookieFromHeader(req: Request, name: string) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  // parse simple: "a=1; b=2"
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

async function readUpstream(res: Response) {
  const raw = await res.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  return { raw, parsed };
}

function detailFrom(parsed: any, raw: string, res: Response) {
  return parsed?.detail ?? parsed?.message ?? raw ?? `${res.status} ${res.statusText}`;
}

/**
 * ✅ GET público: visualizar reseñas
 */
export async function GET(req: Request) {
  const bookId = extractBookId(req);
  const called = `${API_URL}/books/${encodeURIComponent(bookId)}/reviews`;

  if (!bookId) {
    return NextResponse.json(
      {
        ok: false,
        status: 400,
        where: "missing_book_id_in_url",
        bookId,
        called,
        detail: "No se pudo extraer el id desde la URL.",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(called, { cache: "no-store" });
    const { raw, parsed } = await readUpstream(res);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          where: "backend_error",
          bookId,
          called,
          detail: detailFrom(parsed, raw, res),
          backendResponse: parsed ?? null,
          backendRaw: parsed ? null : raw,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(parsed ?? []);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        where: "route_handler_crashed",
        bookId,
        called,
        detail: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

/**
 * ✅ POST requiere login: enviar reseña
 */
export async function POST(req: Request) {
  const bookId = extractBookId(req);
  const called = `${API_URL}/books/${encodeURIComponent(bookId)}/reviews`;

  if (!bookId) {
    return NextResponse.json(
      {
        ok: false,
        status: 400,
        where: "missing_book_id_in_url",
        bookId,
        called,
        detail: "No se pudo extraer el id desde la URL.",
      },
      { status: 400 }
    );
  }

  // ✅ Token desde cookie del request
  const token = getCookieFromHeader(req, COOKIE_NAME);

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        status: 401,
        where: "not_authenticated",
        cookieName: COOKIE_NAME,
        detail: "No autenticado. Inicia sesión para escribir reseñas.",
      },
      { status: 401 }
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const text = String(body?.text ?? "").trim();
  const username = String(body?.username ?? "Anon").trim();

  const ratingRaw = body?.rating;
  const rating =
    ratingRaw === undefined || ratingRaw === null || ratingRaw === ""
      ? undefined
      : Number(ratingRaw);

  if (!text) {
    return NextResponse.json(
      { ok: false, status: 400, where: "invalid_payload", detail: "La reseña debe incluir 'text'." },
      { status: 400 }
    );
  }

  if (rating !== undefined && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json(
      { ok: false, status: 400, where: "invalid_payload", detail: "El campo 'rating' debe ser un número entre 1 y 5." },
      { status: 400 }
    );
  }

  const payload = rating === undefined ? { username, text } : { username, text, rating };

  try {
    const upstream = await fetch(called, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ si tu backend valida JWT
      },
      body: JSON.stringify(payload),
    });

    const { raw, parsed } = await readUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: upstream.status,
          where: "backend_error",
          bookId,
          called,
          detail: detailFrom(parsed, raw, upstream),
          backendResponse: parsed ?? null,
          backendRaw: parsed ? null : raw,
          sentPayload: payload,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(parsed ?? { ok: true }, { status: upstream.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        where: "route_handler_crashed",
        bookId,
        called,
        detail: String(err?.message ?? err),
        sentPayload: payload,
      },
      { status: 500 }
    );
  }
}
