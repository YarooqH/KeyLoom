import React from 'react';
import type { EntropyResult } from './entropyEngine';
import type { PassphraseOptions, PinOptions } from './phraseGenerator';
import { audioEngine } from './audioEngine';
import styles from './MatrixHUD.module.css';

export type GeneratorMode = 'cipher' | 'passphrase' | 'pin';

export interface CipherOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

interface Props {
  mode: GeneratorMode;
  setMode: (m: GeneratorMode) => void;
  // Cipher mode state
  cipherLength: number;
  setCipherLength: (l: number) => void;
  cipherOptions: CipherOptions;
  setCipherOptions: React.Dispatch<React.SetStateAction<CipherOptions>>;
  // Passphrase mode state
  passphraseOptions: PassphraseOptions;
  setPassphraseOptions: React.Dispatch<React.SetStateAction<PassphraseOptions>>;
  // PIN mode state
  pinOptions: PinOptions;
  setPinOptions: React.Dispatch<React.SetStateAction<PinOptions>>;
  // Diagnostics
  entropy: EntropyResult;
  // Preset handler
  onApplyPreset: (name: 'quantum' | 'mobile' | 'memorable' | 'pin') => void;
}

export default function MatrixHUD({
  mode,
  setMode,
  cipherLength,
  setCipherLength,
  cipherOptions,
  setCipherOptions,
  passphraseOptions,
  setPassphraseOptions,
  pinOptions,
  setPinOptions,
  entropy,
  onApplyPreset,
}: Props) {
  const handleModeChange = (newMode: GeneratorMode) => {
    audioEngine.playTick(1400);
    setMode(newMode);
  };

  const handleCipherOptionToggle = (key: keyof CipherOptions) => {
    audioEngine.playTick(1000);
    setCipherOptions(prev => {
      // Ensure at least one character set remains selected
      if (key !== 'excludeAmbiguous') {
        const remaining = Object.entries(prev).filter(
          ([k, v]) => k !== 'excludeAmbiguous' && k !== key && v === true
        );
        if (remaining.length === 0 && prev[key] === true) {
          return prev; // don't disable last remaining set
        }
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  return (
    <div className={styles.hudWrapper}>
      <div className={styles.hudCard}>
        {/* Mode Switcher Tabs */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${mode === 'cipher' ? styles.activeTab : ''}`}
            onClick={() => handleModeChange('cipher')}
          >
            <span>RANDOM CIPHER</span>
          </button>
          <button
            className={`${styles.tabBtn} ${mode === 'passphrase' ? styles.activeTab : ''}`}
            onClick={() => handleModeChange('passphrase')}
          >
            <span>PASSPHRASE</span>
          </button>
          <button
            className={`${styles.tabBtn} ${mode === 'pin' ? styles.activeTab : ''}`}
            onClick={() => handleModeChange('pin')}
          >
            <span>PIN VAULT</span>
          </button>
        </div>

        {/* Dynamic Controls based on Active Mode */}
        {mode === 'cipher' && (
          <>
            {/* Length slider */}
            <div className={styles.sliderSection}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelGroup}>
                  <span>CIPHER LENGTH</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ opacity: 0.7 }}>6 — 64 CHARACTERS</span>
                </div>
                <div className={styles.sliderControls}>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (cipherLength > 6) {
                        audioEngine.playTick(900);
                        setCipherLength(cipherLength - 1);
                      }
                    }}
                    title="Decrease length"
                  >
                    −
                  </button>
                  <div className={styles.valueBadge}>{cipherLength}</div>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (cipherLength < 64) {
                        audioEngine.playTick(1100);
                        setCipherLength(cipherLength + 1);
                      }
                    }}
                    title="Increase length"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={cipherLength}
                  onChange={e => {
                    audioEngine.playTick(800 + Number(e.target.value) * 15);
                    setCipherLength(Number(e.target.value));
                  }}
                  className={styles.rangeInput}
                  aria-label="Password length slider"
                />
              </div>
            </div>

            {/* Character Set Toggles */}
            <div className={styles.toggleGrid}>
              <div
                className={`${styles.toggleChip} ${cipherOptions.uppercase ? styles.activeChip : ''}`}
                onClick={() => handleCipherOptionToggle('uppercase')}
                role="checkbox"
                aria-checked={cipherOptions.uppercase}
                tabIndex={0}
              >
                <span className={styles.toggleLabel}>A-Z UPPERCASE</span>
                <div className={styles.toggleSwitch}>
                  {cipherOptions.uppercase && <div className={styles.checkmark} />}
                </div>
              </div>

              <div
                className={`${styles.toggleChip} ${cipherOptions.lowercase ? styles.activeChip : ''}`}
                onClick={() => handleCipherOptionToggle('lowercase')}
                role="checkbox"
                aria-checked={cipherOptions.lowercase}
                tabIndex={0}
              >
                <span className={styles.toggleLabel}>a-z LOWERCASE</span>
                <div className={styles.toggleSwitch}>
                  {cipherOptions.lowercase && <div className={styles.checkmark} />}
                </div>
              </div>

              <div
                className={`${styles.toggleChip} ${cipherOptions.numbers ? styles.activeChip : ''}`}
                onClick={() => handleCipherOptionToggle('numbers')}
                role="checkbox"
                aria-checked={cipherOptions.numbers}
                tabIndex={0}
              >
                <span className={styles.toggleLabel}>0-9 NUMBERS</span>
                <div className={styles.toggleSwitch}>
                  {cipherOptions.numbers && <div className={styles.checkmark} />}
                </div>
              </div>

              <div
                className={`${styles.toggleChip} ${cipherOptions.symbols ? styles.activeChip : ''}`}
                onClick={() => handleCipherOptionToggle('symbols')}
                role="checkbox"
                aria-checked={cipherOptions.symbols}
                tabIndex={0}
              >
                <span className={styles.toggleLabel}>!@# SYMBOLS</span>
                <div className={styles.toggleSwitch}>
                  {cipherOptions.symbols && <div className={styles.checkmark} />}
                </div>
              </div>

              <div
                className={`${styles.toggleChip} ${cipherOptions.excludeAmbiguous ? styles.activeChip : ''}`}
                onClick={() => handleCipherOptionToggle('excludeAmbiguous')}
                role="checkbox"
                aria-checked={cipherOptions.excludeAmbiguous}
                tabIndex={0}
                style={{ gridColumn: 'span 2' }}
              >
                <span className={styles.toggleLabel}>NO AMBIGUOUS (0/O, 1/l/I)</span>
                <div className={styles.toggleSwitch}>
                  {cipherOptions.excludeAmbiguous && <div className={styles.checkmark} />}
                </div>
              </div>
            </div>
          </>
        )}

        {mode === 'passphrase' && (
          <>
            {/* Word count slider */}
            <div className={styles.sliderSection}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelGroup}>
                  <span>WORD COUNT</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ opacity: 0.7 }}>3 — 8 WORDS</span>
                </div>
                <div className={styles.sliderControls}>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (passphraseOptions.wordCount > 3) {
                        audioEngine.playTick(900);
                        setPassphraseOptions(p => ({ ...p, wordCount: p.wordCount - 1 }));
                      }
                    }}
                  >
                    −
                  </button>
                  <div className={styles.valueBadge}>{passphraseOptions.wordCount}</div>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (passphraseOptions.wordCount < 8) {
                        audioEngine.playTick(1100);
                        setPassphraseOptions(p => ({ ...p, wordCount: p.wordCount + 1 }));
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={passphraseOptions.wordCount}
                  onChange={e => {
                    audioEngine.playTick(900 + Number(e.target.value) * 100);
                    setPassphraseOptions(p => ({ ...p, wordCount: Number(e.target.value) }));
                  }}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* Separator selector */}
            <div className={styles.sliderSection}>
              <div className={styles.sliderLabelGroup}>
                <span>WORD SEPARATOR</span>
              </div>
              <div className={styles.separatorRow}>
                {(['- ', '. ', '_ ', '/ ', 'space '] as const).map(sepVal => {
                  const actualSep = sepVal.trim() === 'space' ? ' ' : (sepVal.trim() as '-' | '.' | '_' | '/');
                  const label = sepVal.trim() === 'space' ? 'Space [ ]' : `[ ${actualSep} ]`;
                  const isSelected = passphraseOptions.separator === actualSep;
                  return (
                    <button
                      key={sepVal}
                      className={`${styles.sepPill} ${isSelected ? styles.activeSep : ''}`}
                      onClick={() => {
                        audioEngine.playTick(1200);
                        setPassphraseOptions(p => ({ ...p, separator: actualSep }));
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passphrase toggles */}
            <div className={styles.toggleGrid}>
              <div
                className={`${styles.toggleChip} ${passphraseOptions.capitalize ? styles.activeChip : ''}`}
                onClick={() => {
                  audioEngine.playTick(1000);
                  setPassphraseOptions(p => ({ ...p, capitalize: !p.capitalize }));
                }}
              >
                <span className={styles.toggleLabel}>CAPITALIZE WORDS</span>
                <div className={styles.toggleSwitch}>
                  {passphraseOptions.capitalize && <div className={styles.checkmark} />}
                </div>
              </div>

              <div
                className={`${styles.toggleChip} ${passphraseOptions.includeNumber ? styles.activeChip : ''}`}
                onClick={() => {
                  audioEngine.playTick(1000);
                  setPassphraseOptions(p => ({ ...p, includeNumber: !p.includeNumber }));
                }}
              >
                <span className={styles.toggleLabel}>APPEND NUMBER (0-99)</span>
                <div className={styles.toggleSwitch}>
                  {passphraseOptions.includeNumber && <div className={styles.checkmark} />}
                </div>
              </div>
            </div>
          </>
        )}

        {mode === 'pin' && (
          <>
            {/* PIN length slider */}
            <div className={styles.sliderSection}>
              <div className={styles.sliderHeader}>
                <div className={styles.sliderLabelGroup}>
                  <span>PIN DIGITS</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ opacity: 0.7 }}>4 — 16 NUMBERS</span>
                </div>
                <div className={styles.sliderControls}>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (pinOptions.length > 4) {
                        audioEngine.playTick(900);
                        setPinOptions(p => ({ ...p, length: p.length - 1 }));
                      }
                    }}
                  >
                    −
                  </button>
                  <div className={styles.valueBadge}>{pinOptions.length}</div>
                  <button
                    className={styles.stepperBtn}
                    onClick={() => {
                      if (pinOptions.length < 16) {
                        audioEngine.playTick(1100);
                        setPinOptions(p => ({ ...p, length: p.length + 1 }));
                      }
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={pinOptions.length}
                  onChange={e => {
                    audioEngine.playTick(900 + Number(e.target.value) * 50);
                    setPinOptions(p => ({ ...p, length: Number(e.target.value) }));
                  }}
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* PIN Grouping toggle */}
            <div className={styles.toggleGrid}>
              <div
                className={`${styles.toggleChip} ${pinOptions.grouping ? styles.activeChip : ''}`}
                onClick={() => {
                  audioEngine.playTick(1000);
                  setPinOptions(p => ({ ...p, grouping: !p.grouping }));
                }}
                style={{ gridColumn: 'span 2' }}
              >
                <span className={styles.toggleLabel}>HYPHEN GROUPING (e.g. 123-456)</span>
                <div className={styles.toggleSwitch}>
                  {pinOptions.grouping && <div className={styles.checkmark} />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Presets Bar */}
        <div className={styles.presetsBar}>
          <span className={styles.presetLabel}>PRESETS:</span>
          <button
            className={styles.presetBtn}
            onClick={() => onApplyPreset('quantum')}
            title="32 characters, maximum entropy, all symbol sets"
          >
            🛡️ Quantum Max (32)
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => onApplyPreset('mobile')}
            title="16 characters, no confusing characters (0/O, 1/l/I)"
          >
            📱 Mobile Safe (16)
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => onApplyPreset('memorable')}
            title="4-word Diceware human-memorable phrase"
          >
            🧠 Memorable Phrase
          </button>
          <button
            className={styles.presetBtn}
            onClick={() => onApplyPreset('pin')}
            title="6-digit bank-grade PIN"
          >
            🔢 6-Digit PIN
          </button>
        </div>
      </div>

      {/* Security Diagnostic Card */}
      <div className={styles.diagCard}>
        <div className={styles.diagRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={styles.diagText}>ESTIMATED CRACK TIME:</span>
            <span className={styles.crackBadge} style={{ color: entropy.tierColor }}>
              {entropy.crackTimeHuman}
            </span>
          </div>
          <div className={styles.diagText}>
            {entropy.bits} BITS OF ENTROPY ({entropy.score}% RATING)
          </div>
        </div>

        <div className={styles.entropyGaugeTrack}>
          <div
            className={styles.entropyGaugeFill}
            style={{
              width: `${Math.max(5, entropy.score)}%`,
              background: `linear-gradient(90deg, #f59e0b, ${entropy.tierColor})`,
              boxShadow: `0 0 12px ${entropy.tierColor}`,
            }}
          />
        </div>

        <div className={styles.diagRow}>
          <span className={styles.diagText} style={{ opacity: 0.45 }}>
            🛡️ Client-side cryptographic RNG (window.crypto). No keys are ever sent across a network.
          </span>
          <span className={styles.diagText} style={{ opacity: 0.6 }}>
            TIER: {entropy.tierLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
