import { Star } from "lucide-react";

import type { AnswerRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const scaleValues = [1, 2, 3, 4, 5];

type MatrixStarQuestionGroupProps = {
  items: string[];
  answerKeys: string[];
  values: AnswerRecord;
  onChange: (key: string, value: number) => void;
  scaleLabel: string;
};

export function MatrixStarQuestionGroup({
  items,
  answerKeys,
  values,
  onChange,
  scaleLabel,
}: MatrixStarQuestionGroupProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50/85 px-5 py-4 text-sm leading-6 text-slate-700">
        {scaleLabel}
      </div>

      <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/88 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] items-end gap-6 border-b border-slate-100 bg-slate-50/60 px-5 py-4 lg:grid">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            题项
          </div>
          <div className="grid grid-cols-5 gap-2">
            {scaleValues.map((value) => (
              <div
                key={`matrix-header-${value}`}
                className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-slate-500"
              >
                <Star className="h-4 w-4" />
                <span className="text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const answerKey = answerKeys[index];
            const selectedValue = values[answerKey];

            return (
              <fieldset key={answerKey} className="px-5 py-5 md:px-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-center lg:gap-6">
                  <legend className="pr-2 text-base font-semibold leading-7 text-slate-900 md:text-[1.02rem]">
                    {item}
                  </legend>

                  <div className="grid grid-cols-5 gap-2">
                    {scaleValues.map((value) => {
                      const selected = selectedValue === value;

                      return (
                        <label
                          key={`${answerKey}-${value}`}
                          className="cursor-pointer"
                          aria-label={`${item} ${value}`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name={answerKey}
                            value={value}
                            checked={selected}
                            onChange={() => onChange(answerKey, value)}
                          />
                          <span
                            className={cn(
                              "flex h-14 flex-col items-center justify-center gap-1 rounded-[20px] border text-xs font-semibold transition md:h-[3.7rem]",
                              selected
                                ? "border-sky-500 bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.24)]"
                                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-slate-700",
                            )}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                selected && "fill-current",
                              )}
                            />
                            <span>{value}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>非常不同意</span>
        <span>非常同意</span>
      </div>
    </div>
  );
}
