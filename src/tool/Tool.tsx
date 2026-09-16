import { useCallback, useState } from 'react';
import { SegmentedControl } from '@mmoall/tool-kit';
import { PassphraseTab } from './PassphraseTab';
import { PasswordTab } from './PasswordTab';
import { StrengthTab } from './StrengthTab';

type TabId = 'password' | 'passphrase' | 'strength';

const TABS: { value: TabId; label: string }[] = [
  { value: 'password', label: 'Password / Token' },
  { value: 'passphrase', label: 'Passphrase' },
  { value: 'strength', label: 'Strength analyser' },
];

export function Tool() {
  const [tab, setTab] = useState<TabId>('password');
  const [analysed, setAnalysed] = useState('');

  const handleAnalyse = useCallback((value: string) => {
    setAnalysed(value);
    setTab('strength');
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl aria-label="Mode" value={tab} onChange={setTab} options={TABS} className="self-start" />
      {tab === 'password' && <PasswordTab onAnalyse={handleAnalyse} />}
      {tab === 'passphrase' && <PassphraseTab onAnalyse={handleAnalyse} />}
      {tab === 'strength' && <StrengthTab value={analysed} onChange={setAnalysed} />}
    </div>
  );
}
