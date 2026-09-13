import { useEffect, useRef } from 'react';

interface Props {
  generateTrigger?: number;
  length?: number;
}

// Rotor definitions — concentric rings rendered as ASCII, differential rotation.
// Inner rings go faster (like a differential accretion disk), directions alternate.
interface Rotor {
  r: number;          // radius in halfH-normalized units
  thickness: number;  // radial band half-width
  baseSpeed: number;   // rad/s
  dir: number;         // +1 / -1
  lobeWidth: number;   // radians, how wide the bright "tumbler" is
  chars: string;       // rotating character set
  colorInner: string;
  colorOuter: string;
  resolution: number;  // chars per radian (controls how many distinct chars you see)
}

// Global scale — shrinks the whole core + rotor arrangement.
const SCALE = 0.62;
// Clear horizontal "display window" cut through the lock's center so the
// password readout (DOM) sits inside the lock, not over it.
const WINDOW_HALF = 0.1;
const LOCK_RADIUS = 1.62; // outermost rotor reach in halfH units (for the window mask)

const ROTORS: Rotor[] = [
  { r: 0.55 * SCALE, thickness: 0.05, baseSpeed: 1.6, dir: 1,  lobeWidth: 0.55, chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', colorInner: '#FFE680', colorOuter: '#FFAA00', resolution: 5 },
  { r: 0.82 * SCALE, thickness: 0.05, baseSpeed: 1.2, dir: -1, lobeWidth: 0.5,  chars: '0123456789!@#$%&*+=?/<>',          colorInner: '#FFAA00', colorOuter: '#FF6B00', resolution: 5 },
  { r: 1.12 * SCALE, thickness: 0.06, baseSpeed: 0.9, dir: 1,  lobeWidth: 0.45, chars: '修理密钥组合编解码传输接收',         colorInner: '#FF6B00', colorOuter: '#FF4500', resolution: 4 },
  { r: 1.48 * SCALE, thickness: 0.06, baseSpeed: 0.7, dir: -1, lobeWidth: 0.42, chars: 'αβγδεθλμπστφψωΣΦΨΩΔΛ',           colorInner: '#FF4500', colorOuter: '#9A4A1E', resolution: 4 },
  { r: 1.92 * SCALE, thickness: 0.07, baseSpeed: 0.5, dir: 1,  lobeWidth: 0.4,  chars: '01<>[]{}|;:.,~^`',                colorInner: '#2D8C8C', colorOuter: '#008080', resolution: 4 },
  { r: 2.45 * SCALE, thickness: 0.08, baseSpeed: 0.34, dir: -1, lobeWidth: 0.38, chars: ':.|/=+-*#%',                       colorInner: '#008080', colorOuter: '#005252', resolution: 3 },
];

const DENSITY = ' .:;-=+*#%@';
const ALIGN_ANGLE = -Math.PI / 2; // tumblers click to the TOP on lock

export default function CipherBackground({ generateTrigger = 0, length = 16 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef(0);

  useEffect(() => {
    if (generateTrigger > 0) triggerRef.current = performance.now();
  }, [generateTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = 10;
    const cellH = 16;

    // Per-rotor accumulated phase + lobe angle (mutable, persists across frames)
    const phase = ROTORS.map(() => Math.random() * 6.283);
    const lobe = ROTORS.map(() => Math.random() * 6.283); // will ease to ALIGN on lock
    let lockProgress = 0;    // 0 idle .. 1 fully locked
    let shockR = -1;         // expanding shockwave radius; -1 = inactive
    let shockT = 0;

    // Mouse: parallax + energize (closer to core => faster rotors)
    const mouse = { x: 0.55, y: 0.5, tx: 0.55, ty: 0.5 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);

    // CSS-pixel dimensions for drawing math; backing store is dpr-scaled
    // so moving rotors stay crisp on high-DPI displays (otherwise the
    // bilinear upscale creates the smudgy/trailing look).
    const dpr = window.devicePixelRatio || 1;
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const handleResize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now * 0.001;

      // Smooth mouse
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      // Core center — dead center now that there's no side panel, with parallax
      const cxN = 0.5 + (mouse.x - 0.5) * 0.04;
      const cyN = 0.5 + (mouse.y - 0.5) * 0.04;

      // Energize: cursor proximity to core speeds rotors up (max ~2.0x)
      const mdx = (mouse.x - cxN);
      const mdy = (mouse.y - cyN);
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      const energize = 1 + Math.max(0, 0.5 - mdist) * 2.4; // up to ~+0.5 radius

      // Global speed bias from length slider (longer = faster lock attempts)
      const lenBias = 0.6 + (length / 64) * 0.8;

      // --- Lock choreography ---
      let lockTarget = 0;
      if (triggerRef.current > 0) {
        const elapsed = (now - triggerRef.current) / 1000;
        // lock engages over 0.6s, holds until ~1.1s, then releases by ~1.9s
        if (elapsed < 0.6) lockTarget = elapsed / 0.6;
        else if (elapsed < 1.1) lockTarget = 1;
        else if (elapsed < 1.9) lockTarget = 1 - (elapsed - 1.1) / 0.8;
        else { lockTarget = 0; triggerRef.current = 0; }
        // shockwave fires at lock peak
        if (elapsed >= 0.6 && shockR < 0) {
          shockR = 0.22 * SCALE; shockT = 0;
        }
      }
      lockProgress += (lockTarget - lockProgress) * delta * 7;

      if (shockR >= 0) {
        shockT += delta;
        shockR = 0.22 * SCALE + easeOut(shockT / 0.9) * 3.4 * SCALE;
        if (shockT > 0.95) shockR = -1;
      }

      // --- Update rotor phases & lobe angles ---
      for (let i = 0; i < ROTORS.length; i++) {
        const ro = ROTORS[i];
        const speed = ro.baseSpeed * ro.dir * energize * lenBias * (1 - lockProgress * 0.96);
        phase[i] += speed * delta;
        // Ease lobe toward the alignment angle during lock
        let dl = ALIGN_ANGLE - lobe[i];
        // wrap to shortest path
        while (dl > Math.PI) dl -= 2 * Math.PI;
        while (dl < -Math.PI) dl += 2 * Math.PI;
        lobe[i] += dl * lockProgress * delta * 9;
      }

      // --- Render ---
      ctx.fillStyle = '#050508';
      // Reset and re-apply DPR transform each frame (fillRect resets it).
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillRect(0, 0, cssW, cssH);

      const halfH = cssH / 2;
      const cellPxW = cellW;
      const cellPxH = cellH;
      const cols = Math.ceil(cssW / cellW);
      const rows = Math.ceil(cssH / cellH);
      const corePxX = cxN * cssW;
      const corePxY = cyN * cssH;
      const coreR = 0.26 * SCALE; // normalized core radius

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px "Courier New", Courier, monospace';

      const corePulse = 0.7 + 0.3 * Math.sin(time * 2.4);
      const coreBoost = 1 + lockProgress * 1.6;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cellPxW + cellPxW / 2;
          const py = y * cellPxH + cellPxH / 2;
          const dx = (px - corePxX) / halfH;
          const dy = (py - corePxY) / halfH;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          // subtle organic warp
          const warp = Math.sin(dist * 6 + time * 0.6) * 0.02;
          const wDist = dist + warp;

          // --- Display window: clear the lock's center band for the password ---
          if (Math.abs(dy) < WINDOW_HALF && Math.abs(dx) < LOCK_RADIUS) continue;

          // --- Core (bright emitter, no void) ---
          if (wDist < coreR) {
            const t = 1 - wDist / coreR;
            const b = Math.pow(t, 1.4) * corePulse * coreBoost;
            const ci = Math.min(DENSITY.length - 1, Math.floor(b * DENSITY.length));
            const ch = DENSITY[ci];
            const col = b > 0.7 ? '#FFFFFF' : (b > 0.4 ? '#FFE680' : '#FFAA00');
            drawChar(ctx, ch, px, py, col, Math.min(1, b));
            continue;
          }

          // --- Rotors ---
          let drawn = false;
          for (let i = 0; i < ROTORS.length; i++) {
            const ro = ROTORS[i];
            const radial = Math.exp(-Math.pow((wDist - ro.r) / ro.thickness, 2));
            if (radial < 0.06) continue;
            // angular lobe highlight (the tumbler)
            let da = angle - lobe[i];
            while (da > Math.PI) da -= 2 * Math.PI;
            while (da < -Math.PI) da += 2 * Math.PI;
            const lobeFactor = Math.exp(-(da * da) / (2 * ro.lobeWidth * ro.lobeWidth));
            const bright = radial * (0.35 + 0.65 * lobeFactor);
            if (bright < 0.06) continue;

            // rotating char: index from angle + phase
            const ci = Math.floor(
              ((angle * ro.resolution + phase[i]) % ro.chars.length + ro.chars.length) % ro.chars.length
            );
            const ch = ro.chars[ci];
            // color blends inner->outer across the band
            const col = radial > 0.6 ? ro.colorInner : ro.colorOuter;
            const a = Math.min(1, bright * 1.4);
            drawChar(ctx, ch, px, py, col, a);
            drawn = true;
            break; // one rotor per cell (bands don't overlap)
          }
          if (drawn) continue;

          // --- Shockwave ring ---
          if (shockR >= 0) {
            const sd = Math.abs(wDist - shockR);
            if (sd < 0.08) {
              const fade = 1 - shockT / 0.95;
              const b = Math.exp(-sd * sd / 0.002) * fade;
              if (b > 0.05) {
                drawChar(ctx, '#', px, py, '#FFAA00', Math.min(1, b));
                continue;
              }
            }
          }

          // --- Sparse background noise ---
          const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.4) * 43758.5453;
          const f = n - Math.floor(n);
          if (f > 0.9928) {
            drawChar(ctx, '.', px, py, f > 0.996 ? '#FFAA00' : '#00e5e0', 0.25);
          }
        }
      }
    };

    function easeOut(t: number) { return 1 - Math.pow(1 - Math.min(1, t), 3); }

    function drawChar(
      c: CanvasRenderingContext2D,
      ch: string,
      px: number, py: number,
      color: string, alpha: number
    ) {
      c.fillStyle = color;
      c.globalAlpha = alpha;
      c.fillText(ch, px, py);
    }

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [length]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* CRT scanline + chromatic-aberration overlay (terminal DNA, tuned) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(16, 14, 12, 0) 50%, rgba(0, 0, 0, 0.22) 50%), linear-gradient(90deg, rgba(255, 80, 0, 0.05), rgba(0, 255, 200, 0.02), rgba(255, 120, 0, 0.05))',
          backgroundSize: '100% 3px, 7px 100%',
          pointerEvents: 'none',
          zIndex: 3,
          mixBlendMode: 'overlay',
        }}
      />
      {/* Warm vignette to seat the core */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 69, 0, 0.08), rgba(5,5,8,0) 55%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Bottom legibility gradient so the floating controls read over the rotor arcs */}
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0, height: '34%',
          background: 'linear-gradient(to top, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.6) 45%, rgba(5,5,8,0) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}