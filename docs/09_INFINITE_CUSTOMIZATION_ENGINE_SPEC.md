# VibeGrid Infinite Customization Engine (ICE) Specification
## Production-Grade Architecture for Deep Workspace, Terminal, and UI Shell Customization

> **Version:** 1.0.0  
> **Status:** Approved / Core Architecture Specification  
> **Target Platforms:** macOS (Apple Silicon & Intel), Windows 10/11 (Mica / Acrylic / DirectWrite), Linux (X11 & Wayland / GTK)  
> **Engine Layer:** VibeGrid Core Customization Subsystem (ICE-v1)

---

## 1. Executive Summary & Architectural Paradigm

VibeGrid is engineered as a high-performance, GPU-accelerated multi-pane workspace and terminal multiplexer. Power users, DevOps engineers, and AI agent supervisors demand **infinite customization**—the ability to configure, skin, automate, and tune every pixel and process in the application without touching source code or facing hard architectural limits.

The **Infinite Customization Engine (ICE)** provides a unified, cascading configuration runtime across all five tiers of VibeGrid:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     VIBEGRID INFINITE CUSTOMIZATION ENGINE (ICE)                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. WORKSPACE TIER     │ Multi-source Icons, Color Rings, Wallpapers, Env, Git, Recipes │
│  2. TERMINAL TIER      │ Typography, OpenType, Cursor FX, WebGL Shaders, Audio, Buffer  │
│  3. UI SHELL TIER      │ Modular Status Bar (DND), Dockable Chrome, 3-Role Theme Studio │
│  4. RESOLUTION RUNTIME │ Cascading Precedence: Pane -> Workspace -> Profile -> Global   │
│  5. BUNDLE & IPC TIER  │ Portable JSON Schemas, WebGL Slot Arbiter, Microsecond Batcher │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

```mermaid
graph TD
    subgraph Storage & Ingestion
        A1[Global Settings Store]
        A2[Settings Profiles v1]
        A3[Workspace JSON Bundles v3]
        A4[Custom Themes & .tmTheme / VSCode JSON]
        A5[Recipe Scripts & Startup Macros]
    end

    subgraph ICE Resolution Engine
        B[Cascading Configuration Resolver]
        B -->|Layer 4| C4[Pane Local Overrides]
        B -->|Layer 3| C3[Workspace Scoped Config]
        B -->|Layer 2| C2[Active Named Profile]
        B -->|Layer 1| C1[Global Application Defaults]
    end

    A1 & A2 & A3 & A4 & A5 --> B

    subgraph Execution Subsystems
        D1[PTY Manager & Env Injector]
        D2[WebGL Post-Processing & Shader Pipeline]
        D3[xterm.js GPU & Typography Runtime]
        D4[3-Role Dynamic Theme Engine & CSS Vars]
        D5[Modular Status Bar DND Registry]
        D6[Web Audio API Sound Synthesizer]
    end

    C4 --> D1 & D2 & D3 & D4 & D5 & D6
```

---

## 2. Cascading Precedence & Resolution Architecture

Every configurable property in VibeGrid (theme, font, opacity, shell, working directory, environment variables, shaders, and cursor styles) resolves through a **4-tier cascading priority hierarchy**:

$$\text{Resolved Value} = \text{Pane Override} \succ \text{Workspace Override} \succ \text{Profile Setting} \succ \text{Global Default}$$

```typescript
/**
 * Configuration Property Resolution Runtime
 */
export function resolveConfigProperty<T>(
  propertyName: string,
  paneValue?: T | null,
  workspaceValue?: T | null,
  profileValue?: T | null,
  globalValue?: T
): T {
  if (paneValue !== undefined && paneValue !== null && paneValue !== '') {
    return paneValue;
  }
  if (workspaceValue !== undefined && workspaceValue !== null && workspaceValue !== '') {
    return workspaceValue;
  }
  if (profileValue !== undefined && profileValue !== null && profileValue !== '') {
    return profileValue;
  }
  return globalValue as T;
}
```

---

## 3. Workspace Customization Specification

Workspaces in VibeGrid are isolated execution environments containing layouts, running processes, appearance overrides, environment variables, git associations, and automation macros.

```mermaid
classDiagram
    class WorkspaceBundle {
        +String schemaVersion
        +String id
        +String name
        +WorkspaceIcon icon
        +WorkspaceVisuals visuals
        +WorkspaceEnvironment environment
        +WorkspaceGitBinding gitBinding
        +WorkspaceRecipe autoLaunchRecipe
        +PaneNode layout
        +WorkspaceOverrides overrides
    }
    class WorkspaceIcon {
        +IconSource type
        +String value
        +String customSvg
        +String brandId
    }
    class WorkspaceVisuals {
        +String colorRingHex
        +String customThemeId
        +WallpaperConfig wallpaper
    }
    class WorkspaceEnvironment {
        +String defaultCwd
        +String defaultShell
        +String shellArgs
        +String envFileContent
        +Record~string, string~ envVars
    }
    class WorkspaceRecipe {
        +Boolean enabled
        +String executionPolicy
        +RecipeStep[] steps
    }
    WorkspaceBundle *-- WorkspaceIcon
    WorkspaceBundle *-- WorkspaceVisuals
    WorkspaceBundle *-- WorkspaceEnvironment
    WorkspaceBundle *-- WorkspaceRecipe
```

