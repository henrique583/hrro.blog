# HRRO Blog

Henrique Rodrigues' personal website: a home page with a live feed of recent activity from X, GitHub, LinkedIn, Goodreads and Letterboxd, framed by animated ocean waves whose color the visitor can choose. Everything is available in US English and Brazilian Portuguese.

This README explains how each feature works and **why** it was built that way, including the alternatives that were tried and dropped. It's meant to be a reference for questions about the code.

---

## Contents

1. [Stack](#1-stack)
2. [Running it](#2-running-it)
3. [Project structure](#3-project-structure)
4. [Languages (i18n)](#4-languages-i18n)
5. [Layout and header](#5-layout-and-header)
6. [Wave color and page background](#6-wave-color-and-page-background)
7. [Liquid glass UI](#7-liquid-glass-ui)
8. [The waves](#8-the-waves)
9. [The home feed](#9-the-home-feed)
10. [Social links](#10-social-links)
11. [Metadata and icon](#11-metadata-and-icon)
12. [Security](#12-security)
13. [Running costs](#13-running-costs)
14. [Known limitations](#14-known-limitations)

---

## 1. Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) with **Cache Components** (`cacheComponents: true`) and **Partial Prefetching** | Came with `create-next-app`. Cache Components gives `"use cache"` + `cacheLife`/`cacheTag`, which is how every feed source is cached and refreshed. |
| UI | React 19, TypeScript | |
| Styling | **Tailwind CSS v4** plus a small `app/globals.css` | Utilities for layout; the few things Tailwind can't express (glass, spoiler blur) live in `globals.css`. |
| Font | **Inter** via `next/font/google` | Requested site-wide font; self-hosted by Next, no layout shift. "Recent activity…" uses SF Mono (see §5). |
| RSS parsing | `fast-xml-parser` | Letterboxd and Goodreads only offer RSS. |
| Icons | `react-icons` (Simple Icons, Font Awesome 6, Lucide) | One dependency covers brand logos and UI icons. |
| Flags | `country-flag-icons` | Real SVG flags. Emoji flags don't render on Windows. |
| Color picker | `react-colorful` | Tiny (~2 kB), no dependencies, accessible. |
| Translation | DeepL API (free plan) | Machine translation of post text (see §4.4). |
| Hosting assumption | Vercel | The daily feed refresh uses a Vercel Cron Job (`vercel.json`). Everything else is host-agnostic. |

> `AGENTS.md` warns that this Next.js version has breaking changes from older ones. All framework APIs used here (proxy, root params, `"use cache"`, metadata, icons) were checked against the docs in `node_modules/next/dist/docs/`.

---

## 2. Running it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000 → redirects to /en or /pt
npm run build && npm start   # production build
npm run lint
```

### Environment variables

All are optional. A source without credentials is simply left out of the feed, and posts are shown untranslated without a DeepL key. `.env.local` is git-ignored; `.env.example` (blank values) is committed. On Vercel, add the same values under Project → Settings → Environment Variables.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `X_CONSUMER_KEY`, `X_CONSUMER_SECRET` | `lib/feed/x.ts` | App's OAuth 1.0a "Consumer Key/Secret" (X developer console → app → Keys & Tokens). |
| `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` | `lib/feed/x.ts` | Your own "Access Token" (for @henrique_rro, Read). Signs requests as you; see §9.2. |
| `DEEPL_API_KEY` | `lib/feed/translate.ts` | DeepL key. Free-plan keys end in `:fx`, which also selects the free endpoint. |
| `GITHUB_TOKEN` | `lib/feed/github.ts` | Optional. Raises GitHub's rate limit from 60 to 5,000 requests/hour per IP. Not needed with a once-a-day refresh. |
| `CRON_SECRET` | `app/api/refresh-feed/route.ts` | Protects the refresh endpoint. Vercel's cron sends it automatically as `Authorization: Bearer …`. |

### A note on the dev server

During development the dev server sometimes kept serving a **stale copy of `app/globals.css`** after edits (an issue with the Tailwind/Turbopack CSS loader set up in `next.config.ts`). Restarting `npm run dev` fixes it. This is also why the wave components set their positioning through inline styles and an inline `<style>` tag rather than `globals.css` (see §8.9).

---

## 3. Project structure

```
proxy.ts                         Locale redirect for paths without /en or /pt (§4.1)
next.config.ts                   Cache Components, "feed" cache profile, security headers
vercel.json                      Daily cron → /api/refresh-feed
app/
  icon.svg                       Browser tab icon (§11)
  globals.css                    Tailwind, glass styles, terminal font, spoiler styles
  api/refresh-feed/route.ts      Clears and re-warms the feed cache (§9.4)
  [lang]/                        Everything is under /en or /pt
    layout.tsx                   Root layout: <html lang>, metadata, header, waves, color selector
    page.tsx                     Home page: social links + feed
    not-found.tsx                Translated 404 (used by /blog, /projects, /about for now)
    dictionaries.ts              Loads en.json / pt.json via the `lang` root param
    dictionaries/en.json, pt.json  All UI text
components/
  Header.tsx, LanguageSelector.tsx, MobileNav.tsx
  ColorSelector.tsx, InlineScript.tsx
  Waves.tsx, waves-data.ts       Ocean waves (§8)
  SocialLinks.tsx, BrandIcon.tsx Social buttons (§10)
  feed/FeedCard.tsx, SourceIcon.tsx, Spoiler.tsx   Feed cards (§9.6)
lib/
  i18n.ts                        Locale list, labels, flags' BCP-47 tags, DeepL codes
  site.ts                        Profile names/handles/URLs/avatars, Goodreads user id, time zone
  wave-color.ts                  Color store, page tint, before-paint script (§6)
  feed/                          One file per source + merge, translation, HTML helpers (§9)
content/linkedin.ts              List of LinkedIn post ids to show (§9.2)
public/avatars/                  Profile pictures used on the feed cards
```

---

## 4. Languages (i18n)

### 4.1 Routing

Every page lives under a locale segment: `/en/...` or `/pt/...` (`app/[lang]/`). `[lang]` is above the root layout, which makes it a **root param**, so any server component or utility can read it with `lang()` from `next/root-params` instead of passing it down as a prop. `generateStaticParams` in the layout returns both locales, which Cache Components requires and which lets both home pages be prerendered.

`proxy.ts` (Next 16 renamed `middleware` to `proxy`) runs on every request that doesn't already start with `/en` or `/pt`, and redirects:

1. to the locale saved in the `NEXT_LOCALE` cookie, if any;
2. otherwise to the best match from the browser's `Accept-Language` header (by quality weight);
3. otherwise to English.

The matcher skips `/_next`, `/api` and anything containing a dot (avatars, icon), so those are never redirected. A path like `/xx` becomes `/en/xx`, which then 404s inside the layout. The layout also calls `notFound()` for any unknown `lang`.

**Why `en`/`pt` in the URL rather than `en-US`/`pt-BR`:** shorter, cleaner URLs. The full BCP-47 tags (`en-US`, `pt-BR`) are kept in `lib/i18n.ts` and used wherever they matter: `<html lang>`, date formatting, `hreflang` links, Open Graph locale.

### 4.2 UI text

All interface text is in `app/[lang]/dictionaries/en.json` and `pt.json`, loaded on the server by `getDictionary()`. Following the Next.js i18n guide, dictionaries are imported only on the server, so they don't add to the browser bundle. Client components (language selector, color selector, mobile menu, spoilers) receive only the strings they need as props.

### 4.3 Language selector

`components/LanguageSelector.tsx` is a small pill with a white border, showing the flag, `EN`/`PT` and a chevron. The menu lists both languages with full names; every row reserves room for the checkmark, so the menu is the same width whichever language is selected (otherwise "Português (BR)" wrapped when it had the checkmark).

Choosing a language:

1. saves the choice in the `NEXT_LOCALE` cookie (1 year), so the proxy remembers it for `/`;
2. navigates to the same path in the other locale with a **full page load** (`window.location.assign`), not `router.push`.

**Why a full page load:** each locale is its own instance of the root layout (its own `<html lang>` and `<head>`). A client-side navigation made React mount the new `<head>` before unmounting the old one ("You are mounting a new head component…" error). During the swap, the wave panel also briefly measured 0 px wide, which produced `NaN` sizes. A full load avoids both, and switching language is rare enough that the reload doesn't matter. ESLint warns against `location.assign` for internal links, so that line has an explicit, commented disable.

It is vertically centered with the nav links, and sits the same distance from BLOG (32 px on desktop) as the links are from each other. It's a different size and has a border, so it reads as a control rather than another link.

### 4.4 Translating post content

UI text is translated by hand in the dictionaries. **Post content** (tweets, LinkedIn posts, Letterboxd and Goodreads reviews, GitHub commit messages) is machine-translated with DeepL, in `lib/feed/translate.ts`:

- Each piece of text is translated **once per target language** and cached forever (`"use cache"` + `cacheLife("max")`). The cache key is the text plus the target language, so a post is never re-translated and new posts don't cause old ones to be re-translated. (An earlier version translated the whole feed as one batch, which re-sent every post whenever any one changed.)
- DeepL detects the source language. If it already matches the target, the original wording is kept (so a post written in Portuguese shows as written on `/pt` and gets translated on `/en`).
- Translated posts show a small "Translated from English" / "Traduzido do inglês" note.
- **Not translated, on purpose:** film titles, book titles, author names, repo names and branch names. They're proper nouns, and machine translation gets them wrong ("The End of Oak Street" would become "O Fim da Rua Oak").
- Failures throw inside the cached function, so a failed translation is never cached; the caller falls back to the original text and the next refresh tries again.
- The API key is read **inside** the cached function rather than passed in as an argument, so it never becomes part of a cache key (see §12).
- Free-plan keys end in `:fx`, which selects `api-free.deepl.com`; anything else uses `api.deepl.com`.
- On the free plan, hitting the 500,000-character monthly limit makes DeepL stop translating (it never bills); the site then shows original text until the quota resets.

Blog articles (when they exist) are meant to be translated by hand, not by DeepL.

---

## 5. Layout and header

`app/[lang]/layout.tsx` renders, in order: the header, then a `relative flex-1` wrapper that contains the waves (absolutely positioned, see §8) and the page content (`relative z-10`, so it sits above the waves). Page content is limited to `max-w-[590px]` and centered.

### Header (`components/Header.tsx`)

- **Not sticky.** It scrolls away with the page.
- Same background as the page, with a soft shadow (`0 6px 24px rgb(0 0 0 / 0.55)`) plus a 1 px faint light line, to separate it from the content and waves below. These are inline styles, not Tailwind classes, to avoid the stale-CSS dev issue.
- **Logo and nav links are the same size:** 18 px on phones, 22 px from the `sm` breakpoint. No letter-spacing, because tracking adds trailing space after each word and makes the gaps look uneven.
- **Even spacing:** the nav links share one 32 px gap, so PROJECTS sits exactly centered between BLOG and ABOUT ME, and the language selector sits the same 32 px from BLOG. This was measured in the browser.
- Nav labels: Blog / Projects / About Me (Portuguese: Blog / Projetos / Sobre mim). The pages don't exist yet, so the links show the translated 404 page.

### Mobile menu (`components/MobileNav.tsx`)

Below the `sm` breakpoint, the header is the logo, the language selector and a ☰ button. Tapping ☰ slides a drawer in from the right (`translate-x` transition) over a dimmed backdrop, with the links in larger text. It closes with ✕, by tapping the backdrop, by choosing a link, or with Escape. Page scrolling is locked while it's open, and the drawer is `inert` when closed so keyboard focus can't land in it. This replaced an earlier two-row phone header, because at the larger font size "ABOUT ME" no longer fit on one line.

### "Recent activity…"

Set in **SF Mono** (`.font-terminal` in `globals.css`) to look like the macOS Terminal. SF Mono can't be bundled as a web font (Apple's license), so it's referenced by name and only shows on Apple devices; elsewhere it falls back to `ui-monospace`, Menlo, Monaco, Consolas or `monospace`.

---

## 6. Wave color and page background

### Choosing a color (`components/ColorSelector.tsx`)

A glass pill with three presets and a pencil button:

| Preset | Color |
| --- | --- |
| Blue (default) | `#005AB4` |
| Red | `#D20000` |
| Green | `#007000` |

The swatches are drawn as small gradients (dark at the top, the color at the bottom) to hint at the water. The pencil opens a popover with a `react-colorful` picker and a hex input. Once a custom color is chosen, the pencil button is filled with it. The pill is exactly 40 px tall, the same height as the social buttons.

### Where the color lives (`lib/wave-color.ts`)

- Saved in `localStorage` under `wave-color`.
- Applied as two CSS variables on `<html>`:
  - `--wave-color`: the chosen color.
  - `--background`: a near-black tint of the same hue (`hsl(<hue> <60% of its saturation> 4%)`). The page isn't pure black; it's barely tinted toward the wave color. For the default blue that's `rgb(4, 10, 16)`.
- `html`, `body` and the header all use `var(--background)`, so the whole page, including the area you see when you scroll past the top or bottom, picks up the tint.
- A tiny store (`subscribeWaveColor` / `readWaveColor`) lets components react to changes through `useSyncExternalStore`, with a server snapshot of the default color so server and client render the same thing.

### No flash on load

The color has to be applied **before the first paint**, otherwise a visitor with a saved red would briefly see blue. `waveColorScript` is a small inline script in `<head>`. It reads `localStorage`, validates the value with a regex (only `#rrggbb` is accepted), and sets both CSS variables. The tint calculation (`backgroundFor`) is written once in TypeScript and inlined into the script with `backgroundFor.toString()`, so there's no second copy to keep in sync.

`components/InlineScript.tsx` renders that script as `type="text/javascript"` on the server and `type="text/plain"` on the client, with `suppressHydrationWarning`. This is the pattern from the Next.js "preventing flash before hydration" guide. React warns if it renders a `<script>` on the client; this way the browser runs it once from the server HTML and React treats the client copy as inert text. `<html>` has `suppressHydrationWarning` because the script adds inline styles React didn't render.

`ColorSelector` also re-applies the color in an effect. Originally this was because client-side locale switches replaced `<html>` and dropped its inline styles; it now also covers any other remount.

---

## 7. Liquid glass UI

`.glass` in `globals.css` is used by the color selector and the social buttons: a faint diagonal white gradient, `backdrop-filter: blur(12px) saturate(160%)`, a thin 12%-white border, an inner top highlight and a soft drop shadow, plus a `::before` sheen near the top edge. It was intentionally toned down after the first version looked too white. `.glass-interactive` brightens slightly and lifts 1 px on hover. `.glass-dense` adds a darker tint for popovers (the color picker) so they stay readable over the feed.

These classes are in `@layer components`, so Tailwind utilities like `absolute` or `rounded-full` override them. In an earlier version they weren't layered, and `.glass { position: relative }` silently beat Tailwind's `absolute`, which broke the color-picker popover.

The language selector deliberately does **not** use glass. You asked for it to be plain, and later bordered.

---

## 8. The waves

The waves went through several designs: an SVG wave with CSS keyframes, overlapping ellipse "lobes" moved by JavaScript, a canvas shoreline with foam, sliding SVG bands, and morphing SVG bands. The current version keeps the visual design you settled on (`waves-morph.svg` plus five sssurf variations) but draws it on canvas, so the bands can fan out of a single point under the header. §8.10 summarizes the earlier versions and why each was replaced.

### 8.1 What you see

On each side of the page, five layered bands of water drift down along the page edge. The deepest, solid band sits against the edge; each band further in is fainter. Each band slowly morphs between ten shapes while drifting at its own speed. At the top, just below the header, all five bands curve into a **single point** at the page edge and fan out from it, like water pouring from one source. A light deep in the water slowly brightens and dims everything on an 8-second cycle. The right side mirrors the left. The waves scroll with the page and fill it down to the bottom.

### 8.2 Data (`components/waves-data.ts`)

- **Shapes.** Ten wave shapes, each one seamless 2400-unit period made of 12 cubic Bézier segments, stored as a crest height at x = 0 plus `[c1x, c1y, c2x, c2y, x, y]` per segment. The data is horizontal (x along the shore, y = depth, crest near the top, down to `WAVE_DEPTH = 800`), exactly like the source SVGs.
  - **Shapes 1–5** come straight from `waves-morph.svg`.
  - **Shapes 6–10** are the five sssurf.app SVGs you pasted, converted to the same format. They had 10 segments and weren't seamless: their ends were up to 37 units apart and the last segment curled into a tail. Since morphing needs identical structure and drifting needs seamless loops, each was resampled, its linear drift removed, smoothed with a 10-harmonic Fourier series (so value *and* slope wrap around exactly), and refit as 12 cubic segments. They stay within 2 units of the originals, and their original vertical placement is kept.
- **Bands.** Five bands, back (faintest) to front (solid). Each band uses the same shapes, shifted `BAND_SPACING = 77` units deeper than the one behind it (as in the original). Per band:

  | Band | Opacity | Drift (s per period) | Drift delay | Morph begin |
  | --- | --- | --- | --- | --- |
  | back | 0.15 | 60 | 0 | 0 |
  | | 0.36 | 52 | −7 | −1.5 |
  | | 0.57 | 45 | −14 | −3 |
  | | 0.78 | 39 | −21 | −4.5 |
  | front | 1.00 | 34 | −28 | −6 |

  The back-band opacities were raised from the original 0.05/0.29/0.53/0.76 so the faintest band is visible. Negative delays mean "already this far into the cycle", so the bands start out of step, as in the original SVG.
- **Gradient.** As in the original, each band fades from the crest color at `GRADIENT_TOP` (176, offset per band) to black `GRADIENT_DEPTH` (938) units deeper, which lies past the page edge, so the water never reaches full black.
- **Morph timing.** `MORPH_STEP_SECONDS = 5`. With 10 shapes, one full cycle is 50 s.

### 8.3 Rendering (`components/Waves.tsx`)

The waves are drawn on **two `<canvas>` elements** (left and right), redrawn every animation frame.

**Why canvas:** the fan-out (§8.5) is a shape fixed to the page (narrowing to a point under the header) while the waves keep moving. With SVG bands that slide via CSS transforms, a fixed shape can't be built into something that's moving; the best possible was cutting the bands off with a mask, which is what the slanted versions did. Drawing each frame lets each band's width be multiplied by a fixed "fan" factor based on its position on the page.

How a frame is drawn, per side, per band:

1. **Sampling.** At startup, each of the 10 shapes is sampled into a lookup table (`SAMPLES`): crest height for every integer position 0–2400, from 64 points per Bézier segment with linear interpolation. Lookups are then O(1). A check confirmed the tables match the original curves exactly at every segment endpoint and still loop seamlessly.
2. **Drift.** `drift = frac((t − driftDelay) / driftSeconds)` gives how far through its period the band is; it's subtracted from the position along the shore, so the pattern moves down the page, flowing out of the point under the header. (The original SVG drifted the other way; the direction was reversed on request. Changing `- driftUnits` back to `+ driftUnits` in `drawBands` flips it again.)
3. **Morph.** `phase = frac((t − morphBegin) / 50 s)` picks the pair of shapes being eased between (`ORDER[i]` → `ORDER[i+1]`) and how far; `ease()` reproduces the original SMIL easing `cubic-bezier(0.45, 0, 0.55, 1)` by bisection. The crest is a linear blend of the two shapes at that eased amount.
4. **Rotation.** The data is horizontal; on the page, depth becomes distance from the edge: `depth = (WAVE_DEPTH − crestY − bandOffset − VIEW_FROM) × scale`, and position along the shore becomes page y. `VIEW_FROM = 100` / `VIEW_TO = 660` crop the visible depth range (the first 100 units next to the edge are solid deep water; 660 is just past the faintest band's highest crest), and `scale = panelWidth / 560`.
5. **Fan** (§8.5) multiplies that depth.
6. The band is filled as a polygon from the page edge out to its crest, sampled every `STEP_Y = 4` px, with its gradient and opacity.

The right canvas uses a mirrored transform (`setTransform(-dpr, …)`), so both sides run the same left-side math. Canvases are sized for `devicePixelRatio` (capped at 2) for sharp edges.

**Panel width** is `clamp(80px, 13vw, 220px)`, computed in JavaScript (`panelWidth()`) because the canvas needs a pixel size.

**Morph order** (`ORDER`) alternates original and sssurf shapes (0, 5, 1, 6, 2, 7, 3, 8, 4, 9), so the sea keeps changing character instead of running through one style and then the other.

### 8.4 Scrolling with the page

The canvases are `position: fixed` and exactly viewport-sized, but they draw in **page coordinates**. Each frame reads the wave area's position (`getBoundingClientRect()` of the wrapper that sits below the header) and draws only the rows of the viewport that overlap it. The waves therefore scroll with the content, start just below the header, end at the bottom of the page, and nothing is drawn above the header when you scroll up.

**Why not one tall canvas:** a canvas as tall as the page (thousands of px at 2× DPR) would use a lot of memory, and only the visible part ever needs drawing.

### 8.5 The fan-out point under the header

At the top of the wave area, every band's depth is multiplied by `fan(y / (FAN_LENGTH × panelWidth))`:

```
fan(u) = (1 − (1 − u)²) ^ FAN_ROUNDNESS     (u clamped to 0…1)
```

- At u = 0 (just under the header, at the page edge) every band has zero width, so all bands meet at **one point**.
- Because deeper bands have smaller depths and outer bands larger ones, the same factor gives **wider arcs to outer bands**: they fan out from the point, as in your sketch.
- `(1 − (1 − u)²)` is a quarter-circle-like profile; raising it to `FAN_ROUNDNESS = 0.4` makes it bulge out sooner (≈50% of full width a tenth of the way down, instead of ≈27% with the earlier `1 − (1 − u)³`). The bands leave the point almost sideways and curve into it rather than slanting straight down.
- `FAN_LENGTH = 1.5` panel widths is how far down the bands take to reach full width.

The point sits at the page edges (left and right), just below the header. Earlier attempts used static CSS masks (per-band slanted cuts, a blurred cut, then one shared crisp "waterfall lip"); masks can only hide water, not reshape it, which is why they looked cut off rather than flowing from a point.

### 8.6 The light in the depths

On an 8-second cycle (`GLOW_SECONDS`), eased in and out:

- **Brightness.** The canvases have a CSS `filter: brightness()` animation from **0.7** (light out) to **1.3** (light at its peak). The peak is deliberately brighter than the waves' base tone, as requested.
- **Glow.** Above the waves, a page-tall element per side holds radial gradients (a lighter, softer version of the wave color) centered on the page edge and repeated every `GLOW_SPACING = 1100` px down the page, so one is always on screen. Its opacity animates 0 → 1 → 0 in sync with the brightness.
- The glow uses `mix-blend-mode: screen`, which only lightens, and its ellipses are narrow enough to stay within the water. It fades in below the fan point (a vertical mask over `FAN_LENGTH`), so it doesn't light the background where the water is still narrow.

These are CSS animations defined in an inline `<style>` in the component, not in `globals.css`, because of the stale-CSS dev issue.

### 8.7 Colors

From the selected color (`waveColors()`): lightness is clamped to 0.28–0.45 so very dark or very bright custom picks still read as water. The **crest color** is that hue at 90% saturation and 0.9× the normalized lightness (a little darker than the pick, as you asked). The **glow color** is a lighter (up to 68% lightness), slightly desaturated version at 70% alpha. For the default blue the crest comes out very close to the original SVG's `#0059A2`.

### 8.8 Phones and reduced motion

- On screens ≤ 640 px the canvases and glow are at 55% opacity, because the content fills the width and sits on top of the waves there.
- With `prefers-reduced-motion: reduce`, nothing animates. The waves are drawn once at t = 0 and redrawn only on scroll, resize or color change, so they still scroll with the page; the brightness and glow animations are off.

### 8.9 Performance

- Only visible rows are drawn: about 225 points per band per side at 900 px tall, so ~2,000 cheap operations per frame.
- Shapes are pre-sampled once; nothing is parsed or allocated per frame beyond one gradient per band.
- Brightness is a CSS filter on the canvas element, which the browser can apply on the GPU.

### 8.10 Earlier versions (decision log)

| Version | What it was | Why it was replaced |
| --- | --- | --- |
| 1 | Your original `sssurf` SVG rotated onto the sides, three layers moved with CSS keyframes | Moved as three long synced lines; you wanted separate waves |
| 2 | Generated overlapping ellipse "lobes" with per-swell random sizes, animated by JS | You preferred a shoreline look |
| 3 | `shore-waves.html` canvas (open sea, wash, foam, wet sand) | Removed sand and wet sand; foam "lace" and straight gradient seams kept reading as vertical lines; motion restarted each wave. Several fixes later, you switched to SVG |
| 4 | `waves-loop.svg`: five drifting bands as GPU-slid SVGs | Wanted the bands to also change shape |
| 5 | `waves-morph.svg`: SMIL morph + CSS drift, then +5 sssurf shapes, glow, slanted masks at the top | Masks could only cut the bands, not make them meet at a point |
| 6 (current) | Same bands, shapes and timings redrawn on canvas with a fan factor | |

Backups of earlier versions were kept outside the repo during development; git history from this point on is the reference.

### 8.11 Tuning cheat-sheet (`components/Waves.tsx` unless noted)

| Want | Change |
| --- | --- |
| Rounder / gentler curve into the fan point | `FAN_ROUNDNESS` (lower = rounder; 1 = gentle taper) |
| Bands reach full width sooner / later | `FAN_LENGTH` |
| Faster / slower light cycle | `GLOW_SECONDS` |
| Darker dim / brighter peak | `brightness(0.7)` / `brightness(1.3)` in `hrro-depth-dim` |
| Glow spot spacing | `GLOW_SPACING` |
| Wider / narrower wave columns | `panelWidth()` |
| Band opacity or drift speed | `bands` in `waves-data.ts` |
| Morph speed | `MORPH_STEP_SECONDS` in `waves-data.ts` |

---

## 9. The home feed

The home page (`app/[lang]/page.tsx`) shows the social links, "Recent activity…", and the **12 most recent posts across all sources**, newest first (`MAX_ITEMS` in `lib/feed/index.ts`). It's capped so the home page isn't an endless feed. The feed is wrapped in `<Suspense>` with a skeleton, although in practice it's served from cache.

### 9.1 Pipeline (`lib/feed/`)

```
x.ts, github.ts, letterboxd.ts, goodreads.ts, linkedin.ts   → each returns normalized FeedItem[] (types.ts)
index.ts   getFeed(): fetch all in parallel → merge → sort by date desc → first 12
           getTranslatedFeed(locale): translate each item's text fields (translate.ts)
```

Every source is wrapped in `try/catch` and returns `[]` on failure, so one broken source never breaks the page. Items carry ISO date strings (not `Date` objects) so they serialize cleanly through `"use cache"`.

### 9.2 Sources

**X (`x.ts`)**
- X API v2 `GET /2/users/:id/tweets`, `max_results=5` (the endpoint's minimum), excluding replies and retweets, with `note_tweet` so long posts aren't truncated. A trailing `t.co` link is stripped.
- **Signed as you with OAuth 1.0a (HMAC-SHA1), not the app's Bearer Token.** X's pay-per-use pricing charges $0.001 per post for "Owned Reads" only when the request is made by the authenticated owner of the app; an app-only Bearer Token is billed at the standard $0.005. The signing code was checked against the worked example in X's documentation.
- Your numeric user id is the part of the access token before the `-`, so no paid user lookup is needed.

**GitHub (`github.ts`)**
- Public events API (`/users/henrique583/events/public`), keeping the 3 most recent `PushEvent`s.
- GitHub no longer includes commit messages in push events, so each push does one more call: `compare/{before}...{head}` for the commits in the push, falling back to `commits/{head}` for new branches or force-pushes. The card shows the newest **non-merge** commit (merge commits like "Merge branch 'main'…" aren't interesting) and "+N more commits in this push".
- `GITHUB_TOKEN` is optional.

**Letterboxd (`letterboxd.ts`)**
- Public RSS at `letterboxd.com/henrique583/rss/`, parsed with `fast-xml-parser` (`parseTagValue: false`, so years and ratings stay strings, and `item` is always an array).
- Uses the `letterboxd:` fields (title, year, rating, watched date, rewatch, liked). The poster comes from the description HTML. Review text is the description with the poster, the spoiler notice and Letterboxd's auto-generated "Watched on…" line removed. Lists are skipped.
- Entries whose id starts with `letterboxd-review` are reviews; others are plain diary entries ("Watched by"). The spoiler flag comes from Letterboxd's own spoiler notice.

**Goodreads (`goodreads.ts`)**
- Goodreads shut down its API in 2020; this uses the `read` shelf RSS: `goodreads.com/review/list_rss/143878744?shelf=read`. The user id was found by following the redirect from `goodreads.com/henrique_rro`.
- Shows title, author, cover, your 1–5 star rating (with Goodreads' own phrases, e.g. "really liked it", translated), and review text if any. The header says "rated", "reviewed" or "read" a book depending on what's there. Goodreads' generic "nophoto" cover is hidden.

**LinkedIn (`linkedin.ts` + `content/linkedin.ts`)**
- LinkedIn gives individuals no API for their own posts. But each post's **embed page** (`linkedin.com/embed/feed/update/urn:li:share:…`) is public, so `content/linkedin.ts` is just a list of post ids. Paste the embed iframe, its URL, the post link or the bare `urn:li:share:…`; anything containing the URN works.
- The text is read from the embed page's commentary element (falling back to its `og:description`).
- The **date** is derived from the id: LinkedIn ids are "snowflake" ids whose top 41 bits are the creation time in milliseconds (`BigInt(id) >> 22`), so no date needs to be entered by hand.
- `BigInt(22)` is used instead of `22n` because `tsconfig` targets ES2017, where BigInt literals aren't allowed.

### 9.3 Caching

Each source is a `"use cache"` function with `cacheLife("feed")` and `cacheTag("feed", "feed:<source>")`. The `feed` profile is defined in `next.config.ts`:

| Setting | Value | Meaning |
| --- | --- | --- |
| `stale` | 1 hour | How long a browser may reuse what it has |
| `revalidate` | 2 days | **Fallback only**: refresh in the background after 2 days if the cron didn't run |
| `expire` | 30 days | After 30 days with no visits, the next visit waits for fresh data |

The X user-id lookup, translations and LinkedIn embeds use their own lifetimes (`max` for translations).

### 9.4 Daily refresh (`vercel.json` + `app/api/refresh-feed/route.ts`)

You chose to update once a day rather than hourly, to keep the X bill near zero.

- `vercel.json` schedules `GET /api/refresh-feed` with cron `0 20 * * *`, i.e. **20:00 UTC** daily: 4 pm US Eastern during daylight saving, 3 pm in winter (Vercel crons are UTC-only). On Vercel's free plan a cron may fire any time within that hour.
- The route requires `Authorization: Bearer $CRON_SECRET` (compared in constant time, §12), calls `revalidateTag("feed", "max")`, then requests `/en` and `/pt`. `revalidateTag` only marks data stale, and the actual refetch happens on the next request; those two requests make the refetch happen right away instead of on the next visitor.
- Without the cron (another host, or before deploying), data still refreshes after the 2-day `revalidate`.

### 9.5 Dates

Each card's date is on the "@handle on Platform" line above it, **right-aligned**. Dates are formatted with `Intl.DateTimeFormat` in the page's locale (`Sep 22, 2026` / `22 de set. de 2026`) in `SITE_TIME_ZONE = "America/New_York"` (`lib/site.ts`), so a post made at night isn't shown as the next day. Plain dates (Letterboxd "watched" dates like `2026-09-02`) are formatted in UTC so they don't shift by a day. On phones the label and date are slightly smaller so long Portuguese dates don't truncate the label.

### 9.6 Cards (`components/feed/FeedCard.tsx`)

Each card mimics its platform, in dark mode where the platform has one, and links to the original post in a new tab:

| Source | Look |
| --- | --- |
| X | Black card, name/handle, X logo, post text (up to 10 lines) |
| GitHub | GitHub dark colors, "pushed to `main` in repo", short SHA + commit title/body |
| LinkedIn | LinkedIn dark (`#1b1f23`), name, text clamped to 5 lines + "…see more" |
| Goodreads | Goodreads' cream/brown (no dark mode exists), cover, serif title, orange stars + rating phrase, review |
| Letterboxd | Letterboxd's dark slate, poster, title + year, green stars (½ supported), orange heart if liked, watched/rewatched date, review |

Avatars are local files in `public/avatars/` (served by `next/image`). Remote posters and covers use plain `<img>` because they come from several CDNs, with an ESLint disable comment.

**Spoilers** (`Spoiler.tsx`): reviews Letterboxd flags as spoilers are blurred. With a mouse, hovering the card reveals them (CSS, only under `@media (hover: hover)`). On touch screens there's no hover, so the **first tap** reveals the text and is prevented from following the link; later taps open the post. The hint text switches between "Hover to reveal" and "Tap to reveal" with `(hover: none)` media queries.

---

## 10. Social links

`components/SocialLinks.tsx`: glass pills (40 px tall, same height as the color selector) linking to each profile in a new tab, with full-color brand marks from `components/BrandIcon.tsx`:

- **LinkedIn:** white "in" on LinkedIn blue `#0A66C2`.
- **Goodreads:** brown "g" on its cream square, like the app icon.
- **Letterboxd:** its orange, green and blue dots, drawn as an inline SVG.
- **X and GitHub:** white. Neither brand has a color logo; white is their official variant on dark backgrounds.

Profile names, handles, URLs and avatars are all in `lib/site.ts`. The feed cards use simpler single-color icons (`SourceIcon.tsx`).

---

## 11. Metadata and icon

- **Title:** "HRRO Blog" (template `%s · HRRO Blog` for future pages). The header logo still reads "HRRO".
- **Description:** per language, from the dictionaries.
- **Also set:** author, application name, a canonical URL per locale, and `hreflang` alternates (`en-US`, `pt-BR`) so search engines link the two versions.
- **Share previews:** Open Graph and Twitter (`summary`) tags with title, description, site name, locale (`en_US` / `pt_BR`) and `@henrique_rro` as creator.
- **Base URL:** `metadataBase` makes those URLs absolute. On Vercel it uses the `VERCEL_PROJECT_PRODUCTION_URL` system variable (your production domain); locally it falls back to `http://localhost:3000`.
- **Icon:** `app/icon.svg` (layered blue waves on the site's dark background) replaces the default Next.js `favicon.ico`. The unused template images (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) were removed.
- **Not added yet:** a share-preview image (`opengraph-image`). Previews currently show text only.

---

## 12. Security

Reviewed before the first commit:

- **No secrets in the repo or its history.** Keys live only in `.env.local` (git-ignored). All are read on the server only; none use the `NEXT_PUBLIC_` prefix, which would expose them to the browser.
- **Third-party content is rendered as text.** React escapes it. The only raw HTML is the color script (§6), which is a fixed string that validates the stored color with a regex.
- **Feed URLs are allow-listed** (`safeUrl()` in `lib/feed/html.ts`). Letterboxd and Goodreads links, posters and covers come from RSS. They're only accepted if they're `https` and on the expected domains (`letterboxd.com`, `ltrbxd.com`, `goodreads.com`, `gr-assets.com`, Amazon image hosts), so a tampered feed can't inject `javascript:` or `data:` links. Entries with invalid links are dropped. This was tested against `javascript:`, `data:`, `http:` and look-alike domains.
- **Refresh endpoint:** the secret is compared in constant time (`timingSafeEqual` over SHA-256 digests), so response timing can't leak it. The endpoint returns 401 without the right secret.
- **No secrets in cache keys:** the DeepL key is read inside the cached function rather than passed in.
- **Security headers** on every response (`next.config.ts`):
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY` (the site can't be embedded in another page)
  - `Permissions-Policy` turning off camera, microphone and geolocation
- **New-tab links** use `rel="noopener noreferrer"`.
- **Dependencies:** `npm audit` reports no vulnerabilities in production dependencies. Five high-severity advisories are in ESLint's dependency chain (via `eslint-config-next`), a development-only tool that never ships to the site. `npm audit fix --force` would make breaking changes, so they're left until Next.js updates its lint config.
- **Housekeeping:** the DeepL key was once shared in a chat during development; it should be regenerated (see below).

**Regenerating the DeepL key:** deepl.com → Account → API Keys → create a key → replace `DEEPL_API_KEY` in `.env.local` (and on Vercel) → deactivate the old key.

---

## 13. Running costs

With the once-a-day refresh:

| Service | Cost |
| --- | --- |
| X API | 5 posts × 30 days × $0.001 ("Owned Reads") ≈ **$0.15/month**. Each deploy also reads 5 posts once. X only bills a post once per UTC day. Set a monthly spending limit in the X developer console's billing settings; requests stop once it's reached. |
| DeepL | **Free.** Each post is translated once per language and stored; 12 posts use ~10–15k of the 500k monthly characters. The free plan stops at the limit rather than charging. |
| GitHub | **Free.** A few requests a day; no token needed. |
| Letterboxd, Goodreads, LinkedIn | **Free** (public RSS / embed pages). |
| Vercel | Hobby (free) plan covers a personal site and one daily cron. A custom domain is ~$10–15/year. |

---

## 14. Known limitations

- **Overscrolling past the page:** the extra area shows the tinted background, but browsers only paint the background color there, so the waves can't extend into it.
- **GitHub:** the events API only covers about the last 90 days; with no public pushes in that time, GitHub drops out of the feed until the next push.
- **Goodreads:** only the `read` shelf is used (not currently-reading or want-to-read).
- **LinkedIn:** each post's id must be added to `content/linkedin.ts` by hand (text and date are automatic).
- **X:** the endpoint always returns at least 5 posts per request, even though only the most recent can make the top 12.
- **Avatars:** GitHub's avatar was confirmed from the API; the Goodreads (cartoon) and Letterboxd (Meet the Robinsons) assignments were a best guess. Swap the files in `public/avatars/` if they're reversed.
- **Blog / Projects / About Me** pages don't exist yet; the nav links show the translated 404.
- **SF Mono** only renders on Apple devices (licensing); other systems get a fallback monospace.
- **Dev server stale CSS:** after editing `globals.css`, restart `npm run dev` if changes don't appear (§2).
- **`.claude/launch.json`** is a local preview config used during development; delete it or add it to `.gitignore` if you don't want it committed.
