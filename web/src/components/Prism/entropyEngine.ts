/**
 * Cryptographic entropy and password security analytics engine.
 */

export interface EntropyResult {
  bits: number;
  score: number; // 0 to 100%
  tier: 'vulnerable' | 'moderate' | 'strong' | 'fortress' | 'quantum';
  tierLabel: string;
  tierColor: string;
  crackTimeHuman: string;
  characterBreakdown: {
    lowercase: number;
    uppercase: number;
    numbers: number;
    symbols: number;
    other: number;
    total: number;
  };
}

export type CharCategory = 'lowercase' | 'uppercase' | 'number' | 'symbol' | 'separator';

export function getCharCategory(ch: string): CharCategory {
  if (/[a-z]/.test(ch)) return 'lowercase';
  if (/[A-Z]/.test(ch)) return 'uppercase';
  if (/[0-9]/.test(ch)) return 'number';
  if (/[-_./\s]/.test(ch)) return 'separator';
  return 'symbol';
}

/**
 * Assumes an attacker capable of 100 billion (10^11) guesses per second
 * (modern offline GPU cluster hash cracking speed).
 */
export function calculateEntropy(password: string): EntropyResult {
  if (!password || password.length === 0) {
    return {
      bits: 0,
      score: 0,
      tier: 'vulnerable',
      tierLabel: 'EMPTY',
      tierColor: '#ef4444',
      crackTimeHuman: 'Instant',
      characterBreakdown: { lowercase: 0, uppercase: 0, numbers: 0, symbols: 0, other: 0, total: 0 },
    };
  }

  let hasLower = false;
  let hasUpper = false;
  let hasNumber = false;
  let hasSymbol = false;

  const breakdown = {
    lowercase: 0,
    uppercase: 0,
    numbers: 0,
    symbols: 0,
    other: 0,
    total: password.length,
  };

  for (const ch of password) {
    if (/[a-z]/.test(ch)) {
      hasLower = true;
      breakdown.lowercase++;
    } else if (/[A-Z]/.test(ch)) {
      hasUpper = true;
      breakdown.uppercase++;
    } else if (/[0-9]/.test(ch)) {
      hasNumber = true;
      breakdown.numbers++;
    } else if (/[-_./\s]/.test(ch)) {
      breakdown.other++;
    } else {
      hasSymbol = true;
      breakdown.symbols++;
    }
  }

  // Determine pool size
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;
  if (breakdown.other > 0 && !hasSymbol) poolSize += 4;
  if (poolSize === 0) poolSize = 1;

  // Bits of entropy: L * log2(poolSize)
  const bits = Math.round(password.length * Math.log2(poolSize));

  // Score scaled up to 100 (128 bits = 100%)
  const score = Math.min(100, Math.round((bits / 110) * 100));

  let tier: EntropyResult['tier'] = 'vulnerable';
  let tierLabel = 'VULNERABLE';
  let tierColor = '#ef4444';

  if (bits >= 110) {
    tier = 'quantum';
    tierLabel = 'QUANTUM-GRADE';
    tierColor = '#38bdf8'; // bright cyan/prism
  } else if (bits >= 80) {
    tier = 'fortress';
    tierLabel = 'FORTRESS-TIER';
    tierColor = '#a855f7'; // violet
  } else if (bits >= 60) {
    tier = 'strong';
    tierLabel = 'CRYPTOGRAPHIC STRONG';
    tierColor = '#10b981'; // emerald
  } else if (bits >= 40) {
    tier = 'moderate';
    tierLabel = 'MODERATE';
    tierColor = '#f59e0b'; // amber
  }

  // Crack time estimation:
  // combinations = poolSize ^ length = 2 ^ bits
  // time (seconds) = combinations / 10^11 / 2 (average half search)
  const crackTimeHuman = estimateCrackTime(bits);

  return {
    bits,
    score,
    tier,
    tierLabel,
    tierColor,
    crackTimeHuman,
    characterBreakdown: breakdown,
  };
}

function estimateCrackTime(bits: number): string {
  if (bits < 28) return 'Instant';
  if (bits < 34) return '< 1 second';
  if (bits < 40) return 'Few seconds';
  if (bits < 46) return '3 minutes';
  if (bits < 52) return '4 hours';
  if (bits < 58) return '11 days';
  if (bits < 64) return '2 years';
  if (bits < 70) return '130 years';
  if (bits < 80) return '140,000 years';
  if (bits < 90) return '140 million years';
  if (bits < 100) return '140 billion years';
  return 'Heat death of Universe';
}