### 3.1 Custom Workspace Icons & Badges
Workspaces support four icon types with a fallback system:

1. **Native Unicode / Emoji**: Rendered via native platform font or Twemoji SVG fallback.
2. **Lucide Icon Catalog**: Over 1,000 searchable vector icons rendered dynamically.
3. **Custom SVG Upload**: Sanitized SVG vector graphic with security filters.
4. **Brand / Tool Logos**: Pre-bundled developer ecosystem logos (`docker`, `kubernetes`, `aws`, `github`, `rust`, `python`, `node`, `go`, `postgres`, `redis`, `react`, `vue`, `angular`, `terraform`, `graphql`, `kafka`).

#### Secure SVG Sanitization Engine
Custom SVG uploads are sanitized on import to remove malicious payloads (`<script>`, inline `on*` event handlers, external entity expansion, and `javascript:` URIs):

```typescript
export function sanitizeSvg(rawSvg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
  
  // Validate root element
  const svgEl = doc.documentElement;
  if (svgEl.tagName.toLowerCase() !== 'svg') {
    throw new Error('Invalid SVG: Root element must be <svg>');
  }

  // Remove dangerous tags
  const forbiddenTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'foreignobject'];
  forbiddenTags.forEach(tag => {
    const elements = svgEl.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  // Remove dangerous attributes
  const allElements = svgEl.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().replace(/\s+/g, '');
      if (name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('data:text/html')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Enforce bounding viewBox
  if (!svgEl.getAttribute('viewBox') && svgEl.getAttribute('width') && svgEl.getAttribute('height')) {
    svgEl.setAttribute('viewBox', `0 0 ${svgEl.getAttribute('width')} ${svgEl.getAttribute('height')}`);
  }
  svgEl.setAttribute('width', '100%');
  svgEl.setAttribute('height', '100%');

  return new XMLSerializer().serializeToString(svgEl);
}
```

### 3.2 Color Identity Rings, Wallpapers & Mesh Gradients
Every workspace can have a distinct visual identity:

- **Color Identity Ring**: An accent glow ring applied to the sidebar workspace tile, window header badge, and terminal split rails.
- **Background Wallpapers**: Custom local image files (`.png`, `.jpg`, `.webp`) or procedural CSS gradients.
- **Shader / Mesh Gradients**: Procedural animated 4-point color blend background with customizable blend modes (`overlay`, `multiply`, `soft-light`, `luminosity`), blur radius (0–64px), and opacity (0.0–1.0).

```css
/* Procedural Workspace Wallpaper Background */
.vibegrid-workspace-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: var(--ws-bg-image, none);
  background-size: cover;
  background-position: center;
  filter: blur(var(--ws-bg-blur, 0px));
  opacity: var(--ws-bg-opacity, 1);
  mix-blend-mode: var(--ws-bg-blend, normal);
}

.vibegrid-workspace-ring {
  box-shadow: 0 0 0 2px var(--ws-ring-color, var(--color-accent)),
              0 0 16px -2px var(--ws-ring-color-glow, rgba(var(--color-accent-rgb), 0.4));
}
```

### 3.3 Per-Workspace Environment Variables, CWD & Git Bindings
Workspaces allow fine-grained process environment binding:

```typescript
export interface WorkspaceEnvironmentConfig {
  /** Default working directory for all newly spawned panes in this workspace */
  defaultCwd: string;
  /** Git directory binding: Auto-detects root and switches branch */
  gitBinding?: {
    repoPath: string;
    targetBranch?: string;
    autoWorktree?: boolean;
  };
  /** Shell executable override */
  defaultShell: string;
  /** Command line arguments passed to default shell */
  shellArgs: string[];
  /** Raw .env format file content with variable expansion */
  envFileContent: string;
  /** Parsed environment map */
  envMap: Record<string, string>;
}
```

#### `.env` Parser with Variable Expansion & Inheritance
```typescript
export function parseAndExpandEnv(
  rawEnv: string,
  parentEnv: Record<string, string> = {}
): Record<string, string> {
  const result: Record<string, string> = { ...parentEnv };
  const lines = rawEnv.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip wrapping quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    // Expand ${VAR} and $VAR
    val = val.replace(/\${([a-zA-Z0-9_]+)(?::-([^}]+))?}|\$([a-zA-Z0-9_]+)/g, (_, braceKey, fallback, plainKey) => {
      const varName = braceKey || plainKey;
      return result[varName] !== undefined ? result[varName] : (fallback !== undefined ? fallback : '');
    });

    result[key] = val;
  }

  return result;
}
```

### 3.4 Auto-Launch Recipes (Startup Macros)
When a workspace opens, ICE can trigger an **Auto-Launch Recipe** to set up development servers, database containers, monitoring tails, and AI agents.

```typescript
export interface RecipeStep {
  id: string;
  type: 'spawn_pane' | 'exec_command' | 'split_grid' | 'delay' | 'focus_pane' | 'broadcast_enable';
  /** Target pane ID or 'focused' | 'root' | 'new' */
  target?: string;
  /** Direction for split_grid */
  direction?: 'horizontal' | 'vertical';
  /** Command to type into PTY */
  command?: string;
  /** Auto-press Enter after command */
  pressEnter?: boolean;
  /** Delay in milliseconds */
  delayMs?: number;
  /** Halt on failure */
  continueOnError?: boolean;
}

export interface AutoLaunchRecipe {
  enabled: boolean;
  name: string;
  executionPolicy: 'sequential' | 'parallel';
  steps: RecipeStep[];
}
```

