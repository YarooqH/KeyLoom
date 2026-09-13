import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import type { Theme } from '../themes';
import { DEFAULT_THEME, themeToCssVars } from '../themes';
import styles from './CipherLabBackground.module.css';

interface Props {
  generateTrigger?: number;
  length?: number;
  setLength?: (v: number) => void;
  theme?: Theme;
  children?: ReactNode;       // password readout (hosted inside the canvas)
  options: { uppercase: boolean; numbers: boolean; symbols: boolean; };
  setOptions: (o: { uppercase: boolean; numbers: boolean; symbols: boolean; }) => void;
  onRefresh: () => void;
  generating?: boolean;
}

// ---- Rotor config ----
// `inner` rotors dynamically reposition between the text boundary and the dial
// to frame the password. `outer` rotors sit at fixed large radii that extend
// BEYOND the screen edges (the grand off-screen look). The dial (slider) is
// separate, fixed at DIAL_R.
interface Rotor {
  kind: 'inner' | 'outer';
  r?: number;            // fixed radius for outer rotors (halfH units)
  thickness: number; baseSpeed: number; dir: number;
  lobeWidth: number; chars: string; resolution: number;
}

const DIAL_R = 0.62;        // fixed slider ring
const DIAL_BAND = 0.028;
const DIAL_HIT_DESKTOP = 0.13;
const DIAL_HIT_MOBILE = 0.22;
const LEN_MIN = 4, LEN_MAX = 64;
const START_ANGLE = -Math.PI / 2;
const OUTER_MAX = 1.7;      // outermost outer ring (goes well off-screen)

const ROTORS: Rotor[] = [
  // 3 inner — dynamic, frame the text (radii computed each frame)
  { kind: 'inner', thickness: 0.032, baseSpeed: 1.6, dir:  1, lobeWidth: 0.55, chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', resolution: 5 },
  { kind: 'inner', thickness: 0.032, baseSpeed: 1.2, dir: -1, lobeWidth: 0.50, chars: '0123456789!@#$%&*+=?/<>',          resolution: 5 },
  { kind: 'inner', thickness: 0.038, baseSpeed: 0.9, dir:  1, lobeWidth: 0.45, chars: '修理密钥组合编解码传输接收',         resolution: 4 },
  // 3 outer — fixed large radii, go beyond the screen
  { kind: 'outer', r: 0.88,      thickness: 0.042, baseSpeed: 0.6,  dir: -1, lobeWidth: 0.42, chars: 'αβγδεθλμπστφψωΣΦΨΩΔΛ', resolution: 4 },
  { kind: 'outer', r: 1.25,      thickness: 0.05,  baseSpeed: 0.4,  dir:  1, lobeWidth: 0.40, chars: '01<>[]{}|;:.,~^`',        resolution: 4 },
  { kind: 'outer', r: OUTER_MAX, thickness: 0.06,  baseSpeed: 0.22, dir: -1, lobeWidth: 0.38, chars: ':.|/=+-*#%',           resolution: 3 },
];

const ALIGN_ANGLE = -Math.PI / 2;

const MOTE_COUNT = 260;
const REPEL_R = 180;
const REPEL_FORCE = 240;

function dialFrac(angle: number) {
  let d = angle - START_ANGLE;
  d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return d / (2 * Math.PI);
}

const MOTE_CHARS: string[] = (() => {
  const arr: string[] = [];
  const push = (ch: string, n: number) => { for (let i = 0; i < n; i++) arr.push(ch); };
  push('·', 70); push('.', 36); push(':', 18); push('+', 12); push('*', 8); push('°', 7); push('∘', 6); push('•', 5);
  return arr;
})();

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.lineTo(x + w / 2 - r, y - h / 2);
  ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + r);
  ctx.lineTo(x + w / 2, y + h / 2 - r);
  ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - r, y + h / 2);
  ctx.lineTo(x - w / 2 + r, y + h / 2);
  ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - r);
  ctx.lineTo(x - w / 2, y - h / 2 + r);
  ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + r, y - h / 2);
  ctx.closePath();
}

type Support = 'unknown' | 'yes' | 'no';

