import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken, validateLogin } from "@/lib/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;
  const username = body?.username ?? "";
  const password = body?.password ?? "";

  if (!validateLogin(username, password)) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
