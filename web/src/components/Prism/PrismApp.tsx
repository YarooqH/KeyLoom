import { useState, useCallback, useEffect, useRef } from 'react';
import { generatePassword } from 'keyloom';
import { getTheme, themeToCssVars } from '../../themes';
import PrismCanvas from './PrismCanvas';
import PrismNavbar from './PrismNavbar';
import PasswordHero from './PasswordHero';
import MatrixHUD, { type GeneratorMode, type CipherOptions } from './MatrixHUD';
import { calculateEntropy, type EntropyResult } from './entropyEngine';
import { generatePassphrase, generatePin, type PassphraseOptions, type PinOptions } from './phraseGenerator';
import { audioEngine } from './audioEngine';
import styles from './MatrixLayout.module.css';

interface Props {
  onNavigateBack?: () => void;
}

export default function PrismApp({ onNavigateBack }: Props) {
  // --- Theme Management ---
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem('keyloom_theme_id') || 'solar';
    } catch {
      return 'solar';
    }
  });
  const theme = getTheme(themeId);

  // Apply theme tokens to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const vars = themeToCssVars(theme);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-accent', theme.accent || '#38bdf8');
    root.style.setProperty('--theme-accent-soft', theme.accentSoft || 'rgba(56, 189, 248, 0.15)');
    root.style.setProperty('--theme-knob-core', theme.knobCore || theme.accent || '#818cf8');
    try {
      localStorage.setItem('keyloom_theme_id', themeId);
    } catch {
      // ignore storage error
    }
  }, [theme, themeId]);

  // --- Generation State ---
  const [mode, setMode] = useState<GeneratorMode>('cipher');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateTrigger, setGenerateTrigger] = useState(0);

  // Mode Options
  const [cipherLength, setCipherLength] = useState(16);
  const [cipherOptions, setCipherOptions] = useState<CipherOptions>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });

  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>({
    wordCount: 4,
    separator: '-',
    capitalize: true,
    includeNumber: true,
  });

  const [pinOptions, setPinOptions] = useState<PinOptions>({
    length: 6,
    grouping: true,
  });

  // Calculate live entropy
  const entropy: EntropyResult = calculateEntropy(password);

  // --- Generation Logic ---
  const handleGenerate = useCallback((immediate: boolean = false) => {
    let nextPassword = '';

    if (mode === 'cipher') {
      nextPassword = generatePassword({
        length: cipherLength,
        includeLowercase: cipherOptions.lowercase,
        includeUppercase: cipherOptions.uppercase,
        includeNumbers: cipherOptions.numbers,
        includeSymbols: cipherOptions.symbols,
        excludeAmbiguous: cipherOptions.excludeAmbiguous,
      });
    } else if (mode === 'passphrase') {
      nextPassword = generatePassphrase(passphraseOptions);
    } else if (mode === 'pin') {
      nextPassword = generatePin(pinOptions);
    }

    setPassword(nextPassword);
    setCopied(false);
    setGenerating(false);

    if (!immediate) {
      setGenerateTrigger(prev => prev + 1);
    }
  }, [mode, cipherLength, cipherOptions, passphraseOptions, pinOptions]);

  // Initial generation on first mount
  const initialMountRef = useRef(false);
  useEffect(() => {
    if (initialMountRef.current) return;
    initialMountRef.current = true;
    handleGenerate(true);
  }, [handleGenerate]);

  // Auto-regenerate when settings or mode change
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!initialMountRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      handleGenerate(false);
    }, 120);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    mode,
    cipherLength,
    cipherOptions,
    passphraseOptions,
    pinOptions,
    handleGenerate,
  ]);

  // --- Copy Action ---
  const handleCopy = useCallback(() => {
    if (!password) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(password).then(() => {
        setCopied(true);
        audioEngine.playSuccess();
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [password]);

  // --- Preset Handlers ---
  const handleApplyPreset = (name: 'quantum' | 'mobile' | 'memorable' | 'pin') => {
    audioEngine.playDecipher();
    if (name === 'quantum') {
      setMode('cipher');
      setCipherLength(32);
      setCipherOptions({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false,
      });
    } else if (name === 'mobile') {
      setMode('cipher');
      setCipherLength(16);
      setCipherOptions({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
        excludeAmbiguous: true,
      });
    } else if (name === 'memorable') {
      setMode('passphrase');
      setPassphraseOptions({
        wordCount: 4,
        separator: '-',
        capitalize: true,
        includeNumber: true,
      });
    } else if (name === 'pin') {
      setMode('pin');
      setPinOptions({
        length: 6,
        grouping: true,
      });
    }
  };

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.playDecipher();
        handleGenerate(false);
      } else if (e.key === 'c' || e.key === 'C') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          handleCopy();
        }
      } else if (e.key === '1') {
        audioEngine.playTick(1400);
        setMode('cipher');
      } else if (e.key === '2') {
        audioEngine.playTick(1400);
        setMode('passphrase');
      } else if (e.key === '3') {
        audioEngine.playTick(1400);
        setMode('pin');
      } else if (e.key === 'm' || e.key === 'M') {
        audioEngine.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, handleCopy]);

  return (
    <div className={styles.appRoot}>
      {/* 3D Interactive Holographic Polyhedron Canvas */}
      <PrismCanvas
        generateTrigger={generateTrigger}
        theme={theme}
      />

      {/* Atmospheric Overlays */}
      <div className={styles.hologramGrid} />
      <div className={styles.radialAtmosphere} />

      {/* Fixed Header Navbar */}
      <PrismNavbar
        currentThemeId={themeId}
        onThemeSelect={setThemeId}
        onLogoClick={() => handleGenerate(false)}
      />

      {/* Top Switcher to return to CipherLab */}
      <div
        style={{
          position: 'fixed',
          top: 18,
          left: 220,
          zIndex: 110,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <a
          href="#cipherlab"
          onClick={onNavigateBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 8,
            color: '#ffffff',
            textDecoration: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            transition: 'all 0.2s ease',
          }}
        >
          ← CIPHER LAB
        </a>
      </div>

      {/* Main Interactive Matrix Dashboard */}
      <main className={styles.mainContainer}>
        <PasswordHero
          password={password}
          generating={generating}
          copied={copied}
          entropy={entropy}
          onGenerate={() => handleGenerate(false)}
          onCopy={handleCopy}
        />

        <MatrixHUD
          mode={mode}
          setMode={setMode}
          cipherLength={cipherLength}
          setCipherLength={setCipherLength}
          cipherOptions={cipherOptions}
          setCipherOptions={setCipherOptions}
          passphraseOptions={passphraseOptions}
          setPassphraseOptions={setPassphraseOptions}
          pinOptions={pinOptions}
          setPinOptions={setPinOptions}
          entropy={entropy}
          onApplyPreset={handleApplyPreset}
        />

        {/* Tactile hint */}
        <div className={styles.footerHint}>
          <span className={styles.footerSparkle}>✦</span>
          <span>Click & drag anywhere in 3D space to spin the holographic prism</span>
          <span className={styles.footerSparkle}>✦</span>
        </div>
      </main>

      {/* Screen Reader Announcement */}
      <div
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {copied ? 'Password copied to clipboard' : ''}
      </div>
    </div>
  );
}
