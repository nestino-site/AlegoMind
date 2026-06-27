interface Step {
  label: string;
  step: number;
}

const STEPS: Step[] = [
  { step: 1, label: "Tip" },
  { step: 2, label: "Program" },
  { step: 3, label: "Plată" },
];

export function BookingStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const done    = s.step < current;
        const active  = s.step === current;
        const pending = s.step > current;
        return (
          <div key={s.step} className="flex items-center">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-brand-500 text-white"
                    : active
                      ? "border-2 border-brand-500 bg-white text-brand-500"
                      : "border-2 border-border bg-white text-text-muted"
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.step
                )}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  active ? "text-brand-500" : done ? "text-text-secondary" : "text-text-muted"
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-4 h-px w-10 transition-colors ${
                  s.step < current ? "bg-brand-400" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
