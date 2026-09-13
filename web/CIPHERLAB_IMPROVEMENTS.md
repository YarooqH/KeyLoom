# Cipher Lab Web App Improvement Plan

This file captures improvement opportunities for the `web` app with `#cipherlab` treated as the primary route. The goal is to make Cipher Lab easier to ship, test, and evolve without carrying unnecessary route complexity into the main user experience.

## Current Observations

- `#cipherlab` is implemented as a Vite + React route inside a hash-routed single-page app.
- `App.tsx` owns route selection, password state, theme state, generation timing, pointer-derived HUD state, and route-specific rendering for all visual experiments.
- `CipherLabBackground.tsx` is the core `#cipherlab` surface. It handles canvas rendering, a length dial, pointer interactions, theme application, DOM-in-canvas support detection, and DOM fallback layout.
- The web package declares `keyloom` as `file:..`, but `App.tsx` imports `generatePassword` from `../../src/index` directly.
- The repo currently has generated `web/dist`, `web/node_modules`, and `web/screenshot.png` present locally. They are ignored by `web/.gitignore`, but this reinforces the need to keep improvement work focused on source files.
- `npm run build` currently fails because `src/components/SingularityBackground.tsx` contains unterminated string literals.
- `npm run lint` currently fails on the same parse error and reports additional warnings in several components.

## Recommended Priority Order

### 1. Make `#cipherlab` the product route, not one experiment among many

If Cipher Lab is the only supported route for now, simplify the app around it.

- Default directly to `#cipherlab`, or remove hash routing until there are real supported routes.
- Hide or remove navigation links for `#classic`, `#vortex`, `#singularity`, `#supernova`, and `#cipher` from the production UI.
- Move legacy route components behind a dev-only flag, a separate playground entry, or delete them if they are no longer needed.
- Extract a `CipherLabApp` component so `App.tsx` stops mixing route orchestration with the product experience.

Expected result: fewer build blockers from unused experimental routes, clearer ownership, and less accidental regression risk.

### 2. Fix build correctness before adding more UI work

The current web app cannot build because TypeScript cannot parse `SingularityBackground.tsx`.

- Fix the multiline entries in `CODE_LINES` by using template literals or splitting them into valid single-line strings.
- Remove or quarantine legacy route files if they are not part of the Cipher Lab app.
- Address lint warnings that are easy cleanup:
  - Remove unused `SlotText` import from `PasswordDisplay.tsx`.
  - Remove unused `DENSITY` and `corePulse` from `CipherLabBackground.tsx`.
  - Remove unused imports/variables in legacy background components if those components remain.
  - Resolve hook dependency warnings in `App.tsx` and `CosmicBackground.tsx`.

Expected result: `npm run build` and `npm run lint` become useful gates for future changes.

### 3. Use the package boundary for password generation

`web/package.json` depends on `keyloom`, but `App.tsx` imports from the parent source file directly.

Recommended change:

```ts
import { generatePassword } from 'keyloom';
```

This makes the web app consume the same public API users consume. It also catches packaging and browser compatibility issues earlier.

### 4. Separate Cipher Lab state and generation behavior

Cipher Lab currently spreads behavior across route checks and shared state in `App.tsx`.

- Create a `useCipherLabGenerator` hook for `length`, `options`, `password`, `copied`, delayed generation, and copy handling.
- Keep the delayed animation timing local to Cipher Lab rather than keyed off route strings.
- Model generation status explicitly, for example `idle`, `animating`, `ready`, and `copied`.
- Cancel pending generation timers when options change, not only when length changes or the component unmounts.

Expected result: the password behavior becomes easier to test and less coupled to visual routing.

### 5. Make canvas support graceful by default

`CipherLabBackground` checks `drawElementImage` and shows a technical Chrome flag notice when unsupported. That is useful during development, but users should not need to understand browser flags.

- Treat DOM fallback as a first-class production path.
- Replace the flag notice with either no notice or a compact non-technical status only in development.
- Add a small support helper, such as `supportsCanvasDrawElement()`, so the component is not responsible for feature detection details.
- Verify both modes visually, especially password centering, controls placement, and pointer interaction.

Expected result: Cipher Lab works in browsers that do not support the experimental canvas DOM compositing API.

### 6. Improve accessibility and keyboard operation

The visual length dial is pointer-first. The app should still be operable without a mouse.

- Add keyboard support for the length dial: arrow keys, PageUp/PageDown, Home, and End.
- Expose the dial as a semantic slider with `role="slider"` or maintain a hidden synced range input.
- Add accessible names for the refresh button, copy target, and option toggles.
- Make copy feedback available through an `aria-live` region.
- Respect `prefers-reduced-motion` by reducing rotor speed, password scrambling, glow pulses, and animated transitions.

Expected result: Cipher Lab remains visually rich without excluding keyboard and reduced-motion users.

### 7. Persist user preferences locally

Cipher Lab already has themes and options; preserving them makes the app feel less transient.

- Persist `themeId`, `length`, and option toggles to `localStorage`.
- Validate stored values on load so invalid lengths or theme IDs fall back safely.
- Consider encoding shareable state in the hash or query string later, but avoid that until the core route is stable.

Expected result: returning users get the same setup they last used.

### 8. Add focused tests and visual smoke checks

The existing `test-console.mjs` targets `#singularity`, which is not the current focus.

- Update the smoke script to load `http://localhost:5173/#cipherlab`.
- Add console/page-error checks for `#cipherlab`.
- Capture screenshots at desktop and mobile viewport sizes.
- Test length changes, option toggles, refresh generation, copy behavior, and theme switching.
- Add a small unit test around generation option mapping if a test runner is introduced.

Expected result: the primary route gets regression coverage instead of only legacy visual experiments.

### 9. Clean up encoding and text quality

Several files show mojibake, such as broken degree symbols, arrows, bullets, and non-Latin rotor characters. Some are only comments, but some render in UI/canvas.

- Normalize source files to UTF-8.
- Replace corrupted visible characters in `App.tsx`, `CipherLabBackground.tsx`, docs, and CSS comments.
- Keep comments concise and technical where they explain non-obvious canvas behavior.

Expected result: cleaner source, fewer confusing rendered glyphs, and less noise during future edits.

### 10. Split the large canvas component into smaller modules

`CipherLabBackground.tsx` is doing many jobs in one file.

Suggested extraction points:

- `cipherLab/constants.ts` for dial, rotor, mote, and length constants.
- `cipherLab/themeCanvas.ts` for color helpers and canvas-specific theme values.
- `cipherLab/useCanvasSupport.ts` for `drawElementImage` detection.
- `cipherLab/useCipherDial.ts` for pointer-to-length math.
- `cipherLab/renderCipherFrame.ts` for pure-ish drawing routines.

Expected result: easier review, easier targeted testing, and fewer accidental regressions when tuning visuals.

## Suggested First Pass

1. Fix or remove the broken legacy `SingularityBackground.tsx` code so the app builds.
2. Make `App.tsx` default to `#cipherlab` and hide legacy route navigation.
3. Switch web generation import to `keyloom`.
4. Update `test-console.mjs` to smoke test `#cipherlab`.
5. Remove the unused imports/variables reported by lint.
6. Extract `CipherLabApp` and a generator hook once the build is green.

## Verification Gates

Run these from `web/` after each improvement pass:

```bash
npm run lint
npm run build
```

For visual changes, also run the Vite dev server and use the Playwright smoke script against `#cipherlab` at desktop and mobile viewport sizes.
