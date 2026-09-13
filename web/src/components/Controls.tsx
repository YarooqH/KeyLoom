import styles from './Controls.module.css';

interface Options {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface ControlsProps {
  length: number;
  setLength: (v: number) => void;
  options: Options;
  setOptions: (v: Options) => void;
}

const TOGGLES: { key: keyof Options; label: string }[] = [
  { key: 'uppercase', label: 'UPPERCASE' },
  { key: 'numbers', label: 'NUMBERS' },
  { key: 'symbols', label: 'SYMBOLS' },
];

export default function Controls({ length, setLength, options, setOptions }: ControlsProps) {
  const toggle = (key: keyof Options) => {
    setOptions({ ...options, [key]: !options[key] });
  };

  return (
    <div className={styles.wrapper}>
      {/* Length selector segment */}
      <div className={styles.lengthRow}>
        <div className={styles.lengthHeader}>
          <span className={styles.label}>KEY_LENGTH</span>
          <span className={styles.lengthBadge}>{length}</span>
        </div>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className={styles.slider}
          />
        </div>
      </div>

      {/* Flag parameter toggles */}
      <div className={styles.toggles}>
        {TOGGLES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`${styles.toggle} ${options[key] ? styles.toggleActive : ''}`}
          >
            <span className={styles.toggleLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}