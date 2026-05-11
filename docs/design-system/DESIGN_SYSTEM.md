# MachIndex Design System — v2.1

> **Core Principle**
>
> Grid may be flexible. Card styling is not.
>
> The system allows softness, but not creativity.
> Softness is controlled via tokens.
> Creativity outside tokens is not allowed.
>
> Consistency > Creativity. System > Style. Precision > Expression.

---

## 0. Surface System

Four layers only. No additional layers. No custom backgrounds. No gradients.

### Dark Mode (default)

| Layer | Token | Value | Usage |
|---|---|---|---|
| L0 | `--surface-base` | `#050709` | Page background |
| L1 | `--surface-raised` | `#0F1219` | Default cards |
| L2 | `--surface-track` | `#0A0D14` | Off-state controls |
| L3 | `--surface-inner` | `#151820` | Inset surfaces (AI input, etc.) |

### Light Mode

| Layer | Token | Value | Usage |
|---|---|---|---|
| L0 | `--surface-base` | `#F2F4F6` | Page background |
| L1 | `--surface-raised` | `#FFFFFF` | Default cards |
| L2 | `--surface-track` | `#F6F7F9` | Off-state controls |
| L3 | `--surface-inner` | `#FAFAFA` | Inset surfaces |

### Rules

- Exactly 4 layers — never add a 5th
- Never use arbitrary background colors on surfaces
- No gradients on any surface layer

---

## 0.5. Typography

| Token | Font | Usage |
|---|---|---|
| `--font-sans` | Geist | Body, UI, labels |
| `--font-mono` | JetBrains Mono | Code, numeric data |
| `--font-condensed` | Barlow Semi Condensed | Data tables, compact headers |

Font packages: `geist`, `@fontsource/jetbrains-mono`, `@fontsource/barlow-semi-condensed`

---

## 1. Radius System

MachIndex uses a controlled radius scale. **No arbitrary values allowed.**

| Token | Value | Usage |
|------|------|------|
| `radius-sm` | 8px | Icon chips, small controls |
| `radius-md` | 12px | Inputs, small containers |
| `radius-lg` | 16px | Buttons, medium containers |
| `radius-xl` | 20px | Default cards |
| `radius-2xl` | 24px | Large feature cards |

### Rules

- Default card radius = `radius-xl` (20px)
- Feature cards may use `radius-2xl` (24px)
- Icon chips ALWAYS use `radius-sm` (8px)
- Inputs ALWAYS use `radius-md` (12px)

### Not allowed

- 10px, 13px, 15px, 17px, etc.
- Mixing multiple radii in same component
- Custom per-component radius

---

## 2. Card System

Cards may vary in size, but **NEVER in styling**.

### Base Card (Default)

- `bg-surface-raised`
- `rounded-xl` (20px)
- `shadow-soft-raised`
- token border
- padding: `p-4`

### Card Variants

| Variant | Usage | Rules |
|--------|------|------|
| `default` | standard cards | base rules |
| `compact` | small KPI / utility | `p-3` |
| `feature` | large hero cards | `rounded-2xl`, `p-5` |

### Soft Raised Cards

Used for:
- KPI cards
- Analytics
- AI input container

**Light mode** — allowed:
- Ultra subtle elevation (max 2 layers)
- Very low opacity (<0.06)

Examples:
- `0 1px 2px rgba(0,0,0,0.04)`
- `0 4px 12px rgba(0,0,0,0.04)`

**Dark mode:**
- NO glow
- NO neon
- Depth comes from surface contrast only

### Forbidden on cards

- Gradients
- Glow
- Blur
- Neumorphism
- Floating glass cards

---

## 3. Charts

Charts are **data-first, not design elements**.

### Default

- Grayscale / neutral palette
- Thin strokes
- Minimal fill

### Accent

- Only ONE accent allowed
- Must map to meaning (primary or status)

### Forbidden

- Multi-color decorative charts
- Gradients
- Bright accent fills

---

## 4. AI Input Component

This is a primary system component.

### Structure

Single container only:

```
[ input row ]
[ controls row ]
```

### Rules

- Uses `bg-surface-raised`
- `rounded-xl`
- `shadow-soft-raised`
- No nested cards
- No glow
- No inner shadows

### Behavior

- Subtle focus state only
- No animated glow
- No neon effects

---

## 5. Bento Grid

MachIndex supports flexible mobile grid layouts.

### Grid

- `grid-template-columns: repeat(6, 1fr)`
- `gap: 12px`
- Outer padding: 16px

### Card sizing

Allowed unit sizes only:

