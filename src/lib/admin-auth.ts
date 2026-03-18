import { env, isAdminPasswordEnabled, isAdminSessionSecretEnabled } from "./config";

export const ADMIN_SESSION_COOKIE = "nft_experiment_admin";

const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  return isAdminSessionSecretEnabled()
    ? env.adminSessionSecret
    : env.adminDashboardPassword;
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [rawKey, ...rawValue] = entry.split("=");
        return [rawKey, decodeURIComponent(rawValue.join("=") ?? "")];
      }),
  );
}

function getPasswordFromHeaders(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-admin-password")?.trim() ?? "";
}

export async function createAdminSessionToken() {
  if (!isAdminPasswordEnabled()) {
    return "";
  }

  return sha256Hex(
    `${env.adminDashboardPassword}::${getSessionSecret()}::nft-imitation-admin`,
  );
}

export async function verifyAdminPassword(password: string) {
  if (!isAdminPasswordEnabled()) {
    return true;
  }

  return password === env.adminDashboardPassword;
}

export async function isAdminCookieAuthorizedValue(value: string | null | undefined) {
  if (!isAdminPasswordEnabled()) {
    return true;
  }

  if (!value) {
    return false;
  }

  return value === (await createAdminSessionToken());
}

export async function isAdminRequestAuthorized(request: Request) {
  if (!isAdminPasswordEnabled()) {
    return true;
  }

  const headerPassword = getPasswordFromHeaders(request);

  if (headerPassword && (await verifyAdminPassword(headerPassword))) {
    return true;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));

  return isAdminCookieAuthorizedValue(cookies.get(ADMIN_SESSION_COOKIE));
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function normalizeAdminRedirectPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}
