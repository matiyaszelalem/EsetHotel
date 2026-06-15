# UI Starter

A reusable Next.js (App Router) + Tailwind + shadcn/ui starter, extracted from
a previous project's design system and genericized so it can be cloned as a
starting point for new projects.

## Status

This is a work-in-progress build, going step by step:

- [x] **Step 1 — Project skeleton.** `package.json`, Tailwind/PostCSS/TS
      config, folder structure, base layout, and a token preview page.
- [ ] Step 2 — Core UI components (button, input, label, card, sheet, skeleton)
- [ ] Step 3 — App shell (loading, error, not-found, Logo placeholder)
- [ ] Step 4 — Animation utilities (useGSAP hook + scroll reveal patterns)
- [ ] Step 5 — Reusable marketing sections (Hero, HowItWorks, Pricing)
- [ ] Step 6 — Style guide / kitchen sink page

## Customizing for a new project

Everything in this starter derives from two files:

1. **`app/globals.css`** — all color tokens live in `:root` as HSL triples.
   To rebrand, change `--primary`, `--primary-dark`, `--primary-light` (and
   `--background`/`--foreground` if you want a different base palette).
   Every component, utility class (`.btn-primary`, `.card-base`, etc.), and
   shadcn primitive reads from these variables, so one edit recolors the
   whole app. Opacity modifiers work natively — `bg-primary/20`,
   `text-primary/40`, etc.

2. **`app/layout.tsx`** — the three font roles (`fontSans`, `fontDisplay`,
   `fontMono`) are loaded here via `next/font/google`. Swap the font choices
   and the `--font-*` variable names carry through automatically via
   `tailwind.config.ts`.

## Token naming — mapped from the source project

The original project used brand-specific names (`sienna`, `stone`,
`offwhite`, etc.) for its palette. Those work great for that brand, but the
names stop making sense the moment you pick a different brand color. This
starter renames everything to semantic roles so the *names* stay valid across
projects — only the *values* in `:root` change.

| Original name | New token | Role |
|---|---|---|
| `sienna` | `primary` | Brand accent — the one color you'll change per project |
| `sienna-dark` | `primary-dark` | Hover/active state of the accent |
| `sienna-light` | `primary-light` | Lighter accent variant |
| `sienna/[0.08]`, `sienna-subtle` | `primary/8`, `primary/10` (opacity modifiers) | Now works natively — no separate "subtle" variant needed |
| `hover:shadow-sienna-glow` | `hover:shadow-glow` | Defined once in `tailwind.config.ts` |
| `stone` | `foreground` | Primary text color (already identical to shadcn's `--foreground`) |
| `stone-soft` | `muted-foreground` | Secondary text |
| `stone-dim` | `subtle` (`text-subtle`) | Tertiary / faint text — new dedicated token |
| `stone-border` | `border` | Already identical to shadcn's `--border` |
| `offwhite` | `background` | Page background (already identical to shadcn's `--background`) |
| `offwhite-dark` | `muted` | Secondary surface (input wells, nested panels) |
| `danger` (button destructive variant) | `destructive` | Standard shadcn token |
| `ink`, `ink-soft`, `ink-card`, `ink-border` | unchanged | Dark "inverted" section surfaces |
| `success`, `warning` | unchanged | Status colors (values now defined in `:root`) |
| *(new)* | `info` | New token (217 91% 60%) — was a hardcoded `#3B82F6` in the source Hero |

Net effect: several previously-duplicated tokens (`stone`/`foreground`,
`stone-border`/`border`, `offwhite`/`background`) are now unified into one,
and the brand palette (`primary` family) is fully wired into shadcn's
component classes — so shadcn primitives and custom marketing sections share
one accent color instead of two parallel systems.

## What was deliberately left out

Business-logic dependencies from the source project (`@supabase/*`,
`@react-email/components`, `resend`, `html5-qrcode`, `qrcode`, `recharts`,
`slugify`) are not included — this starter is UI/design-system only. Add
back per-project as needed.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — you should see the token preview page with
color swatches, type roles, and the shared card/button utility classes.
