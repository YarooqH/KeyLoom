import { useEffect, useRef } from 'react';
import styles from './DitherLoom.module.css';

interface GeneratorOptions {
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export type DitherMode = 'light' | 'dark';

const DITHER_PALETTES = {
  light: {
    paper: '#f3f0e8',
    paperRgb: '243, 240, 232',
    ink: '#171715',
    accent: '#e24a30',
  },
  dark: {
    paper: '#171613',
    paperRgb: '23, 22, 19',
    ink: '#f1ede4',
    accent: '#f47a62',
  },
} as const;

interface DitherLoomProps {
  password: string;
  length: number;
  options: GeneratorOptions;
  copied: boolean;
  generateTrigger: number;
  mode: DitherMode;
  onLengthChange: (length: number) => void;
  onOptionsChange: (options: GeneratorOptions) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onModeToggle: () => void;
}

const TOGGLES: { key: keyof GeneratorOptions; label: string }[] = [
  { key: 'uppercase', label: 'Uppercase' },
  { key: 'numbers', label: 'Numbers' },
  { key: 'symbols', label: 'Symbols' },
];

interface GlyphParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  radius: number;
  phase: number;
  delay: number;
  startsRed: boolean;
  endsRed: boolean;
  edge: boolean;
}

function splitPasswordLines(password: string, maximumCharactersPerLine: number) {
  const lineCount = Math.max(1, Math.ceil(password.length / maximumCharactersPerLine));
  const charactersPerLine = Math.ceil(password.length / lineCount);
  return Array.from(
    { length: lineCount },
    (_, index) => password.slice(index * charactersPerLine, (index + 1) * charactersPerLine),
  );
}

