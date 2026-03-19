import type { AnswerRecord, SingleChoiceOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type SingleChoiceQuestionProps = {
  question: string;
  answerKey: string;
  options: SingleChoiceOption[];
  values: AnswerRecord;
  onChange: (key: string, value: string) => void;
};

export function SingleChoiceQuestion({
  question,
  answerKey,
  options,
  values,
  onChange,
}: SingleChoiceQuestionProps) {
  const selectedValue = values[answerKey];

  return (
    <fieldset className="space-y-5">
      <legend className="text-xl font-display text-slate-950 md:text-[2rem]">
        {question}
      </legend>

      <div className="space-y-3">
        {options.map((option, index) => {
          const selected = selectedValue === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-4 rounded-[28px] border bg-white/86 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition",
                selected
                  ? "border-sky-500 bg-sky-50/90 shadow-[0_18px_45px_rgba(14,165,233,0.14)]"
                  : "border-white/80 hover:border-sky-200 hover:bg-white",
              )}
            >
              <input
                className="sr-only"
                type="radio"
                name={answerKey}
                value={option.value}
                checked={selected}
                onChange={() => onChange(answerKey, option.value)}
              />
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  selected
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500",
                )}
              >
                {index + 1}
              </span>
              <span className="text-base leading-8 text-slate-800">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
