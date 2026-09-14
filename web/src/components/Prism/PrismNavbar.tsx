import { useState } from 'react';
import { audioEngine } from './audioEngine';
import ThemeSelector from '../ThemeSelector';
import { THEMES } from '../../themes';
import styles from './PrismNavbar.module.css';

interface Props {
  currentThemeId: string;
  onThemeSelect: (id: string) => void;
  onLogoClick?: () => void;
}

export default function PrismNavbar({ currentThemeId, onThemeSelect, onLogoClick }: Props) {
  const [isMuted, setIsMuted] = useState(audioEngine.isMuted());

  const handleToggleSound = () => {
    const nextMuted = audioEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.brandGroup} onClick={onLogoClick} title="KeyLoom Cryptographic Generator">
        <div className={styles.brandIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className={styles.brandName}>
          <span>KEYLOOM</span>
          <span className={styles.brandBadge}>v2.0 MATRIX</span>
        </div>
      </div>

      <div className={styles.navCenter}>
        <div className={styles.cryptoPill}>
          <div className={styles.cryptoDot} />
          <span>CSPRNG: ACTIVE</span>
        </div>
        <div className={styles.hintPill}>
          <span>[SPACE] DECRYPT · [C] COPY</span>
        </div>
      </div>

      <div className={styles.rightControls}>
        <button
          className={styles.iconBtn}
          onClick={handleToggleSound}
          title={isMuted ? 'Sound Muted — Click to Enable' : 'Sound Enabled — Click to Mute'}
          aria-label={isMuted ? 'Enable sound' : 'Mute sound'}
        >
          {isMuted ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span>MUTED</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>AUDIO ON</span>
            </>
          )}
        </button>

        <ThemeSelector
          themes={THEMES}
          currentId={currentThemeId}
          onSelect={onThemeSelect}
        />
      </div>
    </header>
  );
}
