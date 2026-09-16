import { useCallback, useMemo, useState } from 'react';
import { Button, Panel, Switch } from '@mmoall/tool-kit';
import { GeneratedOutput } from './GeneratedOutput';
import { Field, RangeField, TextField } from './local-ui';
import {
  AMBIGUOUS_CHARS,
  CHARSETS,
  DEFAULT_PASSWORD_OPTIONS,
  MAX_COUNT,
  buildCharset,
  generatePasswords,
  randomStringEntropy,
  type CharClass,
  type PasswordOptions,
} from './password';

const CLASS_TOGGLES: { key: CharClass; label: string }[] = [
  { key: 'uppercase', label: 'Uppercase (A-Z)' },
  { key: 'lowercase', label: 'Lowercase (a-z)' },
  { key: 'digits', label: 'Digits (0-9)' },
  { key: 'symbols', label: 'Symbols (!@#…)' },
];

const PRESETS: { label: string; patch: Partial<PasswordOptions> }[] = [
  { label: 'Default', patch: { ...DEFAULT_PASSWORD_OPTIONS } },
  {
    label: 'Alphanumeric 32',
    patch: { uppercase: true, lowercase: true, digits: true, symbols: false, customCharset: '', length: 32 },
  },
  { label: 'Hex 64', patch: { customCharset: '0123456789abcdef', excludeAmbiguous: false, excludeChars: '', length: 64 } },
  { label: 'PIN 6', patch: { customCharset: '0123456789', excludeAmbiguous: false, excludeChars: '', length: 6 } },
];

export function PasswordTab({ onAnalyse }: { onAnalyse: (value: string) => void }) {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [count, setCount] = useState(1);
  const [nonce, setNonce] = useState(0);

  const update = useCallback(<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }));
  }, []);

  const plan = useMemo(() => buildCharset(options), [options]);

  const result = useMemo(() => {
    void nonce;
    try {
      return { values: generatePasswords(options, count), error: null };
    } catch (err) {
      return { values: [], error: err instanceof Error ? err.message : String(err) };
    }
  }, [options, count, nonce]);

  const entropy = randomStringEntropy(plan.charset.length, options.length);
  const usingCustom = options.customCharset !== '';

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel title="Options">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant="secondary"
                onClick={() => setOptions((current) => ({ ...current, ...preset.patch }))}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <RangeField label="Length" value={options.length} min={1} max={256} onChange={(value) => update('length', value)} />

          <div className={`grid grid-cols-1 gap-x-4 sm:grid-cols-2 ${usingCustom ? 'opacity-50' : ''}`}>
            {CLASS_TOGGLES.map((toggle) => (
              <Switch
                key={toggle.key}
                checked={options[toggle.key]}
                onChange={(checked) => update(toggle.key, checked)}
                label={toggle.label}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Switch
              checked={options.excludeAmbiguous}
              onChange={(checked) => update('excludeAmbiguous', checked)}
              label={<span title={AMBIGUOUS_CHARS}>Exclude ambiguous</span>}
            />
            <Switch
              checked={options.requireEachClass}
              onChange={(checked) => update('requireEachClass', checked)}
              label="One of each type"
            />
          </div>

          <Field label="Exclude characters" hint="removed from the pool">
            <TextField
              value={options.excludeChars}
              onChange={(event) => update('excludeChars', event.target.value)}
              placeholder={'e.g. {}[]"\''}
            />
          </Field>

          <Field
            label="Custom character set"
            hint={usingCustom ? 'overrides the type toggles' : 'optional'}
          >
            <div className="flex gap-2">
              <TextField
                value={options.customCharset}
                onChange={(event) => update('customCharset', event.target.value)}
                placeholder={`e.g. ${CHARSETS.digits}abcdef`}
              />
              {usingCustom && (
                <Button variant="ghost" onClick={() => update('customCharset', '')}>
                  Clear
                </Button>
              )}
            </div>
          </Field>

          <Field label="Pool" hint={`${plan.charset.length} unique characters`}>
            <div className="font-code max-h-20 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-xs leading-5 break-all text-[var(--color-muted)]">
              {plan.charset || '—'}
            </div>
          </Field>

          <RangeField label="How many" value={count} min={1} max={MAX_COUNT} onChange={setCount} />
        </div>
      </Panel>

      <GeneratedOutput
        title={count > 1 ? 'Passwords' : 'Password'}
        values={result.values}
        error={result.error}
        entropy={entropy}
        stats={[
          { label: 'Length', value: String(options.length) },
          { label: 'Pool size', value: String(plan.charset.length) },
        ]}
        onRegenerate={() => setNonce((value) => value + 1)}
        onAnalyse={onAnalyse}
      />
    </div>
  );
}
