# Builds the ordered portfolio inventory (source of truth for the Work section).
#
#   python scripts/inventory/build_inventory.py <scratch-audit-dir>
#
# Inputs (read-only):
#   - MARWEN DRIDI PORTFOLIO-151026.pdf          authoritative order, labels (Country / Client / Services)
#   - <audit>/pages.json, page_matches.json        per-page text + perceptual-hash matches to assets-original
#   - assets-original/UPWORK_*_FINAL/              prepared boards + manifests (social, identity, Samray)
#   - ../Samray-*/Samray/Direction N/              Samray sources (to map directions → PDF pages)
# Outputs:
#   - src/data/portfolio-inventory.json
#   - PORTFOLIO-INVENTORY.md
import sys, os, re, json, csv, glob
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AO = ROOT / 'assets-original'
MARWEN = ROOT.parent
audit = Path(sys.argv[1])
pages = {p['n']: p for p in json.load(open(audit / 'pages.json', encoding='utf-8'))}
matches = {int(k): v for k, v in json.load(open(audit / 'page_matches.json', encoding='utf-8')).items()}
SOC = AO / 'UPWORK_SOCIAL_ADS_SHOWCASE_FINAL'
_extra = json.load(open(Path(__file__).with_name('extra-originals.json'), encoding='utf-8'))['images']
EXTRA_FILES = {(x['page'], tuple(x['rect'])): x['file'] for x in _extra}
EXTRA_KEYS = set(EXTRA_FILES)
IDN = AO / 'UPWORK_BRAND_IDENTITY_CASE_STUDIES_FINAL'
SAM = AO / 'UPWORK_SAMRAY_PACKAGING_CASE_STUDIES_FINAL'

CHAPTERS = [
    ('social', 3, 'Social Media & Digital Campaigns', 'Digital campaigns and social content designed to connect brands with their audiences.'),
    ('identity', 40, 'Brand Identity & Logo Design', 'Distinctive identities built through thoughtful design and cohesive visual systems.'),
    ('guidelines', 60, 'Brand Guidelines', 'Clear visual standards that keep brands consistent across every touchpoint.'),
    ('editorial', 83, 'Editorial & Presentation Design', 'Reports, publications, and presentations shaped by clarity and visual storytelling.'),
    ('collateral', 108, 'Marketing Collateral & Print Design', 'Branded materials that bring visual identities into the physical world.'),
    ('ai', 145, 'AI-Powered Visual Design', 'Generative visuals and visual assets developed through AI-enhanced design workflows.'),
]
DIVIDERS = {c[1] for c in CHAPTERS}
LAST_PAGE = 200

def chapter_of(page):
    cur = None
    for cid, start, *_ in CHAPTERS:
        if page > start: cur = cid
    return cur

def labels(page):
    t = [l.strip() for l in pages[page]['text'].splitlines() if l.strip()]
    out = {}
    for key in ('Country', 'Client', 'Services'):
        if key in t and t.index(key) + 1 < len(t): out[key.lower()] = t[t.index(key) + 1]
    if 'client' in out and 'country' not in out and t and t[0] != 'Country':
        out['country'] = t[0]            # p43: country printed without its label
    return out

FIX = {'OUGANDA': 'Uganda', 'TUNSIA': 'Tunisia', 'USA': 'USA', 'UAE': 'UAE'}
def nice_country(c): return FIX.get(c.upper(), c.title()) if c else None
def nice_services(s): return s.replace('�', '·').replace(' . ', ' · ').title().replace('Ai ', 'AI ') if s else None
def rel(p):
    # project-relative path; sources outside the project folder are kept as ../ paths (read locally, never shipped)
    return os.path.relpath(Path(p).resolve(), ROOT).replace('\\', '/')
def find_src(name, fallback_dirs=()):
    for d in [AO, *fallback_dirs]:
        p = Path(d) / name
        if p.exists(): return p
    hits = list(AO.rglob(name))
    return hits[0] if hits else None

# ---------- 1. group PDF pages into projects (labels start a project; unlabelled pages continue it) ----------
def ai_key(n):
    best = max((m for m in matches[n] if m.get('dist') is not None and m['dist'] <= 40), key=lambda m: m['w'] * m['h'], default=None)
    mm = re.search(r'Project_(\d+)_(.+?)_\d{3}\.', best['match']) if best else None
    return (int(mm.group(1)), mm.group(2)) if mm else None