export default function CipherLabBackground({
  generateTrigger = 0,
  length = 16,
  setLength,
  theme = DEFAULT_THEME,
  children,
  options,
  setOptions,
  onRefresh,
  generating = false
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const passwordHostRef = useRef<HTMLDivElement>(null);
  const [support, setSupport] = useState<Support>('unknown');
  const [reducedMotion, setReducedMotion] = useState(false);
  const initialCueDoneRef = useRef(false);

  const triggerRef = useRef(0);
  useEffect(() => { if (generateTrigger > 0) triggerRef.current = performance.now(); }, [generateTrigger]);

  const lengthRef = useRef(length);
  lengthRef.current = length;
  const setLengthRef = useRef(setLength);
  setLengthRef.current = setLength;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const setOptionsRef = useRef(setOptions);
  setOptionsRef.current = setOptions;
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const focusedButtonIdRef = useRef<'uppercase' | 'numbers' | 'symbols' | 'refresh' | null>(null);

  const toggleOption = (key: 'uppercase' | 'numbers' | 'symbols') => {
    const next = { ...options, [key]: !options[key] };
    if (next.uppercase || next.numbers || next.symbols) {
      setOptions(next);
    }
  };

  // Theme via ref so the canvas scene recolors live without restarting the
  // animation loop (the effect depends only on `support`).
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Apply theme-driven CSS custom properties to the root so the password
  // text, control labels, and glass containers retheme with the active theme
  // (otherwise they fall back to the dark-mode defaults baked into the CSS,
  // which leaves the password completely invisible on light themes).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const vars = themeToCssVars(theme);
    for (const [k, v] of Object.entries(vars)) {
      el.style.setProperty(k, v);
    }
  }, [theme]);

  useLayoutEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let s: Support = 'no';
    try {
      const test = c.getContext('2d');
      if (test && typeof (test as any).drawElementImage === 'function') s = 'yes';
    } catch { s = 'no'; }
    setSupport(s);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || support === 'unknown') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const supported = support === 'yes';
    if (supported) canvas.setAttribute('layoutsubtree', 'true');

    // CSS-pixel dimensions for drawing math; backing store is dpr-scaled so
    // rotors and motes stay crisp on high-DPI displays (the bilinear upscale
    // was the source of the smudgy/trailing look on the moving elements).
    // Declared at the top of the effect so all closures below can reference
    // them in the temporal dead zone.
    const dpr = window.devicePixelRatio || 1;
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const cellW = 10, cellH = 16;
    const phase = ROTORS.map(() => Math.random() * 6.283);
    const lobe = ROTORS.map(() => Math.random() * 6.283);
    // Dynamic radii for inner rotors (lerp toward target each frame)
    let actualRotorR = ROTORS.map((ro) => (ro.kind === 'outer' ? (ro.r as number) : 0.25));
    let lockProgress = 0, shockR = -1, shockT = 0;
    let dragging = false;
    let isMobile = cssW < 720;
    let dialHit = isMobile ? DIAL_HIT_MOBILE : DIAL_HIT_DESKTOP;

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let hoveredButtonId: 'uppercase' | 'numbers' | 'symbols' | 'refresh' | null = null;

    const onMove = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const pxX = e.clientX - rect.left;
      const pxY = e.clientY - rect.top;

      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;

      if (dragging) {
        applyDragFromEvent(e);
      } else {
        let found: 'uppercase' | 'numbers' | 'symbols' | 'refresh' | null = null;
        
        const toggleY = cssH - 85;
        const toggleW = 80;
        const toggleH = 26;
        
        const toggles = [
          { id: 'uppercase' as const, cx: cssW / 2 - 92 },
          { id: 'numbers' as const, cx: cssW / 2 },
          { id: 'symbols' as const, cx: cssW / 2 + 92 }
        ];
        
        for (const t of toggles) {
          if (Math.abs(pxX - t.cx) < toggleW / 2 && Math.abs(pxY - toggleY) < toggleH / 2) {
            found = t.id;
            break;
          }
        }
        
        const refreshX = cssW / 2;
        const refreshY = cssH - 40;
        const refreshR = 16;
        if (Math.hypot(pxX - refreshX, pxY - refreshY) < refreshR) {
          found = 'refresh';
        }
        
        hoveredButtonId = found;
      }
    };

    function applyDragFromEvent(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const halfH = cssH / 2;
      const corePxX = cssW / 2;
      const corePxY = cssH / 2;
      const dx = (e.clientX - rect.left - corePxX) / halfH;
      const dy = (e.clientY - rect.top - corePxY) / halfH;
      const angle = Math.atan2(dy, dx);
      const f = dialFrac(angle);
      const len = Math.round(LEN_MIN + f * (LEN_MAX - LEN_MIN));
      setLengthRef.current?.(Math.max(LEN_MIN, Math.min(LEN_MAX, len)));
    }

    const onDown = (e: PointerEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const halfH = cssH / 2;
      const corePxX = cssW / 2;
      const corePxY = cssH / 2;
      const dx = (e.clientX - rect.left - corePxX) / halfH;
      const dy = (e.clientY - rect.top - corePxY) / halfH;
      const dist = Math.hypot(dx, dy);

      if (Math.abs(dist - DIAL_R) < dialHit) {
        dragging = true;
        canvas!.setPointerCapture(e.pointerId);
        applyDragFromEvent(e);
        return;
      }

      // Check toggles
      const toggleY = cssH - 85;
      const toggleW = 80;
      const toggleH = 26;
      const toggles = [
        { id: 'uppercase' as const, cx: cssW / 2 - 92 },
        { id: 'numbers' as const, cx: cssW / 2 },
        { id: 'symbols' as const, cx: cssW / 2 + 92 }
      ];

      for (const t of toggles) {
        if (Math.abs(clickX - t.cx) < toggleW / 2 && Math.abs(clickY - toggleY) < toggleH / 2) {
          const next = { ...optionsRef.current, [t.id]: !optionsRef.current[t.id] };
          if (next.uppercase || next.numbers || next.symbols) {
            setOptionsRef.current?.(next);
          }
          return;
        }
      }

      // Check refresh
      const refreshX = cssW / 2;
      const refreshY = cssH - 40;
      const refreshR = 16;
      if (Math.hypot(clickX - refreshX, clickY - refreshY) < refreshR) {
        onRefreshRef.current?.();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (dragging) { dragging = false; try { canvas!.releasePointerCapture(e.pointerId); } catch {} }
    };

    // Keyboard operation for the length dial.
    const onKeyDown = (e: KeyboardEvent) => {
      if (!setLengthRef.current) return;
      const step = e.shiftKey ? 5 : 1;
      let next = lengthRef.current;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = Math.min(LEN_MAX, lengthRef.current + step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          next = Math.max(LEN_MIN, lengthRef.current - step);
          break;
        case 'PageUp':
          next = Math.min(LEN_MAX, lengthRef.current + 10);
          break;
        case 'PageDown':
          next = Math.max(LEN_MIN, lengthRef.current - 10);
          break;
        case 'Home':
          next = LEN_MIN;
          break;
        case 'End':
          next = LEN_MAX;
          break;
        default:
          return;
      }
      e.preventDefault();
      setLengthRef.current(next);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onUp);
    canvas.addEventListener('keydown', onKeyDown);

    const pwSize = { w: 0, h: 0 };

    // Estimate the password readout's on-screen size from the CURRENT length
    // value (not the measured text) so the rings resize in realtime as the
    // slider is dragged — before DECRYPT is ever pressed.
    const estimateTextSize = () => {
      const fontSize = Math.min(30.4, Math.max(20, 0.034 * cssW));
      const charW = fontSize * 0.6;
      const textW = lengthRef.current * charW;
      const buttonW = 92;
      const gap = 18;
      const hostPadX = 24;
      const contentW = textW + gap + buttonW + hostPadX;
      const maxW = Math.min(cssW * 0.88, DIAL_R * 2 * (cssH / 2) * 0.82);
      if (contentW <= maxW) {
        return { w: contentW, h: fontSize + 16 };
      }
      const cols = Math.max(1, Math.floor(maxW / charW));
      const rows = Math.ceil(lengthRef.current / cols);
      return { w: maxW, h: rows * fontSize * 1.2 + 16 };
    };

    const capHost = () => {
      if (!passwordHostRef.current) return;
      const halfH = cssH / 2;
      const cap = Math.min(cssW * 0.88, DIAL_R * 2.0 * halfH * 0.82);
      passwordHostRef.current.style.maxWidth = cap + 'px';
    };
    const measure = () => {
      capHost();
      if (passwordHostRef.current) { pwSize.w = passwordHostRef.current.offsetWidth; pwSize.h = passwordHostRef.current.offsetHeight; }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (passwordHostRef.current) ro.observe(passwordHostRef.current);

    const motes = Array.from({ length: MOTE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      baseVx: (Math.random() - 0.5) * 7,
      baseVy: (Math.random() - 0.5) * 5,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.1,
      baseAlpha: 0.55 + Math.random() * 0.4,
      char: MOTE_CHARS[Math.floor(Math.random() * MOTE_CHARS.length)],
      hueIdx: (() => { const r = Math.random(); return r < 0.7 ? 0 : (r < 0.85 ? 1 : 2); })(),
      fontSize: 7 + Math.random() * 5,
    }));

    // CSS-pixel dimensions for drawing math; backing store is dpr-scaled so
    // rotors and motes stay crisp on high-DPI displays (the bilinear upscale
    // was the source of the smudgy/trailing look on the moving elements).
    const handleResize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      isMobile = cssW < 720;
      dialHit = isMobile ? DIAL_HIT_MOBILE : DIAL_HIT_DESKTOP;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      capHost();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let lastTime = performance.now();
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 3);
    const drawChar = (c: CanvasRenderingContext2D, ch: string, px: number, py: number, color: string, alpha: number) => {
      c.fillStyle = color; c.globalAlpha = alpha; c.fillText(ch, px, py);
    };

    const drawFrame = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now * 0.001;

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      const cxN = 0.5, cyN = 0.5;
      const halfH = cssH / 2;
      const corePxX = cxN * cssW;
      const corePxY = cyN * cssH;

      const mxh = (mouse.x - 0.5) * (cssW / halfH);
      const myh = (mouse.y - 0.5) * 2;
      const mdistH = Math.hypot(mxh, myh);
      const overDial = Math.abs(mdistH - DIAL_R) < dialHit;
      canvas.style.cursor = dragging ? 'grabbing' : (overDial ? 'grab' : (hoveredButtonId ? 'pointer' : 'default'));

      const mdist = Math.hypot(mouse.x - cxN, mouse.y - cyN);
      const energize = reducedMotion ? 1 : 1 + Math.max(0, 0.5 - mdist) * 2.4;
      const lenBias = reducedMotion ? 1 : 0.6 + (lengthRef.current / 64) * 0.8;

      let lockTarget = 0;
      if (triggerRef.current > 0) {
        const el = (now - triggerRef.current) / 1000;
        if (el < 0.6) lockTarget = el / 0.6;
        else if (el < 1.1) lockTarget = 1;
        else if (el < 1.9) lockTarget = 1 - (el - 1.1) / 0.8;
        else { lockTarget = 0; triggerRef.current = 0; }
        if (el >= 0.6 && shockR < 0) { shockR = 0.22; shockT = 0; }
      }
      lockProgress += (lockTarget - lockProgress) * delta * 7;
      if (shockR >= 0) {
        shockT += delta;
        shockR = 0.22 + easeOut(shockT / 0.9) * 3.4 * 0.62;
        if (shockT > 0.95) shockR = -1;
      }
      for (let i = 0; i < ROTORS.length; i++) {
        const speed = ROTORS[i].baseSpeed * ROTORS[i].dir * energize * lenBias * (1 - lockProgress * 0.96);
        phase[i] += speed * delta;
        let dl = ALIGN_ANGLE - lobe[i];
        while (dl > Math.PI) dl -= 2 * Math.PI;
        while (dl < -Math.PI) dl += 2 * Math.PI;
        lobe[i] += dl * lockProgress * delta * 9;
      }

      // === Compute dynamic rotor radii (inner + outer) from the slider ===
      // Inner rotors frame the text: distributed between coreBoundary and the dial.
      // Outer rotors breathe with the slider: distributed between just outside the
      // dial and OUTER_MAX, with their spread scaled by curFrac so they visibly
      // expand as the password grows (and contract as it shrinks).
      const curFracLive = (lengthRef.current - LEN_MIN) / (LEN_MAX - LEN_MIN);
      const est = estimateTextSize();
      const coreHHalfW = (est.w / 2) / halfH;
      const coreHHalfH = (est.h / 2) / halfH;
      const coreBoundary = Math.max(coreHHalfW, coreHHalfH) + 0.03;
      const innerEnd = DIAL_R - 0.05;
      const outerStart = DIAL_R + 0.08;
      const outerEnd = outerStart + (1.2 - outerStart) * (0.5 + 0.5 * curFracLive);
      const innerCount = ROTORS.filter(r => r.kind === 'inner').length;
      const outerCount = ROTORS.filter(r => r.kind === 'outer').length;
      let innerIdx = 0, outerIdx = 0;
      for (let i = 0; i < ROTORS.length; i++) {
        if (ROTORS[i].kind === 'inner') {
          const t = (innerIdx + 0.5) / innerCount;
          const target = coreBoundary + Math.max(0.02, innerEnd - coreBoundary) * t;
          actualRotorR[i] += (target - actualRotorR[i]) * delta * 6;
          innerIdx++;
        } else {
          const t = (outerIdx + 0.5) / outerCount;
          const target = outerStart + Math.max(0.02, outerEnd - outerStart) * t;
          actualRotorR[i] += (target - actualRotorR[i]) * delta * 6;
          outerIdx++;
        }
      }

      // === Cursor proximity glow — a wedge of light follows the cursor across
      // ALL the rings (angular proximity), so every ring visibly responds
      // regardless of where the cursor is on screen. A subtle radial boost
      // adds extra brightness to the ring nearest the cursor's radius.
      const cursorAngle = Math.atan2(
        (mouse.y - 0.5) * 2,
        (mouse.x - 0.5) * (cssW / halfH)
      );
      const SIGMA_ANG2 = 0.5;  // radians; the wedge is ~50° wide
      const PROX_SIGMA2 = 0.1;
      const ringProx: number[] = ROTORS.map((_, i) =>
        Math.exp(-Math.pow(mdistH - actualRotorR[i], 2) / PROX_SIGMA2)
      );
      const dialProx = Math.exp(-Math.pow(mdistH - DIAL_R, 2) / PROX_SIGMA2);

      const th = themeRef.current;
      // Reset and re-apply DPR transform each frame (fillRect resets it).
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = th.bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const cols = Math.ceil(cssW / cellW);
      const rows = Math.ceil(cssH / cellH);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px "Courier New", Courier, monospace';
      ctx.globalAlpha = 1;
      const curLen = lengthRef.current;
      const curFrac = (curLen - LEN_MIN) / (LEN_MAX - LEN_MIN);

      // One-time intro motion cue: the knob settles into position on first load.
      const elapsed = (now - startTime) / 1000;
      const cueDuration = reducedMotion ? 0 : 0.9;
      const cueT = Math.min(1, elapsed / cueDuration);
      const cueOffset = (1 - easeOut(cueT)) * Math.PI * 0.35;
      const knobAngle = START_ANGLE + curFrac * 2 * Math.PI - cueOffset;
      if (!initialCueDoneRef.current && cueT >= 1) initialCueDoneRef.current = true;

      const knobPulse = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(time * 3);
      const dialGlow = overDial || dragging ? 1.0 : 0.7;

      // === 1) ASCII MOTES (drifting, mouse-repelling dust) ===
      const mousePxX = mouse.x * cssW;
      const mousePxY = mouse.y * cssH;
      ctx.save();
      const moteShadow = reducedMotion ? 0 : 6;
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const dx = m.x - mousePxX;
        const dy = m.y - mousePxY;
        const d = Math.hypot(dx, dy);
        if (!reducedMotion && d < REPEL_R && d > 0.5) {
          const f = (1 - d / REPEL_R) * REPEL_FORCE * delta;
          m.x += (dx / d) * f;
          m.y += (dy / d) * f;
        }
        m.x += m.baseVx * (reducedMotion ? 0.35 : 1) * delta;
        m.y += m.baseVy * (reducedMotion ? 0.35 : 1) * delta;
        if (m.x < -8) m.x = cssW + 8;
        if (m.x > cssW + 8) m.x = -8;
        if (m.y < -8) m.y = cssH + 8;
        if (m.y > cssH + 8) m.y = -8;
        const twinkle = reducedMotion ? 0.8 : 0.55 + 0.45 * Math.sin(time * m.twinkleSpeed * 2 + m.phase);
        const nearBoost = (!reducedMotion && d < REPEL_R) ? (1 - d / REPEL_R) * 0.6 : 0;
        const alpha = Math.min(1, m.baseAlpha * twinkle + nearBoost);
        const moteCol = themeRef.current.moteColors[m.hueIdx % themeRef.current.moteColors.length];
        ctx.font = `${m.fontSize}px "Courier New", Courier, monospace`;
        ctx.shadowColor = moteCol;
        ctx.shadowBlur = moteShadow;
        drawChar(ctx, m.char, m.x, m.y, moteCol, alpha);
        ctx.shadowBlur = 0;
      }
      ctx.font = 'bold 9px "Courier New", Courier, monospace';
      ctx.restore();

      // === 2) LOCK — dial + inner (dynamic) + outer (fixed, off-screen) ===
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cellW + cellW / 2;
          const py = y * cellH + cellH / 2;
          const dx = (px - corePxX) / halfH;
          const dy = (py - corePxY) / halfH;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          // Angular proximity to the cursor — the wedge of light that sweeps
          // across every ring as the cursor moves.
          let da = angle - cursorAngle;
          while (da > Math.PI) da -= 2 * Math.PI;
          while (da < -Math.PI) da += 2 * Math.PI;
          const angularProx = Math.exp(-(da * da) / SIGMA_ANG2);
          const warp = Math.sin(dist * 6 + time * 0.6) * 0.02;
          const wDist = dist + warp;

          // LENGTH DIAL (fixed at DIAL_R) — ASCII cells, but thin
          if (Math.abs(wDist - DIAL_R) < DIAL_BAND) {
            const fc = dialFrac(angle);
            const radialT = 1 - Math.abs(wDist - DIAL_R) / DIAL_BAND;
            const nearTick =
              Math.min(Math.abs(fc - 0), Math.abs(fc - 0.25), Math.abs(fc - 0.5), Math.abs(fc - 0.75), Math.abs(fc - 1)) < 0.012;
            const dialCursorGlow = 2.2 * angularProx + 0.5 * dialProx;
            if (fc <= curFrac + 0.001) {
              drawChar(ctx, '#', px, py, th.dialFill, Math.min(1, (0.75 + radialT * 0.35) * (dialGlow + dialCursorGlow)));
            } else {
              // Tick marks at quarter stops are sharper and brighter.
              const tickChar = nearTick ? '+' : '·';
              const tickCol = nearTick ? th.dialTick : th.dialTrack;
              const tickAlpha = nearTick
                ? Math.min(1, (0.65 + radialT * 0.35) * (1 + dialCursorGlow))
                : Math.min(1, (0.35 + radialT * 0.3) * (1 + dialCursorGlow));
              drawChar(ctx, tickChar, px, py, tickCol, tickAlpha);
            }
            continue;
          }

          // Inner + outer rotors
          let drawn = false;
          for (let i = 0; i < ROTORS.length; i++) {
            const ro = ROTORS[i];
            const r = actualRotorR[i];
            const radial = Math.exp(-Math.pow((wDist - r) / ro.thickness, 2));
            if (radial < 0.06) continue;
            let da = angle - lobe[i];
            while (da > Math.PI) da -= 2 * Math.PI;
            while (da < -Math.PI) da += 2 * Math.PI;
            const lobeFactor = Math.exp(-(da * da) / (2 * ro.lobeWidth * ro.lobeWidth));
            const bright = radial * (0.35 + 0.65 * lobeFactor);
            if (bright < 0.06) continue;
            const ci = Math.floor(((angle * ro.resolution + phase[i]) % ro.chars.length + ro.chars.length) % ro.chars.length);
            const col = radial > 0.6 ? th.gradient[i] : th.gradient[i + 1];
            const rotorCursorGlow = 2.2 * angularProx + 0.5 * ringProx[i];
            drawChar(ctx, ro.chars[ci], px, py, col, Math.min(1, bright * 1.4 * (1 + rotorCursorGlow)));
            drawn = true; break;
          }
          if (drawn) continue;

          if (shockR >= 0) {
            const sd = Math.abs(wDist - shockR);
            if (sd < 0.08) {
              const fade = 1 - shockT / 0.95;
              const b = Math.exp(-sd * sd / 0.002) * fade;
              if (b > 0.05) { drawChar(ctx, '#', px, py, th.dialFill, Math.min(1, b)); continue; }
            }
          }
          const n = Math.sin(x * 12.9898 + y * 78.233 + time * 0.4) * 43758.5453;
          const f = n - Math.floor(n);
          if (f > 0.9928) drawChar(ctx, '.', px, py, f > 0.996 ? th.dialFill : th.moteColors[1], 0.25);
        }
      }

      // === No core pill / no box ===
      // The text floats on the dark empty center (inside the innermost ring),
      // framed by the rings. Readability comes from the dark bg + white text.

      // === 2.5) RULER — length numbers at the 4 major dial stops ===
      // Sits just outside the dial as a reference scale. Each label sits on
      // a small mode-inverted pill (same trick as the length chip) so it
      // reads cleanly against any background. Drawn before the knob/chip so
      // the chip naturally covers the label at its own stop (the chip
      // already shows the current value, so the overlap is fine).
      //
      // Note: 5 labels would put the "4" (frac 0) and "64" (frac 1.0) at the
      // exact same position on the dial (both at the top — START_ANGLE wraps
      // around), so we only show 4. The chip displays 64 when the knob is at
      // the top, so the value is still discoverable.
      const RULER_STOPS: { frac: number; label: string }[] = [
        { frac: 0,    label: '4'  },
        { frac: 0.25, label: '19' },
        { frac: 0.5,  label: '34' },
        { frac: 0.75, label: '49' },
      ];
      const rulerR = DIAL_R + 0.06;
      const rulerBg = th.mode === 'light' ? 'rgba(8, 8, 16, 1)' : 'rgba(255, 255, 255, 1)';
      const rulerFg = th.mode === 'light' ? '#ffffff' : '#1a1a1a';
      ctx.save();
      ctx.font = 'bold 14px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const stop of RULER_STOPS) {
        const ang = START_ANGLE + stop.frac * 2 * Math.PI;
        const lx = corePxX + Math.cos(ang) * rulerR * halfH;
        const ly = corePxY + Math.sin(ang) * rulerR * halfH;
        const tw = ctx.measureText(stop.label).width;
        const pillW = tw + 14;
        const pillH = 22;
        // Accent-bordered pill background — matches the chip's visual language
        ctx.fillStyle = rulerBg;
        ctx.strokeStyle = th.chipBorder;
        ctx.lineWidth = 1.5;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(lx - pillW / 2, ly - pillH / 2, pillW, pillH, pillH / 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(lx - pillW / 2, ly - pillH / 2, pillW, pillH);
          ctx.strokeRect(lx - pillW / 2, ly - pillH / 2, pillW, pillH);
        }
        // Number on top — no shadow, just clean type
        ctx.fillStyle = rulerFg;
        ctx.fillText(stop.label, lx, ly + 1);
      }
      ctx.restore();

      // === 3) GLOWING KNOB + LENGTH CHIP on the fixed dial ===
      const knobX = corePxX + Math.cos(knobAngle) * DIAL_R * halfH;
      const knobY = corePxY + Math.sin(knobAngle) * DIAL_R * halfH;
      const knobRadius = (isMobile ? 8.5 : 6.5) * (overDial || dragging ? 1.25 : 1);
      
      if (overDial || dragging) {
        ctx.fillStyle = th.knobGlow;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.shadowColor = th.knobGlow;
      ctx.shadowBlur = reducedMotion ? 0 : (overDial || dragging ? 28 : 14) * knobPulse;
      ctx.fillStyle = th.knob;
      ctx.beginPath();
      ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = th.knobCore;
      ctx.beginPath();
      ctx.arc(knobX, knobY, knobRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Knob handle — a short accent line outward so the dial is recognisably draggable.
      const handleR = DIAL_R + (isMobile ? 0.06 : 0.045);
      const handleInnerR = DIAL_R + 0.005;
      const handleX1 = corePxX + Math.cos(knobAngle) * handleInnerR * halfH;
      const handleY1 = corePxY + Math.sin(knobAngle) * handleInnerR * halfH;
      const handleX2 = corePxX + Math.cos(knobAngle) * handleR * halfH;
      const handleY2 = corePxY + Math.sin(knobAngle) * handleR * halfH;
      ctx.strokeStyle = th.knob;
      ctx.lineWidth = isMobile ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handleX1, handleY1);
      ctx.lineTo(handleX2, handleY2);
      ctx.stroke();

      const chipR = DIAL_R + 0.10;
      const chipCX = corePxX + Math.cos(knobAngle) * chipR * halfH;
      const chipCY = corePxY + Math.sin(knobAngle) * chipR * halfH;
      const chipText = String(curLen).padStart(2, '0');
      // Large, bold, always-white text on a solid dark pill with a bright
      // theme-accent border + glow so it reads clearly in every theme.
      ctx.font = 'bold 20px "Space Mono", monospace';
      const tw = ctx.measureText(chipText).width;
      const cPad = 12;
      const chipW = tw + cPad * 2;
      const chipH = 36;
      // Connector line (knob → chip edge): bright accent. Stopped at the
      // chip's near edge with a small gap so it doesn't visually run into
      // the pill.
      const lineDx = chipCX - knobX;
      const lineDy = chipCY - knobY;
      const lineLen = Math.hypot(lineDx, lineDy) || 1;
      const lineUx = lineDx / lineLen;
      const lineUy = lineDy / lineLen;
      // Approximate the chip's half-extent along the line of approach by
      // clamping to the pill's width/height half (good enough for a short line).
      const stopR = Math.hypot(chipW / 2, chipH / 2) * 0.6 + 2;
      const lineEndX = chipCX - lineUx * stopR;
      const lineEndY = chipCY - lineUy * stopR;
      ctx.strokeStyle = th.chipBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(knobX, knobY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();
      // Solid opaque pill — mode-inverted so it always reads as the reverse
      // contrast of the scene behind it. Dark mode: white pill, dark text.
      // Light mode: dark pill, white text.
      const chipBg = th.mode === 'light' ? 'rgba(8, 8, 16, 1)' : 'rgba(255, 255, 255, 1)';
      const chipFg = th.mode === 'light' ? '#ffffff' : '#1a1a1a';
      ctx.fillStyle = chipBg;
      ctx.strokeStyle = th.chipBorder;
      ctx.lineWidth = 1.5;
      const chipRadius = chipH / 2;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(chipCX - chipW / 2, chipCY - chipH / 2, chipW, chipH, chipRadius);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(chipCX - chipW / 2, chipCY - chipH / 2, chipW, chipH);
        ctx.strokeRect(chipCX - chipW / 2, chipCY - chipH / 2, chipW, chipH);
      }
      // Mode-inverted text with a strong accent glow for depth
      ctx.shadowColor = th.chipGlow;
      ctx.shadowBlur = reducedMotion ? 0 : 10;
      ctx.fillStyle = chipFg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chipText, chipCX, chipCY + 0.5);
      ctx.shadowBlur = 0;

      // Visible "LENGTH" label above the current-value chip so users associate
      // the number with the dial control.
      const labelR = DIAL_R + (isMobile ? 0.185 : 0.165);
      const labelAngle = knobAngle - 0.07;
      const labelCX = corePxX + Math.cos(labelAngle) * labelR * halfH;
      const labelCY = corePxY + Math.sin(labelAngle) * labelR * halfH;
      ctx.font = `bold ${isMobile ? 12 : 10}px "Space Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = th.mode === 'light' ? 'rgba(8, 8, 16, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('LENGTH', labelCX, labelCY);

      // === 3.8) CANVAS-DIRECTED CONTROLS ===
      const toggleY = cssH - 85;
      const toggleW = 80;
      const toggleH = 26;
      
      const toggles = [
        { id: 'uppercase' as const, label: 'A-Z', cx: cssW / 2 - 92, active: optionsRef.current.uppercase },
        { id: 'numbers' as const, label: '0-9', cx: cssW / 2, active: optionsRef.current.numbers },
        { id: 'symbols' as const, label: '!@#', cx: cssW / 2 + 92, active: optionsRef.current.symbols }
      ];

      ctx.save();
      for (const t of toggles) {
        const isFocused = focusedButtonIdRef.current === t.id;
        const isHovered = hoveredButtonId === t.id || isFocused;
        
        // Draw button border
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = t.active 
          ? (isHovered ? th.accent : th.dialFill) 
          : (isHovered ? 'rgba(255,255,255,0.4)' : th.dialTrack);
          
        // Draw background if active or hovered
        if (t.active) {
          ctx.fillStyle = th.accentSoft;
          drawRoundedRect(ctx, t.cx, toggleY, toggleW, toggleH, 5);
          ctx.fill();
        } else if (isHovered) {
          ctx.fillStyle = th.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
          drawRoundedRect(ctx, t.cx, toggleY, toggleW, toggleH, 5);
          ctx.fill();
        }
        
        drawRoundedRect(ctx, t.cx, toggleY, toggleW, toggleH, 5);
        ctx.stroke();

        // Draw Focus Ring if keyboard focused
        if (isFocused) {
          ctx.save();
          ctx.strokeStyle = th.accent;
          ctx.lineWidth = 1.0;
          ctx.setLineDash([3, 3]);
          drawRoundedRect(ctx, t.cx, toggleY, toggleW + 6, toggleH + 6, 8);
          ctx.stroke();
          ctx.restore();
        }
        
        // Draw indicator dot
        const dotX = t.cx - 24;
        ctx.beginPath();
        ctx.arc(dotX, toggleY, 2.5, 0, Math.PI * 2);
        if (t.active) {
          ctx.fillStyle = th.accent;
          ctx.shadowColor = th.accent;
          ctx.shadowBlur = isHovered ? 8 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = th.mode === 'light' ? 'rgba(8, 8, 16, 0.25)' : 'rgba(255,255,255,0.2)';
          ctx.fill();
        }
        
        // Draw text
        ctx.font = 'bold 10px "Space Mono", monospace';
        ctx.fillStyle = t.active ? th.text : (isHovered ? (th.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.7)') : (th.mode === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'));
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.label, t.cx - 10, toggleY + 0.5);
      }
      ctx.restore();

      // Draw Refresh button
      const refreshX = cssW / 2;
      const refreshY = cssH - 40;
      const refreshR = 16;
      const isRefreshFocused = focusedButtonIdRef.current === 'refresh';
      const isRefreshHovered = hoveredButtonId === 'refresh' || isRefreshFocused;
      
      ctx.save();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isRefreshHovered ? th.accent : th.dialTrack;
      ctx.fillStyle = isRefreshHovered ? th.accentSoft : (th.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)');
      
      ctx.beginPath();
      ctx.arc(refreshX, refreshY, refreshR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw Focus Ring if keyboard focused
      if (isRefreshFocused) {
        ctx.save();
        ctx.strokeStyle = th.accent;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(refreshX, refreshY, refreshR + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      // Draw refresh icon rotating
      let iconAngle = 0;
      if (generating) {
        iconAngle = time * 8; // continuous spin
      } else if (isRefreshHovered) {
        iconAngle = -0.6; // slight tilt
      }
      
      ctx.translate(refreshX, refreshY);
      ctx.rotate(iconAngle);
      ctx.strokeStyle = isRefreshHovered ? th.accent : th.dialTrack;
      ctx.lineWidth = 2.0;
      
      // Draw top arc
      ctx.beginPath();
      ctx.arc(0, 0, 6, -0.75 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
      
      // Draw arrowhead at the end (0.75 * Math.PI)
      const arrowAngle = 0.75 * Math.PI;
      const arrowX = Math.cos(arrowAngle) * 6;
      const arrowY = Math.sin(arrowAngle) * 6;
      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(arrowAngle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(0, 0);
      ctx.lineTo(-3, 3);
      ctx.stroke();
      ctx.restore();
      
      // Draw bottom arc
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();
      
      // Draw arrowhead at the end (1.75 * Math.PI)
      const arrowAngle2 = 1.75 * Math.PI;
      const arrowX2 = Math.cos(arrowAngle2) * 6;
      const arrowY2 = Math.sin(arrowAngle2) * 6;
      ctx.save();
      ctx.translate(arrowX2, arrowY2);
      ctx.rotate(arrowAngle2 + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(0, 0);
      ctx.lineTo(-3, 3);
      ctx.stroke();
      ctx.restore();
      
      ctx.restore();

      // === 4) HOSTED HTML COMPOSITED INTO THE CANVAS (OT) ===
      if (supported) {
        if (passwordHostRef.current) {
          const dx = Math.round(corePxX - pwSize.w / 2);
          const dy = Math.round(corePxY - pwSize.h / 2);
          try {
            const t = (ctx as any).drawElementImage(passwordHostRef.current, dx, dy) as DOMMatrix | undefined;
            if (t) passwordHostRef.current.style.transform = t.toString();
          } catch { /* first-frame snapshot warmup */ }
        }
      }
    };

    let rafId = 0;
    let stopped = false;

    if (supported) {
      (canvas as any).onpaint = () => {
        if (stopped) return;
        drawFrame(performance.now());
        (canvas as any).requestPaint();
      };
      (canvas as any).requestPaint();
    } else {
      const loop = (now: number) => {
        if (stopped) return;
        rafId = requestAnimationFrame(loop);
        drawFrame(now);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      (canvas as any).onpaint = null;
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      canvas.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      if (supported) canvas.removeAttribute('layoutsubtree');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [support]);

  const scanlineBg = theme.mode === 'light'
    ? `linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,${theme.scanlineAlpha}) 50%)`
    : `linear-gradient(rgba(16,14,12,0) 50%, rgba(0,0,0,${theme.scanlineAlpha}) 50%), linear-gradient(90deg, rgba(255,80,0,0.05), rgba(0,255,200,0.02), rgba(255,120,0,0.05))`;
  const scanlineSize = theme.mode === 'light' ? '100% 3px' : '100% 3px, 7px 100%';

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        zIndex: 0, overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'none', WebkitUserSelect: 'none',
      } as CSSProperties}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background: scanlineBg,
          backgroundSize: scanlineSize,
          pointerEvents: 'none', zIndex: 3, mixBlendMode: 'overlay',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${theme.vignetteColor}, transparent 55%)`, pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', background: `linear-gradient(to top, ${theme.bottomGradient}, transparent)`, pointerEvents: 'none', zIndex: 2 }} />

      {support === 'no' && import.meta.env.DEV && (
        <div className={styles.notice}>
          html-in-canvas OT not enabled — showing DOM fallback. Enable{' '}
          <code>chrome://flags/#canvas-draw-element</code> &amp; relaunch.
        </div>
      )}

      {support === 'yes' ? (
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="slider"
          aria-label="Password length dial"
          aria-valuemin={LEN_MIN}
          aria-valuemax={LEN_MAX}
          aria-valuenow={length}
          aria-valuetext={`Length ${length}`}
          style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', userSelect: 'none' }}
        >
          <div ref={passwordHostRef} className={styles.passwordHost}>{children}</div>
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
            <button onFocus={() => { focusedButtonIdRef.current = 'uppercase'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('uppercase')} aria-pressed={options.uppercase}>Include uppercase letters</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'numbers'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('numbers')} aria-pressed={options.numbers}>Include numbers</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'symbols'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('symbols')} aria-pressed={options.symbols}>Include symbols</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'refresh'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={onRefresh}>Regenerate password</button>
          </div>
        </canvas>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="slider"
            aria-label="Password length dial"
            aria-valuemin={LEN_MIN}
            aria-valuemax={LEN_MAX}
            aria-valuenow={length}
            aria-valuetext={`Length ${length}`}
            style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', userSelect: 'none' }}
          />
          <div ref={passwordHostRef} className={styles.passwordFallback}>{children}</div>
          <div style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
            <button onFocus={() => { focusedButtonIdRef.current = 'uppercase'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('uppercase')} aria-pressed={options.uppercase}>Include uppercase letters</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'numbers'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('numbers')} aria-pressed={options.numbers}>Include numbers</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'symbols'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={() => toggleOption('symbols')} aria-pressed={options.symbols}>Include symbols</button>
            <button onFocus={() => { focusedButtonIdRef.current = 'refresh'; }} onBlur={() => { focusedButtonIdRef.current = null; }} onClick={onRefresh}>Regenerate password</button>
          </div>
        </>
      )}
    </div>
  );
}