// Prepares web masters for the Work section from the ordered inventory
// (src/data/portfolio-inventory.json — built by scripts/inventory/build_inventory.py).
//
//   npm run portfolio -- --limit 3   # first 3 projects in PDF order (review sample)
//   npm run portfolio                # every project
//   add --force to regenerate existing files
//
// Output per project: src/assets/portfolio/<order>-<id>/
//   d-01.webp …  desktop visuals (prepared boards / page layouts), long edge ≤ 2400 px
//   m-01.webp …  mobile visuals (the individual creatives, in reading order), long edge ≤ 1600 px
// Sources are only read. Astro builds the responsive AVIF/WebP sizes from these masters.
import { readFile, mkdir, access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const inv = JSON.parse(await readFile(path.join(root, 'src/data/portfolio-inventory.json'), 'utf8'));
const args = process.argv.slice(2);
const force = args.includes('--force');
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const outRoot = path.join(root, 'src/assets/portfolio');
const exists = (p) => access(p).then(() => true, () => false);

async function master(src, out, maxEdge, quality) {
  if (!force && (await exists(out))) return 'skip';
  const file = path.resolve(root, src);
  if (!(await exists(file))) throw new Error(`Missing source: ${src}`);
  await sharp(file, { limitInputPixels: false })
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })          // transparent PNG creatives sit on white, as in the PDF
    .webp({ quality, effort: 5 })
    .toFile(out);
  return 'ok';
}

// Every project, in PDF order. PDF-layout projects must have been rendered first
// (scripts/inventory/render_sources.py fills their desktop/mobile lists).
const projects = inv.projects.slice(0, limit);
const unrendered = projects.filter((p) => !p.desktop?.length);
if (unrendered.length) throw new Error('Run render_sources.py first — no visuals for: ' + unrendered.map((p) => p.id).join(', '));

// keep only the folders of projects in range (so --limit 3 really shows 3)
const keep = new Set(projects.map((p) => `${String(p.order).padStart(3, '0')}-${p.id}`));
if (await exists(outRoot)) {
  for (const d of await readdir(outRoot)) if (!keep.has(d)) await rm(path.join(outRoot, d), { recursive: true });
}

let written = 0;
for (const p of projects) {
  const dir = path.join(outRoot, `${String(p.order).padStart(3, '0')}-${p.id}`);
  await mkdir(dir, { recursive: true });
  for (const [i, src] of p.desktop.entries()) {
    if ((await master(src, path.join(dir, `d-${String(i + 1).padStart(2, '0')}.webp`), 2400, 86)) === 'ok') written++;
  }
  for (const [i, src] of p.mobile.entries()) {
    if (String(src).startsWith('MISSING')) continue;
    if ((await master(src, path.join(dir, `m-${String(i + 1).padStart(2, '0')}.webp`), 1600, 86)) === 'ok') written++;
  }
  console.log(`✓ ${String(p.order).padStart(3, '0')} ${p.client}${p.title ? ' — ' + p.title : ''}: ${p.desktop.length} desktop, ${p.mobile.length} mobile`);
}
console.log(`Done: ${written} files written for ${projects.length} projects.`);
