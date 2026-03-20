"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  AlertTriangle,
  CircleCheckBig,
  DatabaseZap,
  Download,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

import { readBrowserDashboardDataset, subscribeToStorage } from "@/lib/client-storage";
import { buildDashboardSummary, mergeDashboardDatasets } from "@/lib/dashboard";
import type { AdminHealthStatus, DashboardDataset } from "@/lib/types";
import { abbreviateRespondentId, cn, formatTimestamp } from "@/lib/utils";

type AdminDashboardProps = {
  initialDataset: DashboardDataset;
};

const statCards = [
  {
    label: "Total Respondents",
    icon: Users,
    value: (summary: ReturnType<typeof buildDashboardSummary>) =>
      summary.totalRespondents,
  },
  {
    label: "Completed Respondents",
    icon: CircleCheckBig,
    value: (summary: ReturnType<typeof buildDashboardSummary>) =>
      summary.completedRespondents,
  },
  {
    label: "Study 1 Count",
    icon: FolderKanban,
    value: (summary: ReturnType<typeof buildDashboardSummary>) =>
      summary.studyCounts.study1,
  },
  {
    label: "Study 2 Count",
    icon: Activity,
    value: (summary: ReturnType<typeof buildDashboardSummary>) =>
      summary.studyCounts.study2,
  },
];

const emptyBrowserDataset: DashboardDataset = {
  respondents: [],
  pageEvents: [],
  finishes: [],
  storageMode: "mock",
  notices: [],
  updatedAt: "",
};

function getStorageModeLabel(storageMode: AdminHealthStatus["storageMode"]) {
  if (storageMode === "edgeone-kv") {
    return "EdgeOne KV";
  }

  if (storageMode === "missing") {
    return "Missing KV";
  }

  return "Mock / Unknown";
}

function getBackendOriginLabel(backendOrigin: AdminHealthStatus["backendOrigin"]) {
  if (backendOrigin === "edge-functions") {
    return "Edge Functions";
  }

  if (backendOrigin === "next-mock-api") {
    return "Next Mock API";
  }

  return "Unknown";
}

function normalizeHealthStatus(
  value?: Partial<AdminHealthStatus>,
): AdminHealthStatus {
  return {
    ok: value?.ok ?? false,
    storageMode: value?.storageMode ?? "unknown",
    backendOrigin: value?.backendOrigin ?? "unknown",
    hasKvBinding: value?.hasKvBinding ?? false,
    kvBindingName: value?.kvBindingName ?? "NFT_EXPERIMENT_KV",
    respondentCount: value?.respondentCount,
    submissionCount: value?.submissionCount,
    notices: value?.notices ?? [],
    warnings: value?.warnings ?? [],
    error: value?.error,
  };
}

