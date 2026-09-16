// Cryptographically secure, unbiased random helpers built on
// crypto.getRandomValues (rejection sampling, never Math.random).

const UINT32_RANGE = 0x1_0000_0000;

/** Uniform integer in [0, max). */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError(`randomInt: max must be an integer in 1..2^32, got ${max}`);
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % max);
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

export function randomItem<T>(items: ArrayLike<T>): T {
  return items[randomInt(items.length)];
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
