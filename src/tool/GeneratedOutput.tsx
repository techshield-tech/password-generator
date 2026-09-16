import { Button, CodeArea, CopyButton, ErrorBox, Panel } from '@mmoall/tool-kit';
import { RefreshIcon, Stat, StrengthMeter } from './local-ui';
import { ATTACK_SCENARIOS, DEFAULT_SCENARIO_INDEX, STRENGTH_LABELS, crackSeconds, entropyLevel, formatDuration } from './strength';

const SCENARIO = ATTACK_SCENARIOS[DEFAULT_SCENARIO_INDEX];

export interface GeneratedOutputProps {
  title: string;
  values: string[];
  error: string | null;
  entropy: number;
  stats: { label: string; value: string }[];
  onRegenerate: () => void;
  onAnalyse: (value: string) => void;
}

export function GeneratedOutput({ title, values, error, entropy, stats, onRegenerate, onAnalyse }: GeneratedOutputProps) {
  const first = values[0] ?? '';
  const level = error ? -1 : entropyLevel(entropy);
  const all = values.join('\n');

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Panel
        title={title}
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => onAnalyse(first)} disabled={!first}>
              Analyse
            </Button>
            <Button size="sm" onClick={onRegenerate} title="Generate again">
              <RefreshIcon />
              Regenerate
            </Button>
          </>
        }
      >
        {error ? (
          <ErrorBox>{error}</ErrorBox>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3">
              <output
                aria-live="polite"
                className="font-code min-w-0 flex-1 text-lg leading-7 break-all text-[var(--color-fg)] select-all"
              >
                {first}
              </output>
              <CopyButton getText={() => first} disabled={!first} />
            </div>
            <StrengthMeter level={level} label={level >= 0 ? STRENGTH_LABELS[entropyLevel(entropy)] : ''} />
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Entropy" value={`${entropy.toFixed(1)} bits`} />
              {stats.map((stat) => (
                <Stat key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
            <p className="text-xs leading-5 text-[var(--color-muted)]">
              Average brute-force time at {SCENARIO.description}:{' '}
              <span className="font-semibold text-[var(--color-fg)]">
                {formatDuration(crackSeconds(entropy, SCENARIO.guessesPerSecond))}
              </span>
            </p>
          </div>
        )}
      </Panel>

      {!error && values.length > 1 && (
        <Panel
          flush
          className="h-[320px]"
          title={`All ${values.length.toLocaleString()} results`}
          actions={<CopyButton getText={() => all} label="Copy all" />}
        >
          <CodeArea aria-label="All generated values" value={all} readOnly />
        </Panel>
      )}
    </div>
  );
}