#### Recipe Execution Engine Runtime
```typescript
export class RecipeRunner {
  private abortController: AbortController | null = null;

  async execute(recipe: AutoLaunchRecipe, context: { workspaceId: string }): Promise<void> {
    if (!recipe.enabled || recipe.steps.length === 0) return;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    for (const step of recipe.steps) {
      if (signal.aborted) break;

      try {
        switch (step.type) {
          case 'delay':
            if (step.delayMs) {
              await new Promise((resolve) => setTimeout(resolve, step.delayMs));
            }
            break;

          case 'split_grid': {
            const paneStore = usePaneStore.getState();
            const focused = paneStore.focusedPaneId;
            if (focused && step.direction) {
              paneStore.splitPane(focused, step.direction);
            }
            break;
          }

          case 'exec_command': {
            if (step.command) {
              const paneStore = usePaneStore.getState();
              const targetPane = step.target && step.target !== 'focused'
                ? step.target
                : paneStore.focusedPaneId;

              if (targetPane) {
                const termNode = findTerminalNode(paneStore.root, targetPane);
                if (termNode && termNode.paneId) {
                  const cmdText = step.pressEnter !== false ? `${step.command}\n` : step.command;
                  await writeToPty(termNode.paneId, cmdText);
                }
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error(`[RecipeRunner] Step ${step.id} failed:`, err);
        if (!step.continueOnError) {
          throw err;
        }
      }
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
```

### 3.5 Portable JSON Workspace Bundles (`.vibegrid-template`)
Workspaces can be exported as self-contained, shareable `.json` bundles.

```json
{
  "$schema": "https://vibegrid.dev/schemas/workspace-bundle-v3.json",
  "schemaVersion": 3,
  "id": "tpl-frontend-fullstack",
  "name": "Fullstack Web App (Next.js + Postgres + Redis)",
  "author": "VibeGrid Architect",
  "icon": {
    "type": "brand",
    "value": "react"
  },
  "visuals": {
    "colorRingHex": "#38bdf8",
    "customThemeId": "tokyoNight",
    "wallpaper": {
      "type": "gradient",
      "gradient": "radial-gradient(ellipse at top left, rgba(56, 189, 248, 0.15), transparent 70%)"
    }
  },
  "environment": {
    "defaultCwd": "${PROJECT_ROOT:-~/dev/webapp}",
    "defaultShell": "/bin/zsh",
    "shellArgs": ["-l"],
    "envFileContent": "NODE_ENV=development\nPORT=3000\nDATABASE_URL=postgres://postgres:root@localhost:5432/main_db"
  },
  "autoLaunchRecipe": {
    "enabled": true,
    "name": "Spinup Dev Services",
    "executionPolicy": "sequential",
    "steps": [
      { "id": "s1", "type": "exec_command", "command": "docker compose up -d postgres redis", "pressEnter": true },
      { "id": "s2", "type": "delay", "delayMs": 1500 },
      { "id": "s3", "type": "split_grid", "direction": "horizontal" },
      { "id": "s4", "type": "exec_command", "command": "pnpm dev", "pressEnter": true }
    ]
  },
  "layout": {
    "type": "split",
    "id": "split-root",
    "direction": "horizontal",
    "ratio": 0.6,
    "children": [
      { "type": "terminal", "id": "t1", "title": "Next.js Frontend Server" },
      { "type": "terminal", "id": "t2", "title": "Database Logs & Shell" }
    ]
  }
}
```

---

## 4. Terminal Customization Specification

### 4.1 Typography & OpenType Feature Flags
The terminal typography subsystem controls text rasterization, ligature rendering, line pitch, and font metrics:

| Property | Valid Range / Options | Default | Description |
| :--- | :--- | :--- | :--- |
| `fontFamily` | Custom string / CSS font stack | `'JetBrains Mono', monospace` | Primary font family stack |
| `fontSize` | `4` to `96` (step 1px) | `14` | Glyph point size in pixels |
| `lineHeight` | `0.8` to `3.0` (step 0.05) | `1.2` | Vertical cell height multiplier |
| `letterSpacing` | `-2` to `10` (step 0.5px) | `0` | Horizontal character tracking in pixels |
| `fontWeight` | `100` to `900` (step 100) | `400` | Normal glyph weight |
| `fontWeightBold` | `100` to `900` (step 100) | `700` | ANSI Bold glyph weight |
| `fontLigatures` | `boolean` | `true` | Enables OpenType `calt`, `liga` |
| `fontFeatures` | String (`"ss01", "zero", "cv02"`) | `""` | OpenType stylistic alternates |
| `fontSmoothing` | `'antialiased' | 'subpixel-antialiased' | 'none'` | `'antialiased'` | OS font rasterizer mode |

#### OpenType Font Catalog & Feature Matrix
- **JetBrains Mono**: Features `calt`, `liga`, `zero`, `ss02` (no-serif `i`), `ss19` (slashed zero).
- **Fira Code**: Features `calt`, `zero`, `ss01` (`r` alternate), `ss03` (`&` alternate), `ss08` (`==` / `===`).
- **Cascadia Code**: Features `calt`, `ss01` (cursive italic), `ss19`, `ss20`.
- **SF Mono**: Apple system monospaced typeface with high legibility.
- **Comic Mono**: Casual monospace font for distinctive terminal aesthetics.
- **Monaspace Series (GitHub)**: Neon, Argon, Radon, Krypton, Xenon with texture healing and cursive italic alternates.

