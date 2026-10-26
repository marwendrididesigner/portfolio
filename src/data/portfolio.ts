import type { ImageMetadata } from 'astro';
import data from './portfolio.json';
import { alts } from './portfolio-alts';
import { deliverables } from './projects';
import { projectText, services as frServices } from '../i18n/ui';
import { driveId, drivePreview, driveView, RATIOS, type Ratio } from './drive';

// The Work section renders src/data/portfolio.json: chapters in PDF order, each with its ordered project
// ids, and every project's boards in display order (files in src/assets/portfolio/<folder>/).
// The admin page (/admin/) edits this file. A missing board fails the build, so a broken publish
// never replaces the live site.
// (portfolio-inventory.json remains the PDF audit record used by the scripts/ tooling.)

export interface Visual { src: ImageMetadata; alt: string; altFr: string } // alt text for /en/ and /fr/
// A Google Drive video: Drive's player is embedded only when the visitor clicks the thumbnail.
export interface Video { id: string; title?: string; ratio: Ratio; embed: string; link: string; thumb?: Visual }
export interface PortfolioProject {
  id: string;
  chapter: string;
  client: string;
  title?: string;
  country?: string;
  services?: string;
  boards: Visual[];
  videos: Video[];
}
export interface Chapter { id: string; number: string; title: string; deliverables: readonly string[]; projects: PortfolioProject[] }

export interface StoredProject {
  client: string | null; title: string | null; country: string | null; services: string | null;
  folder: string; boards: string[];
  // Motion Design & Video Editing (any section can hold them): Google Drive videos in display order.
  // `id` is permanent (it survives link, thumbnail and title changes); `thumb` is a v-*.webp/jpg file in
  // the project folder (null = placeholder). Absent = no videos.
  videos?: StoredVideo[];
  // Hidden from the public site (both languages, Work and Selected Work) but kept with its section
  // position, boards and Selected Work entries, so un-hiding restores it as it was. Absent = visible.
  hidden?: boolean;
}
export interface StoredVideo { id: string; url: string; title: string | null; ratio: Ratio; thumb: string | null }
// Selected Work: four fixed groups. Each item references an existing project by id plus the boards to
// show, in display order (`boards`: file names from that project's boards — stable, unlike indices) —
// never a copy of the project or its images. `chapter` is the Work chapter the "Explore all" link scrolls to; `chapters` are the categories
// the admin picker offers for the group. Edited from /admin/ independently of the portfolio order.
// `videos`: selected video ids, in display order; `covers`: optional Selected-Work-only thumbnails
// (video id → v-* file in the project folder). An item selects at least one board or video.
export interface FeaturedItem { project: string; boards: string[]; videos?: string[]; covers?: Record<string, string> }
export interface FeaturedGroup { id: string; title: string; chapter: string; chapters: string[]; items: FeaturedItem[] }
export interface PortfolioData {
  chapters: { id: string; title: string; projects: string[] }[];
  projects: Record<string, StoredProject>;
  featured?: FeaturedGroup[];
}
export const MAX_FEATURED = 4;
export const portfolioData = data as PortfolioData;