- 1×1
- 2×1
- 2×2
- 3×2
- 3×3
- 6×2
- 6×3

### Rules

- Cards snap to grid units
- No random sizes
- No horizontal scroll
- Layout can vary, styling cannot

---

## 6. Shadow Policy

### Light mode

**Allowed:**
- Border-based elevation
- Minimal soft shadow (optional, controlled)

**Not allowed:**
- Large shadows
- Blur shadows
- Glow
- Atmospheric depth

### Dark mode

**Allowed:**
- Subtle depth via contrast

**Not allowed:**
- Neon glow
- Colored shadows

---

## 7. Motion

All transitions use a single shared easing curve.

### Default easing

```
cubic-bezier(0.22, 1, 0.36, 1)
```

Token: `--ease-standard`. Tailwind utility: `ease-standard` (alias `ease-mx`).

### Durations

| Token | Value | Usage |
|---|---|---|
| `duration-fast` | 120ms | Micro-interactions (hover, tap) |
| `duration-base` | 200ms | Default UI transitions |
| `duration-slow` | 320ms | Page-level / large surface changes |

### Rules

- Never animate longer than `duration-slow` for UI feedback
- No spring animations on system controls
- No bouncy easings (overshoot is not on-brand)

---

## 8. Focus state

All interactive elements MUST be keyboard-focusable and show a focus ring.

### Default focus ring

```
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary/30
```

- Uses `focus-visible` (not `focus`) so mouse clicks don't show the ring
- Always 2px ring, primary at 30% opacity
- No glow, no shadow, no animation

### Token-backed alternative

For elements where Tailwind ring is awkward, use the `--focus-ring` box-shadow token:
```
box-shadow: var(--focus-ring);
```

### Rules

- Focus indicator is required on every interactive element
- Color must be `primary/30` — never `accent`, `info`, or status colors
- No removal of outline without replacement

---

## 9. Disabled state

```
disabled:opacity-50
disabled:cursor-not-allowed
```

Token: `--disabled-opacity: 0.5`.

### Rules

- 50% opacity reduction across the whole control
- `cursor-not-allowed` on hover
- No color change beyond opacity
- Pointer events stay on (so tooltips can fire), but `disabled` attribute prevents interaction

---

## 10. Toggle component

### Structure

```
[ track ]
   [ thumb ]
```

- Track = pill (`rounded-full`)
- Thumb = circle (`rounded-full`)

### Sizing

- Track height: 28–32px
- Thumb diameter: ~60% of track height

### OFF state

| Element | Token |
|---|---|
| Track | `bg-surface-track` |
| Thumb | `bg-surface-raised` |
| Border | `border-border` |
| Shadow | `shadow-soft-raised` (no glow) |

Feel: neutral, low contrast, system.

### ON state — primary subtle (default)

| Element | Token |
|---|---|
| Track | `bg-primary/10` |
| Thumb | `bg-primary` |
| Text/icon | `text-primary-foreground` |

### ON state — neutral (alternate, premium)

| Element | Token |
|---|---|
| Track | `bg-surface-inner` |
| Thumb | `bg-foreground` |

No color, only contrast. Apple/Tesla/Stripe feel.

### Rules

- Never use `--status-success` (green) on toggles
- ON-state animation: `transition-all ease-standard duration-base`
- Focus and disabled states per sections 9 & 10

---

## 11. Ban List (consolidated)

Do **NOT** use:

- Decorative gradients in cards
- Glow effects
- Blur-based elevation
- Multiple accent colors in same component
- Arbitrary radius values
- Nested card containers
- Glassmorphism / `backdrop-blur` on surfaces
- Neumorphism
- Floating glass cards
- Multi-color decorative charts
- Bright accent fills in charts
- Animated glow on inputs
- Inner shadows on inputs

---

## Enforcement

This document is the **source of truth**. Everything that conflicts with these rules in the legacy Lovable codebase (`reference/`) must NOT be carried over to `apps/machindex/`.

Specifically rejected from prior Lovable work:
- Glassmorphism (`.glass-card`, `backdrop-blur`, `rgba(10,16,32,0.55)` panels)
- V3 multi-accent palette (cyan `#3FD6FF` + electric blue `#4E8DFF` + violet `#8E6BFF` + magenta `#FF5FD2`)
- Ambient glow orbs, neon shadows, edge-glow lines
- Card aura pseudo-elements
- Radial gradients on cards/charts
- `rounded-[22px]`, `rounded-[14px]`, or any `rounded-[Npx]` outside the token scale

A token-lint script (`scripts/lint-tokens.mjs`) will be added to the new project to catch violations in CI.
