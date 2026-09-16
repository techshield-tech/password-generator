// Brute-force strength estimate: entropy = length × log2(pool size), where
// the pool is inferred from the character classes present. Adds pattern
// warnings (common passwords, repeats, sequences) that brute force ignores.

export interface CharsetBreakdown {
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  other: boolean;
}

export interface AttackScenario {
  label: string;
  description: string;
  guessesPerSecond: number;
}

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    label: 'Online, throttled',
    description: '100 guesses / hour',
    guessesPerSecond: 100 / 3600,
  },
  {
    label: 'Online, unthrottled',
    description: '10 guesses / second',
    guessesPerSecond: 10,
  },
  {
    label: 'Offline, slow hash',
    description: '10k guesses / second (bcrypt, Argon2)',
    guessesPerSecond: 1e4,
  },
  {
    label: 'Offline, fast hash',
    description: '10B guesses / second (MD5, SHA-1 on GPUs)',
    guessesPerSecond: 1e10,
  },
];

export const DEFAULT_SCENARIO_INDEX = 3;

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very strong',
};

export interface StrengthReport {
  length: number;
  charsetSize: number;
  breakdown: CharsetBreakdown;
  entropy: number;
  level: StrengthLevel;
  /** 0..1, entropy relative to 128 bits. */
  score: number;
  /** Found in the built-in list of most common passwords. */
  isCommon: boolean;
  warnings: string[];
}

const COMMON_PASSWORDS = new Set([
  '123456', '123456789', '12345678', '12345', '1234567', '1234567890', '111111', '000000',
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'qwerty', 'qwerty123',
  'qwertyuiop', 'abc123', 'letmein', 'welcome', 'welcome1', 'admin', 'admin123', 'root',
  'iloveyou', 'monkey', 'dragon', 'football', 'baseball', 'master', 'sunshine', 'princess',
  'shadow', 'superman', 'trustno1', 'login', 'starwars', 'whatever', 'freedom', 'hello',
  'hello123', 'secret', 'changeme', 'default', 'guest', 'test', 'test123', '654321',
  '1q2w3e4r', '1qaz2wsx', 'zaq12wsx', 'asdfghjkl', 'azerty', '123123', '987654321',
]);

const SEQUENCES = [
  'abcdefghijklmnopqrstuvwxyz',
  '01234567890',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

export function getCharsetBreakdown(password: string): CharsetBreakdown {
  return {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digits: /\d/.test(password),
    symbols: /[\x20-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/.test(password),
    other: /[^\x20-\x7e]/.test(password),
  };
}

export function getCharsetSize(breakdown: CharsetBreakdown): number {
  return (
    (breakdown.lowercase ? 26 : 0) +
    (breakdown.uppercase ? 26 : 0) +
    (breakdown.digits ? 10 : 0) +
    (breakdown.symbols ? 33 : 0) +
    (breakdown.other ? 100 : 0)
  );
}

function hasSequence(lower: string, run: number): boolean {
  for (const sequence of SEQUENCES) {
    const reversed = Array.from(sequence).reverse().join('');
    for (let i = 0; i + run <= sequence.length; i++) {
      if (lower.includes(sequence.slice(i, i + run)) || lower.includes(reversed.slice(i, i + run))) {
        return true;
      }
    }
  }
  return false;
}

export function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  const deLeet = lower
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's');
  return COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(deLeet);
}

function findWarnings(password: string, length: number, breakdown: CharsetBreakdown, isCommon: boolean): string[] {
  const warnings: string[] = [];
  const lower = password.toLowerCase();

  if (isCommon) {
    warnings.push('This is one of the most common passwords — it would be guessed instantly.');
  }
  if (length < 12) {
    warnings.push('Shorter than 12 characters. Length matters more than complexity.');
  }
  if (/(.)\1{2,}/u.test(password)) {
    warnings.push('Contains a character repeated 3+ times in a row.');
  }
  if (hasSequence(lower, 4)) {
    warnings.push('Contains a predictable sequence (e.g. "abcd", "1234", "qwer").');
  }
  if (/(19|20)\d{2}/.test(password)) {
    warnings.push('Contains what looks like a year — dates are easy to guess.');
  }
  const classes = [breakdown.lowercase, breakdown.uppercase, breakdown.digits, breakdown.symbols, breakdown.other].filter(Boolean).length;
  if (length > 0 && classes === 1) {
    warnings.push('Uses a single character type only.');
  }
  return warnings;
}

export function entropyLevel(entropy: number): StrengthLevel {
  if (entropy < 28) return 0;
  if (entropy < 36) return 1;
  if (entropy < 60) return 2;
  if (entropy < 100) return 3;
  return 4;
}

export function analysePassword(password: string): StrengthReport {
  const length = Array.from(password).length;
  const breakdown = getCharsetBreakdown(password);
  const charsetSize = getCharsetSize(breakdown);
  const entropy = length === 0 || charsetSize === 0 ? 0 : length * Math.log2(charsetSize);
  const isCommon = length > 0 && isCommonPassword(password);
  const warnings = length === 0 ? [] : findWarnings(password, length, breakdown, isCommon);

  const level: StrengthLevel = isCommon ? 0 : entropyLevel(entropy);
  return {
    length,
    charsetSize,
    breakdown,
    entropy,
    level,
    score: isCommon ? 0 : Math.min(entropy / 128, 1),
    isCommon,
    warnings,
  };
}

/** Average time to find the password by brute force: half the keyspace. */
export function crackSeconds(entropy: number, guessesPerSecond: number): number {
  if (entropy <= 0) return 0;
  return 2 ** (entropy - 1) / guessesPerSecond;
}

const TIME_UNITS: { singular: string; plural: string; seconds: number }[] = [
  { singular: 'millennium', plural: 'millennia', seconds: 31_536_000_000 },
  { singular: 'century', plural: 'centuries', seconds: 3_153_600_000 },
  { singular: 'year', plural: 'years', seconds: 31_536_000 },
  { singular: 'month', plural: 'months', seconds: 2_592_000 },
  { singular: 'day', plural: 'days', seconds: 86_400 },
  { singular: 'hour', plural: 'hours', seconds: 3_600 },
  { singular: 'minute', plural: 'minutes', seconds: 60 },
  { singular: 'second', plural: 'seconds', seconds: 1 },
];

function formatQuantity(value: number): string {
  if (value >= 1e15) {
    const [mantissa, exponent] = value.toExponential(2).split('e');
    return `${mantissa} × 10^${exponent.replace('+', '')}`;
  }
  return Math.floor(value).toLocaleString('en-US');
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'Longer than the age of the universe';
  if (seconds < 0.001) return 'Instantly';
  if (seconds < 1) return 'Less than a second';
  if (seconds > 4.35e17) return `${formatQuantity(seconds / TIME_UNITS[0].seconds)} millennia (longer than the age of the universe)`;

  for (const unit of TIME_UNITS) {
    if (seconds >= unit.seconds) {
      const quantity = seconds / unit.seconds;
      return `${formatQuantity(quantity)} ${Math.floor(quantity) === 1 ? unit.singular : unit.plural}`;
    }
  }
  return 'Instantly';
}
