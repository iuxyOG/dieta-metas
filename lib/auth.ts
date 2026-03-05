import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "jh_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function getAuthSecret() {
  return encoder.encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-before-production");
}

export function getLoginUsername() {
  return (process.env.LOGIN_USERNAME ?? "jhullya").trim();
}

function getLoginPassword() {
  return process.env.LOGIN_PASSWORD ?? "iuxy";
}

export function validateLogin(username: string, password: string) {
  return username.trim() === getLoginUsername() && password === getLoginPassword();
}

export async function createSessionToken() {
  return new SignJWT({ sub: getLoginUsername(), role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), { algorithms: ["HS256"] });
    return payload.sub === getLoginUsername();
  } catch {
    return false;
  }
}

export function isSafeRedirectPath(path: string | null | undefined) {
  if (!path) {
    return false;
  }

  return path.startsWith("/") && !path.startsWith("//");
}
