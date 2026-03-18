import type { AnswerRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const scaleValues = [1, 2, 3, 4, 5, 6, 7];

type LikertQuestionGroupProps = {
  items: string[];
  answerKeys: string[];
  values: AnswerRecord;
  onChange: (key: string, value: number) => void;
  scaleLabel: string;
};

export function LikertQuestionGroup({
  items,
  answerKeys,
  values,
  onChange,
  scaleLabel,
}: LikertQuestionGroupProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm leading-6 text-slate-700">
        {scaleLabel}
      </div>
      {items.map((item, index) => {
        const answerKey = answerKeys[index];
        const selectedValue = values[answerKey];

        return (
          <fieldset
            key={answerKey}
            className="rounded-[30px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
          >
            <legend className="w-full pr-2 text-base font-semibold leading-7 text-slate-900">
              {item}
            </legend>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {scaleValues.map((value) => (
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
                    checked={selectedValue === value}
                    onChange={() => onChange(answerKey, value)}
                  />
                  <span
                    className={cn(
                      "flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                      selectedValue === value
                        ? "border-sky-500 bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.28)]"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-300 hover:bg-sky-50",
                    )}
                  >
                    {value}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>非常不同意</span>
              <span>非常同意</span>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
