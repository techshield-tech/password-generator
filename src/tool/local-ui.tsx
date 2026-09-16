// Small primitives this tool needs on top of @mmoall/tool-kit (which has no
// generic input, slider, or meter and is kept identical across repos).

import type { InputHTMLAttributes, ReactNode } from 'react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className = '', ...props }: TextFieldProps) {
  return (
    <input
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      className={`font-code h-9 w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 text-[13px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent)] ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-[var(--color-muted)]">
        {label}
        {hint && <span className="font-normal text-[var(--color-subtle)]">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

export interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

/** Slider paired with a numeric input, clamped to [min, max]. */
export function RangeField({ label, value, min, max, onChange }: RangeFieldProps) {
  const clamp = (next: number) => Math.max(min, Math.min(max, Math.round(next)));
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="h-9 min-w-0 flex-1 cursor-pointer accent-[var(--color-accent)]"
        />
        <input
          type="number"
          aria-label={`${label} value`}
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(clamp(next));
          }}
          className="font-code h-9 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-2 text-center text-[13px] text-[var(--color-fg)] tabular-nums outline-none focus:border-[var(--color-accent)]"
        />
      </div>
    </Field>
  );
}

const LEVEL_FILL = [
  'bg-[var(--color-danger)]',
  'bg-[var(--color-danger)]',
  'bg-[var(--color-accent)]',
  'bg-[var(--color-success)]',
  'bg-[var(--color-success)]',
];

const LEVEL_TEXT = [
  'text-[var(--color-danger)]',
  'text-[var(--color-danger)]',
  'text-[var(--color-accent)]',
  'text-[var(--color-success)]',
  'text-[var(--color-success)]',
];

/** Five-segment strength bar; `level` is 0..4, or -1 for empty. */
export function StrengthMeter({ level, label }: { level: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid flex-1 grid-cols-5 gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-colors ${
              level >= 0 && index <= level ? LEVEL_FILL[level] : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>
      <span
        className={`w-24 text-right text-xs font-semibold ${level >= 0 ? LEVEL_TEXT[level] : 'text-[var(--color-subtle)]'}`}
      >
        {label}
      </span>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2">
      <span className="text-[11px] font-medium tracking-wide text-[var(--color-muted)] uppercase">{label}</span>
      <span className="font-code truncate text-sm font-semibold text-[var(--color-fg)] tabular-nums">{value}</span>
    </div>
  );
}

export const RefreshIcon = ({ className = 'size-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);
