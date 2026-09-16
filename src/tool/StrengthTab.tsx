import { useMemo, useState } from 'react';
import { Button, Panel, StatusPill } from '@mmoall/tool-kit';
import { Stat, StrengthMeter, TextField } from './local-ui';
import { ATTACK_SCENARIOS, STRENGTH_LABELS, analysePassword, crackSeconds, formatDuration } from './strength';

const CLASS_LABELS: { key: 'lowercase' | 'uppercase' | 'digits' | 'symbols' | 'other'; label: string; size: number }[] = [
  { key: 'lowercase', label: 'Lowercase', size: 26 },
  { key: 'uppercase', label: 'Uppercase', size: 26 },
  { key: 'digits', label: 'Digits', size: 10 },
  { key: 'symbols', label: 'Symbols', size: 33 },
  { key: 'other', label: 'Non-ASCII', size: 100 },
];

export function StrengthTab({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  const report = useMemo(() => analysePassword(value), [value]);
  const empty = report.length === 0;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-3">
        <Panel title="Password">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <TextField
                type={visible ? 'text' : 'password'}
                aria-label="Password to analyse"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Type or paste a password…"
                autoFocus
              />
              <Button onClick={() => setVisible((current) => !current)}>{visible ? 'Hide' : 'Show'}</Button>
              <Button variant="ghost" onClick={() => onChange('')} disabled={empty}>
                Clear
              </Button>
            </div>
            <StrengthMeter level={empty ? -1 : report.level} label={empty ? 'No input' : STRENGTH_LABELS[report.level]} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Length" value={report.length} />
              <Stat label="Charset" value={report.charsetSize} />
              <Stat label="Entropy" value={`${report.entropy.toFixed(1)} bits`} />
              <Stat label="Score" value={`${Math.round(report.score * 100)} / 100`} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLASS_LABELS.map((item) => (
                <StatusPill key={item.key} tone={report.breakdown[item.key] ? 'success' : 'neutral'}>
                  {item.label} +{item.size}
                </StatusPill>
              ))}
            </div>
          </div>
        </Panel>

        {report.warnings.length > 0 && (
          <Panel title="Warnings">
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-[var(--color-fg)] marker:text-[var(--color-danger)]">
              {report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <Panel title="Estimated time to crack">
        <div className="flex flex-col gap-3">
          {ATTACK_SCENARIOS.map((scenario) => {
            const seconds = crackSeconds(report.entropy, scenario.guessesPerSecond);
            return (
              <div
                key={scenario.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-fg)]">{scenario.label}</span>
                  <span className="text-xs text-[var(--color-muted)]">{scenario.description}</span>
                </div>
                <span className="font-code text-sm font-semibold break-words text-[var(--color-fg)]">
                  {empty ? '—' : report.isCommon ? 'Instantly (dictionary attack)' : formatDuration(seconds)}
                </span>
              </div>
            );
          })}
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Estimates assume a brute-force search over the detected character set (average case: half the keyspace).
            Real attackers use dictionaries and patterns first, so passwords built from words, names, or dates fall much
            faster than shown. Your input is analysed locally and never leaves the browser.
          </p>
        </div>
      </Panel>
    </div>
  );
}
