# Writes PORTFOLIO-INVENTORY.md: every project on the website, in PDF order, with its PDF pages,
# sources and the web assets actually generated (src/assets/portfolio/<order>-<id>/).
#   python scripts/inventory/final_report.py
import json
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[2]
inv = json.load(open(ROOT / 'src/data/portfolio-inventory.json', encoding='utf-8'))
assets = ROOT / 'src/assets/portfolio'
chap = {c['id']: c for c in inv['chapters']}

def files(e, k):
    d = assets / f"{e['order']:03d}-{e['id']}"
    return sorted(p.name for p in d.glob(f'{k}-*.webp')) if d.exists() else []

def source_kind(e):
    if e['layout'] == 'boards': return 'Prepared social boards + original creatives'
    if e['layout'] == 'board': return 'Prepared case-study board + its panels'
    return 'PDF page layout re-rendered with high-res originals'

rows, tot_d, tot_m = [], 0, 0
for e in inv['projects']:
    d, m = files(e, 'd'), files(e, 'm'); tot_d += len(d); tot_m += len(m)
    rows.append((e, d, m))
status = Counter(e['status'] for e in inv['projects'])
L = ['# Portfolio inventory — website build', '',
     f"Source of truth: `MARWEN DRIDI PORTFOLIO-151026.pdf` (200 pages). Machine-readable: `src/data/portfolio-inventory.json`.", '',
     f"- **Projects on the website: {len(rows)}** (every project of the PDF, in PDF order)",
     f"- **Images: {tot_d} desktop/tablet presentation images + {tot_m} phone images = {tot_d + tot_m}** (each device shows one set)",
     f"- PDF pages covered: 4–200 (cover p.1, index pp.2–3 and the six chapter dividers are represented by the site's own Hero, Services and chapter openers)",
     '- Chapter 07 *Motion Graphics & Video* is listed on PDF p.2 but has no pages or files — not shown.', '',
     '## Status legend', '',
     '| Status | Count | Meaning |', '|---|---|---|',
     f"| ready | {status['ready']} | all visuals at high resolution; name/labels from the PDF |",
     f"| check | {status['check']} | visuals complete; the prepared board's own report lists a source limitation (see notes) |",
     f"| unlabelled | {status['unlabelled']} | visuals complete; the PDF page has no client label — name read from the artwork / file names (please confirm) |",
     f"| missing-originals | {status['missing-originals']} | at least one image has no high-res original anywhere; the PDF's embedded copy is used |", '']
for cid, c in chap.items():
    items = [r for r in rows if r[0]['chapter'] == cid]
    L += [f"## {c['title']} — {len(items)} projects", '',
          '| # | PDF pages | Project | Country | Services | Source | Web assets (desktop / phone) | Status | Notes |',
          '|---|---|---|---|---|---|---|---|---|']
    for e, d, m in items:
        pg = e['pdfPages']; pages = f"{pg[0]}" + (f"–{pg[-1]}" if len(pg) > 1 else '')
        name = ' — '.join(x for x in (e.get('client'), e.get('title')) if x)
        notes = '; '.join(e.get('notes') or []) or '—'
        L.append(f"| {e['order']} | {pages} | {name} | {e.get('country') or '—'} | {e.get('services') or '—'} | {source_kind(e)} | "
                 f"`{e['order']:03d}-{e['id']}/` {len(d)} / {len(m)} | {e['status']} | {notes} |")
    L.append('')
L += ['## Source files per project', '']
for e, d, m in rows:
    name = ' — '.join(x for x in (e.get('client'), e.get('title')) if x)
    L.append(f"**{e['order']:03d}. {name}** (PDF p.{', '.join(map(str, e['pdfPages']))}) → `src/assets/portfolio/{e['order']:03d}-{e['id']}/`")
    L.append('- desktop: ' + ', '.join(f"`{Path(s).name}`" for s in e['desktop']))
    L.append('- phone: ' + ', '.join(f"`{Path(str(s)).name}`" for s in e['mobile']))
    L.append('')
(ROOT / 'PORTFOLIO-INVENTORY.md').write_text('\n'.join(L), encoding='utf-8')
print('projects', len(rows), 'desktop', tot_d, 'phone', tot_m, dict(status))