# Explicit group starts where the PDF has no label but the prepared assets prove a new project begins
# p.38: event covers (prepared folder 20); p.59: Green Bazar (folder 19), same PDF label as TADA p.58.
# pp.112–144 carry no labels: one Samray direction per page (112–120), then pages grouped by the brand
# visible on the artwork (consecutive pages of the same brand/event stay together).
FORCE_START = {38, 59} | set(range(112, 121)) | {121, 122, 123, 124, 126, 127, 129, 130, 131, 132, 134, 136, 137, 139, 143, 144}

# Names for unlabelled pages, read from the artwork itself (client, title). None = no brand visible.
ARTWORK_NAMES = {
    109: (None, 'Event roll-up banners'),            # African Cleantech Congress, CCD4Libya, Future Islands roll-ups
    121: ('Future Islands', 'Branded polo shirts & business cards'),
    122: ('CCD4Libya', 'Tote bag'),
    123: ('Maarifa for Transition', 'Tote bag — “Ancestral Practices”'),
    124: ('Fifth Insight', 'Brochure'),
    126: (None, 'Company brochure'),
    127: (None, 'Event badges & speaker cards'),
    129: ('Career Insider', 'Event badges'),
    130: ('CCD4Libya', 'Hoodie & notebook'),
    131: ('Delace', 'Poster campaign'),
    132: ('BD’s — Saudi Business Developers Forum', 'Brochure & roll-up banners'),
    134: ('IEEEXtreme — Egypt Section', 'Event badges & tote bag'),
    136: (None, 'Employee ID badges'),
    137: (None, 'Event flags & staff polo shirts'),
    139: ('Career Insider — IEEE Mansoura Student Branch', 'Event print & signage'),
    143: (None, 'Event report & certificates'),
    144: ('Nayyar', 'Menu'),
}
AI_NAMES = {
    146: ('Bodies', 'Instagram feed imagery'), 149: ('Bodies', 'Product imagery'), 150: ('Ghitra', 'Brand imagery'),
    156: ('Flawless', 'Imagery shoot'), 157: ('Indintambwe', 'Brand imagery'), 159: ('MZURI Organics', 'Brand imagery'),
    161: ('Viva', '5-in-1 professional hair-styling set'), 162: ('Patvention', 'Brand imagery'), 164: (None, 'Face shapewear'),
    165: (None, 'Bodysuits'), 170: ('Almizan Economy', 'Imagery'), 172: ('Bodies', 'Product imagery'),
    176: (None, 'Packaging imagery'), 180: (None, 'Shapewear product review shots'), 181: (None, 'Shapewear website product shoot'),
    186: (None, 'Bodysuits'), 189: (None, 'Face shapewear'), 192: (None, 'Brand imagery'), 194: (None, 'Bodysuits'),
}
# Display spellings for PDF labels (typos corrected; brand casing as on the artwork)
DISPLAY = {'ACE MOBILITY LTD': 'Ace Mobility', 'MZURI ORGANICS': 'MZURI Organics', 'RDVMEDCINS': 'RDVmédecins', 'AIQ': 'AIQ',
           'CCD4LIBYA': 'CCD4Libya', 'CCD4TUNISIA': 'CCD4Tunisia', 'CLEANTECH216': 'Cleantech216', 'A+ENERGIHOUSE': 'A+ EnergiHouse',
           'FUTURE ISLAND': 'Future Islands', 'ESPRESSO21': 'Espresso21', 'EDDY KENZO': 'Eddy Kenzo', 'SOUN': 'Soun'}
def display(c): return DISPLAY.get(c.strip().upper(), c.strip().title()) if c else None
groups = []
for n in range(4, LAST_PAGE + 1):
    if n in DIVIDERS: continue
    lb, ch = labels(n), chapter_of(n)
    new_group = not groups or groups[-1]['chapter'] != ch or n in FORCE_START
    if not new_group and 'client' in lb:
        prev = groups[-1]['label']   # a repeated identical label (e.g. Future Islands journal pp.110–111) continues the project
        new_group = (lb.get('client'), lb.get('services'), lb.get('country')) != (prev.get('client'), prev.get('services'), prev.get('country'))
    if not new_group and ch == 'ai':
        new_group = ai_key(n) != groups[-1].get('ai')
    if new_group:
        groups.append({'chapter': ch, 'pages': [n], 'label': lb, 'ai': ai_key(n) if ch == 'ai' else None})
    else:
        groups[-1]['pages'].append(n)

