# AtoA: tax preparation in four languages, Quad Cities

A static website built the Lafiglow way (plain HTML, a booking popup that sends visitors to WhatsApp, phone or email, ready for GitHub Pages), with a full version in each of four languages:

| Page | Language |
|---|---|
| `index.html` | English |
| `ar/index.html` | Arabic (right‑to‑left) |
| `sw/index.html` | Swahili |
| `fr/index.html` | French |

Each language folder also has a `privacy.html` page, built from `src/privacy.html`.

## How it's put together

- **Edit `src/page.html`** and `src/privacy.html` (the layouts; the shared `<head>` and footer are in `src/partials/`) and **`src/i18n/<lang>.json`** (the words). Never edit the built `index.html` files by hand.
- `node build.mjs` builds all four pages and `assets/site.css` (Tailwind 4 + DaisyUI 5). `node build.mjs --watch` rebuilds every time you save.
- `node_modules` is AtoA's own copy of the build tools (DaisyUI 5.7.46, Tailwind 4.3.3, PostCSS). It's separate from every other project and is not committed (`.gitignore`). On a new computer, run `npm install`.
- `og.jpg` (the preview picture shown when the site is shared on WhatsApp or Facebook) is a screenshot of `src/og.html` at 1200×630: `chromium --headless --window-size=1200,630 --screenshot=og.png src/og.html`. After changing it, bump `?v=` next to `og_image` in `build.mjs`.
- Each page tells Google the other three versions exist (`hreflang` tags), so each language can rank in search on its own.
- When a visitor's phone or computer is set to Arabic, Swahili or French, a small bar at the top offers them that version.

## Brand (from the AtoA brand board, `~/Downloads/AtoA.jpeg`)

| Color | Hex | Use |
|---|---|---|
| Navy | `#0B2D4A` | logo, main buttons, the Languages and Contact sections |
| Orange | `#F7931E` | the logo's last "A" and swoosh, headline swoosh, highlights. Text on orange is always navy, because white on orange is too hard to read (2.3:1). |
| Mist / Cloud | `#E8EEF5` / `#F5F7FA` | light backgrounds |
| Line | `#E5E7EB` | borders |

- Fonts: **Poppins** for headings (from the brand board), Open Sans for body text, IBM Plex Mono for form numbers. Arabic uses Cairo and IBM Plex Sans Arabic.
- **Light and dark mode:** the moon/sun button in the menu bar switches between them. The site starts in the visitor's system setting and remembers their choice. Both themes are defined in `src/input.css` (`atoa` and `atoa-night`).
- Design rules checked against the UI UX Pro Max guidelines (`~/.jcode/scratch/uupm`): text contrast of at least 4.5:1, visible focus rings, reduced motion respected, no emoji icons.