### 4.2 Cursor Engine & Animation Subsystem
The terminal cursor supports configurable geometric styles, blinking dynamics, phase glow effects, and GPU particle comet trails:

```mermaid
graph LR
    A[Cursor Position Updates] --> B{Cursor Trail Enabled?}
    B -->|Yes| C[Spawn WebGL / Canvas Particles]
    B -->|No| D[Direct Terminal Render]
    C --> E[Physics Simulation Step: Velocity, Drag, Alpha Decay]
    E --> F[Composite Additive Glow Trail]
    D & F --> G[Rendered Frame Buffer]
```

#### Cursor Styles & Animation Modes
1. **Geometric Styles**:
   - `block`: Solid or outline bounding cell box.
   - `beam` / `bar`: Vertical line with configurable width (1px to 8px).
   - `underline`: Horizontal bottom stripe with configurable height (1px to 4px).
2. **Animation Dynamics**:
   - `none`: Static always-visible cursor.
   - `blink`: Classic discrete square wave on/off cycle (configurable interval 200ms–1500ms).
   - `smooth`: Sine-wave continuous alpha fade: $\alpha(t) = 0.5 + 0.5 \cdot \sin(2\pi f t)$.
   - `phase-glow`: Radial phosphorescent aura pulsing around the active cursor coordinate.
3. **Cursor Particle Trail / Comet Effect**:
   - Spawns particle vertices on cursor position change.
   - Particle physics: Initial velocity $\vec{v}$, deceleration drag $\gamma = 0.92$, lifespan $\tau = 350\text{ms}$, decaying radius $r(t) = r_0 (1 - t/\tau)$.

```typescript
export interface CursorTrailConfig {
  enabled: boolean;
  mode: 'comet' | 'sparkles' | 'laser' | 'flame';
  trailLength: number; // 4 to 32 frames
  particleLifespanMs: number; // 100ms to 800ms
  particleColor: string; // Hex or 'match-cursor' | 'match-accent'
  blendMode: 'lighter' | 'screen' | 'source-over';
}
```

### 4.3 WebGL Retro Shaders & Post-Processing Pipeline
VibeGrid implements a hardware-accelerated **WebGL Post-Processing Pipeline** layered directly over the xterm.js WebGL canvas.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    WEBGL SHADER POST-PROCESSING PIPELINE                   │
├────────────────────────────────────────────────────────────────────────────┤
│  1. Primary PTY Framebuffer (xterm.js WebGL Addon Canvas)                   │
│         │                                                                  │
│         ▼                                                                  │
│  2. Texture Pass -> Ingestion into Offscreen WebGL Texture                  │
│         │                                                                  │
│         ▼                                                                  │
│  3. Fragment Shader Pass:                                                  │
│     ├── Barrel Distortion / Screen Curvature                                │
│     ├── Scanline Synthesis & Phosphor Grille                               │
│     ├── Chromatic Aberration (Radial RGB Dispersal)                        │
│     └── Bloom / Phosphor Persistence Decay                                │
│         │                                                                  │
│         ▼                                                                  │
│  4. Blit to Screen Canvas with Native OS Vibrancy & Transparency           │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Production GLSL Fragment Shader (CRT, Scanlines, Curvature, Chromatic Aberration & Bloom)
```glsl
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_terminalTexture;
uniform vec2 u_resolution;
uniform float u_time;

// Configurable Shader Parameters
uniform float u_curvature;          // 0.0 (flat) to 0.3 (curved CRT)
uniform float u_scanlineIntensity;  // 0.0 to 1.0
uniform float u_scanlineCount;      // typically 300.0 to 800.0
uniform float u_chromaticOffset;    // 0.0 to 0.015 (RGB fringing)
uniform float u_bloomIntensity;     // 0.0 to 1.0 (phosphor glow)
uniform float u_vignetteDarkness;   // 0.0 to 1.0

// Barrel distortion coordinate transform
vec2 curveUV(vec2 uv) {
    uv = (uv - 0.5) * 2.0;
    uv *= 1.1;
    uv.x *= 1.0 + pow((abs(uv.y) * u_curvature), 2.0);
    uv.y *= 1.0 + pow((abs(uv.x) * u_curvature), 2.0);
    uv = (uv / 2.0) + 0.5;
    return uv;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Apply CRT screen curvature
    if (u_curvature > 0.001) {
        uv = curveUV(uv);
        // Discard fragments outside CRT bezel boundary
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
    }

    // Chromatic Aberration (Radial Channel Split)
    vec2 dir = uv - 0.5;
    float dist = length(dir);
    vec2 offset = normalize(dir) * dist * u_chromaticOffset;

    float r = texture2D(u_terminalTexture, uv + offset).r;
    float g = texture2D(u_terminalTexture, uv).g;
    float b = texture2D(u_terminalTexture, uv - offset).b;
    vec4 baseColor = vec4(r, g, b, 1.0);

    // Phosphor Bloom Sampling (4-tap cross)
    if (u_bloomIntensity > 0.0) {
        vec2 texel = 1.0 / u_resolution;
        vec4 bloom = (
            texture2D(u_terminalTexture, uv + vec2(texel.x * 2.0, 0.0)) +
            texture2D(u_terminalTexture, uv - vec2(texel.x * 2.0, 0.0)) +
            texture2D(u_terminalTexture, uv + vec2(0.0, texel.y * 2.0)) +
            texture2D(u_terminalTexture, uv - vec2(0.0, texel.y * 2.0))
        ) * 0.25;
        baseColor += bloom * u_bloomIntensity;
    }

    // Horizontal Scanlines
    if (u_scanlineIntensity > 0.0) {
        float scanline = sin(uv.y * u_scanlineCount * 3.14159265 + u_time * 2.0);
        scanline = (scanline + 1.0) * 0.5; // Map to [0, 1]
        baseColor.rgb *= (1.0 - u_scanlineIntensity * (1.0 - scanline));
    }

    // Vignette Effect
    if (u_vignetteDarkness > 0.0) {
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
        baseColor.rgb *= mix(1.0 - u_vignetteDarkness, 1.0, vignette);
    }

    gl_FragColor = baseColor;
}
```

