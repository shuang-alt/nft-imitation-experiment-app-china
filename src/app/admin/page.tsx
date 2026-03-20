import Link from "next/link";
import { cookies } from "next/headers";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { AdminDashboard } from "@/components/admin-dashboard";
import {
  ADMIN_SESSION_COOKIE,
  isAdminCookieAuthorizedValue,
} from "@/lib/admin-auth";
import { isAdminPasswordEnabled } from "@/lib/config";
import { getDashboardDataset } from "@/lib/storage";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requiresPassword = isAdminPasswordEnabled();
  const isAuthorized =
    !requiresPassword ||
    (await isAdminCookieAuthorizedValue(
      cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    ));

  if (!isAuthorized) {
    return (
      <main className="flex min-h-screen items-center px-4 py-8 md:px-6">
        <div className="mx-auto max-w-xl rounded-[36px] border border-white/80 bg-white/85 p-8 shadow-[0_32px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Admin Dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl text-slate-950">Enter password</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            已配置 `ADMIN_DASHBOARD_PASSWORD` 时，访问 `/admin` 需要先通过密码登录。
          </p>
          <form className="mt-6 space-y-4" method="POST" action="/admin/login">
            <input type="hidden" name="redirectTo" value="/admin" />
            <input
              type="password"
              name="password"
              placeholder="ADMIN_DASHBOARD_PASSWORD"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
            />
            {params.error === "invalid_password" ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                密码不正确，请重试。
              </div>
            ) : null}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4" />
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  const dataset =
    process.env.NODE_ENV === "development"
      ? await getDashboardDataset()
      : {
          respondents: [],
          pageEvents: [],
          finishes: [],
          storageMode: "mock" as const,
          notices: [
            "Waiting for /api/admin/dataset and /api/admin/health from the formal backend.",
          ],
          updatedAt: new Date().toISOString(),
        };

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[36px] border border-white/80 bg-white/82 px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.1)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Admin Prototype
            </p>
            <h1 className="mt-2 font-display text-4xl text-slate-950">
              Response overview dashboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <form method="POST" action="/admin/logout">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Return Home
            </Link>
          </div>
        </header>

        <AdminDashboard initialDataset={dataset} />
      </div>
    </main>
  );
}
