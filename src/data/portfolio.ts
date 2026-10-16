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
export interface PortfolioData { chapters: { id: string; title: string; projects: string[] }[]; projects: Record<string, StoredProject> }
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
