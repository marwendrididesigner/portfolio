import type { ImageMetadata } from 'astro';
import inventory from './portfolio-inventory.json';
import { alts } from './portfolio-alts';

// The Work section renders the PDF portfolio in its original order (inventory = source of truth).
// A project appears once its web masters exist in src/assets/portfolio/<order>-<id>/ (npm run portfolio).

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
  desktop: Visual[];
  mobile: Visual[];
}
export interface Chapter { id: string; number: string; title: string; description: string; projects: PortfolioProject[] }

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/portfolio/*/*.webp', { eager: true });
const byFolder = new Map<string, string[]>();
for (const k of Object.keys(files).sort()) {
  const folder = k.split('/').slice(-2, -1)[0]!;
  byFolder.set(folder, [...(byFolder.get(folder) ?? []), k]);
}

function visuals(p: InvProject, kind: 'd' | 'm'): Visual[] {
  const folder = `${String(p.order).padStart(3, '0')}-${p.id}`;
  const keys = (byFolder.get(folder) ?? []).filter((k) => k.split('/').pop()!.startsWith(`${kind}-`));
  const name = [p.client, p.title].filter(Boolean).join(' — ') || 'Project';
  const given = alts[p.id]?.[kind === 'd' ? 'desktop' : 'mobile'] ?? [];
  return keys.map((k, i) => ({
    src: files[k]!.default,
    alt: given[i] ?? (kind === 'd'
      ? `${name} — ${p.services ?? 'project'} presentation ${keys.length > 1 ? `${i + 1} of ${keys.length}` : ''}`.trim()
      : `${name} — design ${i + 1} of ${keys.length}`),
  }));
}

const published: PortfolioProject[] = (inventory.projects as InvProject[])
  .map((p) => ({
    id: p.id, order: p.order, chapter: p.chapter,
    // Unlabelled projects without a visible brand are headed by their descriptive title
    client: p.client ?? p.title ?? 'Untitled', title: p.client ? (p.title ?? undefined) : undefined,
    country: p.country ?? undefined, services: p.services ?? undefined,
    pdfPages: p.pdfPages, desktop: visuals(p, 'd'), mobile: visuals(p, 'm'),
  }))
  .filter((p) => p.desktop.length > 0);

export const chapters: Chapter[] = inventory.chapters
  .map((c, i) => ({
    id: c.id, number: String(i + 1).padStart(2, '0'), title: c.title, description: c.description,
    projects: published.filter((p) => p.chapter === c.id),
  }))
  .filter((c) => c.projects.length > 0);

export const totals = { published: published.length, inventory: inventory.projects.length };
