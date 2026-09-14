/**
 * Passphrase (Diceware-style) and Numeric PIN generator for KeyLoom.
 * Uses window.crypto for cryptographically secure random selection.
 */

// Curated list of evocative, easy-to-read, phonetic words
const WORD_POOL = [
  'amber', 'anchor', 'apex', 'arcane', 'arctic', 'arrow', 'astral', 'atlas', 'aurora', 'avatar',
  'azure', 'beacon', 'breeze', 'bridge', 'cadence', 'canyon', 'cascade', 'castle', 'cedar', 'celestial',
  'cipher', 'clarity', 'cloud', 'cobalt', 'comet', 'compass', 'copper', 'coral', 'cosmos', 'canyon',
  'crystal', 'current', 'dawn', 'delta', 'drift', 'dune', 'dynamo', 'echo', 'eclipse', 'element',
  'ember', 'emerald', 'enigma', 'epoch', 'falcon', 'fathom', 'feather', 'flare', 'flint', 'flux',
  'forest', 'forge', 'fractal', 'frost', 'galaxy', 'garnet', 'glacier', 'glimmer', 'granite', 'grove',
  'halo', 'harbor', 'haven', 'helix', 'horizon', 'hyper', 'ignite', 'impact', 'indigo', 'infinity',
  'island', 'jade', 'jaguar', 'journey', 'juniper', 'karma', 'kinetic', 'lagoon', 'lantern', 'laser',
  'legacy', 'legend', 'light', 'linear', 'lunar', 'magnet', 'mantle', 'matrix', 'meadow', 'meteor',
  'mirage', 'monarch', 'mosaic', 'mystic', 'nebula', 'nexus', 'noble', 'nomad', 'nova', 'oasis',
  'obsidian', 'ocean', 'omega', 'onyx', 'optics', 'oracle', 'orbit', 'origin', 'ozone', 'palace',
  'paragon', 'passage', 'peak', 'phantom', 'phoenix', 'pillar', 'pilot', 'plasma', 'polar', 'portal',
  'prism', 'pulse', 'pyramid', 'quantum', 'quarry', 'quartz', 'quasar', 'radiant', 'radius', 'ravine',
  'reef', 'relic', 'resonance', 'ridge', 'ripple', 'river', 'rocket', 'rune', 'saffron', 'sapphire',
  'satellite', 'scenic', 'shadow', 'shield', 'shimmer', 'sierra', 'signal', 'silicon', 'silver', 'solar',
  'spark', 'spectra', 'sphere', 'spiral', 'summit', 'supernova', 'surge', 'synergy', 'talisman', 'tempo',
  'terra', 'thermal', 'thunder', 'tide', 'timber', 'titan', 'topaz', 'torrent', 'tracer', 'tropic',
  'ultra', 'umbra', 'valiant', 'valley', 'vapor', 'vector', 'velocity', 'velvet', 'vertex', 'vessel',
  'vibrant', 'violet', 'vortex', 'voyage', 'warden', 'wave', 'whisper', 'zenith', 'zephyr', 'zodiac',
];

function getSecureRandomInt(max: number): number {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export interface PassphraseOptions {
  wordCount: number;
  separator: '-' | '.' | '_' | '/' | ' ';
  capitalize: boolean;
  includeNumber: boolean;
}

export function generatePassphrase(options: PassphraseOptions): string {
  const { wordCount = 4, separator = '-', capitalize = true, includeNumber = true } = options;
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const idx = getSecureRandomInt(WORD_POOL.length);
    let word = WORD_POOL[idx];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    words.push(word);
  }

  if (includeNumber) {
    const num = getSecureRandomInt(90) + 10; // 10 to 99
    words.push(String(num));
  }

  return words.join(separator);
}

export interface PinOptions {
  length: number;
  grouping?: boolean;
}

export function generatePin(options: PinOptions): string {
  const { length = 6, grouping = true } = options;
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += String(getSecureRandomInt(10));
  }
  if (grouping && length >= 6) {
    if (length === 6) return `${pin.slice(0, 3)}-${pin.slice(3)}`;
    if (length === 8) return `${pin.slice(0, 4)}-${pin.slice(4)}`;
    if (length === 12) return `${pin.slice(0, 4)}-${pin.slice(4, 8)}-${pin.slice(8)}`;
    if (length === 16) return `${pin.slice(0, 4)}-${pin.slice(4, 8)}-${pin.slice(8, 12)}-${pin.slice(12)}`;
  }
  return pin;
}
