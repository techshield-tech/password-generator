import { randomItem, shuffle } from './random';

export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
} as const;

export type CharClass = keyof typeof CHARSETS;

export const AMBIGUOUS_CHARS = 'Il1|O0oB8S5Z2`\'"';

export const MAX_LENGTH = 1024;
export const MAX_COUNT = 500;

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  /** Characters removed from every pool. */
  excludeChars: string;
  /** When non-empty, replaces the class toggles entirely. */
  customCharset: string;
  /** Guarantee at least one character from every enabled class. */
  requireEachClass: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  excludeChars: '',
  customCharset: '',
  requireEachClass: true,
};

export interface CharsetPlan {
  /** Non-empty pools, one per enabled class (or a single custom pool). */
  pools: string[];
  /** Deduplicated union of all pools. */
  charset: string;
}

function uniqueChars(value: string): string {
  return Array.from(new Set(Array.from(value))).join('');
}

export function buildCharset(options: PasswordOptions): CharsetPlan {
  const removed = new Set(Array.from(options.excludeChars));
  if (options.excludeAmbiguous) {
    for (const char of AMBIGUOUS_CHARS) removed.add(char);
  }
  const filter = (pool: string) =>
    Array.from(uniqueChars(pool))
      .filter((char) => !removed.has(char))
      .join('');

  const rawPools =
    options.customCharset !== ''
      ? [filter(options.customCharset)]
      : (Object.keys(CHARSETS) as CharClass[])
          .filter((key) => options[key])
          .map((key) => filter(CHARSETS[key]));

  const pools = rawPools.filter((pool) => pool.length > 0);
  return { pools, charset: uniqueChars(pools.join('')) };
}

export function generatePassword(options: PasswordOptions, plan = buildCharset(options)): string {
  const { pools, charset } = plan;
  if (charset.length === 0) {
    throw new Error('The character set is empty — enable at least one character type.');
  }
  const length = Math.max(1, Math.min(MAX_LENGTH, Math.floor(options.length)));
  const chars = Array.from(charset);
  const result: string[] = [];

  if (options.requireEachClass && pools.length > 1 && length >= pools.length) {
    for (const pool of pools) result.push(randomItem(Array.from(pool)));
  }
  while (result.length < length) result.push(randomItem(chars));

  return shuffle(result).join('');
}

export function generatePasswords(options: PasswordOptions, count: number): string[] {
  const plan = buildCharset(options);
  const total = Math.max(1, Math.min(MAX_COUNT, Math.floor(count)));
  return Array.from({ length: total }, () => generatePassword(options, plan));
}

/** Entropy in bits of a uniformly random string (ignores the small "require each class" bias). */
export function randomStringEntropy(charsetSize: number, length: number): number {
  return charsetSize <= 1 ? 0 : length * Math.log2(charsetSize);
}
