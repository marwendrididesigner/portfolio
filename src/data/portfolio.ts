import type { ImageMetadata } from 'astro';
import inventory from './portfolio-inventory.json';
import { alts } from './portfolio-alts';
import { deliverables } from './projects';

// The Work section renders the PDF portfolio in its original order (inventory = source of truth).
// A project appears once its web masters exist in src/assets/portfolio/<order>-<id>/ (npm run portfolio).
// Every viewport shows the prepared presentation boards (d-*.webp); the individual designs (m-*) are not used.

type InvProject = (typeof inventory.projects)[number] & { title?: string | null };

export interface Visual { src: ImageMetadata; alt: string }
export interface PortfolioProject {
  id: string;
  order: number;
  chapter: string;
  client: string;
  title?: string;
  country?: string;
  services?: string;
  pdfPages: number[];
  boards: Visual[];
}
export interface Chapter { id: string; number: string; title: string; deliverables: readonly string[]; projects: PortfolioProject[] }

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/portfolio/*/d-*.webp', { eager: true });
const byFolder = new Map<string, string[]>();
for (const k of Object.keys(files).sort()) {
  const folder = k.split('/').slice(-2, -1)[0]!;
  byFolder.set(folder, [...(byFolder.get(folder) ?? []), k]);
}

function boards(p: InvProject): Visual[] {
  const folder = `${String(p.order).padStart(3, '0')}-${p.id}`;
  const keys = (byFolder.get(folder) ?? []).filter((k) => k.split('/').pop()!.startsWith('d-'));
  const name = [p.client, p.title].filter(Boolean).join(' — ') || 'Project';
  const given = alts[p.id]?.desktop ?? [];
  return keys.map((k, i) => ({
    src: files[k]!.default,
    alt: given[i] ?? `${name} — ${p.services ?? 'project'} presentation ${keys.length > 1 ? `${i + 1} of ${keys.length}` : ''}`.trim(),
  }));
}

const published: PortfolioProject[] = (inventory.projects as InvProject[])
  .map((p) => ({
    id: p.id, order: p.order, chapter: p.chapter,
    // Unlabelled projects without a visible brand are headed by their descriptive title
    client: p.client ?? p.title ?? 'Untitled', title: p.client ? (p.title ?? undefined) : undefined,
    country: p.country ?? undefined, services: p.services ?? undefined,
    pdfPages: p.pdfPages, boards: boards(p),
  }))
  .filter((p) => p.boards.length > 0);

export const chapters: Chapter[] = inventory.chapters
  .map((c, i) => ({
    id: c.id, number: String(i + 1).padStart(2, '0'), title: c.title, deliverables: deliverables[c.id] ?? [],
    projects: published.filter((p) => p.chapter === c.id),
  }))
  .filter((c) => c.projects.length > 0);

export const totals = { published: published.length, inventory: inventory.projects.length };
