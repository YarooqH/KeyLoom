import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { generatePassword } from 'keyloom';
import CosmicBackground from './components/CosmicBackground';
import DataVortexBackground from './components/DataVortexBackground';
import AsciiSingularity from './components/AsciiSingularity';
import SingularityGenerator from './components/SingularityGenerator';
import SupernovaBackground from './components/SupernovaBackground';
import SupernovaGenerator from './components/SupernovaGenerator';
import SupernovaHUD from './components/SupernovaHUD';
import CipherBackground from './components/CipherBackground';
import CipherLabBackground from './components/CipherLabBackground';
import CipherControls from './components/CipherControls';
import CipherGenerateButton from './components/CipherGenerateButton';
import ThemeSelector from './components/ThemeSelector';
import { THEMES, getTheme } from './themes';
import cipherOverlay from './CipherOverlay.module.css';
import PasswordDisplay from './components/PasswordDisplay';
import Controls from './components/Controls';
import GenerateButton from './components/GenerateButton';
import PrismApp from './components/Prism/PrismApp';
import DitherLoom, { type DitherMode } from './components/DitherLoom';
import styles from './App.module.css';

interface GeneratorOptions {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#cipherlab');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(12);
  const [options, setOptions] = useState<GeneratorOptions>({
    uppercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [coords, setCoords] = useState({ lat: '37.7749° N', lng: '122.4194° W' });
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [themeId, setThemeId] = useState('solar');
  const [ditherMode, setDitherMode] = useState<DitherMode>(() => window.localStorage.getItem('keyloom-dither-mode') === 'dark' ? 'dark' : 'light');
  const theme = getTheme(themeId);
  const isDither = route === '#dither';
  const ditherNav = ditherMode === 'dark'
    ? { ink: '#f1ede4', muted: '#b9b2a6', accent: '#f47a62' }
    : { ink: '#171715', muted: '#706d66', accent: '#e24a30' };

  useEffect(() => {
    window.localStorage.setItem('keyloom-dither-mode', ditherMode);
  }, [ditherMode]);

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash || '#classic');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setCursorPos({ x, y });
      const latVal = ((e.clientY / window.innerHeight) * 180 - 90).toFixed(4);
      const lngVal = ((e.clientX / window.innerWidth) * 360 - 180).toFixed(4);
      setCoords({
        lat: `${Math.abs(Number(latVal))}° ${Number(latVal) >= 0 ? 'N' : 'S'}`,
        lng: `${Math.abs(Number(lngVal))}° ${Number(lngVal) >= 0 ? 'E' : 'W'}`,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [generateTrigger, setGenerateTrigger] = useState(0);
  // Holds the pending cipher/cipherlab doGen timeout so we can cancel a stale
  // generation when a newer one supersedes it (prevents the "old password
  // flashes, then new one appears" flicker when the slider is dragged rapidly).
  const doGenTimeoutRef = useRef<number | null>(null);

  const handleGenerate = useCallback((immediate: boolean = false) => {
    const doGen = () => {
      const next = generatePassword({
        length,
        includeLowercase: true,
        includeUppercase: options.uppercase,
        includeNumbers: options.numbers,
        includeSymbols: options.symbols,
      });
      setPassword(next);
      setCopied(false);
      setGenerating(false);
    };

    if (route === '#singularity' && immediate !== true) {
      setGenerateTrigger(prev => prev + 1);
      setTimeout(doGen, 1200);
    } else if (route === '#supernova' && immediate !== true) {
      setGenerateTrigger(prev => prev + 1);
      setTimeout(doGen, 1000);
    } else if ((route === '#cipher' || route === '#cipherlab') && immediate !== true) {
      if (doGenTimeoutRef.current) {
        clearTimeout(doGenTimeoutRef.current);
      }
      setGenerating(true);
      setGenerateTrigger(prev => prev + 1);
      doGenTimeoutRef.current = window.setTimeout(() => {
        doGen();
        doGenTimeoutRef.current = null;
      }, 1100);
    } else if (route === '#dither' && immediate !== true) {
      setGenerateTrigger(prev => prev + 1);
      doGen();
    } else {
      doGen();
    }
  }, [length, options, route]);

  const handleCopy = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [password]);

  const initialGenerated = useRef(false);
  useEffect(() => {
    if (initialGenerated.current) return;
    initialGenerated.current = true;
    handleGenerate(true);
  }, [handleGenerate]);

  // On #cipherlab, the length dial IS the trigger. Auto-generate a new password
  // whenever the slider settles, so the user never has to press a button.
  const genTimeoutRef = useRef<number | null>(null);
  const isFirstLengthRun = useRef(true);
  useEffect(() => {
    if (route !== '#cipherlab') return;
    if (isFirstLengthRun.current) { isFirstLengthRun.current = false; return; }
    if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
    setGenerating(true);
    genTimeoutRef.current = window.setTimeout(() => {
      handleGenerate(false);
      genTimeoutRef.current = null;
    }, 160);
    return () => {
      if (genTimeoutRef.current) {
        clearTimeout(genTimeoutRef.current);
        genTimeoutRef.current = null;
      }
    };
  }, [length, route, handleGenerate]);

  // Clean up any pending timeouts when we unmount or leave the page
  useEffect(() => {
    return () => {
      if (doGenTimeoutRef.current) clearTimeout(doGenTimeoutRef.current);
      if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
    };
  }, []);

  const renderBackground = () => {
    if (route === '#dither') return null;
    if (route === '#vortex') return <DataVortexBackground />;
    if (route === '#singularity') {
      return <AsciiSingularity generateTrigger={generateTrigger} />;
    }
    if (route === '#supernova') {
      return <SupernovaBackground generateTrigger={generateTrigger} />;
    }
    if (route === '#cipher') {
      return <CipherBackground generateTrigger={generateTrigger} length={length} />;
    }
    if (route === '#cipherlab') {
      return (
        <CipherLabBackground
          generateTrigger={generateTrigger}
          length={length}
          setLength={setLength}
          theme={theme}
          options={options}
          setOptions={setOptions}
          onRefresh={() => handleGenerate(false)}
          generating={generating}
        >
          <PasswordDisplay password={password} onCopy={handleCopy} copied={copied} generating={generating} />
        </CipherLabBackground>
      );
    }
    return <CosmicBackground isSingularity={false} />;
  };

  if (route === '#matrix') {
    return <PrismApp onNavigateBack={() => setRoute('#cipherlab')} />;
  }

  return (
    <div className={styles.root}>
      {renderBackground()}

      {route === '#supernova' && (
        <SupernovaHUD cursorPos={cursorPos} coords={coords} currentTime={currentTime} />
      )}

      {/* Global accessible copy confirmation, placed outside the canvas so it
          is reliably announced by screen readers in both OT and fallback modes. */}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {copied ? 'Password copied to clipboard' : ''}
      </div>
      {route === '#cipherlab' && (
        <>
          <div
            style={{
              position: 'fixed', bottom: 24, right: 28,
              zIndex: 50, pointerEvents: 'auto',
            }}
          >
            <ThemeSelector themes={THEMES} currentId={themeId} onSelect={setThemeId} />
          </div>
          <div
            style={{
              position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 40, pointerEvents: 'none',
              padding: '6px 14px',
              borderRadius: 999,
              background: theme.mode === 'light' ? 'rgba(15,15,25,0.04)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.mode === 'light' ? 'rgba(15,15,25,0.12)' : 'rgba(255,255,255,0.12)'}`,
              backdropFilter: 'blur(12px) saturate(160%)',
              WebkitBackdropFilter: 'blur(12px) saturate(160%)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: theme.text,
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: 0.75,
            }}
          >
            <span style={{ opacity: 0.55 }}>LENGTH</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span style={{ fontWeight: 600 }}>{String(length).padStart(2, '0')}</span>
          </div>
        </>
      )}

      {!isDither && <div className={styles.gridOverlay} />}

      {!isDither && <nav className={styles.nav} data-dither-theme={isDither ? ditherMode : undefined} style={route === '#cipherlab' || isDither ? { pointerEvents: 'auto', zIndex: 100 } : undefined}>
        <div className={styles.logoGroup}>
          <svg className={styles.logoMark} style={isDither ? { color: ditherNav.ink } : undefined} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="4" r="1.5" /><circle cx="5" cy="8" r="1.5" /><circle cx="5" cy="12" r="1.5" />
            <circle cx="5" cy="16" r="1.5" /><circle cx="5" cy="20" r="1.5" /><circle cx="9" cy="11" r="1.5" />
            <circle cx="13" cy="7" r="1.5" /><circle cx="17" cy="3" r="1.5" /><circle cx="9" cy="13" r="1.5" />
            <circle cx="13" cy="17" r="1.5" /><circle cx="17" cy="21" r="1.5" /><circle className={styles.logoAccent} cx="9" cy="12" r="1.5" />
          </svg>
          <span className={styles.logoText} style={isDither ? { color: ditherNav.ink } : undefined}>keyloom</span>
        </div>
        <div className={styles.navTools}>
          <div className={styles.routeLinks}>
            {[
              { hash: '#dither', label: 'Dither Loom' },
              { hash: '#cipherlab', label: 'Cipher Lab' },
              { hash: '#matrix', label: '3D Matrix' },
              { hash: '#classic', label: 'Classic' },
              { hash: '#vortex', label: 'Vortex' },
              { hash: '#singularity', label: 'Singularity' },
              { hash: '#supernova', label: 'Supernova' },
              { hash: '#cipher', label: 'Cipher' },
            ].map(({ hash, label }) => (
              <a
                key={hash}
                href={hash}
                onClick={() => setRoute(hash)}
                style={{
                  color: route === hash ? (isDither ? ditherNav.accent : '#ffaa00') : (isDither ? ditherNav.muted : 'rgba(255,255,255,0.6)'),
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: '0.08em',
                  transition: 'all 0.2s',
                  padding: isDither ? '6px 0' : '4px 8px',
                  borderRadius: isDither ? '0' : '6px',
                  background: isDither ? 'transparent' : (route === hash ? 'rgba(255, 170, 0, 0.12)' : 'rgba(255,255,255,0.03)'),
                  border: isDither ? '0' : `1px solid ${route === hash ? 'rgba(255, 170, 0, 0.3)' : 'transparent'}`,
                  borderBottom: isDither && route === hash ? `1px solid ${ditherNav.accent}` : undefined,
                }}
              >
                {label}
              </a>
            ))}
          </div>
          {isDither && (
            <button type="button" className={styles.themeToggle} onClick={() => setDitherMode((current) => current === 'light' ? 'dark' : 'light')} aria-pressed={ditherMode === 'dark'} aria-label={`Switch to ${ditherMode === 'light' ? 'dark' : 'light'} mode`}>
              {ditherMode}
            </button>
          )}
        </div>
      </nav>}

      <main
        className={styles.main}
        style={
          route === '#singularity'
            ? { display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: '0 10%', paddingTop: '80px', width: '100%', maxWidth: '1600px', margin: '0 auto', pointerEvents: 'none' }
            : route === '#cipher'
            ? { display: 'block', pointerEvents: 'none' }
            : route === '#cipherlab'
            ? { display: 'block', pointerEvents: 'none' }
            : route === '#dither'
            ? { display: 'block', pointerEvents: 'auto', paddingTop: 0 }
            : route === '#supernova'
            ? { display: 'block', pointerEvents: 'none' }
            : { display: 'flex', flexDirection: 'column', paddingTop: '80px' }
        }
      >
        {route === '#dither' ? (
          <DitherLoom
            password={password}
            length={length}
            options={options}
            copied={copied}
            generateTrigger={generateTrigger}
            mode={ditherMode}
            onLengthChange={setLength}
            onOptionsChange={setOptions}
            onGenerate={() => handleGenerate(false)}
            onCopy={handleCopy}
            onModeToggle={() => setDitherMode((current) => current === 'light' ? 'dark' : 'light')}
          />
        ) : route === '#singularity' ? (
          <div style={{ width: '520px', pointerEvents: 'auto' }}>
            <SingularityGenerator
              password={password}
              length={length}
              setLength={setLength}
              options={options}
              setOptions={setOptions}
              onGenerate={handleGenerate}
              onCopy={handleCopy}
              copied={copied}
            />
          </div>
        ) : route === '#cipher' ? (
          <>
            {/* The password lives INSIDE the lock, as its central readout */}
            <div className={cipherOverlay.passwordSlot}>
              <PasswordDisplay password={password} onCopy={handleCopy} copied={copied} />
            </div>
            {/* Cipher-themed controls float in the scene, no card */}
            <div className={cipherOverlay.controlsCluster}>
              <CipherControls
                length={length}
                setLength={setLength}
                options={options}
                setOptions={setOptions}
              />
              <CipherGenerateButton onClick={handleGenerate} />
            </div>
          </>
        ) : route === '#cipherlab' ? (
          /* null — the password readout, toggles, and DECRYPT button are all
             hosted INSIDE the canvas by CipherLabBackground (html-in-canvas OT);
             the length dial is the outer rotor ring itself. Nothing floats here. */
          null
        ) : route === '#supernova' ? (
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              left: 32,
              right: 32,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto', width: '100%' }}>
              <SupernovaGenerator
                password={password}
                length={length}
                setLength={setLength}
                options={options}
                setOptions={setOptions}
                onGenerate={handleGenerate}
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
          </div>
        ) : (
          <motion.div
            className={styles.generatorBox}
            key={route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <PasswordDisplay password={password} onCopy={handleCopy} copied={copied} />
            <Controls length={length} setLength={setLength} options={options} setOptions={setOptions} />
            <div className={styles.actionContainer}>
              <GenerateButton onClick={handleGenerate} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
