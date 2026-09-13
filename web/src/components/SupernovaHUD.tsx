import styles from './SupernovaHUD.module.css';

interface CursorPos {
  x: number;
  y: number;
}

interface Coords {
  lat: string;
  lng: string;
}

interface Props {
  cursorPos: CursorPos;
  coords: Coords;
  currentTime: string;
}

export default function SupernovaHUD({ cursorPos, coords, currentTime }: Props) {
  // Lock-on: when cursor approaches the center of the screen
  const dx = cursorPos.x - 50;
  const dy = cursorPos.y - 50;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const isLocked = distance < 12;

  // Coords flip below the crosshair if the cursor is near the bottom edge
  const showCoordsBelow = cursorPos.y < 75;

  // Extract HH:MM:SS from the toUTCString format
  const timeMatch = currentTime.match(/(\d{2}:\d{2}:\d{2})/);
  const formattedTime = timeMatch ? `${timeMatch[1]} UTC` : '--:--:-- UTC';

  return (
    <div className={styles.hud}>
      {/* Crosshair — follows cursor, locks on near center */}
      <div
        className={`${styles.crosshair} ${isLocked ? styles.locked : ''}`}
        style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%` }}
      >
        <div className={styles.crosshairDot} />
        <div
          className={styles.coords}
          style={showCoordsBelow ? { top: '14px' } : { bottom: '14px' }}
        >
          <span>{coords.lat}</span>
          <span className={styles.coordSep}>·</span>
          <span>{coords.lng}</span>
        </div>
      </div>

      {/* Corner viewfinder brackets */}
      <div className={`${styles.corner} ${styles.tl}`} />
      <div className={`${styles.corner} ${styles.tr}`} />
      <div className={`${styles.corner} ${styles.bl}`} />
      <div className={`${styles.corner} ${styles.br}`} />

      {/* Top-right UTC clock */}
      <div className={styles.clock}>
        <div className={styles.clockLabel}>UTC</div>
        <div className={styles.clockTime}>{formattedTime}</div>
      </div>
    </div>
  );
}
