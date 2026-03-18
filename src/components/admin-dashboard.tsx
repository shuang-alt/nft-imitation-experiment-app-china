"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  CircleCheckBig,
  DatabaseZap,
  Download,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

import { readBrowserDashboardDataset, subscribeToStorage } from "@/lib/client-storage";
import { buildDashboardSummary, mergeDashboardDatasets } from "@/lib/dashboard";
import type { DashboardDataset } from "@/lib/types";
import { abbreviateRespondentId, formatTimestamp } from "@/lib/utils";

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

function getStorageModeLabel(storageMode: DashboardDataset["storageMode"]) {
  return storageMode === "edgeone-kv" ? "EdgeOne KV" : "Mock";
}

export function AdminDashboard({ initialDataset }: AdminDashboardProps) {
  const browserDataset = useSyncExternalStore(
    subscribeToStorage,
    readBrowserDashboardDataset,
    () => ({
      respondents: [],
      pageEvents: [],
      finishes: [],
      storageMode: "mock" as const,
      notices: [],
      updatedAt: "",
    }),
  );
  const [serverDataset, setServerDataset] = useState(initialDataset);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [remoteError, setRemoteError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDataset() {
      try {
        const response = await fetch("/api/admin/dataset", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const dataset = (await response.json()) as DashboardDataset;

        if (!active) {
          return;
        }

        setServerDataset(dataset);
        setRemoteError("");
      } catch (error) {
        console.error("Failed to load admin dataset", error);

        if (!active) {
          return;
        }

        setRemoteError("无法刷新远端数据，当前展示本地预览结果。");
      } finally {
        if (active) {
          setIsRefreshing(false);
        }
      }
    }

    void loadDataset();

    return () => {
      active = false;
    };
  }, []);

  const dataset =
    serverDataset.storageMode === "edgeone-kv"
      ? serverDataset
      : mergeDashboardDatasets(serverDataset, browserDataset);
  const summary = buildDashboardSummary(dataset);
  const notices = remoteError
    ? [...summary.notices, remoteError]
    : summary.notices;

  return (
    <div className="space-y-8">
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
                当前模式：{getStorageModeLabel(summary.storageMode)}
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
                        {item.eventType === "finish"
                          ? "finish"
                          : `page ${item.pageNumber}`}
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
