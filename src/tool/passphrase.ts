import { randomInt, randomItem } from './random';
import { EFF_LARGE_WORDS, EFF_SHORT_WORDS } from './wordlists';

export type WordlistId = 'eff-large' | 'eff-short';
export type WordCase = 'lower' | 'title' | 'upper' | 'random';

const SOURCES: Record<WordlistId, string> = {
  'eff-large': EFF_LARGE_WORDS,
  'eff-short': EFF_SHORT_WORDS,
};

const cache = new Map<WordlistId, string[]>();

export function getWordlist(id: WordlistId): string[] {
  let words = cache.get(id);
  if (!words) {
    words = SOURCES[id].split(' ');
    cache.set(id, words);
  }
  return words;
}

export const PASSPHRASE_SYMBOLS = '!@#$%^&*?';
export const MAX_WORDS = 20;

export interface PassphraseOptions {
  wordlist: WordlistId;
  words: number;
  separator: string;
  wordCase: WordCase;
  includeNumber: boolean;
  includeSymbol: boolean;
}

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  wordlist: 'eff-large',
  words: 5,
  separator: '-',
  wordCase: 'lower',
  includeNumber: false,
  includeSymbol: false,
};

function applyCase(word: string, wordCase: WordCase): string {
  switch (wordCase) {
    case 'lower':
      return word;
    case 'upper':
      return word.toUpperCase();
    case 'title':
      return word.charAt(0).toUpperCase() + word.slice(1);
    case 'random':
      return randomInt(2) === 0 ? word : word.toUpperCase();
  }
}

export function generatePassphrase(options: PassphraseOptions): string {
  const list = getWordlist(options.wordlist);
  const count = Math.max(1, Math.min(MAX_WORDS, Math.floor(options.words)));
  const words = Array.from({ length: count }, () => applyCase(randomItem(list), options.wordCase));

  if (options.includeNumber) {
    const index = randomInt(count);
    words[index] += String(randomInt(10));
  }
  if (options.includeSymbol) {
    const index = randomInt(count);
    words[index] += randomItem(PASSPHRASE_SYMBOLS);
  }
  return words.join(options.separator);
}

export function generatePassphrases(options: PassphraseOptions, count: number): string[] {
  return Array.from({ length: Math.max(1, count) }, () => generatePassphrase(options));
}

/** Entropy in bits, assuming the attacker knows the wordlist and settings. */
export function passphraseEntropy(options: PassphraseOptions): number {
  const count = Math.max(1, Math.min(MAX_WORDS, Math.floor(options.words)));
  let bits = count * Math.log2(getWordlist(options.wordlist).length);
  if (options.wordCase === 'random') bits += count;
  if (options.includeNumber) bits += Math.log2(10) + Math.log2(count);
  if (options.includeSymbol) bits += Math.log2(PASSPHRASE_SYMBOLS.length) + Math.log2(count);
  return bits;
}
