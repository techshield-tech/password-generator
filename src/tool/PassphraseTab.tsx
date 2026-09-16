import { useCallback, useMemo, useState } from 'react';
import { Panel, SegmentedControl, Select, Switch } from '@mmoall/tool-kit';
import { GeneratedOutput } from './GeneratedOutput';
import { Field, RangeField, TextField } from './local-ui';
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  MAX_WORDS,
  generatePassphrases,
  getWordlist,
  passphraseEntropy,
  type PassphraseOptions,
  type WordCase,
  type WordlistId,
} from './passphrase';

const WORDLIST_OPTIONS: { value: WordlistId; label: string }[] = [
  { value: 'eff-large', label: 'EFF large (7,776 words)' },
  { value: 'eff-short', label: 'EFF short (1,296 words)' },
];

const CASE_OPTIONS: { value: WordCase; label: string }[] = [
  { value: 'lower', label: 'lower' },
  { value: 'title', label: 'Title' },
  { value: 'upper', label: 'UPPER' },
  { value: 'random', label: 'rAnDoM' },
];

type SeparatorId = '-' | ' ' | '.' | '_' | ',' | '' | 'custom';

const SEPARATOR_OPTIONS: { value: SeparatorId; label: string }[] = [
  { value: '-', label: 'Hyphen ( - )' },
  { value: ' ', label: 'Space' },
  { value: '.', label: 'Period ( . )' },
  { value: '_', label: 'Underscore ( _ )' },
  { value: ',', label: 'Comma ( , )' },
  { value: '', label: 'None' },
  { value: 'custom', label: 'Custom…' },
];

export function PassphraseTab({ onAnalyse }: { onAnalyse: (value: string) => void }) {
  const [options, setOptions] = useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS);
  const [separatorId, setSeparatorId] = useState<SeparatorId>('-');
  const [customSeparator, setCustomSeparator] = useState('~');
  const [count, setCount] = useState(1);
  const [nonce, setNonce] = useState(0);

  const update = useCallback(<K extends keyof PassphraseOptions>(key: K, value: PassphraseOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }));
  }, []);

  const effective = useMemo<PassphraseOptions>(
    () => ({ ...options, separator: separatorId === 'custom' ? customSeparator : separatorId }),
    [options, separatorId, customSeparator],
  );

  const values = useMemo(() => {
    void nonce;
    return generatePassphrases(effective, count);
  }, [effective, count, nonce]);

  const entropy = passphraseEntropy(effective);
  const listSize = getWordlist(effective.wordlist).length;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel title="Options">
        <div className="flex flex-col gap-4">
          <RangeField label="Words" value={options.words} min={1} max={MAX_WORDS} onChange={(value) => update('words', value)} />

          <Field label="Wordlist">
            <Select
              aria-label="Wordlist"
              value={options.wordlist}
              onChange={(event) => update('wordlist', event.target.value as WordlistId)}
              options={WORDLIST_OPTIONS}
              className="w-full [&>select]:w-full"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Separator">
              <Select
                aria-label="Separator"
                value={separatorId}
                onChange={(event) => setSeparatorId(event.target.value as SeparatorId)}
                options={SEPARATOR_OPTIONS}
                className="w-full [&>select]:w-full"
              />
            </Field>
            {separatorId === 'custom' && (
              <Field label="Custom separator">
                <TextField value={customSeparator} onChange={(event) => setCustomSeparator(event.target.value)} />
              </Field>
            )}
          </div>

          <Field label="Capitalisation">
            <SegmentedControl
              aria-label="Capitalisation"
              value={options.wordCase}
              onChange={(value) => update('wordCase', value)}
              options={CASE_OPTIONS}
              className="self-start"
            />
          </Field>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Switch
              checked={options.includeNumber}
              onChange={(checked) => update('includeNumber', checked)}
              label="Add a digit"
            />
            <Switch
              checked={options.includeSymbol}
              onChange={(checked) => update('includeSymbol', checked)}
              label="Add a symbol"
            />
          </div>

          <RangeField label="How many" value={count} min={1} max={100} onChange={setCount} />

          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Words are picked uniformly with <code className="font-code">crypto.getRandomValues</code> from the{' '}
            EFF Diceware lists. Entropy assumes the attacker knows the list and your settings.
          </p>
        </div>
      </Panel>

      <GeneratedOutput
        title={count > 1 ? 'Passphrases' : 'Passphrase'}
        values={values}
        error={null}
        entropy={entropy}
        stats={[
          { label: 'Characters', value: String(values[0]?.length ?? 0) },
          { label: 'Bits / word', value: Math.log2(listSize).toFixed(2) },
        ]}
        onRegenerate={() => setNonce((value) => value + 1)}
        onAnalyse={onAnalyse}
      />
    </div>
  );
}
