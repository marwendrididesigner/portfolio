# Marwen Dridi — Portfolio website

One-page portfolio (Astro + TypeScript, plain CSS, no UI framework). Static output, built for free GitHub Pages hosting.

The **Work** section presents the complete PDF portfolio (`MARWEN DRIDI PORTFOLIO-151026.pdf`) as one continuous scroll — 108 projects in the PDF's exact order, every visual inline, no cards, filters or popups.

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321  (live reload)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4321
```

The first production build processes ~2,300 image variants (several minutes); later builds reuse Astro's image cache (`node_modules/.astro`).

---

## Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.

1. Create a GitHub repository (e.g. `portfolio`) and push this folder to its `main` branch.
   Only the website is committed — `assets-original/` (1.4 GB), the PDF, `.cache/` and `dist/` are git-ignored.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push (or run the workflow from the **Actions** tab). The site appears at
   - `https://<username>.github.io/<repo>/` for a project repository, or
   - `https://<username>.github.io/` for a repository named `<username>.github.io`.

The base path is set automatically: the workflow passes `SITE_URL` and `BASE_PATH` from GitHub Pages to `astro.config.mjs`.
To test a sub-path build locally:

```bash
# PowerShell
$env:BASE_PATH="/portfolio"; $env:SITE_URL="https://example.github.io"; npm run build; npm run preview
# bash (Git Bash: prefix with MSYS_NO_PATHCONV=1)
BASE_PATH=/portfolio SITE_URL=https://example.github.io npm run build && npm run preview
```

Size: ~84 MB of image masters in the repository; the published site stays well under GitHub Pages' 1 GB limit.

---

## Project structure

| Path | Purpose |
|---|---|
| `src/components/` | Header, Hero, About, Services, Ribbon, Work, Credentials, Contact, BackToTop |
| `src/data/site.ts` | Profile copy, verified metrics, tools, certifications, languages, contact text |
| `src/data/projects.ts` | Services & deliverables list |
| `src/data/portfolio-inventory.json` | **Source of truth for Work**: every project in PDF order with pages, labels, sources and ordered files |
| `src/data/portfolio.ts` | Turns the inventory + image masters into chapters/projects for the page |
| `src/data/portfolio-alts.ts` | Hand-written alt text (projects without an entry get a descriptive generic alt) |
| `src/assets/portfolio/<order>-<id>/` | Web masters: `d-NN.webp` presentation layouts (tablet/desktop), `m-NN.webp` individual designs (phones) |
| `src/data/ribbon.ts`, `src/assets/brand/` | Hero artwork (see below) |
| `PORTFOLIO-INVENTORY.md` | Human-readable inventory: every project, PDF pages, sources, files, open questions |

---

## Work section pipeline

Sources (read-only, never modified): the PDF, `assets-original/` and the prepared presentation boards in
`assets-original/UPWORK_SOCIAL_ADS_SHOWCASE_FINAL`, `…_BRAND_IDENTITY_CASE_STUDIES_FINAL`, `…_SAMRAY_PACKAGING_CASE_STUDIES_FINAL`.

```bash
python scripts/inventory/build_inventory.py <audit-dir>   # 1. ordered inventory from the PDF + prepared boards
python scripts/inventory/render_sources.py  <audit-dir>   # 2. page layouts & panel crops → .cache/portfolio-src/
npm run portfolio                                         # 3. web masters → src/assets/portfolio/
```

`<audit-dir>` holds `pages.json` and `page_matches.json` (per-page text and perceptual-hash matches between PDF images and `assets-original`).

| Chapter | Desktop / tablet | Phone |
|---|---|---|
| Social Media | prepared boards (3200×2400) | the original creatives, in board reading order |
| Brand Identity | prepared case-study board | each panel of the board (logos keep their prepared background and clear space) |
| Samray packaging | prepared case-study board | each panel of the board |
| Guidelines, Editorial, Collateral, AI | the PDF page re-rendered with every embedded image swapped for its high-resolution original (exact layout; page caption removed — the header shows it) | the page's individual images |

Phones get the individual designs because the 4:3 boards' type is unreadable below ~700 px. The other set is `display:none` + `loading="lazy"`, so it is never downloaded.

---

## Hero artwork

The original "Portfolio" lockup is raster-only, so it is rebuilt as two coordinated layers:

| File | What it is |
|---|---|
| `src/data/ribbon.ts` | One continuous SVG path traced from the original ribbon (waypoints: `scripts/hero-artwork/ribbon-waypoints.json`), with smooth extensions to both viewport edges |
| `src/assets/brand/wordmark-letters.png` | The original lettering with the ribbon removed |
| `src/assets/brand/ribbon-over-mask.png` | The 8 crossings where the ribbon passes in front of a letter |

Regenerate with `scripts/hero-artwork/fit_ribbon.py` and `build_artwork.py` (Python + numpy, OpenCV, Pillow).

---

## Design system

| Token | Value | Source |
|---|---|---|
| Ink | `#000004` | PDF cover background |
| Signature blue | `#00A0DE` | Name, section numbers |
| Ribbon | `#439EDA` | Hero ribbon |
| Cream | `#FFF5EA` | Type on dark |
| Glow | `#004C8A` | Cover light |
| Lime | `#93C003` | Contact separators |
| Paper | `#FBFBFB` | Project pages |

Typeface: **Argentum Sans** (SIL OFL 1.1, `@fontsource/argentum-sans`) — the font embedded in the PDF. Weights 400 and 800.