### 4.4 OS Native Vibrancy & Window Material Integration
VibeGrid integrates with native platform window compositors:

- **macOS Vibrancy (`NSVisualEffectView`)**:
  - Materials: `hudWindow`, `underWindow`, `popover`, `sidebar`, `fullScreenUI`.
  - Blending Modes: `behindWindow` vs `withinWindow`.
  - Dynamic Appearance: Automatically synchronizes with macOS Light/Dark appearance.
- **Windows 11 Mica & Acrylic (`DwmSetWindowAttribute`)**:
  - `DWMSBT_MAINWINDOW` (Mica material - aligns with desktop background).
  - `DWMSBT_TRANSIENTWINDOW` (Acrylic material - strong gaussian blur).
- **Linux X11 & Wayland**:
  - X11: `_NET_WM_WINDOW_OPACITY` 32-bit cardinal atom with Picom/Compiz blur hints.
  - Wayland: `org_kde_kwin_blur` protocol integration.

### 4.5 Audio & Sensory Feedback Engine
Terminal interactions provide tactile and auditory feedback:

```mermaid
graph TD
    A[Terminal Bell Trigger \a / 0x07] --> B{Bell Mode}
    B -->|Audio| C[Web Audio API Synthesizer]
    B -->|Visual Flash| D[CSS Animation Invert / Border Flash]
    B -->|Both| C & D
    B -->|Mute| E[No-op]
    
    C --> F1[Sine Wave 880Hz Bell]
    C --> F2[Retro 8-Bit Bleep / Chiptune]
    C --> F3[Mechanical Keystroke Click]
    C --> F4[Custom WAV/MP3 Sample Playback]
```

#### Parametric Web Audio Synthesizer
```typescript
export type BellSoundPreset = 'sine' | 'retro-beep' | 'mechanical-click' | 'subtle-pop' | 'custom';

export class TerminalSoundEngine {
  private audioCtx: AudioContext | null = null;
  private customBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctor();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playBell(preset: BellSoundPreset, volume: number = 0.1): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      if (preset === 'custom' && this.customBuffer) {
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        src.buffer = this.customBuffer;
        src.connect(gain).connect(ctx.destination);
        src.start(now);
        return;
      }

      switch (preset) {
        case 'retro-beep': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(880, now + 0.04);
          gain.gain.setValueAtTime(volume, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'mechanical-click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);
          gain.gain.setValueAtTime(volume * 1.5, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }

        case 'sine':
        default: {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(volume, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
      }
    } catch {
      // Audio autoplay policy or device unavailable
    }
  }

  async loadCustomAudio(arrayBuffer: ArrayBuffer): Promise<void> {
    const ctx = this.getContext();
    this.customBuffer = await ctx.decodeAudioData(arrayBuffer);
  }
}
```

### 4.6 Buffer, GPU & IPC Performance Tuning
High-throughput workflows (e.g., build loops, log streaming, AI agent reasoning traces) require adjustable buffer and IPC parameters:

1. **Scrollback Buffer History**:
   - Range: `1,000` to `1,000,000` lines.
   - Paged Memory Management: Lines exceeding 50,000 are indexed in 64KB blocks with virtualized scroll rendering to prevent DOM memory bloat.
2. **WebGL Context Slot Arbiter**:
   - Range: `1` to `32` concurrent GPU contexts.
   - LRU Context Eviction: When active pane count exceeds max WebGL slots, the least-recently-focused pane is hot-swapped to the 2D Canvas renderer without dropping PTY state or restarting the shell.
3. **IPC Microsecond Batching**:
   - Configurable interval: `1ms` to `64ms`.
   - Adaptive Batching: Automatically scales interval up during stdout torrents (>100KB/s) to maintain 60 FPS UI rendering, and scales down to 1ms during interactive typing for instant keystroke feedback.

---

## 5. UI Shell & Ergonomics Customization Specification

