import type { ImageMetadata } from 'astro';
import data from './portfolio.json';
import { alts } from './portfolio-alts';
import { deliverables } from './projects';

// The Work section renders src/data/portfolio.json: chapters in PDF order, each with its ordered project
// ids, and every project's boards in display order (files in src/assets/portfolio/<folder>/).
// The admin page (/admin/) edits this file. A missing board fails the build, so a broken publish
// never replaces the live site.
// (portfolio-inventory.json remains the PDF audit record used by the scripts/ tooling.)

export interface Visual { src: ImageMetadata; alt: string }
export interface PortfolioProject {
  id: string;
  chapter: string;
  client: string;
  title?: string;
  country?: string;
  services?: string;
  boards: Visual[];
}
export interface Chapter { id: string; number: string; title: string; deliverables: readonly string[]; projects: PortfolioProject[] }

export interface StoredProject {
  client: string | null; title: string | null; country: string | null; services: string | null;
  folder: string; boards: string[];
}
// Selected Work: four fixed groups. Each item references an existing project by id plus the board shown
// as its preview (`cover`, a file name from that project's boards) — never a copy of the project or its
// images. `chapter` is the Work chapter the "Explore all" link scrolls to; `chapters` are the categories
// the admin picker offers for the group. Edited from /admin/ independently of the portfolio order.
export interface FeaturedItem { project: string; cover: string }
export interface FeaturedGroup { id: string; title: string; chapter: string; chapters: string[]; items: FeaturedItem[] }
export interface PortfolioData {
  chapters: { id: string; title: string; projects: string[] }[];
  projects: Record<string, StoredProject>;
  featured?: FeaturedGroup[];
}
export const MAX_FEATURED = 4;
export const portfolioData = data as PortfolioData;

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/portfolio/*/d-*.{webp,jpg}', { eager: true });

function project(id: string, chapter: string): PortfolioProject {
  const p = portfolioData.projects[id];
  if (!p) throw new Error(`portfolio.json: chapter "${chapter}" lists unknown project "${id}"`);
  const name = [p.client, p.title].filter(Boolean).join(' — ') || 'Project';
  const given = alts[id]?.desktop ?? [];
  const boards = p.boards.map((f, i) => {
    const file = files[`../assets/portfolio/${p.folder}/${f}`];
    if (!file) throw new Error(`portfolio.json: missing board ${p.folder}/${f}`);
    return {
      src: file.default,
      alt: given[i] ?? `${name} — ${p.services ?? 'project'} presentation ${p.boards.length > 1 ? `${i + 1} of ${p.boards.length}` : ''}`.trim(),
    };
  });
  return {
    id, chapter,
    // Unlabelled projects without a visible brand are headed by their descriptive title
    client: p.client ?? p.title ?? 'Untitled', title: p.client ? (p.title ?? undefined) : undefined,
    country: p.country ?? undefined, services: p.services ?? undefined, boards,
  };
}

export const chapters: Chapter[] = portfolioData.chapters
  .map((c, i) => ({
    id: c.id, number: String(i + 1).padStart(2, '0'), title: c.title, deliverables: deliverables[c.id] ?? [],
    projects: c.projects.map((id) => project(id, c.id)).filter((p) => p.boards.length > 0),
  }))
  .filter((c) => c.projects.length > 0);

export const featured = (portfolioData.featured ?? []).map((g, i) => {
  const chapter = chapters.find((c) => c.id === g.chapter);
  if (!chapter) throw new Error(`portfolio.json: featured group "${g.id}" links to unknown chapter "${g.chapter}"`);
  const all = chapters.flatMap((c) => c.projects);
  return {
    id: g.id, number: String(i + 1).padStart(2, '0'), title: g.title,
    chapter: { id: chapter.id, title: chapter.title },
    // Empty slots are simply not rendered
    projects: g.items.slice(0, MAX_FEATURED).map(({ project: id, cover }) => {
      const p = all.find((x) => x.id === id);
      if (!p) throw new Error(`portfolio.json: featured group "${g.id}" lists "${id}", which is not in any chapter`);
      const coverIndex = portfolioData.projects[id]!.boards.indexOf(cover);
      if (coverIndex < 0) throw new Error(`portfolio.json: featured "${id}" uses cover "${cover}", which is not one of its boards`);
      return { ...p, coverIndex, cover: p.boards[coverIndex]! };
    }),
  };
});
