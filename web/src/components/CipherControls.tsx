import styles from './CipherControls.module.css';

interface Options {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface CipherControlsProps {
  length: number;
  setLength: (v: number) => void;
  options: Options;
  setOptions: (v: Options) => void;
  hideSlider?: boolean; // cipherlab hosts the length dial as a rotor ring
}

const TOGGLES: { key: keyof Options; label: string; aria: string }[] = [
  { key: 'uppercase', label: 'A-Z', aria: 'Include uppercase letters' },
  { key: 'numbers', label: '0-9', aria: 'Include numbers' },
  { key: 'symbols', label: '!@#', aria: 'Include symbols' },
];

export default function CipherControls({ length, setLength, options, setOptions, hideSlider }: CipherControlsProps) {
  const toggle = (key: keyof Options) => {
    // Prevent the ambiguous state where no character-class option is active.
    // Lowercase is always included, so keep at least one additional class on.
    const next = { ...options, [key]: !options[key] };
    if (!next.uppercase && !next.numbers && !next.symbols) {
      return;
    }
    setOptions(next);
  };

  return (
    <div className={styles.wrapper}>
      {!hideSlider && (
      <div className={styles.lengthRow}>
        <div className={styles.lengthHeader}>
          <span className={styles.label}>LENGTH</span>
          <span className={styles.lengthBadge}>{length.toString().padStart(2, '0')}</span>
        </div>
        <div className={styles.sliderContainer}>
          <span className={styles.tickLabel}>04</span>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.tickLabel}>64</span>
        </div>
      </div>
      )}

      <div className={styles.toggles} role="group" aria-label="Add character types (lowercase always included)">
        {TOGGLES.map(({ key, label, aria }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`${styles.toggle} ${options[key] ? styles.toggleActive : ''}`}
            aria-pressed={options[key]}
            aria-label={aria}
            title={aria}
          >
            <span className={styles.toggleDot} />
            <span className={styles.toggleLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}