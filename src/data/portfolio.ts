import type { ImageMetadata } from 'astro';
import data from './portfolio.json';
import { alts } from './portfolio-alts';
import { deliverables } from './projects';
import { projectText, services as frServices } from '../i18n/ui';

// The Work section renders src/data/portfolio.json: chapters in PDF order, each with its ordered project
// ids, and every project's boards in display order (files in src/assets/portfolio/<folder>/).
// The admin page (/admin/) edits this file. A missing board fails the build, so a broken publish
// never replaces the live site.
// (portfolio-inventory.json remains the PDF audit record used by the scripts/ tooling.)

export interface Visual { src: ImageMetadata; alt: string; altFr: string } // alt text for /en/ and /fr/
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
  // Hidden from the public site (both languages, Work and Selected Work) but kept with its section
  // position, boards and Selected Work entries, so un-hiding restores it as it was. Absent = visible.
  hidden?: boolean;
}
// Selected Work: four fixed groups. Each item references an existing project by id plus the boards to
// show, in display order (`boards`: file names from that project's boards — stable, unlike indices) —
// never a copy of the project or its images. `chapter` is the Work chapter the "Explore all" link scrolls to; `chapters` are the categories
// the admin picker offers for the group. Edited from /admin/ independently of the portfolio order.
export interface FeaturedItem { project: string; boards: string[] }
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
  const givenFr = alts[id]?.fr ?? [];
  const n = p.boards.length;
  const boards = p.boards.map((f, i) => {
    const file = files[`../assets/portfolio/${p.folder}/${f}`];
    if (!file) throw new Error(`portfolio.json: missing board ${p.folder}/${f}`);
    // Written alt texts belong to the original boards d-01, d-02… (by file name, not position, so they
    // follow a board when the admin reorders; boards added or replaced from the admin get other names).
    const k = Number(/^d-(\d{2})\.(?:webp|jpg)$/.exec(f)?.[1] ?? 0) - 1;
    return {
      src: file.default,
      alt: given[k] ?? `${name} — ${p.services ?? 'project'} presentation ${n > 1 ? `${i + 1} of ${n}` : ''}`.trim(),
      altFr: givenFr[k] ?? `${[p.client, p.title].filter(Boolean).map((x) => projectText('fr', x!)).join(' — ') || 'Projet'} — planche de présentation${p.services ? ` (${frServices('fr', p.services)})` : ''}${n > 1 ? ` ${i + 1} sur ${n}` : ''}`,
    };
  });
  return {
    id, chapter,
    // Unlabelled projects without a visible brand are headed by their descriptive title
    client: p.client ?? p.title ?? 'Untitled', title: p.client ? (p.title ?? undefined) : undefined,
    country: p.country ?? undefined, services: p.services ?? undefined, boards,
  };
}

// Row grouping shared by Work and Selected Work: one project per row, except two CONSECUTIVE
// single-board projects, which share a row.
export const rowsOf = <T extends { boards: readonly unknown[] }>(projects: T[]) => {
  const rows: T[][] = [];
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i]!, q = projects[i + 1];
    if (p.boards.length === 1 && q?.boards.length === 1) { rows.push([p, q]); i++; }
    else rows.push([p]);
  }
  return rows;
};

// Empty chapters (e.g. a new category with no projects yet) are dropped; numbering follows what is shown.
export const chapters: Chapter[] = portfolioData.chapters
  .map((c) => ({
    id: c.id, number: '', title: c.title, deliverables: deliverables[c.id] ?? [],
    // Hidden projects are still checked (missing boards fail the build) but never rendered
    projects: c.projects.map((id) => project(id, c.id)).filter((p) => p.boards.length > 0 && !portfolioData.projects[p.id]!.hidden),
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
    projects: shown(g).slice(0, MAX_FEATURED).map(({ project: id, boards }) => {
      const p = all.find((x) => x.id === id);
      if (!p) throw new Error(`portfolio.json: featured group "${g.id}" lists "${id}", which is not in any chapter`);
      if (!boards.length) throw new Error(`portfolio.json: featured "${id}" has no selected boards`);
      const files = portfolioData.projects[id]!.boards;
      // Only the selected boards, in the chosen order (the full portfolio still shows them all)
      return { ...p, boards: boards.map((b) => {
        const i = files.indexOf(b);
        if (i < 0) throw new Error(`portfolio.json: featured "${id}" selects "${b}", which is not one of its boards`);
        return p.boards[i]!;
      }) };
    }),
  };
});