### 5.1 Modular Drag-and-Drop Status Bar Subsystem
The VibeGrid Status Bar is a flexible widget container with three layout zones: `Left`, `Center`, and `Right`.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODULAR STATUS BAR LAYOUT                                 │
├──────────────────────────────┬──────────────────────────┬──────────────────────────────┤
│  LEFT ZONE (Workspace & Git) │ CENTER ZONE (Active HUD) │ RIGHT ZONE (System & Telemetry)│
│  [WS Icon] [Branch] [Dirty]  │ [Agent HUD] [Cost Meter] │ [Ports] [VU] [GPU] [CPU/RAM] │
└──────────────────────────────┴──────────────────────────┴──────────────────────────────┘
```

#### Status Bar Widget Registry
```typescript
export type StatusBarZone = 'left' | 'center' | 'right';

export interface StatusBarWidgetConfig {
  id: string;
  type: StatusBarWidgetType;
  zone: StatusBarZone;
  order: number;
  visible: boolean;
  refreshIntervalMs?: number;
  customProps?: Record<string, unknown>;
}

export type StatusBarWidgetType =
  | 'workspace_identity' // Workspace icon, name & active pane title
  | 'git_branch'         // Branch name, dirty status, ahead/behind counters
  | 'active_agents'      // Active AI agents count, status pill (thinking/idle)
  | 'token_cost_meter'   // LLM session token tally, $ cost estimate, sparkline
  | 'webgl_slots'        // GPU WebGL active slots / Canvas fallback indicator
  | 'system_resources'   // Real-time CPU % & RAM usage
  | 'active_ports'       // Detected listening dev server ports (3000, 5173, etc.)
  | 'audio_vu_meter'     // Microphone RMS level meter for Whisper voice input
  | 'custom_command'     // Periodic execution of user shell script
  | 'clock_timer';       // Session stopwatch / UTC time display
```

#### Status Bar Store & Drag-and-Drop State
```typescript
export interface StatusBarState {
  widgets: StatusBarWidgetConfig[];
  moveWidget: (widgetId: string, targetZone: StatusBarZone, targetIndex: number) => void;
  toggleWidget: (widgetId: string, visible?: boolean) => void;
  updateWidgetProps: (widgetId: string, props: Record<string, unknown>) => void;
  resetToDefaults: () => void;
}
```

### 5.2 Header & Activity Bar Customization
- **Header Positioning & Docking**:
  - `top` (standard application titlebar), `bottom` (above status bar), or `hidden` (borderless fullscreen).
  - Compact height mode: `28px` (ultra-compact), `36px` (default), or `44px` (touch/accessible).
  - Custom button toolbar layout: Drag-to-reorder split buttons, layout presets, search, settings, and command palette triggers.
- **Activity Bar / Workspace Sidebar**:
  - Position: `left` or `right` docking.
  - Dock Mode: `pinned` (fixed width), `auto-hide / overlay` (reveals on mouse hover or shortcut `Cmd+B`).
  - Width: Resizable from `160px` to `480px`.
  - Display Styles: `compact-icons-only` (56px rail) vs `detailed-cards` (with previews and process badges).

### 5.3 3-Role Theme Studio & Color Science Engine
The VibeGrid Theme Studio provides a color science pipeline grounded in WCAG 2.2 APCA / AA / AAA readability standards.

```mermaid
graph TD
    A[Base Role Pickers: Background, Surface, Accent, Ink] --> B[Color Science Engine: OKLCH / CIELAB Transforms]
    B --> C[Contrast Verification Matrix: APCA / WCAG 2.2 AA/AAA]
    C -->|Pass| D[Generate Semantic Tokens Tier]
    C -->|Warning / Fail| E[Visual Warning Badge + Auto-Correct Button]
    D --> F[Inject CSS Custom Properties :root]
    D --> G[Sync xterm.js 16 ANSI Palette]
    D --> H[Export .tmTheme / VSCode JSON / Alacritty TOML]
```

#### Color Science & WCAG Contrast Formula
To guarantee legibility, ICE computes perceived relative luminance ($L$) and contrast ratio ($CR$) using WCAG 2.2 algorithms:

$$L = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$

$$CR = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (\text{where } L_1 > L_2)$$

```typescript
export interface ContrastValidationResult {
  contrastRatio: number;
  wcagAA: boolean; // >= 4.5:1 (normal text)
  wcagAAA: boolean; // >= 7.0:1 (normal text)
  wcagAALarge: boolean; // >= 3.0:1 (large text / UI components)
  suggestedCorrectionHex?: string;
}

