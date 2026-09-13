export interface Theme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  bg: string;
  text: string;
  textGlow: string;        // rgba
  gradient: string[];      // 7 colors, hot (inner) -> cold (outer)
  core: string;
  dialFill: string;
  dialTrack: string;
  dialTick: string;
  knob: string;
  knobCore: string;
  knobGlow: string;        // rgba
  chipText: string;
  chipBorder: string;      // rgba
  chipGlow: string;        // rgba
  moteColors: string[];
  accent: string;
  accentSoft: string;      // rgba
  scanlineAlpha: number;
  vignetteColor: string;   // rgba
  bottomGradient: string;  // rgba
}

export const THEMES: Theme[] = [
  // ============ DARK (7) ============
  {
    id: 'solar', name: 'Solar Flare', mode: 'dark',
    bg: '#050508', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#FFE680', '#FFAA00', '#FF6B00', '#FF4500', '#9A4A1E', '#2D8C8C', '#005252'],
    core: '#FFFFFF', dialFill: '#FFAA00', dialTrack: '#2D8C8C', dialTick: '#2D8C8C',
    knob: '#FFFFFF', knobCore: '#FFAA00', knobGlow: 'rgba(255,170,0,0.95)',
    chipText: '#FFE680', chipBorder: 'rgba(255,170,0,0.55)', chipGlow: 'rgba(255,170,0,0.5)',
    moteColors: ['#FFFFFF', '#2D8C8C', '#FFAA00'],
    accent: '#ffaa00', accentSoft: 'rgba(255,170,0,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(255,69,0,0.08)', bottomGradient: 'rgba(5,5,8,0.5)',
  },
  {
    id: 'nebula', name: 'Nebula', mode: 'dark',
    bg: '#0a0820', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#f0abfc', '#e879f9', '#d946ef', '#a855f7', '#7c3aed', '#4f46e5', '#312e81'],
    core: '#ffffff', dialFill: '#d946ef', dialTrack: '#6366f1', dialTick: '#818cf8',
    knob: '#ffffff', knobCore: '#d946ef', knobGlow: 'rgba(217,70,239,0.95)',
    chipText: '#f0abfc', chipBorder: 'rgba(217,70,239,0.55)', chipGlow: 'rgba(217,70,239,0.5)',
    moteColors: ['#ffffff', '#a855f7', '#d946ef'],
    accent: '#d946ef', accentSoft: 'rgba(217,70,239,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(139,92,246,0.1)', bottomGradient: 'rgba(10,8,32,0.5)',
  },
  {
    id: 'aurora', name: 'Aurora', mode: 'dark',
    bg: '#021018', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#a7f3d0', '#34d399', '#10b981', '#059669', '#0d9488', '#0891b2', '#155e75'],
    core: '#ffffff', dialFill: '#34d399', dialTrack: '#0d9488', dialTick: '#14b8a6',
    knob: '#ffffff', knobCore: '#34d399', knobGlow: 'rgba(52,211,153,0.95)',
    chipText: '#a7f3d0', chipBorder: 'rgba(52,211,153,0.55)', chipGlow: 'rgba(52,211,153,0.5)',
    moteColors: ['#ffffff', '#34d399', '#67e8f9'],
    accent: '#34d399', accentSoft: 'rgba(52,211,153,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(13,148,136,0.1)', bottomGradient: 'rgba(2,16,24,0.5)',
  },
  {
    id: 'ember', name: 'Ember', mode: 'dark',
    bg: '#0d0608', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b', '#450a0a'],
    core: '#ffffff', dialFill: '#ef4444', dialTrack: '#991b1b', dialTick: '#b91c1c',
    knob: '#ffffff', knobCore: '#ef4444', knobGlow: 'rgba(239,68,68,0.95)',
    chipText: '#fecaca', chipBorder: 'rgba(239,68,68,0.55)', chipGlow: 'rgba(239,68,68,0.5)',
    moteColors: ['#ffffff', '#f87171', '#fbbf24'],
    accent: '#ef4444', accentSoft: 'rgba(239,68,68,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(220,38,38,0.1)', bottomGradient: 'rgba(13,6,8,0.5)',
  },
  {
    id: 'glacier', name: 'Glacier', mode: 'dark',
    bg: '#06101a', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0c4a6e'],
    core: '#ffffff', dialFill: '#7dd3fc', dialTrack: '#0284c7', dialTick: '#38bdf8',
    knob: '#ffffff', knobCore: '#7dd3fc', knobGlow: 'rgba(125,211,252,0.95)',
    chipText: '#e0f2fe', chipBorder: 'rgba(125,211,252,0.55)', chipGlow: 'rgba(125,211,252,0.5)',
    moteColors: ['#ffffff', '#7dd3fc', '#bae6fd'],
    accent: '#7dd3fc', accentSoft: 'rgba(125,211,252,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(14,165,233,0.1)', bottomGradient: 'rgba(6,16,26,0.5)',
  },
  {
    id: 'vapor', name: 'Vapor', mode: 'dark',
    bg: '#140a20', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#fbcfe8', '#f472b6', '#ec4899', '#a855f7', '#7c3aed', '#22d3ee', '#0e7490'],
    core: '#ffffff', dialFill: '#f472b6', dialTrack: '#22d3ee', dialTick: '#67e8f9',
    knob: '#ffffff', knobCore: '#f472b6', knobGlow: 'rgba(244,114,182,0.95)',
    chipText: '#fbcfe8', chipBorder: 'rgba(244,114,182,0.55)', chipGlow: 'rgba(244,114,182,0.5)',
    moteColors: ['#ffffff', '#f472b6', '#22d3ee'],
    accent: '#f472b6', accentSoft: 'rgba(244,114,182,0.08)',
    scanlineAlpha: 0.22, vignetteColor: 'rgba(168,85,247,0.1)', bottomGradient: 'rgba(20,10,32,0.5)',
  },
  {
    id: 'mono', name: 'Mono', mode: 'dark',
    bg: '#000000', text: '#ffffff', textGlow: 'rgba(255,255,255,0.5)',
    gradient: ['#ffffff', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#262626'],
    core: '#ffffff', dialFill: '#ffffff', dialTrack: '#525252', dialTick: '#a3a3a3',
    knob: '#ffffff', knobCore: '#ffffff', knobGlow: 'rgba(255,255,255,0.95)',
    chipText: '#ffffff', chipBorder: 'rgba(255,255,255,0.55)', chipGlow: 'rgba(255,255,255,0.5)',
    moteColors: ['#ffffff', '#a3a3a3', '#d4d4d4'],
    accent: '#ffffff', accentSoft: 'rgba(255,255,255,0.08)',
    scanlineAlpha: 0.18, vignetteColor: 'rgba(255,255,255,0.05)', bottomGradient: 'rgba(0,0,0,0.5)',
  },

  // ============ LIGHT (7) ============
  {
    id: 'paper', name: 'Paper', mode: 'light',
    bg: '#f5f1e8', text: '#1a1a1a', textGlow: 'rgba(0,0,0,0.18)',
    gradient: ['#1a1a1a', '#3a3a3a', '#5a5a5a', '#7a7a7a', '#9a9a9a', '#b0a890', '#c9bfa0'],
    core: '#1a1a1a', dialFill: '#3a3a3a', dialTrack: '#d4cdb8', dialTick: '#b0a890',
    knob: '#1a1a1a', knobCore: '#3a3a3a', knobGlow: 'rgba(58,58,58,0.4)',
    chipText: '#1a1a1a', chipBorder: 'rgba(58,58,58,0.5)', chipGlow: 'rgba(58,58,58,0.3)',
    moteColors: ['#1a1a1a', '#7a7a7a', '#b0a890'],
    accent: '#3a3a3a', accentSoft: 'rgba(58,58,58,0.06)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(180,160,120,0.1)', bottomGradient: 'rgba(245,241,232,0.5)',
  },
  {
    id: 'sand', name: 'Sand', mode: 'light',
    bg: '#f4e8d4', text: '#3d2817', textGlow: 'rgba(61,40,23,0.18)',
    gradient: ['#7c2d12', '#9a3412', '#b45309', '#c2410c', '#d97706', '#d4b896', '#e8d5b0'],
    core: '#7c2d12', dialFill: '#b45309', dialTrack: '#d4b896', dialTick: '#a16207',
    knob: '#7c2d12', knobCore: '#b45309', knobGlow: 'rgba(180,83,9,0.4)',
    chipText: '#7c2d12', chipBorder: 'rgba(180,83,9,0.5)', chipGlow: 'rgba(180,83,9,0.3)',
    moteColors: ['#7c2d12', '#b45309', '#d4b896'],
    accent: '#b45309', accentSoft: 'rgba(180,83,9,0.08)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(180,120,60,0.1)', bottomGradient: 'rgba(244,232,212,0.5)',
  },
  {
    id: 'mint', name: 'Mint', mode: 'light',
    bg: '#e8f5ee', text: '#064e3b', textGlow: 'rgba(6,78,59,0.18)',
    gradient: ['#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#a7f3d0', '#d1fae5'],
    core: '#064e3b', dialFill: '#047857', dialTrack: '#a7f3d0', dialTick: '#6ee7b7',
    knob: '#064e3b', knobCore: '#047857', knobGlow: 'rgba(4,120,87,0.4)',
    chipText: '#064e3b', chipBorder: 'rgba(4,120,87,0.5)', chipGlow: 'rgba(4,120,87,0.3)',
    moteColors: ['#064e3b', '#047857', '#34d399'],
    accent: '#047857', accentSoft: 'rgba(4,120,87,0.08)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(16,185,129,0.1)', bottomGradient: 'rgba(232,245,238,0.5)',
  },
  {
    id: 'sky', name: 'Sky', mode: 'light',
    bg: '#e6f0fa', text: '#0c2747', textGlow: 'rgba(12,39,71,0.18)',
    gradient: ['#0c2747', '#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#93c5fd', '#dbeafe'],
    core: '#0c2747', dialFill: '#1e40af', dialTrack: '#93c5fd', dialTick: '#60a5fa',
    knob: '#0c2747', knobCore: '#1e40af', knobGlow: 'rgba(30,64,175,0.4)',
    chipText: '#0c2747', chipBorder: 'rgba(30,64,175,0.5)', chipGlow: 'rgba(30,64,175,0.3)',
    moteColors: ['#0c2747', '#1e40af', '#3b82f6'],
    accent: '#1e40af', accentSoft: 'rgba(30,64,175,0.08)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(37,99,235,0.1)', bottomGradient: 'rgba(230,240,250,0.5)',
  },
  {
    id: 'rose', name: 'Rose', mode: 'light',
    bg: '#fae8ed', text: '#4c0519', textGlow: 'rgba(76,5,25,0.18)',
    gradient: ['#4c0519', '#831843', '#be123c', '#e11d48', '#f43f5e', '#fda4af', '#fecdd3'],
    core: '#4c0519', dialFill: '#be123c', dialTrack: '#fda4af', dialTick: '#fb7185',
    knob: '#4c0519', knobCore: '#be123c', knobGlow: 'rgba(190,18,60,0.4)',
    chipText: '#4c0519', chipBorder: 'rgba(190,18,60,0.5)', chipGlow: 'rgba(190,18,60,0.3)',
    moteColors: ['#4c0519', '#be123c', '#f43f5e'],
    accent: '#be123c', accentSoft: 'rgba(190,18,60,0.08)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(225,29,72,0.1)', bottomGradient: 'rgba(250,232,237,0.5)',
  },
  {
    id: 'linen', name: 'Linen', mode: 'light',
    bg: '#fafafa', text: '#000000', textGlow: 'rgba(0,0,0,0.15)',
    gradient: ['#000000', '#1a1a1a', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'],
    core: '#000000', dialFill: '#1a1a1a', dialTrack: '#d4d4d4', dialTick: '#a3a3a3',
    knob: '#000000', knobCore: '#1a1a1a', knobGlow: 'rgba(26,26,26,0.4)',
    chipText: '#000000', chipBorder: 'rgba(26,26,26,0.5)', chipGlow: 'rgba(26,26,26,0.3)',
    moteColors: ['#000000', '#737373', '#a3a3a3'],
    accent: '#1a1a1a', accentSoft: 'rgba(26,26,26,0.06)',
    scanlineAlpha: 0.05, vignetteColor: 'rgba(0,0,0,0.06)', bottomGradient: 'rgba(250,250,250,0.5)',
  },
  {
    id: 'peach', name: 'Peach', mode: 'light',
    bg: '#fde8d8', text: '#431407', textGlow: 'rgba(67,20,7,0.18)',
    gradient: ['#431407', '#9a3412', '#c2410c', '#ea580c', '#fb923c', '#fed7aa', '#ffedd5'],
    core: '#431407', dialFill: '#ea580c', dialTrack: '#fed7aa', dialTick: '#fdba74',
    knob: '#431407', knobCore: '#ea580c', knobGlow: 'rgba(234,88,12,0.4)',
    chipText: '#431407', chipBorder: 'rgba(234,88,12,0.5)', chipGlow: 'rgba(234,88,12,0.3)',
    moteColors: ['#431407', '#ea580c', '#fb923c'],
    accent: '#ea580c', accentSoft: 'rgba(234,88,12,0.08)',
    scanlineAlpha: 0.06, vignetteColor: 'rgba(234,88,12,0.1)', bottomGradient: 'rgba(253,232,216,0.5)',
  },
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? DEFAULT_THEME;
}

// ---- CSS variable mapping ----
// Maps a Theme to the CSS custom properties consumed by the cipher-lab view
// (PasswordDisplay + CipherControls + glass containers). Centralising this here
// means the CSS module files can stay theme-agnostic and every view that opts
// in (currently only CipherLabBackground) gets consistent theming.
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  const isLight = theme.mode === 'light';
  // Glass: dark mode uses a soft white wash, light mode uses a soft black wash
  // so the frosted panel reads as a "lifted" surface in both directions.
  const glassBg = isLight ? rgba('#000000', 0.04) : 'rgba(255, 255, 255, 0.22)';
  const glassBorder = isLight ? rgba('#000000', 0.10) : 'rgba(255, 255, 255, 0.28)';
  // Muted text and subtle border: derive from the theme's text color so any
  // future palette swaps still produce legible, on-brand values.
  const textMuted = rgba(theme.text, isLight ? 0.6 : 0.55);
  const borderSubtle = rgba(theme.text, isLight ? 0.18 : 0.22);
  const bgContrast = isLight ? '#ffffff' : '#0f0f19';
  return {
    '--cipher-text': theme.text,
    '--cipher-text-glow': theme.textGlow,
    '--cipher-text-muted': textMuted,
    '--cipher-text-hover': rgba(theme.text, isLight ? 0.82 : 0.85),
    '--cipher-accent': theme.accent,
    '--cipher-accent-soft': theme.accentSoft,
    '--cipher-border-subtle': borderSubtle,
    '--cipher-glass-bg': glassBg,
    '--cipher-glass-border': glassBorder,
    '--cipher-bg-contrast': bgContrast,
  };
}
