import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "access_token";

export async function GET() {
  try {
    // ✅ En Next 16, cookies() puede ser async (Turbopack)
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    return NextResponse.json({
      authenticated: Boolean(token),
      cookieName: COOKIE_NAME,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        where: "auth_me_route_crashed",
        detail: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