export function validateContrast(fgHex: string, bgHex: string): ContrastValidationResult {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    contrastRatio: Number(ratio.toFixed(2)),
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7.0,
    wcagAALarge: ratio >= 3.0,
  };
}
```

#### Universal Theme Importer & Exporter
The Theme Studio imports and maps third-party theme formats:

1. **VSCode Theme JSON (`workbench.colorCustomizations` & token colors)**:
   - Maps `editor.background` $\to$ `background`
   - Maps `editor.foreground` $\to$ `foreground`
   - Maps `terminal.ansi*` $\to$ `black` through `brightWhite`
   - Maps `activityBar.background` $\to$ `surface`
   - Maps `focusBorder` / `terminalCursor.foreground` $\to$ `accent` / `cursor`
2. **TextMate `.tmTheme` (XML Plist)**:
   - Parses XML dictionary structures and extracts font style / background / caret / ANSI mappings.
3. **Exporters**:
   - VibeGrid Native Theme JSON
   - VSCode `settings.json` snippet
   - Alacritty `alacritty.toml`
   - Kitty `kitty.conf`
   - iTerm2 `.itermcolors`

```typescript
export function importVSCodeTheme(jsonString: string): TerminalTheme {
  const parsed = JSON.parse(jsonString);
  const colors = parsed.colors || parsed;

  return {
    name: parsed.name || 'Imported VSCode Theme',
    background: colors['editor.background'] || colors['terminal.background'] || '#1e1e1e',
    foreground: colors['editor.foreground'] || colors['terminal.foreground'] || '#d4d4d4',
    cursor: colors['terminalCursor.foreground'] || colors['editorCursor.foreground'] || '#528bff',
    cursorAccent: colors['terminalCursor.background'] || '#1e1e1e',
    selectionBackground: colors['terminal.selectionBackground'] || 'rgba(255, 255, 255, 0.2)',
    black: colors['terminal.ansiBlack'] || '#000000',
    red: colors['terminal.ansiRed'] || '#cd3131',
    green: colors['terminal.ansiGreen'] || '#0dbc79',
    yellow: colors['terminal.ansiYellow'] || '#e5e510',
    blue: colors['terminal.ansiBlue'] || '#2472c8',
    magenta: colors['terminal.ansiMagenta'] || '#bc3fbc',
    cyan: colors['terminal.ansiCyan'] || '#11a8cd',
    white: colors['terminal.ansiWhite'] || '#e5e5e5',
    brightBlack: colors['terminal.ansiBrightBlack'] || '#666666',
    brightRed: colors['terminal.ansiBrightRed'] || '#f14c4c',
    brightGreen: colors['terminal.ansiBrightGreen'] || '#23d18b',
    brightYellow: colors['terminal.ansiBrightYellow'] || '#f5f543',
    brightBlue: colors['terminal.ansiBrightBlue'] || '#3b8eea',
    brightMagenta: colors['terminal.ansiBrightMagenta'] || '#d670d6',
    brightCyan: colors['terminal.ansiBrightCyan'] || '#29b8db',
    brightWhite: colors['terminal.ansiBrightWhite'] || '#ffffff',
  };
}
```

---

## 6. Comprehensive TypeScript Engine State & Data Model

Below is the complete data contract defining the VibeGrid Infinite Customization Engine:

```typescript
// ============================================================================
// VIBEGRID INFINITE CUSTOMIZATION ENGINE (ICE) - CORE DATA CONTRACT
// ============================================================================

export type IconType = 'emoji' | 'lucide' | 'svg' | 'brand';
export type CursorAnimationMode = 'none' | 'blink' | 'smooth' | 'phase-glow';
export type WindowVibrancyMode = 'none' | 'vibrancy-hud' | 'vibrancy-popover' | 'mica' | 'acrylic';

export interface WorkspaceIconConfig {
  type: IconType;
  value: string; // Emoji char, Lucide icon name, raw SVG string, or brand identifier
}

export interface WorkspaceWallpaperConfig {
  type: 'none' | 'gradient' | 'image' | 'mesh';
  value: string; // CSS gradient string or file URI
  opacity: number; // 0.05 to 1.0
  blurPx: number; // 0 to 64
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'luminosity';
}

export interface TerminalTypographyConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: number;
  fontWeightBold: number;
  fontLigatures: boolean;
  fontFeatures: string;
  fontSmoothing: 'antialiased' | 'subpixel-antialiased' | 'none';
}

export interface TerminalCursorConfig {
  style: 'block' | 'underline' | 'bar';
  widthPx: number; // For bar cursor (1-8px)
  blink: boolean;
  animationMode: CursorAnimationMode;
  smoothBlinkDurationMs: number;
  phaseGlowRadiusPx: number;
  trail: {
    enabled: boolean;
    mode: 'comet' | 'sparkles' | 'laser';
    particleCount: number;
    lifespanMs: number;
  };
}

export interface TerminalShaderConfig {
  enabled: boolean;
  preset: 'none' | 'crt-classic' | 'crt-amber' | 'cyberpunk-glow' | 'subtle-scanlines' | 'custom';
  curvature: number; // 0.0 to 0.3
  scanlineIntensity: number; // 0.0 to 1.0
  scanlineCount: number; // 200 to 1200
  chromaticAberration: number; // 0.0 to 0.02
  bloomGlow: number; // 0.0 to 1.0
  vignette: number; // 0.0 to 1.0
  customFragmentShader?: string;
}

export interface TerminalSensoryConfig {
  audioBell: boolean;
  audioPreset: 'sine' | 'retro-beep' | 'mechanical-click' | 'subtle-pop' | 'custom';
  audioVolume: number; // 0.0 to 1.0
  visualBell: boolean;
  visualBellStyle: 'invert' | 'border-pulse' | 'vignette-flash';
  visualBellDurationMs: number;
  bracketedPaste: boolean;
  copyOnSelect: boolean;
  middleClickPaste: boolean;
  rightClickAction: 'context-menu' | 'paste';
  pasteConfirmNewlines: boolean;
}

export interface TerminalBufferConfig {
  scrollbackLines: number; // 1,000 to 1,000,000
  scrollOnOutput: boolean;
  maxWebglSlots: number; // 1 to 32
  ipcBatchIntervalMs: number; // 1 to 64
  adaptiveIpcBatching: boolean;
}