// d-* = presentation boards, v-* = video thumbnails
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/portfolio/*/{d,v}-*.{webp,jpg}', { eager: true });
const image = (folder: string, f: string) => {
  const file = files[`../assets/portfolio/${folder}/${f}`];
  if (!file) throw new Error(`portfolio.json: missing image ${folder}/${f}`);
  return file.default;
};

function project(id: string, chapter: string): PortfolioProject {
  const p = portfolioData.projects[id];
  if (!p) throw new Error(`portfolio.json: chapter "${chapter}" lists unknown project "${id}"`);
  const name = [p.client, p.title].filter(Boolean).join(' — ') || 'Project';
  const given = alts[id]?.desktop ?? [];
  const givenFr = alts[id]?.fr ?? [];
  const n = p.boards.length;
  const boards = p.boards.map((f, i) => {
    // Written alt texts belong to the original boards d-01, d-02… (by file name, not position, so they
    // follow a board when the admin reorders; boards added or replaced from the admin get other names).
    const k = Number(/^d-(\d{2})\.(?:webp|jpg)$/.exec(f)?.[1] ?? 0) - 1;
    return {
      src: image(p.folder, f),
      alt: given[k] ?? `${name} — ${p.services ?? 'project'} presentation ${n > 1 ? `${i + 1} of ${n}` : ''}`.trim(),
      altFr: givenFr[k] ?? `${[p.client, p.title].filter(Boolean).map((x) => projectText('fr', x!)).join(' — ') || 'Projet'} — planche de présentation${p.services ? ` (${frServices('fr', p.services)})` : ''}${n > 1 ? ` ${i + 1} sur ${n}` : ''}`,
    };
  });
  const nameFr = [p.client, p.title].filter(Boolean).map((x) => projectText('fr', x!)).join(' — ') || 'Projet';
  const seen = new Set<string>();
  const videos = (p.videos ?? []).map((v, i): Video => {
    const drive = driveId(v.url);
    if (!drive) throw new Error(`portfolio.json: "${id}" video ${i + 1} has an invalid Google Drive link: ${v.url}`);
    if (!v.id || seen.has(v.id)) throw new Error(`portfolio.json: "${id}" has a missing or repeated video id "${v.id}"`);
    if (!RATIOS.includes(v.ratio)) throw new Error(`portfolio.json: "${id}" video ${i + 1} has an unknown aspect ratio "${v.ratio}"`);
    seen.add(v.id);
    const label = v.title ? ` — ${v.title}` : '';
    return {
      id: v.id, title: v.title ?? undefined, ratio: v.ratio, embed: drivePreview(drive), link: driveView(drive),
      thumb: v.thumb ? { src: image(p.folder, v.thumb), alt: `${name}${label} — video thumbnail`, altFr: `${nameFr}${label} — vignette de la vidéo` } : undefined,
    };
  });
  return {
    id, chapter,
    // Unlabelled projects without a visible brand are headed by their descriptive title
    client: p.client ?? p.title ?? 'Untitled', title: p.client ? (p.title ?? undefined) : undefined,
    country: p.country ?? undefined, services: p.services ?? undefined, boards, videos,
  };
}

// Row grouping shared by Work and Selected Work: one project per row, except two CONSECUTIVE
// single-board projects (without videos), which share a row.
export const rowsOf = <T extends { boards: readonly unknown[]; videos: readonly unknown[] }>(projects: T[]) => {
  const rows: T[][] = [];
  const single = (p?: T) => p?.boards.length === 1 && !p.videos.length;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i]!, q = projects[i + 1];
    if (single(p) && single(q)) { rows.push([p, q]); i++; }
    else rows.push([p]);
  }
  return rows;
};

// Empty chapters (e.g. a new category with no projects yet) are dropped; numbering follows what is shown.
export const chapters: Chapter[] = portfolioData.chapters
  .map((c) => ({
    id: c.id, number: '', title: c.title, deliverables: deliverables[c.id] ?? [],
    // Hidden projects are still checked (missing boards fail the build) but never rendered
    projects: c.projects.map((id) => project(id, c.id)).filter((p) => p.boards.length + p.videos.length > 0 && !portfolioData.projects[p.id]!.hidden),
  }))
  .filter((c) => c.projects.length > 0)
  .map((c, i) => ({ ...c, number: String(i + 1).padStart(2, '0') }));

// Groups with no featured projects yet stay in the data (and the admin) but are not rendered. Entries of
// hidden projects keep their slot in the data and are skipped here.
const shown = (g: FeaturedGroup) => g.items.filter((it) => !portfolioData.projects[it.project]?.hidden);
export const featured = (portfolioData.featured ?? []).filter((g) => shown(g).length > 0).map((g, i) => {
  const chapter = chapters.find((c) => c.id === g.chapter);
  if (!chapter) throw new Error(`portfolio.json: featured group "${g.id}" links to unknown chapter "${g.chapter}"`);
  const all = chapters.flatMap((c) => c.projects);
  return {
    id: g.id, number: String(i + 1).padStart(2, '0'), title: g.title,
    chapter: { id: chapter.id, title: chapter.title },
    // Empty slots are simply not rendered
    projects: shown(g).slice(0, MAX_FEATURED).map(({ project: id, boards, videos = [], covers = {} }) => {
      const p = all.find((x) => x.id === id);
      if (!p) throw new Error(`portfolio.json: featured group "${g.id}" lists "${id}", which is not in any chapter`);
      if (!boards.length && !videos.length) throw new Error(`portfolio.json: featured "${id}" has no selected boards or videos`);
      const stored = portfolioData.projects[id]!;
      // Only the selected boards and videos, in the chosen order (the full portfolio still shows them all)
      return { ...p, boards: boards.map((b) => {
        const i = stored.boards.indexOf(b);
        if (i < 0) throw new Error(`portfolio.json: featured "${id}" selects "${b}", which is not one of its boards`);
        return p.boards[i]!;
      }), videos: videos.map((vid) => {
        const v = p.videos.find((x) => x.id === vid);
        if (!v) throw new Error(`portfolio.json: featured "${id}" selects video "${vid}", which is not one of its videos`);
        // A Selected-Work-only thumbnail replaces the video's own one here
        const cover = covers[vid];
        return cover ? { ...v, thumb: { ...(v.thumb ?? { alt: `${[p.client, p.title].filter(Boolean).join(' — ')} — video thumbnail`, altFr: `${p.client} — vignette de la vidéo` }), src: image(stored.folder, cover) } } : v;
      }) };
    }),
  };
});
