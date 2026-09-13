import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'slot-text/style.css';
import styles from './PasswordDisplay.module.css';

interface PasswordDisplayProps {
  password: string;
  onCopy: () => void;
  copied: boolean;
  generating?: boolean;
  showCopyButton?: boolean;
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

export default function PasswordDisplay({ password, onCopy, copied, generating = false, showCopyButton = true }: PasswordDisplayProps) {
  const [displayChars, setDisplayChars] = useState<string[]>([]);
  const prevPassword = useRef(password);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (password === prevPassword.current) return;
    prevPassword.current = password;

    if (!password) {
      setDisplayChars([]);
      return;
    }

    const chars = password.split('');
    const current = chars.map(() => randomChar());
    setDisplayChars([...current]);

    const totalDuration = 700;
    const steps = 22;
    const interval = totalDuration / steps;
    let step = 0;

    const tick = () => {
      step++;
      const progress = step / steps;

      setDisplayChars((prev) =>
        prev.map((_, i) => {
          const charDelay = (i / chars.length) * 0.45;
          if (progress > charDelay + 0.55) return chars[i];
          if (progress > charDelay) {
            const t = (progress - charDelay) / 0.55;
            if (t > 0.75 || Math.random() > 0.5) return chars[i];
          }
          return randomChar();
        })
      );

      if (step < steps) {
        rafRef.current = window.setTimeout(tick, interval);
      } else {
        setDisplayChars(chars);
      }
    };

    rafRef.current = window.setTimeout(tick, interval);
    return () => {
      if (rafRef.current !== null) clearTimeout(rafRef.current);
    };
  }, [password]);

  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleCopy = useCallback(() => {
    if (!password || generating) return;
    onCopy();
  }, [password, generating, onCopy]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.display} ${displayChars.length > 0 && !generating ? styles.displayCopyable : ''} ${generating ? styles.displayGenerating : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMousePos(null); }}
        onMouseMove={handleMouseMove}
        onClick={handleCopy}
        title={displayChars.length > 0 && !generating ? 'Copy to clipboard' : undefined}
        role="button"
        aria-label={displayChars.length > 0 ? 'Copy password' : 'Password display'}
        aria-live="polite"
        aria-busy={generating}
        tabIndex={displayChars.length > 0 && !generating ? 0 : -1}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopy(); } }}
      >
        <AnimatePresence mode="wait">
          {displayChars.length === 0 ? (
            <motion.p
              key="placeholder"
              className={styles.placeholder}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
            >
              INITIALIZE GENERATION SEQUENCE
            </motion.p>
          ) : generating ? (
            <motion.p
              key="generating"
              className={styles.generatingLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ALIGNING ROTORS…
            </motion.p>
          ) : (
            <motion.div
              key="password"
              className={styles.passwordRow}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {displayChars.map((char, i) => (
                <span key={i} className={char !== password[i] ? styles.scrambling : styles.char}>
                  {char}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover tooltip: COPY above the cursor, COPIED after click */}
        <AnimatePresence>
          {displayChars.length > 0 && !generating && hovered && mousePos && (
            <motion.span
              className={`${styles.tooltip} ${copied ? styles.tooltipCopied : ''}`}
              style={{ left: mousePos.x, top: Math.max(0, mousePos.y - 26) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              {copied ? 'COPIED' : 'COPY'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {showCopyButton && displayChars.length > 0 && (
        <div className={styles.copyRow}>
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
            onClick={handleCopy}
            disabled={generating}
            aria-label={copied ? 'Password copied' : 'Copy password'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        </div>
      )}

      {/* Accessible copy confirmation, visible to screen readers and sighted users */}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {copied ? 'Password copied to clipboard' : ''}
      </div>
    </div>
  );
}