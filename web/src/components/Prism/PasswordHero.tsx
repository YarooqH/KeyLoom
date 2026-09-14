import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCharCategory, type CharCategory, type EntropyResult } from './entropyEngine';
import { audioEngine } from './audioEngine';
import styles from './PasswordHero.module.css';

const CIPHER_GLYPHS = '0123456789ABCDEF!@#$%&*?§±⌁⌂⍺⌘⌬⏣⎔⍟⌖◈';

interface Props {
  password: string;
  generating: boolean;
  copied: boolean;
  entropy: EntropyResult;
  onGenerate: () => void;
  onCopy: () => void;
  onHoverCategory?: (cat: CharCategory | null) => void;
}

export default function PasswordHero({
  password,
  generating,
  copied,
  entropy,
  onGenerate,
  onCopy,
  onHoverCategory,
}: Props) {
  const [displayChars, setDisplayChars] = useState<string[]>(password ? password.split('') : []);
  const [activeCategory, setActiveCategory] = useState<CharCategory | null>(null);
  const [hoveredCharIndex, setHoveredCharIndex] = useState<number | null>(null);

  // Scramble deciphering effect when password changes or during generation
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!password) return;
    const targetChars = password.split('');
    const len = targetChars.length;
    const totalFrames = Math.min(30, Math.max(16, len * 1.5));
    let frame = 0;

    const runGlitch = () => {
      frame++;
      const resolvedCount = Math.floor((frame / totalFrames) * len);
      const nextChars = targetChars.map((realChar, i) => {
        if (i < resolvedCount) {
          return realChar;
        }
        return CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)];
      });

      setDisplayChars(nextChars);

      if (frame < totalFrames) {
        animationFrameRef.current = requestAnimationFrame(runGlitch);
      } else {
        setDisplayChars(targetChars);
      }
    };

    runGlitch();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [password]);

  const handleCategoryHover = (cat: CharCategory | null) => {
    setActiveCategory(cat);
    if (onHoverCategory) onHoverCategory(cat);
  };

  const { characterBreakdown } = entropy;

  return (
    <div className={styles.heroCard}>
      {/* Top row status */}
      <div className={styles.cardTopRow}>
        <div className={styles.statusIndicator}>
          <div className={styles.pulseDot} />
          <span>QUANTUM DECRYPTION MATRIX</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: entropy.tierColor, fontWeight: 600 }}>
            {entropy.tierLabel}
          </span>
          <span>·</span>
          <span>{entropy.bits} BITS</span>
        </div>
      </div>

      {/* Hero readout slot */}
      <div
        className={styles.passwordReadoutArea}
        onClick={onCopy}
        title="Click to copy to clipboard"
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCopy();
          }
        }}
      >
        <div className={styles.charContainer}>
          {displayChars.map((ch, idx) => {
            const cat = getCharCategory(ch);
            const isDimmed = activeCategory !== null && activeCategory !== cat;
            const isHighlighted = activeCategory !== null && activeCategory === cat;

            return (
              <span
                key={idx}
                className={`${styles.charSlot} ${styles[cat]} ${
                  isDimmed ? styles.dimmed : ''
                } ${isHighlighted ? styles.highlighted : ''}`}
                onMouseEnter={() => setHoveredCharIndex(idx)}
                onMouseLeave={() => setHoveredCharIndex(null)}
              >
                {ch}
                {hoveredCharIndex === idx && (
                  <div className={styles.charTooltip}>
                    {cat.toUpperCase()} · ASCII 0x{ch.charCodeAt(0).toString(16).toUpperCase()}
                  </div>
                )}
              </span>
            );
          })}
        </div>

        {/* Copy Banner Overlay */}
        <AnimatePresence>
          {copied && (
            <motion.div
              className={styles.copyOverlay}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <span>COPIED TO CLIPBOARD ✓</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Row & Character Anatomy */}
      <div className={styles.actionRow}>
        <div className={styles.anatomyGroup}>
          {characterBreakdown.uppercase > 0 && (
            <span
              className={styles.anatomyPill}
              onMouseEnter={() => handleCategoryHover('uppercase')}
              onMouseLeave={() => handleCategoryHover(null)}
              title="Hover to highlight uppercase letters"
            >
              <span className={styles.pillDot} style={{ background: '#fbbf24' }} />
              {characterBreakdown.uppercase} UPPER
            </span>
          )}
          {characterBreakdown.lowercase > 0 && (
            <span
              className={styles.anatomyPill}
              onMouseEnter={() => handleCategoryHover('lowercase')}
              onMouseLeave={() => handleCategoryHover(null)}
              title="Hover to highlight lowercase letters"
            >
              <span className={styles.pillDot} style={{ background: '#38bdf8' }} />
              {characterBreakdown.lowercase} LOWER
            </span>
          )}
          {characterBreakdown.numbers > 0 && (
            <span
              className={styles.anatomyPill}
              onMouseEnter={() => handleCategoryHover('number')}
              onMouseLeave={() => handleCategoryHover(null)}
              title="Hover to highlight digits"
            >
              <span className={styles.pillDot} style={{ background: '#34d399' }} />
              {characterBreakdown.numbers} NUM
            </span>
          )}
          {characterBreakdown.symbols > 0 && (
            <span
              className={styles.anatomyPill}
              onMouseEnter={() => handleCategoryHover('symbol')}
              onMouseLeave={() => handleCategoryHover(null)}
              title="Hover to highlight symbols"
            >
              <span className={styles.pillDot} style={{ background: '#f472b6' }} />
              {characterBreakdown.symbols} SYM
            </span>
          )}
        </div>

        <div className={styles.btnGroup}>
          <button
            className={styles.copyBtn}
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            title="Copy password to clipboard (Shortcut: C)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>COPY</span>
            <span className={styles.shortcutBadge}>C</span>
          </button>

          <button
            className={styles.generateBtn}
            onClick={(e) => {
              e.stopPropagation();
              audioEngine.playDecipher();
              onGenerate();
            }}
            title="Generate new password (Shortcut: Space)"
          >
            <motion.svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              animate={generating ? { rotate: 360 } : {}}
              transition={{ repeat: generating ? Infinity : 0, duration: 0.8, ease: 'linear' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </motion.svg>
            <span>DECRYPT / NEXT</span>
            <span className={styles.shortcutBadge}>SPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
