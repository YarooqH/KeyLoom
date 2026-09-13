import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Theme } from '../themes';
import styles from './ThemeSelector.module.css';

interface Props {
  themes: Theme[];
  currentId: string;
  onSelect: (id: string) => void;
}

function swatchBackground(t: Theme): string {
  // A ring-like conic gradient using the theme's hot->cold ramp
  const stops = t.gradient.map((c, i) => `${c} ${(i / t.gradient.length) * 360}deg`).join(', ');
  return `conic-gradient(from -90deg, ${stops})`;
}

export default function ThemeSelector({ themes, currentId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const current = themes.find(t => t.id === currentId) ?? themes[0];
  const dark = themes.filter(t => t.mode === 'dark');
  const light = themes.filter(t => t.mode === 'light');

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.header}>
              <span className={styles.headerLabel}>THEME</span>
              <span className={styles.headerName}>{current.name}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>DARK</span>
              <div className={styles.swatches}>
                {dark.map(t => (
                  <Swatch
                    key={t.id}
                    theme={t}
                    selected={t.id === currentId}
                    onClick={() => onSelect(t.id)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>LIGHT</span>
              <div className={styles.swatches}>
                {light.map(t => (
                  <Swatch
                    key={t.id}
                    theme={t}
                    selected={t.id === currentId}
                    onClick={() => onSelect(t.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        title={current.name}
        aria-label={`Theme: ${current.name}`}
      >
        <div className={styles.triggerSwatch} style={{ background: swatchBackground(current) }} />
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>
    </div>
  );
}

function Swatch({ theme, selected, onClick }: { theme: Theme; selected: boolean; onClick: () => void }) {
  return (
    <motion.button
      className={`${styles.swatch} ${selected ? styles.swatchSelected : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.12, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      title={theme.name}
      aria-label={theme.name}
    >
      <div className={styles.swatchInner} style={{ background: swatchBackground(theme) }} />
    </motion.button>
  );
}
