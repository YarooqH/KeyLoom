import { motion } from 'framer-motion';
import PasswordDisplay from './PasswordDisplay';
import Controls from './Controls';
import GenerateButton from './GenerateButton';
import styles from './SupernovaGenerator.module.css';

interface Options {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface SupernovaGeneratorProps {
  password: string;
  length: number;
  setLength: (v: number) => void;
  options: Options;
  setOptions: (v: Options) => void;
  onGenerate: () => void;
  onCopy: () => void;
  copied: boolean;
}

export default function SupernovaGenerator({
  password,
  length,
  setLength,
  options,
  setOptions,
  onGenerate,
  onCopy,
  copied,
}: SupernovaGeneratorProps) {
  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>CORE</span>
          <span className={styles.statusValue}>
            <span className={styles.statusDot} />
            ACTIVE
          </span>
        </div>
        <div className={styles.statusDivider} />
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>FUEL</span>
          <span className={styles.statusValue}>HEAVY ELEMENTS</span>
        </div>
        <div className={styles.statusDivider} />
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>PHASE</span>
          <span className={styles.statusValue}>FUSION</span>
        </div>
        <div className={styles.statusDivider} />
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>ENTROPY</span>
          <span className={styles.statusValue}>
            {password ? Math.round(length * 5.7) : 0} bits
          </span>
        </div>
        <div className={styles.statusDivider} />
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>STORAGE</span>
          <span className={styles.statusValue}>NONE</span>
        </div>
      </div>

      <div className={styles.contentRow}>
        <div className={styles.output}>
          <PasswordDisplay password={password} onCopy={onCopy} copied={copied} />
        </div>
        <div className={styles.divider} />
        <div className={styles.sidebar}>
          <Controls length={length} setLength={setLength} options={options} setOptions={setOptions} />
          <div className={styles.actionContainer}>
            <GenerateButton onClick={onGenerate} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