# collateral & AI pages carry no labels after their first page: split them one project per page-run later
# ---------- 2. prepared sources ----------
soc_dirs = sorted(d for d in SOC.glob('Project_*') if d.is_dir())
idn_rows = list(csv.DictReader(open(IDN / 'REPORTS' / 'Project_Index.csv', encoding='utf-8-sig')))
idn_by_page = {int(r['portfolio_pdf_page']): r for r in idn_rows}

def social_project(folder):
    boards = sorted((folder / 'PNG').glob('*_Board_*.png'))
    man = list(csv.DictReader(open(folder / 'REPORT' / 'Image_Usage_Manifest.csv', encoding='utf-8-sig')))
    inc = [m for m in man if m['included'] == 'YES']
    def key(m):
        x0, y0 = [int(v) for v in re.findall(r'\d+', m['panel_box_px'])[0:3:2]]
        return (int(m['board']), y0, x0)
    mobile, missing = [], []
    for m in sorted(inc, key=key):
        p = find_src(m['source_file'], [MARWEN / 'PORTFOLIO 2026 - 151026 Folder TEMPLATE FINAL' / 'Links'])
        (mobile if p else missing).append(rel(p) if p else m['source_file'])
    return boards, mobile, missing, len(inc)

# map social folders to PDF groups by client-name similarity (order comes from the PDF, not the folders)
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
SOCIAL_ALIASES = {'kukupoultry': 'acemobilityltd@5', 'eventandfacebookcovers': '@38'}

inventory = []
order = 0
samray_dirs = sorted(d for d in SAM.glob('Project_*') if d.is_dir())

def add(entry):
    global order
    order += 1
    entry['order'] = order
    inventory.append(entry)

