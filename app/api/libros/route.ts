// app/api/libros/route.ts
import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const targetUrl = `${API_URL}/books`;

  try {
    const res = await fetch(targetUrl, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, called: targetUrl, backendResponse: data },
        { status: 200 }
      );
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { ok: false, status: "invalid_books_format", called: targetUrl, backendResponse: data },
        { status: 200 }
      );
    }

    const normalized = data.map((b: any) => ({
      id: String(b.id ?? ""), // 👈 TU backend usa "id"
      title: String(b.title ?? ""),
      author: String(b.author ?? ""),
      description: String(b.description ?? ""),
    }));

    // 👇 Si hay libros sin id, regresamos debug (así detectas el problema sin adivinar)
    const missingIds = normalized.filter((b: any) => !b.id || b.id === "undefined");
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          status: "books_missing_id",
          called: targetUrl,
          hint: "Hay libros que el backend está devolviendo sin campo `id`. Revisa seed o endpoint /books.",
          sample_backend_item: data.find((x: any) => !x?.id) ?? data[0],
          count_missing: missingIds.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(normalized);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, status: "route_handler_crashed", error: String(err?.message ?? err) },
      { status: 200 }
    );
  }
}
