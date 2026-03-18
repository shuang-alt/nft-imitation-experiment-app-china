import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  normalizeAdminRedirectPath,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectTo = normalizeAdminRedirectPath(
    String(formData.get("redirectTo") ?? "/admin"),
  );

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.redirect(
      new URL(`${redirectTo}?error=invalid_password`, request.url),
      303,
    );
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  const token = await createAdminSessionToken();

  if (token) {
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      getAdminSessionCookieOptions(),
    );
  }

  return response;
}
