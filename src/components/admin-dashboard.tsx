"use client";

import { useSyncExternalStore } from "react";
import {
  Activity,
  CircleCheckBig,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

import { readBrowserDashboardDataset } from "@/lib/client-storage";
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

export function AdminDashboard({ initialDataset }: AdminDashboardProps) {
  const dataset = useSyncExternalStore(
    () => () => undefined,
    () => mergeDashboardDatasets(initialDataset, readBrowserDashboardDataset()),
    () => initialDataset,
  );

  const summary = buildDashboardSummary(dataset);

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

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-slate-950">Storage Overview</h2>
              <p className="text-sm text-slate-500">
                当前模式：{summary.storageMode === "database" ? "database" : "mock"}
              </p>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
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
          </dl>
          <div className="mt-5 space-y-3">
            {summary.notices.map((notice) => (
              <div
                key={notice}
                className="rounded-[22px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-800"
              >
                {notice}
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Last refreshed: {formatTimestamp(summary.updatedAt)}
            </p>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-slate-950">Latest Submissions</h2>
              <p className="text-sm text-slate-500">
                最近写入的 page save / finish 事件概览
              </p>
            </div>
          </div>

          {summary.latestSubmissions.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
              尚无提交记录。先完成任一 study 流程，再回到此页即可查看本机 mock 数据概览。
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
