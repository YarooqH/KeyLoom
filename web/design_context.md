# KeyLoom Web - Design Context & System

## Overview
KeyLoom Web is a single-page, no-scroll application serving as the frontend for the `keyloom` password generator package. The goal is to create an immersive, "Awwwards-winning" experience with a clean, minimal UI set against a dynamic, space-themed background.

## Core Requirements

- **Architecture**: Single page, no scroll (fixed `100vh`). No overflow, no scrollbars, no content that extends beyond the viewport.
- **Core Logic**: Uses the local `keyloom` package for cryptographically secure password generation.
- **Animation**: Integrates [textmotion.dev](https://textmotion.dev/) for dynamic, high-quality typography animations, specifically when revealing the newly generated password (e.g., scrambling or decoding effects).
- **Background**: Full viewport space theme. Uses Three.js to render an animated eclipse, glowing celestial body, and subtle stardust/nebula effects. Canvas must fill 100vw × 100vh.
- **UX/UI**: Extremely clean, minimal, premium. Think editorial or high-end sci-fi interface with precise, technical details.

## Technology Stack

### Animation & Motion
- **Background**: [Three.js](https://threejs.org/) for the animated cosmic eclipse. Recommended approach:
  - A glowing celestial body (sphere with custom shader) with layered glow/bloom via [three/addons/postprocessing](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing) (UnrealBloomPass).
  - Ambient particle system (stardust) using `three/addons/objects/Points`.
  - Slow auto-rotating camera with subtle mouse parallax for depth.
- **Password Animation**: [TextMotion.dev](https://textmotion.dev/) — scrambling/decoding effect on password reveal. Integrate via their JS API or React component if available.
- **UI Motion**: [Framer Motion](https://www.framer.com/motion/) for component-level transitions (button hovers, panel fades, slider interactions). Works well alongside Three.js.

### Why this stack?
- Three.js gives us the real-time shader control needed for a true Awwwards-winning cosmic eclipse (custom glow, light rays, bloom).
- Framer Motion handles all DOM/2D UI animation with clean declarative APIs.
- TextMotion handles the core password reveal moment — the hero interaction.

## Typography

### Font Recommendations (Awwwards-Level)

**Primary Display Font** — use for the password output and hero text:
- **[Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue)** — ultra-wide, cinematic, bold. Great for the password display (one character at a time). Wide tracking fits the cosmic/technical aesthetic perfectly.
- **[Orbitron](https://fonts.google.com/specimen/Orbitron)** — futuristic, geometric, technical. Excellent for a "sci-fi terminal" vibe.
- **[Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) + [Space Mono](https://fonts.google.com/specimen/Space+Mono)** — pairing: Bebas for display, Space Mono for the monospaced password characters (prevents layout shift as characters scramble).

**UI/Body Fonts**:
- **[Outfit](https://fonts.google.com/specimen/Outfit)** — clean, modern, slightly geometric. Not overused like Inter. Great for controls/labels.
- **[Syne](https://fonts.google.com/specimen/Syne)** — bold personality, wide letter-spacing, perfect for subheadings and technical labels.
- **[Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)** — refined, premium feel, excellent at light weights.

**Selected Pairing for KeyLoom**:
- **Display / Hero**: Bebas Neue (wide, cinematic)
- **Password characters**: Space Mono (monospace, technical, prevents layout shift)
- **UI / Labels / Controls**: Outfit or Syne (clean, premium)

### Typography Styling
- Subheadings: `letter-spacing: 0.2em–0.3em`, `font-weight: 300` (thin), uppercase
- Password output: `font-family: 'Space Mono', monospace`, large scale (`clamp(2rem, 5vw, 4rem)`)
- Technical labels: `letter-spacing: 0.15em`, `font-size: 0.75rem`, uppercase, muted color

## Visual Identity & Aesthetics
Based on the provided reference images, the visual identity is built around a "Cosmic Eclipse" theme.

### Color Palette
- **Deep Space (Backgrounds)**: `#050508` to `#0d1117` (Deep, near-black void).
- **Solar Flare (Primary Accents)**: `#FF4500` (Vibrant Orange/Red) to `#FFAA00` (Amber). Used for primary actions, glows, and key highlights.
- **Nebula Glow (Secondary Accents)**: `#008080` (Deep Teal) to `#2D8C8C` (Cyan/Aqua). Used for contrasting ambient light and subtle atmospheric gradients.
- **Typography**: `#FFFFFF` (Primary text, stark white) and `#8B9A9A` (Muted/Secondary text).

### UI Elements
- **Translucency / Glassmorphism**: Subtle frosted glass effects (`backdrop-blur`) for UI panels, ensuring the gorgeous background remains visible.
- **Technical Accents**: Very thin (1px) semi-transparent technical lines, crosshairs, and minimal geometric borders.
- **Controls**: Minimalist sliders and buttons that feel tactile and responsive.

## Layout Structure

- **Background Layer (`z-index: -1`)**: Three.js canvas filling exactly `100vw × 100vh`. No overflow, no scrollbars. The canvas renders the glowing eclipse (orange/red core with teal atmospheric glow), stardust particles, and subtle light rays.
- **Foreground Layer (`z-index: 10`)**: The interactive UI — perfectly centered within the viewport.
  - All content constrained to `100vh`, horizontally and vertically centered.
  - Large, animated password display (powered by TextMotion).
  - Minimalist controls: length slider, toggle options (numbers, symbols), copy button.
  - A subtle, glowing "Generate" button.
  - No elements should break layout or extend beyond the viewport edge.

## Interactions & Motion
- **Password Generation**: When the user clicks generate, the text scrambles or decrypts smoothly using TextMotion.
- **Hover States**: Soft, glowing transitions for interactive elements (buttons, sliders). 
- **Ambient Motion**: The background celestial body should have a slow, breathing pulse, subtle light ray rotation, or particle drift to bring the scene to life without distracting from the core functionality.