export function AdminDashboard({ initialDataset }: AdminDashboardProps) {
  const browserDataset = useSyncExternalStore(
    subscribeToStorage,
    readBrowserDashboardDataset,
    () => emptyBrowserDataset,
  );
  const [serverDataset, setServerDataset] = useState(initialDataset);
  const [healthStatus, setHealthStatus] = useState<AdminHealthStatus>(
    normalizeHealthStatus({
      notices: ["Health check pending."],
    }),
  );
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [remoteError, setRemoteError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdminState() {
      try {
        const [datasetResponse, healthResponse] = await Promise.all([
          fetch("/api/admin/dataset", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          }),
          fetch("/api/admin/health", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          }),
        ]);

        const [datasetPayload, healthPayload] = await Promise.all([
          datasetResponse
            .json()
            .catch(() => null) as Promise<DashboardDataset | { error?: string } | null>,
          healthResponse
            .json()
            .catch(() => null) as Promise<Partial<AdminHealthStatus> | { error?: string } | null>,
        ]);

        if (!active) {
          return;
        }

        if (datasetResponse.ok && datasetPayload) {
          setServerDataset(datasetPayload as DashboardDataset);
          setRemoteError("");
        } else {
          const message =
            (datasetPayload as { error?: string } | null)?.error ??
            `无法刷新远端数据集（${datasetResponse.status}）。`;
          setRemoteError(message);
        }

        if (healthPayload) {
          setHealthStatus(normalizeHealthStatus(healthPayload as Partial<AdminHealthStatus>));
        } else {
          setHealthStatus(
            normalizeHealthStatus({
              error: `Health check request failed: ${healthResponse.status}`,
              warnings: ["Unable to parse /api/admin/health response."],
            }),
          );
        }
      } catch (error) {
        console.error("Failed to load admin status", error);

        if (!active) {
          return;
        }

        setRemoteError("无法刷新远端数据集，当前未拿到正式后台返回。");
        setHealthStatus(
          normalizeHealthStatus({
            error: "无法请求 /api/admin/health。",
            warnings: ["Current backend status is unknown."],
          }),
        );
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    }

    void loadAdminState();

    return () => {
      active = false;
    };
  }, []);

  const shouldMergeBrowserPreview =
    process.env.NODE_ENV === "development" && serverDataset.storageMode !== "edgeone-kv";
  const dataset = shouldMergeBrowserPreview
    ? mergeDashboardDatasets(serverDataset, browserDataset)
    : serverDataset;
  const summary = buildDashboardSummary(dataset);
  const notices = remoteError ? [...summary.notices, remoteError] : summary.notices;
  const isFormalHealthy =
    healthStatus.ok &&
    healthStatus.backendOrigin === "edge-functions" &&
    healthStatus.storageMode === "edgeone-kv" &&
    healthStatus.hasKvBinding;

  return (
    <div className="space-y-8">
      <section
        className={cn(
          "rounded-[30px] border p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]",
          isFormalHealthy
            ? "border-emerald-200 bg-emerald-50/80"
            : "border-rose-200 bg-rose-50/85",
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "rounded-2xl p-3",
              isFormalHealthy
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            )}
          >
            {isFormalHealthy ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </span>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Backend Health
            </p>
            <h2 className="font-display text-3xl text-slate-950">
              {isFormalHealthy ? "正式收数后端正常" : "当前不是正式收数后端"}
            </h2>
            <p className="text-sm leading-7 text-slate-700">
              {isFormalHealthy
                ? "当前 /api/* 已连接到 Edge Functions + EdgeOne KV，同一套正式后端同时负责问卷写入和后台读取。"
                : "当前不是 edge-functions + edgeone-kv + hasKvBinding=true，数据可能不会进入正式库。"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-white/80 bg-white/85 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              当前后端
            </dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">
              {getBackendOriginLabel(healthStatus.backendOrigin)}
            </dd>
          </div>
          <div className="rounded-[22px] border border-white/80 bg-white/85 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              当前存储
            </dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">
              {getStorageModeLabel(healthStatus.storageMode)}
            </dd>
          </div>
          <div className="rounded-[22px] border border-white/80 bg-white/85 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              KV 绑定
            </dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">
              {healthStatus.hasKvBinding ? healthStatus.kvBindingName : "missing"}
            </dd>
          </div>
          <div className="rounded-[22px] border border-white/80 bg-white/85 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              健康检查
            </dt>
            <dd className="mt-2 text-lg font-semibold text-slate-950">
              {isFormalHealthy ? "正常" : "异常"}
            </dd>
          </div>
        </div>

        {(healthStatus.error || healthStatus.warnings.length > 0 || healthStatus.notices.length > 0) ? (
          <div className="mt-6 space-y-2">
            {healthStatus.error ? (
              <p className="rounded-[22px] border border-rose-200 bg-white/85 px-4 py-3 text-sm text-rose-700">
                {healthStatus.error}
              </p>
            ) : null}
            {healthStatus.warnings.map((warning) => (
              <p
                key={warning}
                className="rounded-[22px] border border-rose-200 bg-white/85 px-4 py-3 text-sm text-rose-700"
              >
                {warning}
              </p>
            ))}
            {healthStatus.notices.map((notice) => (
              <p
                key={notice}
                className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 text-sm text-slate-600"
              >
                {notice}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <section
              key={card.label}
              className="rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.1)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <span className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 text-4xl font-display text-slate-950">
                {card.value(summary)}
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-slate-950">Storage Overview</h2>
              <p className="text-sm text-slate-500">
                当前展示数据：{getStorageModeLabel(summary.storageMode)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Control
              </dt>
              <dd className="mt-2 text-2xl font-display text-slate-950">
                {summary.conditionCounts.control}
              </dd>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Treatment
              </dt>
              <dd className="mt-2 text-2xl font-display text-slate-950">
                {summary.conditionCounts.treatment}
              </dd>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Study 1 / Control", summary.studyConditionCounts.study1.control],
                ["Study 1 / Treatment", summary.studyConditionCounts.study1.treatment],
                ["Study 2 / Control", summary.studyConditionCounts.study2.control],
                ["Study 2 / Treatment", summary.studyConditionCounts.study2.treatment],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </dt>
                <dd className="mt-2 text-2xl font-display text-slate-950">{value}</dd>
              </div>
            ))}
          </div>

          {notices.length > 0 ? (
            <div className="mt-6 space-y-2">
              {notices.map((notice) => (
                <p
                  key={notice}
                  className="rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600"
                >
                  {notice}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/admin/export/json"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </a>
            <a
              href="/api/admin/export/csv"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <DatabaseZap className="h-4 w-4" />
              Export CSV
            </a>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Last refreshed: {formatTimestamp(summary.updatedAt)}
            {isRefreshing ? " · refreshing..." : ""}
          </p>
        </section>

        <section className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
          <h2 className="font-display text-2xl text-slate-950">Latest Submissions</h2>

          {summary.latestSubmissions.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              尚无提交记录。先完成任一 study 流程，再回到此页即可查看数据概览。
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50/90 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Respondent</th>
                    <th className="px-4 py-3 font-medium">Study</th>
                    <th className="px-4 py-3 font-medium">Condition</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {summary.latestSubmissions.map((item) => (
                    <tr key={item.key}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {abbreviateRespondentId(item.respondentId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.studyId === "study1" ? "Study 1" : "Study 2"}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">
                        {item.condition}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.eventType === "finish" ? "finish" : `page ${item.pageNumber}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatTimestamp(item.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