for g in groups:
    ch, pg, lb = g['chapter'], g['pages'], g['label']
    client = lb.get('client')
    base = {'chapter': ch, 'pdfPages': pg, 'country': nice_country(lb.get('country')), 'services': nice_services(lb.get('services')), 'notes': []}
    if ch == 'social':
        SOCIAL_FOLDER = {4: 1, 5: 2, 6: 3, 8: 4, 9: 5, 10: 6, 12: 7, 13: 8, 14: 9, 16: 11, 18: 12, 20: 13, 22: 14, 24: 10,
                         28: 15, 30: 16, 32: 17, 34: 18, 36: 19, 38: 20}
        num = SOCIAL_FOLDER.get(pg[0])
        folder = next((d for d in soc_dirs if d.name.startswith('Project_%02d_' % num)), None) if num else None
        if not folder: base['notes'].append('no prepared board folder found')
        boards, mobile, missing, n = social_project(folder) if folder else ([], [], [], 0)
        name = re.sub(r'^Project_\d+_', '', folder.name).replace('_', ' ') if folder else (client or 'Untitled')
        if folder and 'Kuku' in folder.name: base['notes'].append("PDF p.5 is labelled 'ACE MOBILITY LTD' but every creative carries Kuku poultry branding (prepared-asset folder: Kuku Poultry) — confirm client")
        if folder and 'Event' in folder.name: base['notes'].append('PDF pp.38–39 carry no client label; covers show Future Islands, GIZ, EcoCollab and Inrgize Nexus events — confirm grouping/title')
        if missing: base['notes'].append('individual creatives not found locally: ' + ', '.join(missing))
        add({**base, 'id': 'social-' + norm(name), 'client': None if pg[0] == 38 else (display(client) if client and pg[0] != 5 else name),
             **({'title': 'Event & Facebook covers'} if pg[0] == 38 else {}),
             'source': rel(folder) if folder else None, 'layout': 'boards',
             'desktop': [rel(b) for b in boards], 'mobile': mobile, 'creatives': n,
             'status': 'ready' if folder and not missing else 'check'})
        continue
    if ch == 'identity':
        r = idn_by_page.get(pg[0])
        folder = IDN / f"Project_{int(r['project']):02d}_{r['name']}" if r else None
        board = folder / f"{r['name']}_Case_Study.png" if r else None
        mob = []
        if r:
            rep = json.load(open(folder / '_board_report.json', encoding='utf-8'))
            for pnl in rep['panels']:
                f = pnl.get('file')
                if f:
                    p = find_src(f)
                    mob.append(rel(p) if p else f'MISSING:{f}')
        notes = []
        if r and r['source_limitations'] not in ('-', ''): notes.append(r['source_limitations'])
        if r and r['notes'] not in ('-', '', 'approved benchmark'): notes.append(r['notes'])
        name = r['name'].replace('_', ' ').replace('A Plus', 'A+') if r else client
        extra = {}
        if pg[0] == 46: name, extra = 'Tounes El Mezyena', {'title': 'Sahtek Bin Idik'}
        elif pg[0] not in (58, 59) and client: name = display(client)
        add({**base, **extra, 'id': 'identity-' + norm(name), 'client': name, 'source': rel(folder) if folder else None, 'layout': 'board',
             'desktop': [rel(board)] if board and board.exists() else [], 'mobile': mob, 'notes': base['notes'] + notes,
             'status': 'ready' if board and board.exists() and not any(m.startswith('MISSING') for m in mob) else 'check'})
        continue
    # ---------- PDF-page based chapters (guidelines, editorial, collateral, ai): rebuild pages from originals ----------
    def page_images(n):
        imgs = []
        for s in matches[n]:
            if s.get('dist') is None or s['w'] < 60 or s['h'] < 60: continue
            ok = s['dist'] <= 40 or (n, tuple(s['rect'] or ())) in EXTRA_KEYS
            extra = EXTRA_FILES.get((n, tuple(s['rect'] or ())))
            imgs.append({'file': rel(AO / s['match']) if s['dist'] <= 40 else (extra if ok else None), 'rect': s['rect'], 'pdfImage': [s['w'], s['h']], 'dist': s['dist']})
        imgs.sort(key=lambda i: (i['rect'][1] // 40, i['rect'][0]) if i['rect'] else (0, 0))
        return imgs
    def page_entry(n):
        ims = page_images(n)
        return {'page': n, 'images': ims, 'unmatched': sum(1 for i in ims if not i['file'])}
    runs = [pg]
    named = (AI_NAMES if ch == 'ai' else ARTWORK_NAMES).get(pg[0]) if not client else None
    if named:
        client, base['title'] = named
        base['notes'].append('PDF pages unlabelled; name read from the artwork' + (' and the source file names' if ch == 'ai' else '') + ' — confirm')
    for run in runs:
        pe = [page_entry(n) for n in run]
        um = sum(p['unmatched'] for p in pe)
        e = {**base, 'pdfPages': run, 'id': f'{ch}-p{run[0]}', 'client': display(client) if client and not named else client,
             'source': 'pdf-page-originals', 'layout': 'pdf-pages', 'pages': pe,
             'status': 'missing-originals' if um else ('unlabelled' if named else 'ready')}
        if not client and not base.get('title'): e['notes'] = e['notes'] + ['no client label in the PDF — title needed']
        if um: e['notes'] = e['notes'] + [f'{um} image(s) without a high-res original — PDF-embedded copy only']
        add(e)

# ---------- 3. Samray: pages 112–120 → prepared packaging boards ----------
# The PDF pages are composites, the "Direction N all.png" files are line-ups, so hashing cannot pair them.
# Pairing verified visually: each PDF page and its prepared board share the same hero photograph.
SAMRAY_PAGE_DIRECTION = {112: 5, 113: 7, 114: 4, 115: 6, 116: 1, 117: 3, 118: 9, 119: 8, 120: 2}
for e in inventory:
    d = SAMRAY_PAGE_DIRECTION.get(e['pdfPages'][0]) if e['chapter'] == 'collateral' else None
    folder = next((f for f in samray_dirs if f'_Direction_{d}_' in f.name), None) if d else None
    if not folder: continue
    rep = json.load(open(folder / '_board_report.json', encoding='utf-8'))
    mob, miss = [], []
    for pnl in rep['panels']:
        src = Path(pnl['src'])
        if not src.exists():            # some flat-artwork renders were made in a temp folder; look for the same name next to the sources
            alt = list(next(MARWEN.glob('Samray-*/Samray')).rglob(src.name))
            src = alt[0] if alt else src
        (mob if src.exists() else miss).append(rel(src) if src.exists() else src.name)
    pretty = re.sub(r'^Project_\d+_Samray_', '', folder.name).replace('_', ' ')
    notes = [f"PDF p.{e['pdfPages'][0]} = {pretty} (visually verified: same hero photograph); client name from the prepared-asset folder — the PDF page is unlabelled"]
    if miss: notes.append('mobile sources not found locally: ' + ', '.join(miss) + ' (desktop board is complete)')
    e.update({'id': 'collateral-samray-d%d' % d, 'client': 'Samray', 'title': pretty, 'services': 'Packaging Design',
              'source': rel(folder), 'layout': 'board', 'desktop': [rel(next(folder.glob('*_Case_Study.png')))], 'mobile': mob,
              'tags': ['packaging'], 'status': 'ready' if not miss else 'check', 'notes': notes})
    e.pop('pages', None)

json.dump({'generated_from': 'MARWEN DRIDI PORTFOLIO-151026.pdf', 'chapters': [{'id': c[0], 'dividerPage': c[1], 'title': c[2], 'description': c[3]} for c in CHAPTERS], 'projects': inventory},
          open(ROOT / 'src' / 'data' / 'portfolio-inventory.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- 4. human-readable inventory ----------
L = ['# Portfolio inventory', '', 'Generated from `MARWEN DRIDI PORTFOLIO-151026.pdf` (authoritative order) and the prepared assets in `assets-original/UPWORK_*_FINAL`. Machine-readable copy: `src/data/portfolio-inventory.json`.', '',
     '| Status | Meaning |', '|---|---|', '| ready | all visuals available at high resolution |', '| check | prepared asset exists but something needs confirmation (see notes) |',
     '| unlabelled | visuals ready; the PDF page has no client label — title needed |', '| missing-originals | at least one image only exists as the PDF-embedded (low-res) copy |', '']
for c in CHAPTERS:
    items = [e for e in inventory if e['chapter'] == c[0]]
    L += [f"## {c[2]} (divider p.{c[1]}) — {len(items)} projects", '', '| # | PDF pages | Project | Country | Services | Source | Desktop visuals | Mobile visuals | Status | Notes |', '|---|---|---|---|---|---|---|---|---|---|']
    for e in items:
        pages_s = f"{e['pdfPages'][0]}" + (f"–{e['pdfPages'][-1]}" if len(e['pdfPages']) > 1 else '')
        name = (e.get('client') or '—') + (f" — {e['title']}" if e.get('title') else '')
        if e['layout'] == 'pdf-pages':
            dv = sum(len(p['images']) for p in e['pages']); mv = dv
            src = 'PDF page layout rebuilt from originals'
        else:
            dv = len(e['desktop']); mv = len(e['mobile']); src = '`' + (e['source'] or '').split('/')[-1] + '`'
        L.append(f"| {e['order']} | {pages_s} | {name} | {e.get('country') or '—'} | {e.get('services') or '—'} | {src} | {dv} | {mv} | {e['status']} | {'; '.join(e['notes']) or '—'} |")
    L.append('')
L += ['## Ordered files per project', '']
for e in inventory:
    L.append(f"### {e['order']:02d}. {(e.get('client') or 'Unlabelled')}{' — ' + e['title'] if e.get('title') else ''} (p.{', '.join(map(str, e['pdfPages']))})")
    if e['layout'] == 'pdf-pages':
        for p in e['pages']:
            L.append(f"- p.{p['page']}: " + ', '.join((f"`{i['file'].split('/')[-1]}`" if i['file'] else f"**PDF-only {i['pdfImage'][0]}×{i['pdfImage'][1]}**") for i in p['images']))
    else:
        L.append('- desktop: ' + ', '.join(f"`{d.split('/')[-1]}`" for d in e['desktop']))
        L.append('- mobile: ' + ', '.join(f"`{str(m).split('/')[-1].split(chr(92))[-1]}`" for m in e['mobile']))
    L.append('')
open(ROOT / 'PORTFOLIO-INVENTORY.md', 'w', encoding='utf-8').write('\n'.join(L))
from collections import Counter
print('projects:', len(inventory), dict(Counter(e['chapter'] for e in inventory)))
print('status:', dict(Counter(e['status'] for e in inventory)))
