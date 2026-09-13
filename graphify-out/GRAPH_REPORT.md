# Graph Report - .  (2026-06-29)

## Corpus Check
- Corpus is ~18,055 words - fits in a single context window. You may not need a graph.

## Summary
- 214 nodes · 233 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Root CLI Package Metadata|Root CLI Package Metadata]]
- [[_COMMUNITY_Visual Design System & Motion Stack|Visual Design System & Motion Stack]]
- [[_COMMUNITY_React UI Components|React UI Components]]
- [[_COMMUNITY_Web App TypeScript Config|Web App TypeScript Config]]
- [[_COMMUNITY_CLI TypeScript Build Config|CLI TypeScript Build Config]]
- [[_COMMUNITY_Web Node TypeScript Config|Web Node TypeScript Config]]
- [[_COMMUNITY_CLI Password Engine & Public API|CLI Password Engine & Public API]]
- [[_COMMUNITY_Web Dev Tooling (PostCSSTailwindPlaywright)|Web Dev Tooling (PostCSS/Tailwind/Playwright)]]
- [[_COMMUNITY_Web Package Manifest|Web Package Manifest]]
- [[_COMMUNITY_Brand Identity (Favicon, Fonts, Typography Rationale)|Brand Identity (Favicon, Fonts, Typography Rationale)]]
- [[_COMMUNITY_Legacy CLI Bin (passgen.js, ESM .js mirror)|Legacy CLI Bin (passgen.js, ESM .js mirror)]]
- [[_COMMUNITY_Oxlint Rules Config|Oxlint Rules Config]]
- [[_COMMUNITY_Vite + React + Oxlint Stack Docs|Vite + React + Oxlint Stack Docs]]
- [[_COMMUNITY_SingularityBackground Code-Line Animator|SingularityBackground Code-Line Animator]]
- [[_COMMUNITY_Web TS Project References|Web TS Project References]]
- [[_COMMUNITY_Icons Sprite Asset|Icons Sprite Asset]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 15 edges
3. `compilerOptions` - 15 edges
4. `KeyLoom Web Design Context` - 10 edges
5. `KeyLoom Web SPA` - 8 edges
6. `scripts` - 6 edges
7. `generatePassword()` - 6 edges
8. `Three.js Background Layer` - 6 edges
9. `Three Background Variants (Cosmic / Vortex / Singularity)` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `KeyLoom CLI` --semantically_similar_to--> `KeyLoom Web SPA`  [INFERRED] [semantically similar]
  README.md → web/design_context.md
- `KeyLoom CLI` --references--> `keyloom`  [INFERRED]
  README.md → package.json
- `Ambiguous Character Exclusion (il1Lo0O)` --references--> `CHAR_SETS`  [INFERRED]
  README.md → src/index.ts
- `Library API (generatePassword)` --references--> `generatePassword()`  [INFERRED]
  README.md → src/index.ts
- `Password Presets (simple/strong/pin)` --references--> `program`  [INFERRED]
  README.md → src/passgen.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **KeyLoom Visual Identity (Cosmic Eclipse)** — web_design_context_cosmic_eclipse, web_design_context_color_palette, web_design_context_typography, web_design_context_glassmorphism, web_design_context_stardust, web_design_context_unreal_bloom [INFERRED 0.85]
- **KeyLoom Motion Stack** — web_design_context_threejs, web_design_context_textmotion, web_design_context_framermotion [EXTRACTED 1.00]

## Communities (18 total, 3 thin omitted)

### Community 0 - "Root CLI Package Metadata"
Cohesion: 0.07
Nodes (29): author, bugs, url, dependencies, clipboardy, commander, description, devDependencies (+21 more)

### Community 1 - "Visual Design System & Motion Stack"
Cohesion: 0.08
Nodes (28): Hash-Based Background Routing (#classic, #vortex, #singularity), Three Background Variants (Cosmic / Vortex / Singularity), KeyLoom Web Design Context, Color Palette (Deep Space / Solar Flare / Nebula Glow), Cosmic Eclipse Theme, Framer Motion UI Transitions, Glassmorphism UI Pattern, KeyLoom Web SPA (+20 more)

### Community 2 - "React UI Components"
Cohesion: 0.12
Nodes (13): GeneratorOptions, Controls(), ControlsProps, Options, TOGGLES, CosmicBackground(), CosmicBackgroundProps, DataVortexBackground() (+5 more)

### Community 3 - "Web App TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 4 - "CLI TypeScript Build Config"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+9 more)

### Community 5 - "Web Node TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 6 - "CLI Password Engine & Public API"
Cohesion: 0.20
Nodes (14): KeyLoom CLI README, Ambiguous Character Exclusion (il1Lo0O), Library API (generatePassword), Password Presets (simple/strong/pin), CHAR_SETS, generatePassword(), getSecureRandomBytes(), PasswordOptions (+6 more)

### Community 7 - "Web Dev Tooling (PostCSS/Tailwind/Playwright)"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, oxlint, playwright, postcss, tailwindcss, @types/node, @types/react (+5 more)

### Community 8 - "Web Package Manifest"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 9 - "Brand Identity (Favicon, Fonts, Typography Rationale)"
Cohesion: 0.25
Nodes (8): bin, keyloom, KeyLoom CLI, Why Space Mono for password chars, Typography Pairing (Bebas Neue + Space Mono + Outfit), Web Entry HTML, Google Fonts Preload (Bebas Neue, Outfit, Space Mono), Favicon (KeyLoom Brand Mark)

### Community 10 - "Legacy CLI Bin (passgen.js, ESM .js mirror)"
Cohesion: 0.29
Nodes (4): CHAR_SETS, { Command }, crypto, program

### Community 11 - "Oxlint Rules Config"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "Vite + React + Oxlint Stack Docs"
Cohesion: 0.40
Nodes (5): Web README (Vite + React + TS Template), Oxlint with Type-Aware Rules, Vite + React + TypeScript Stack, React Logo, Vite Logo

## Knowledge Gaps
- **127 isolated node(s):** `{ Command }`, `crypto`, `program`, `CHAR_SETS`, `name` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `KeyLoom Web SPA` connect `Visual Design System & Motion Stack` to `Brand Identity (Favicon, Fonts, Typography Rationale)`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `KeyLoom CLI` connect `Brand Identity (Favicon, Fonts, Typography Rationale)` to `Visual Design System & Motion Stack`, `CLI Password Engine & Public API`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **What connects `{ Command }`, `crypto`, `program` to the rest of the system?**
  _131 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Root CLI Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Visual Design System & Motion Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.08275862068965517 - nodes in this community are weakly interconnected._
- **Should `React UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `Web App TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._