function DitherPassword({ password, generateTrigger, mode }: Pick<DitherLoomProps, 'password' | 'generateTrigger' | 'mode'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preferredWidth = Math.min(700, Math.max(220, password.length * (password.length > 24 ? 15 : 42)));
  const colors = DITHER_PALETTES[mode];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles: GlyphParticle[] = [];
    let animationFrame = 0;
    let animationStartedAt = window.performance.now();
    let measuredWidth = 0;
    let measuredHeight = 0;
    let disposed = false;
    let glyphLines: string[] = [];
    let glyphFontFamily = 'monospace';
    let glyphFontSize = 12;
    let glyphLineHeight = 14;

    const createRandom = () => {
      let value = (generateTrigger + 1) * 2654435761;
      for (let index = 0; index < password.length; index += 1) value = (value ^ password.charCodeAt(index) * (index + 17)) >>> 0;
      return () => {
        value += 0x6d2b79f5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
      };
    };

    const buildParticles = (animate: boolean) => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      measuredWidth = width;
      measuredHeight = height;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      const mask = document.createElement('canvas');
      mask.width = width;
      mask.height = height;
      const maskContext = mask.getContext('2d', { willReadFrequently: true });
      if (!maskContext || !password) {
        particles = [];
        return;
      }

      const fontFamily = window.getComputedStyle(canvas).fontFamily || 'monospace';
      const maxFontSize = width < 460 ? 48 : 70;
      // Passwords have no natural word boundaries. Split them at a stable capacity
      // so the particle mask remains readable instead of shrinking an arbitrary line.
      const maximumCharactersPerLine = width < 460 ? 16 : 24;
      const lines = splitPasswordLines(password, maximumCharactersPerLine);
      const lineCount = lines.length;
      maskContext.font = `700 ${maxFontSize}px ${fontFamily}`;
      const widestLine = Math.max(...lines.map((line) => maskContext.measureText(line).width));
      const fontSize = Math.max(12, Math.min(maxFontSize, maxFontSize * (width - 16) / Math.max(1, widestLine), (height - 12) / (lineCount * 1.18)));
      const lineHeight = fontSize * 1.15;
      const blockHeight = lineHeight * lineCount;
      glyphLines = lines;
      glyphFontFamily = fontFamily;
      glyphFontSize = fontSize;
      glyphLineHeight = lineHeight;
      maskContext.clearRect(0, 0, width, height);
      maskContext.fillStyle = '#fff';
      maskContext.font = `700 ${fontSize}px ${fontFamily}`;
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      lines.forEach((line, index) => {
        maskContext.fillText(line, width / 2, height / 2 - blockHeight / 2 + lineHeight * (index + 0.5));
      });

      const pixels = maskContext.getImageData(0, 0, width, height).data;
      const sampleStep = 2;
      const targets: { x: number; y: number; edge: boolean }[] = [];
      for (let y = 1; y < height - 1; y += sampleStep) {
        for (let x = 1; x < width - 1; x += sampleStep) {
          if (pixels[(y * width + x) * 4 + 3] <= 90) continue;
          const edge = [
            [x - sampleStep, y],
            [x + sampleStep, y],
            [x, y - sampleStep],
            [x, y + sampleStep],
          ].some(([sampleX, sampleY]) => pixels[(sampleY * width + sampleX) * 4 + 3] <= 90);
          targets.push({ x, y, edge });
        }
      }

      const maximumParticles = password.length > 32
        ? (width < 460 ? 3600 : 5200)
        : (width < 460 ? 1800 : 2800);
      const targetStride = Math.max(1, Math.ceil(targets.length / maximumParticles));
      const random = createRandom();
      particles = targets.filter((_, index) => index % targetStride === 0).map((target) => ({
        startX: random() * width,
        startY: random() * height,
        targetX: target.x + (random() - 0.5) * 0.8,
        targetY: target.y + (random() - 0.5) * 0.8,
        radius: 0.56 + random() * 0.46,
        phase: random() * Math.PI * 2,
        delay: random() * 0.26,
        startsRed: random() < 0.58,
        endsRed: target.edge && random() < 0.08,
        edge: target.edge,
      }));
      animationStartedAt = animate && !reducedMotion ? window.performance.now() : -10000;
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, measuredWidth, measuredHeight);
      const progress = reducedMotion ? 1 : Math.min(1, (now - animationStartedAt) / 980);
      const time = now / 1000;
      particles.forEach((particle) => {
        const localProgress = Math.max(0, Math.min(1, (progress - particle.delay) / (1 - particle.delay)));
        const eased = 1 - (1 - localProgress) ** 3;
        const wander = (1 - eased) * 10;
        const settledDrift = eased * (particle.edge ? 0.06 : 0);
        const x = particle.startX + (particle.targetX - particle.startX) * eased
          + Math.sin(time * 5.2 + particle.phase) * wander
          + Math.sin(time * 0.8 + particle.phase) * settledDrift;
        const y = particle.startY + (particle.targetY - particle.startY) * eased
          + Math.cos(time * 4.6 + particle.phase) * wander
          + Math.cos(time * 0.72 + particle.phase) * settledDrift;
        const isRed = localProgress < 0.84 ? particle.startsRed : particle.endsRed;
        context.fillStyle = isRed ? colors.accent : colors.ink;
        context.globalAlpha = 0.44 + eased * 0.56;
        context.beginPath();
        context.arc(x, y, particle.radius * (0.58 + eased * 0.42), 0, Math.PI * 2);
        context.fill();
      });

      const coreOpacity = Math.max(0, Math.min(0.18, (progress - 0.62) * 0.48));
      if (coreOpacity > 0 && glyphLines.length > 0) {
        const blockHeight = glyphLineHeight * glyphLines.length;
        context.globalAlpha = coreOpacity;
        context.fillStyle = colors.ink;
        context.font = `700 ${glyphFontSize}px ${glyphFontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        glyphLines.forEach((line, index) => {
          context.fillText(line, measuredWidth / 2, measuredHeight / 2 - blockHeight / 2 + glyphLineHeight * (index + 0.5));
        });
      }
      context.globalAlpha = 1;
    };

    const animate = (now: number) => {
      draw(now);
      animationFrame = window.requestAnimationFrame(animate);
    };

    buildParticles(true);
    if (reducedMotion) draw(window.performance.now());
    else animationFrame = window.requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      if (Math.abs(bounds.width - measuredWidth) < 1 && Math.abs(bounds.height - measuredHeight) < 1) return;
      buildParticles(false);
      if (reducedMotion) draw(window.performance.now());
    });
    resizeObserver.observe(canvas);

    if (document.fonts.status !== 'loaded') {
      void document.fonts.ready.then(() => {
        if (disposed) return;
        buildParticles(false);
        if (reducedMotion) draw(window.performance.now());
      });
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [colors.accent, colors.ink, generateTrigger, password]);

  return (
    <div className={styles.passwordBlock} style={{ width: `min(${preferredWidth}px, 100%)` }}>
      <canvas
        ref={canvasRef}
        className={`${styles.password} ${password.length > 24 ? styles.passwordLong : ''}`}
        data-dither-password
        aria-hidden="true"
      />
      <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{password}</span>
    </div>
  );
}

function DitherGenerateLabel({ generateTrigger, mode }: Pick<DitherLoomProps, 'generateTrigger' | 'mode'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const colors = DITHER_PALETTES[mode];

  useEffect(() => {
    const canvas = canvasRef.current;
    const text = textRef.current;
    if (!canvas || !text) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles: GlyphParticle[] = [];
    let frame = 0;
    let startedAt = 0;
    let width = 0;
    let height = 0;
    let animating = false;

    const random = () => {
      let value = (generateTrigger + 1) * 747796405;
      return () => {
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    };

    const buildParticles = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      const mask = document.createElement('canvas');
      mask.width = width;
      mask.height = height;
      const maskContext = mask.getContext('2d', { willReadFrequently: true });
      if (!maskContext) return;
      const fontFamily = window.getComputedStyle(canvas).fontFamily || 'sans-serif';
      const maxSize = 18;
      maskContext.font = `700 ${maxSize}px ${fontFamily}`;
      const size = Math.max(14, Math.min(maxSize, maxSize * (width - 4) / maskContext.measureText('Generate').width));
      maskContext.fillStyle = '#fff';
      maskContext.font = `700 ${size}px ${fontFamily}`;
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      maskContext.fillText('Generate', width / 2, height / 2 + 0.5);

      const pixels = maskContext.getImageData(0, 0, width, height).data;
      const targets: { x: number; y: number; edge: boolean }[] = [];
      for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
          if (pixels[(y * width + x) * 4 + 3] <= 90) continue;
          const edge = [
            [x - 2, y],
            [x + 2, y],
            [x, y - 2],
            [x, y + 2],
          ].some(([sampleX, sampleY]) => pixels[(sampleY * width + sampleX) * 4 + 3] <= 90);
          targets.push({ x, y, edge });
        }
      }
      const limit = 820;
      const stride = Math.max(1, Math.ceil(targets.length / limit));
      const next = random();
      particles = targets.filter((_, index) => index % stride === 0).map((target) => ({
        startX: next() * width,
        startY: next() * height,
        targetX: target.x,
        targetY: target.y,
        radius: 0.52 + next() * 0.42,
        phase: next() * Math.PI * 2,
        delay: next() * 0.2,
        startsRed: next() < 0.7,
        endsRed: target.edge && next() < 0.06,
        edge: target.edge,
      }));
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      const progress = Math.min(1, (now - startedAt) / 900);
      const time = now / 1000;
      const textOpacity = progress < 0.1
        ? 1 - progress / 0.1
        : progress > 0.82
          ? Math.min(1, (progress - 0.82) / 0.18)
          : 0;
      const canvasOpacity = progress < 0.1
        ? progress / 0.1
        : progress > 0.82
          ? Math.max(0, 1 - (progress - 0.82) / 0.18)
          : 1;
      text.style.opacity = `${textOpacity}`;

      particles.forEach((particle) => {
        const stagger = particle.delay * 0.08;
        const outward = Math.max(0, Math.min(1, (progress - 0.12 - stagger) / 0.26));
        const inward = Math.max(0, Math.min(1, (progress - 0.48 - stagger) / 0.28));
        const outwardEase = 1 - (1 - outward) ** 3;
        const inwardEase = inward * inward * (3 - 2 * inward);
        const scatter = outwardEase * (1 - inwardEase);
        const drift = scatter * 3;
        const x = particle.targetX + (particle.startX - particle.targetX) * scatter + Math.sin(time * 8 + particle.phase) * drift;
        const y = particle.targetY + (particle.startY - particle.targetY) * scatter + Math.cos(time * 7 + particle.phase) * drift;
        context.fillStyle = scatter > 0.2
          ? (particle.startsRed ? colors.accent : colors.ink)
          : (particle.endsRed ? colors.accent : colors.ink);
        context.globalAlpha = canvasOpacity * (0.78 + (1 - scatter) * 0.22);
        context.beginPath();
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      if (progress >= 1) {
        context.clearRect(0, 0, width, height);
        text.style.opacity = '1';
        animating = false;
        return false;
      }
      return true;
    };

    const animate = (now: number) => {
      if (draw(now)) frame = window.requestAnimationFrame(animate);
    };

    buildParticles();
    context.clearRect(0, 0, width, height);
    text.style.opacity = '1';
    if (generateTrigger > 0 && !reducedMotion) {
      animating = true;
      startedAt = window.performance.now();
      frame = window.requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      if (Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - height) < 1) return;
      buildParticles();
      if (!animating) context.clearRect(0, 0, width, height);
    });
    resizeObserver.observe(canvas);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      text.style.opacity = '1';
    };
  }, [colors.accent, colors.ink, generateTrigger]);

  return (
    <span className={styles.generateLabel} aria-hidden="true">
      <span ref={textRef} className={styles.generateText}>Generate</span>
      <canvas ref={canvasRef} className={styles.generateParticles} />
    </span>
  );
}

function DitherField({ length, options, generateTrigger, copied, mode }: Pick<DitherLoomProps, 'length' | 'options' | 'generateTrigger' | 'copied' | 'mode'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ length, options, generateTrigger, copied, pointerX: -1000, pointerY: -1000, pointerActive: false });
  const colors = DITHER_PALETTES[mode];
  stateRef.current.length = length;
  stateRef.current.options = options;
  stateRef.current.generateTrigger = generateTrigger;
  stateRef.current.copied = copied;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const toggleMix: Record<keyof GeneratorOptions, number> = {
      uppercase: 0,
      numbers: 0,
      symbols: 0,
    };
    let frame = 0;
    let lastTrigger = generateTrigger;
    let burstStartedAt = -10;
    let cursorX = -1000;
    let cursorY = -1000;
    const pointer = (event: PointerEvent) => {
      stateRef.current.pointerX = event.clientX;
      stateRef.current.pointerY = event.clientY;
      stateRef.current.pointerActive = true;
    };
    const leave = () => {
      stateRef.current.pointerActive = false;
    };
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * scale);
      canvas.height = Math.round(window.innerHeight * scale);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    const seed = (value: number) => {
      const x = Math.sin(value * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    const dot = (x: number, y: number, radius: number, color: string, alpha: number) => {
      context.fillStyle = color;
      context.globalAlpha = Math.max(0, Math.min(1, alpha));
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    };
    const cluster = (cx: number, cy: number, rx: number, ry: number, count: number, redRatio: number, activity: number, time: number, pulse = 0) => {
      for (let index = 0; index < count; index += 1) {
        if (seed(index + 97) > 0.18 + activity * 0.82) continue;
        const phase = seed(index + 31) * Math.PI * 2;
        const angle = seed(index + Math.round(cx)) * Math.PI * 2 + Math.sin(time * 0.42 + phase) * 0.045;
        const distance = Math.sqrt(seed(index + cy * 3));
        const breathing = 1 + Math.sin(time * 0.82 + phase) * 0.075 * activity;
        const x = cx + Math.cos(angle) * rx * distance * breathing;
        const y = cy + Math.sin(angle) * ry * distance * breathing;
        const pointerDistance = Math.hypot(x - cursorX, y - cursorY);
        const pointerPush = Math.max(0, 1 - pointerDistance / 150) ** 2;
        const offset = pointerPush * 22;
        const isRed = seed(index + 19) < redRatio;
        dot(
          x + Math.cos(angle) * offset,
          y + Math.sin(angle) * offset,
          0.65 + seed(index + 7) * 1.5 + pulse + Math.sin(time * 0.8 + phase) * 0.08,
          isRed ? colors.accent : colors.ink,
          (0.08 + (1 - distance) * 0.74) * (0.45 + activity * 0.55) * (isRed ? 0.94 : 0.8),
        );
      }
    };
    const brushStroke = (cx: number, cy: number, width: number, height: number, count: number, time: number, intensity: number) => {
      if (intensity <= 0) return;
      for (let index = 0; index < count; index += 1) {
        const horizontal = (seed(index + 401) - 0.5) * 2;
        const taper = 1 - Math.abs(horizontal);
        const phase = seed(index + 433) * Math.PI * 2;
        const x = cx + horizontal * width * 0.5 + Math.sin(time * 0.45 + phase) * 3;
        const y = cy + (seed(index + 467) - 0.5) * height * taper + Math.sin(time * 0.72 + phase) * 2;
        const textGap = Math.abs(x - cx) < width * 0.4 && Math.abs(y - cy) < 11;
        if (textGap) continue;
        const isRed = seed(index + 499) < 0.68;
        dot(
          x,
          y,
          0.6 + taper * 1.1 + intensity * 0.35,
          isRed ? colors.accent : colors.ink,
          (0.1 + taper * 0.48) * intensity,
        );
      }
    };
    const ring = (cx: number, cy: number, rx: number, ry: number, count: number, progress: number) => {
      const intensity = Math.sin(progress * Math.PI);
      const contraction = 1.42 - progress * 0.38;
      for (let index = 0; index < count; index += 1) {
        const angle = seed(index + 601) * Math.PI * 2;
        const jitter = 0.9 + seed(index + 631) * 0.18;
        const x = cx + Math.cos(angle) * rx * contraction * jitter;
        const y = cy + Math.sin(angle) * ry * contraction * jitter;
        dot(x, y, 0.7 + seed(index + 647) * 1.9 + intensity * 0.8, seed(index + 659) < 0.58 ? colors.accent : colors.ink, intensity * 0.82);
      }
    };
    const toggleGlyph = (cx: number, cy: number, count: number, progress: number, time: number, seedOffset: number) => {
      const eased = progress * progress * (3 - 2 * progress);
      for (let index = 0; index < count; index += 1) {
        const particleSeed = index + seedOffset;
        const angle = seed(particleSeed + 11) * Math.PI * 2;
        const ringDistance = 0.58 + seed(particleSeed + 23) * 0.46;
        const circleX = Math.cos(angle) * 15.5 * ringDistance;
        const circleY = Math.sin(angle) * 15.5 * ringDistance;

        const strokeProgress = seed(particleSeed + 37);
        const onFirstStroke = strokeProgress < 0.38;
        const lineProgress = onFirstStroke ? strokeProgress / 0.38 : (strokeProgress - 0.38) / 0.62;
        const startX = onFirstStroke ? -11 : -3;
        const startY = onFirstStroke ? -1 : 8;
        const endX = onFirstStroke ? -3 : 13;
        const endY = onFirstStroke ? 7 : -10;
        const lineX = startX + (endX - startX) * lineProgress;
        const lineY = startY + (endY - startY) * lineProgress;
        const lineAngle = Math.atan2(endY - startY, endX - startX);
        const thickness = (seed(particleSeed + 53) - 0.5) * 2.8;
        const tickX = lineX + Math.cos(lineAngle + Math.PI / 2) * thickness;
        const tickY = lineY + Math.sin(lineAngle + Math.PI / 2) * thickness;

        const phase = seed(particleSeed + 67) * Math.PI * 2;
        const drift = reducedMotion ? 0 : 0.24 + (1 - eased) * 0.42;
        let x = cx + circleX + (tickX - circleX) * eased + Math.sin(time * 0.72 + phase) * drift;
        let y = cy + circleY + (tickY - circleY) * eased + Math.cos(time * 0.64 + phase) * drift;
        const pointerDistance = Math.hypot(x - cursorX, y - cursorY);
        const pointerPush = Math.max(0, 1 - pointerDistance / 110) ** 2 * 12;
        if (pointerPush > 0) {
          const pointerAngle = Math.atan2(y - cursorY, x - cursorX);
          x += Math.cos(pointerAngle) * pointerPush;
          y += Math.sin(pointerAngle) * pointerPush;
        }

        const isRed = seed(particleSeed + 79) < 0.38 - eased * 0.28;
        dot(
          x,
          y,
          0.54 + seed(particleSeed + 83) * 0.84,
          isRed ? colors.accent : colors.ink,
          0.48 + (1 - Math.abs(seed(particleSeed + 97) - 0.5) * 2) * 0.45,
        );
      }
    };
    const draw = (timestamp: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 700;
      const state = stateRef.current;
      const time = reducedMotion ? 0 : timestamp / 1000;
      if (state.generateTrigger !== lastTrigger) {
        lastTrigger = state.generateTrigger;
        burstStartedAt = time;
      }
      if (state.pointerActive && !reducedMotion) {
        cursorX += (state.pointerX - cursorX) * 0.14;
        cursorY += (state.pointerY - cursorY) * 0.14;
      } else {
        cursorX = -1000;
        cursorY = -1000;
      }
      const burstProgress = Math.min(1, Math.max(0, (time - burstStartedAt) / 1.25));
      const burst = burstProgress < 1 ? Math.sin(burstProgress * Math.PI) : 0;
      context.clearRect(0, 0, width, height);

      const passwordElement = document.querySelector<HTMLElement>('[data-dither-password]');
      const passwordRect = passwordElement?.getBoundingClientRect();
      const passwordY = passwordRect ? passwordRect.top + passwordRect.height / 2 : (isMobile ? height * 0.32 : height * 0.39);
      context.globalAlpha = 1;
      if (passwordRect) {
        const haze = context.createRadialGradient(
          passwordRect.left + passwordRect.width / 2,
          passwordY,
          4,
          passwordRect.left + passwordRect.width / 2,
          passwordY,
          Math.max(passwordRect.width * 0.62, passwordRect.height * 1.4),
        );
        haze.addColorStop(0, `rgba(${colors.paperRgb}, 0.2)`);
        haze.addColorStop(0.56, `rgba(${colors.paperRgb}, 0.09)`);
        haze.addColorStop(1, `rgba(${colors.paperRgb}, 0)`);
        context.fillStyle = haze;
        context.fillRect(passwordRect.left - 80, passwordRect.top - 80, passwordRect.width + 160, passwordRect.height + 160);
      }
      const density = isMobile ? 820 : 1500;
      for (let index = 0; index < density; index += 1) {
        const progress = seed(index + 1);
        const phase = seed(index + 73) * Math.PI * 2;
        const spreadSeed = (seed(index + 10) - 0.5) * 2;
        const breathing = 1 + Math.sin(time * 0.58 - progress * Math.PI * 3) * 0.08;
        const spread = Math.sign(spreadSeed) * Math.abs(spreadSeed) ** 1.75 * (isMobile ? 88 : 122) * breathing;
        const current = Math.sin(progress * Math.PI * 2.15 + time * 0.78) * (isMobile ? 20 : 29);
        const diagonal = (0.5 - progress) * (isMobile ? 72 : 118);
        const gather = (0.5 - progress) * burst * 34;
        let x = width * (0.015 + progress * 0.97) + Math.sin(time * 0.58 + phase) * 7 + gather;
        let y = passwordY + diagonal + current + spread + Math.cos(time * 0.72 + phase) * 6;
        const pointerDistance = Math.hypot(x - cursorX, y - cursorY);
        const repel = Math.max(0, 1 - pointerDistance / 155) ** 2 * 34;
        if (repel > 0) {
          const pointerAngle = Math.atan2(y - cursorY, x - cursorX);
          x += Math.cos(pointerAngle) * repel;
          y += Math.sin(pointerAngle) * repel;
        }
        const redFocus = 0.5 + Math.sin(time * 0.42) * 0.29;
        const redBias = 0.16 + Math.exp(-(((progress - redFocus) / 0.17) ** 2)) * 0.58;
        const isRed = seed(index + 44) < redBias;
        const core = 1 - Math.abs(spreadSeed);
        const passwordMist = passwordRect
          ? Math.max(0, 1 - Math.hypot(
            (x - (passwordRect.left + passwordRect.width / 2)) / Math.max(1, passwordRect.width * 0.56),
            (y - passwordY) / Math.max(1, passwordRect.height * 0.7),
          ))
          : 0;
        const flowPulse = 0.78 + (Math.sin(time * 0.92 - progress * Math.PI * 7) + 1) * 0.11;
        dot(
          x,
          y,
          0.55 + core * 1.35 + (isRed ? 0.15 : 0) + burst * core * 0.7,
          isRed ? colors.accent : colors.ink,
          (0.12 + core * 0.68) * flowPulse * (1 - passwordMist * 0.92),
        );
      }
      if (passwordRect && burst > 0) {
        ring(passwordRect.left + passwordRect.width / 2, passwordY, passwordRect.width / 2 + 45, 58, isMobile ? 110 : 190, burstProgress);
      }

      const sliderElement = document.getElementById('dither-length');
      const sliderRect = sliderElement?.getBoundingClientRect();
      const sliderY = sliderRect ? sliderRect.top + sliderRect.height / 2 : (isMobile ? height * 0.51 : height * 0.57);
      const sliderStart = sliderRect?.left ?? width * (isMobile ? 0.12 : 0.31);
      const sliderEnd = sliderRect?.right ?? width * (isMobile ? 0.88 : 0.69);
      const sliderProgress = (state.length - 4) / 60;
      for (let index = 0; index < 180; index += 1) {
        const progress = (index + seed(index + 211) * 0.85) / 180;
        const phase = seed(index + 223) * Math.PI * 2;
        const x = sliderStart + (sliderEnd - sliderStart) * progress + Math.sin(time * 0.5 + phase) * 1.8;
        const isActive = progress <= sliderProgress;
        const y = sliderY + (seed(index) - 0.5) * (isActive ? 8 : 5) + Math.sin(time * 0.7 + phase) * 1.3;
        dot(x, y, isActive ? 1.25 + seed(index + 229) : 0.8 + seed(index + 229) * 0.65, isActive ? colors.accent : colors.ink, isActive ? 0.86 : 0.34);
      }
      const thumbX = sliderStart + (sliderEnd - sliderStart) * sliderProgress;
      cluster(thumbX, sliderY, 24 + burst * 9, 24 + burst * 9, 118, 0.62, 1, time, burst * 0.7);

      const toggleElements = [...document.querySelectorAll<HTMLElement>('[data-dither-toggle]')];
      const toggleCenters: { x: number; y: number }[] = [];
      TOGGLES.forEach(({ key }, index) => {
        const toggleRect = toggleElements[index]?.getBoundingClientRect();
        const toggleX = toggleRect ? toggleRect.left + toggleRect.width / 2 : width * (0.3 + index * 0.2);
        const toggleY = toggleRect ? toggleRect.top + toggleRect.height / 2 : height * 0.64;
        toggleCenters.push({ x: toggleX, y: toggleY });
        toggleMix[key] += ((state.options[key] ? 1 : 0) - toggleMix[key]) * (reducedMotion ? 1 : 0.11);
        const mix = toggleMix[key];
        toggleGlyph(toggleX, toggleY, 88, mix, time, index * 211 + 701);
      });
      for (let pair = 0; pair < toggleCenters.length - 1; pair += 1) {
        const start = toggleCenters[pair];
        const end = toggleCenters[pair + 1];
        for (let index = 0; index < 44; index += 1) {
          const progress = (index + 1) / 45;
          const phase = seed(index + pair * 89) * Math.PI * 2;
          dot(
            start.x + (end.x - start.x) * progress,
            start.y + Math.sin(progress * Math.PI * 2 + time * 0.32 + phase) * 2.2,
            0.55 + seed(index + 281) * 0.7,
            seed(index + pair * 31) < 0.2 ? colors.accent : colors.ink,
            0.2,
          );
        }
      }

      const actionElement = document.querySelector<HTMLElement>('[data-dither-generate]');
      const actionRect = actionElement?.getBoundingClientRect();
      const actionY = actionRect ? actionRect.top + actionRect.height / 2 : (isMobile ? height * 0.77 : height * 0.78);
      const actionX = actionRect ? actionRect.left + actionRect.width / 2 : width * 0.5;
      const actionActive = actionElement?.matches(':hover, :focus-visible') ? 1 : 0;
      const actionIntensity = Math.min(1, actionActive * 0.22 + burst);
      brushStroke(
        actionX,
        actionY,
        isMobile ? 168 : 196,
        38 + burst * 16,
        Math.round(100 + actionIntensity * 180),
        time,
        actionIntensity,
      );
      const copyElement = document.querySelector<HTMLElement>('[data-dither-copy]');
      const copyRect = copyElement?.getBoundingClientRect();
      if (state.copied && copyRect) {
        cluster(copyRect.left + copyRect.width / 2, copyRect.top + copyRect.height / 2, 35, 23, 90, 0.72, 1, time, 0.25);
      }

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerleave', leave);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerleave', leave);
    };
  }, [colors.accent, colors.ink, colors.paperRgb, generateTrigger]);

  return <canvas ref={canvasRef} className={styles.ditherField} aria-hidden="true" />;
}

export default function DitherLoom({ password, length, options, copied, generateTrigger, mode, onLengthChange, onOptionsChange, onGenerate, onCopy, onModeToggle }: DitherLoomProps) {
  const toggle = (key: keyof GeneratorOptions) => onOptionsChange({ ...options, [key]: !options[key] });

  return (
    <section className={styles.scene} data-theme={mode} aria-label="Dither Loom password generator">
      <DitherField length={length} options={options} generateTrigger={generateTrigger} copied={copied} mode={mode} />
      <div className={styles.masthead}>
        <div className={styles.brand}>
          <svg className={styles.brandMark} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="4" r="1.5" /><circle cx="5" cy="8" r="1.5" /><circle cx="5" cy="12" r="1.5" />
            <circle cx="5" cy="16" r="1.5" /><circle cx="5" cy="20" r="1.5" /><circle cx="9" cy="11" r="1.5" />
            <circle cx="13" cy="7" r="1.5" /><circle cx="17" cy="3" r="1.5" /><circle cx="9" cy="13" r="1.5" />
            <circle cx="13" cy="17" r="1.5" /><circle cx="17" cy="21" r="1.5" /><circle className={styles.brandAccent} cx="9" cy="12" r="1.5" />
          </svg>
          <span className={styles.brandName}>keyloom</span>
        </div>
        <div className={styles.mastheadTools}>
          <a className={styles.externalLink} href="https://github.com/YarooqH/keyloom" target="_blank" rel="noreferrer" aria-label="Keyloom on GitHub" title="Keyloom on GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 .6a11.4 11.4 0 0 0-3.6 22.2c.57.1.78-.25.78-.55v-2.05c-3.17.69-3.84-1.34-3.84-1.34-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.74.4-1.24.73-1.53-2.53-.29-5.18-1.26-5.18-5.62 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .95-.31 3.13 1.17a10.9 10.9 0 0 1 5.7 0c2.18-1.48 3.13-1.17 3.13-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.82 1.17 3.06 0 4.37-2.66 5.32-5.2 5.61.41.35.78 1.04.78 2.1v3.12c0 .3.2.66.79.55A11.4 11.4 0 0 0 12 .6Z" />
            </svg>
          </a>
          <a className={styles.externalLink} href="https://www.npmjs.com/package/keyloom" target="_blank" rel="noreferrer" aria-label="Keyloom on npm" title="Keyloom on npm">
            <svg viewBox="0 0 48 24" aria-hidden="true">
              <rect width="48" height="24" fill="#e60000" />
              <path fill="#fff" fillRule="evenodd" d="M4 4h12v16h-4V8H8v12H4zm15 0h12v16h-8v4h-4zm4 4v8h4V8zm12-4h10v16h-4V8h-2v12h-4V8h-2v12h-4V4z" />
            </svg>
          </a>
          <button type="button" className={styles.modeToggle} onClick={onModeToggle} aria-pressed={mode === 'dark'} aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            {mode}
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <h1>Create a password</h1>
        <div className={styles.passwordLine}>
          <DitherPassword password={password} generateTrigger={generateTrigger} mode={mode} />
        </div>

        <div className={styles.lengthGroup}>
          <div className={styles.lengthHeader}>
            <label htmlFor="dither-length">Length</label>
            <div className={styles.lengthActions}>
              <button type="button" className={styles.copyButton} data-dither-copy data-copied={copied} onClick={onCopy} aria-label={copied ? 'Password copied' : 'Copy password'}>{copied ? 'Copied' : 'Copy'}</button>
              <output>{length}</output>
            </div>
          </div>
          <input id="dither-length" className={styles.lengthInput} type="range" min="4" max="64" value={length} onChange={(event) => onLengthChange(Number(event.target.value))} />
        </div>

        <div className={styles.options} aria-label="Password character options">
          {TOGGLES.map(({ key, label }) => (
            <button key={key} type="button" className={styles.option} aria-pressed={options[key]} onClick={() => toggle(key)}>
              <span className={styles.optionMark} data-dither-toggle={key} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </div>

        <button type="button" className={styles.generateButton} data-dither-generate onClick={onGenerate} aria-label="Generate password"><DitherGenerateLabel generateTrigger={generateTrigger} mode={mode} /></button>
        <p className={styles.helper}>Generated locally in your browser.</p>
      </div>
    </section>
  );
}
