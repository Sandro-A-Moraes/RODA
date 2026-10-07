# Roda — Design System (colors)

These are the **official colors of the project**. They are the same ones used in the Figma Slides case deck (https://www.figma.com/slides/Ln7uO1JKbaJ2nwP5REA7eG). The app must use them through design tokens in `src/core/theme`. **Never hardcode a hex value in a component.**

## Palette

| Token | Hex | RGB | Role |
|---|---|---|---|
| `forest` | `#10261F` | 16, 38, 31 | Dark base background. Brand's main dark. |
| `forest2` | `#1B3B30` | 27, 59, 48 | Surface on dark backgrounds (cards, panels). |
| `cream` | `#F5EEDF` | 245, 238, 223 | Main light background. Text on dark surfaces. |
| `sand` | `#E9DCC3` | 233, 220, 195 | Secondary light background, subtle section changes. |
| `terra` | `#BD401C` | 189, 64, 28 | Primary accent on light backgrounds. Primary actions, emphasis, errors-adjacent highlights. Also a solid background (cream text on top). |
| `glow` | `#F28047` | 242, 128, 71 | Accent on **dark** backgrounds (rings, large numerals, highlights). |
| `sage` | `#9EBF9E` | 158, 191, 158 | Soft green. Secondary text on dark, decorative rings on light. |
| `ink` | `#14201B` | 20, 32, 27 | Primary text on light backgrounds. |
| `muted` | `#45544D` | 69, 84, 77 | Secondary text on light backgrounds. |

`forest` is the leading color of the identity. `terra` and `glow` are the same accent in two versions, tuned for light and dark backgrounds respectively. Do not use `terra` for text on dark backgrounds or `glow` for text on light ones, because the contrast is not enough there.

## Allowed text and background pairs

Contrast ratios follow WCAG 2.1. Normal text needs at least 4.5:1, and large text (≥ 24px, or ≥ 19px bold) needs at least 3:1.

| Text | Background | Ratio | Use for |
|---|---|---|---|
| `ink` | `cream` | 14.52 | Body text, headings |
| `muted` | `cream` | 6.92 | Secondary text |
| `terra` | `cream` | 4.64 | Labels, links, accent text |
| `ink` | `sand` | 12.37 | Body text |
| `muted` | `sand` | 5.89 | Secondary text |
| `terra` | `sand` | 3.96 | **Large text only** |
| `ink` | `sage` | 8.31 | Text on sage fills |
| `cream` | `forest` | 13.78 | Body text, headings |
| `sage` | `forest` | 7.88 | Secondary text |
| `glow` | `forest` | 6.03 | Accent text, numerals |
| `cream` | `forest2` | 10.60 | Body text on cards |
| `sage` | `forest2` | 6.06 | Secondary text on cards |
| `glow` | `forest2` | 4.64 | Accent text on cards |
| `cream` | `terra` | 4.64 | Text on terracotta fills (buttons, banners) |

Pairs not listed here are not approved. Check the contrast before using them.

## Semantic roles (what the app should consume)

Components should depend on these roles, not on the raw palette names. The mapping to the palette is the only place that changes if the identity evolves.

| Role | Light theme | Dark theme |
|---|---|---|
| `background` | `cream` | `forest` |
| `backgroundAlt` | `sand` | `forest2` |
| `surface` | `cream` | `forest2` |
| `textPrimary` | `ink` | `cream` |
| `textSecondary` | `muted` | `sage` |
| `accent` | `terra` | `glow` |
| `onAccent` | `cream` | `forest` |
| `decorative` | `sage` | `glow` |

The app ships in the **light theme first**. The dark theme is optional and comes only if time allows.

## Reference TypeScript tokens

This is the shape to implement in `src/core/theme/colors.ts` (step 0.3 of the plan):

```ts
export const palette = {
  forest: '#10261F',
  forest2: '#1B3B30',
  cream: '#F5EEDF',
  sand: '#E9DCC3',
  terra: '#BD401C',
  glow: '#F28047',
  sage: '#9EBF9E',
  ink: '#14201B',
  muted: '#45544D',
} as const;

export type Palette = typeof palette;

export const lightColors = {
  background: palette.cream,
  backgroundAlt: palette.sand,
  surface: palette.cream,
  textPrimary: palette.ink,
  textSecondary: palette.muted,
  accent: palette.terra,
  onAccent: palette.cream,
  decorative: palette.sage,
} as const;

export const darkColors = {
  background: palette.forest,
  backgroundAlt: palette.forest2,
  surface: palette.forest2,
  textPrimary: palette.cream,
  textSecondary: palette.sage,
  accent: palette.glow,
  onAccent: palette.forest,
  decorative: palette.glow,
} as const;

export type ColorRole = keyof typeof lightColors;
```

## Related identity (not colors)

- **Typography:** Fraunces (serif, headings) and DM Sans (body).
- **Motif:** the circle. A ring with 12 dots around it represents a circle of 12 people.
