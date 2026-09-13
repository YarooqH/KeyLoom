import { useState as _useState } from 'react';
void _useState;
import { motion } from 'framer-motion';
import PasswordDisplay from './PasswordDisplay';
import Controls from './Controls';
import GenerateButton from './GenerateButton';
import styles from './SingularityGenerator.module.css';

interface Options {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface SingularityGeneratorProps {
  password: string;
  length: number;
  setLength: (v: number) => void;
  options: Options;
  setOptions: (v: Options) => void;
  onGenerate: () => void;
  onCopy: () => void;
  copied: boolean;
}

export default function SingularityGenerator({
  password,
  length,
  setLength,
  options,
  setOptions,
  onGenerate,
  onCopy,
  copied,
}: SingularityGeneratorProps) {
  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.topMeta}>
        <span className={styles.label}>KEYLOOM</span>
        <span className={styles.sep}>//</span>
        <span className={styles.mode}>SINGULARITY</span>
      </div>

      <h1 className={styles.heading}>GENERATE</h1>
      <p className={styles.sub}>Entropy-driven key derivation. No servers. No logs.</p>

      <div className={styles.output}>
        <PasswordDisplay password={password} onCopy={onCopy} copied={copied} />
      </div>

      <Controls length={length} setLength={setLength} options={options} setOptions={setOptions} />

      <GenerateButton onClick={onGenerate} />

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.metaKey}>ALGO</span>
          <span className={styles.metaVal}>CSPRNG</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKey}>ENTROPY</span>
          <span className={styles.metaVal}>{length * 8} bits</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaKey}>STORAGE</span>
          <span className={styles.metaVal}>NONE</span>
        </div>
      </div>
    </motion.div>
  );
}