export interface UIShellConfig {
  themeMode: 'dark' | 'light' | 'system';
  activeThemeName: string;
  uiAccentColor: string | null;
  uiBackgroundColor: string | null;
  uiSurfaceColor: string | null;
  windowVibrancy: WindowVibrancyMode;
  windowOpacity: number; // 0.1 to 1.0
  uiZoom: number; // 80% to 150%
  animationsEnabled: boolean;
  header: {
    visible: boolean;
    dockPosition: 'top' | 'bottom';
    height: 'compact' | 'default' | 'spacious';
    buttonOrder: string[];
  };
  activityBar: {
    visible: boolean;
    dockPosition: 'left' | 'right';
    mode: 'pinned' | 'auto-hide' | 'icons-only';
    widthPx: number;
  };
  statusBar: {
    visible: boolean;
    widgets: StatusBarWidgetConfig[];
  };
}

export interface FullCustomizationProfile {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  terminal: {
    typography: TerminalTypographyConfig;
    cursor: TerminalCursorConfig;
    shaders: TerminalShaderConfig;
    sensory: TerminalSensoryConfig;
    buffer: TerminalBufferConfig;
  };
  ui: UIShellConfig;
}
```

---

## 7. Migration, Security & Validation Strategy

### 7.1 Schema Evolution & Safe In-Place Migration
To prevent state corruption across desktop releases, all configuration schemas use explicit version headers (`schemaVersion: 3`). 

```typescript
export function migrateCustomizationSchema(raw: Record<string, unknown>): FullCustomizationProfile {
  const version = typeof raw.version === 'number' ? raw.version : 1;
  let data = { ...raw };

  if (version < 2) {
    // Migration v1 -> v2: Added 3-role UI chrome tokens and themeMode
    data.ui = {
      ...(typeof data.ui === 'object' ? data.ui : {}),
      themeMode: 'dark',
      uiAccentColor: null,
    };
    data.version = 2;
  }

  if (version < 3) {
    // Migration v2 -> v3: Added Shaders, Audio synthesizer, and Modular Status Bar
    data.terminal = {
      ...(typeof data.terminal === 'object' ? data.terminal : {}),
      shaders: {
        enabled: false,
        preset: 'none',
        curvature: 0.0,
        scanlineIntensity: 0.0,
        scanlineCount: 400,
        chromaticAberration: 0.0,
        bloomGlow: 0.0,
        vignette: 0.0,
      },
      sensory: {
        audioBell: false,
        audioPreset: 'sine',
        audioVolume: 0.1,
        visualBell: true,
        visualBellStyle: 'border-pulse',
        visualBellDurationMs: 150,
        bracketedPaste: true,
        copyOnSelect: false,
        middleClickPaste: true,
        rightClickAction: 'context-menu',
        pasteConfirmNewlines: true,
      },
    };
    data.version = 3;
  }

  return data as unknown as FullCustomizationProfile;
}
```

### 7.2 Safety & Security Boundaries
- **PTY Injection Guard**: Custom environment variables and shell arguments are sanitized against null-byte injection (`\0`) and malicious format strings.
- **Shader Compilation Sandbox**: User-provided GLSL shaders are checked via offscreen canvas compilation. Syntax or linkage errors fail gracefully to the default blit pass with a non-fatal toast notification, preventing renderer thread panics.
- **Recipe Zero-Trust Interceptor**: Startup recipes containing destructive commands (e.g. `rm -rf`, `mkfs`, `dd`) prompt a security approval dialog unless explicitly trusted by the workspace author signature.

---

## 8. Verification & Test Plan

| Test Category | Test Case | Expected Outcome |
| :--- | :--- | :--- |
| **Cascade Resolution** | Pane appearance override vs Workspace override vs Global setting | Pane overrides workspace, workspace overrides global; deleting pane override instantly falls back to workspace. |
| **SVG Sanitization** | Upload SVG containing `<script>alert(1)</script>` and `onload=""` | Script tags and inline handlers stripped; clean SVG renders safely without script execution. |
| **Recipe Execution** | Multi-step startup recipe with split, delay, and shell execution | All splits created sequentially; commands dispatched to corresponding PTYs; abort signal halts execution cleanly. |
| **WebGL Shaders** | 16 active panes with CRT curvature, chromatic aberration, and bloom at 60 FPS | Shaders execute within GPU budget (<2ms frame time); no memory leaks on window resize. |
| **Audio Synthesizer** | Trigger terminal bell (`\a`) with `sine`, `retro-beep`, and `mechanical-click` | Audio synthesizes cleanly without audio pop or glitch; respects muted/volume levels. |
| **Status Bar DND** | Drag widget from Right zone to Left zone and reorder | New layout persists across app restarts; widgets dynamically update telemetry. |
| **Theme Importer** | Import VSCode Dark+ and `.tmTheme` files with WCAG validation | Palettes parsed correctly; contrast warning displayed if contrast ratio is < 4.5:1. |
| **Bundle Portability** | Export workspace as JSON bundle; import on clean instance | Layout tree, visual styles, env variables, and recipes restored identically. |

---

## 9. Conclusion

The **VibeGrid Infinite Customization Engine (ICE)** elevates VibeGrid from a static terminal multiplexer to a fully customizable desktop command center. By combining cascading configuration, WebGL post-processing shaders, parametric audio synthesis, modular drag-and-drop chrome, and portable workspace recipes, developers and AI agent operators can craft their ideal terminal environment.
