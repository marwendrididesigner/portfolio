# Produces the per-project source images the website uses, and records them in the inventory.
#
#   python scripts/inventory/render_sources.py <scratch-audit-dir>
#
#  * PDF-layout projects (guidelines, editorial, collateral, AI): each PDF page is re-rendered from an
#    in-memory copy in which every embedded (downsampled) image is replaced by its high-resolution
#    original — exact InDesign layout, sharp artwork. The page's "Country / Client / Services" caption is
#    removed (the website shows it in the project header). Pages that are a single full-page image use
#    that original file directly. Mobile = the page's individual images in reading order.
#  * Prepared boards (identity, Samray): mobile = each panel of the board cut out at its exact panel box
#    (logos keep their prepared background and clear space; nothing inside a panel is cropped).
#  * Social: unchanged (boards + original creatives from the manifests).
# Nothing is written over the PDF or the originals; outputs go to .cache/portfolio-src/ (git-ignored).
import sys, io, json, re
from pathlib import Path
import pymupdf
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[2]
AO = ROOT / 'assets-original'
CACHE = ROOT / '.cache' / 'portfolio-src'
INV = ROOT / 'src' / 'data' / 'portfolio-inventory.json'
PDF = ROOT / 'MARWEN DRIDI PORTFOLIO-151026.pdf'
audit = Path(sys.argv[1])
matches = {int(k): v for k, v in json.load(open(audit / 'page_matches.json', encoding='utf-8')).items()}
inv = json.load(open(INV, encoding='utf-8'))
doc = pymupdf.open(PDF)
DESKTOP_W = 2400
import os
rel = lambda p: Path(os.path.relpath(Path(p).resolve(), ROOT)).as_posix()
# extra originals found outside assets-original (see extra-originals.json)
EXTRA = {(x['page'], tuple(x['rect'])): ROOT / x['file'] for x in json.load(open(Path(__file__).with_name('extra-originals.json'), encoding='utf-8'))['images']}
def original_for(n, m):
    if m.get('dist') is not None and m['dist'] <= 40: return AO / m['match']
    return EXTRA.get((n, tuple(m['rect'])))

def original_stream(path, max_edge=3200):
    im = Image.open(path)
    im.load()
    if max(im.size) > max_edge: im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    buf = io.BytesIO()
    if im.mode in ('RGBA', 'LA', 'P'):
        im.convert('RGBA').save(buf, 'PNG', optimize=False)
    else:
        im.convert('RGB').save(buf, 'JPEG', quality=94)
    return buf.getvalue()

def extract_embedded(src_page, xref, out):
    pix = pymupdf.Pixmap(doc, xref)
    smask = next((i[1] for i in src_page.get_images(full=True) if i[0] == xref), 0)
    if smask: pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, smask))
    if pix.n - pix.alpha >= 4: pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    pix.save(out)
    return out

def render_page(n, outdir, idx):
    src = doc[n - 1]
    area = src.rect.width * src.rect.height
    imgs = [m for m in matches[n] if m.get('rect') and m.get('w', 0) >= 60 and m.get('h', 0) >= 60]
    text = src.get_text().strip()
    labels_only = all(w in ('Country', 'Client', 'Services') or True for w in text.split())  # pages carry only caption text
    # reading order for mobile
    order = sorted(imgs, key=lambda m: (round(m['rect'][1] / 40), m['rect'][0]))
    mobile = []
    for k, m in enumerate(order):
        o = original_for(n, m)
        if o:
            mobile.append(rel(o))
        else:
            mobile.append(rel(extract_embedded(src, m['xref'], outdir / f'p{n}-img{k + 1}.png')))
    # single full-page image → use it directly
    full = [m for m in imgs if (m['rect'][2] - m['rect'][0]) * (m['rect'][3] - m['rect'][1]) >= 0.97 * area]
    if len(imgs) == 1 and full and not any(w in text for w in ('Country', 'Client', 'Services')):
        return mobile[0], mobile, 'full-image'
    # composite: copy page, swap images for originals, remove caption, render
    tmp = pymupdf.open(); tmp.insert_pdf(doc, from_page=n - 1, to_page=n - 1); pg = tmp[0]
    swapped, kept = 0, 0
    for info in pg.get_images(full=True):
        xref = info[0]
        rects = pg.get_image_rects(xref)
        if not rects: continue
        r = rects[0]
        m = next((m for m in imgs if abs(m['rect'][0] - r.x0) < 2 and abs(m['rect'][1] - r.y0) < 2 and abs(m['rect'][2] - r.x1) < 2 and abs(m['rect'][3] - r.y1) < 2), None)
        o = original_for(n, m) if m else None
        if o:
            pg.replace_image(xref, stream=original_stream(o))
            swapped += 1
        else:
            kept += 1
    # caption: all live text on these pages is the Country/Client/Services caption
    words = pg.get_text('words')
    if words:
        cap = pymupdf.Rect(min(w[0] for w in words), min(w[1] for w in words), max(w[2] for w in words), max(w[3] for w in words))
        cap = cap + (-8, -8, 8, 8)
        pg.add_redact_annot(cap)
        pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)
        for dwg in pg.get_drawings():   # thin caption separators left at the edge of the caption box
            rr = dwg['rect']
            if (rr.width < 2 or rr.height < 2) and rr.intersects(cap + (-12, -12, 12, 12)):
                pg.add_redact_annot(rr + (-1, -1, 1, 1))
        pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
    # content box = images (clipped to page) + remaining coloured shapes that are not the page background
    box = None
    for info in pg.get_images(full=True):
        for r in pg.get_image_rects(info[0]):
            r = r & pg.rect
            if r.is_empty or r.width < 30 or r.height < 30: continue
            box = r if box is None else box | r
    for dwg in pg.get_drawings():
        r = dwg['rect'] & pg.rect
        if r.is_empty or r.width * r.height >= 0.9 * area or (r.width < 3 or r.height < 3): continue
        if dwg.get('fill') and min(dwg['fill']) > 0.95: continue        # white/near-white plates
        box = r if box is None else box | r
    clip = (box + (-18, -18, 18, 18)) & pg.rect if box else pg.rect
    zoom = DESKTOP_W / clip.width
    pix = pg.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=False)
    out = outdir / f'd-p{n}.png'
    pix.save(out)
    return rel(out), mobile, f'composite ({swapped} originals swapped in, {kept} embedded kept)'

def crop_panels(board, report, outdir):
    im = Image.open(board)
    rep = json.load(open(report, encoding='utf-8'))
    out = []
    for k, p in enumerate(rep['panels']):
        x0, y0, x1, y1 = p['box']
        if p.get('role') == 'palette': continue      # 150 px swatch strip: unreadable on its own on a phone
        f = outdir / f'panel-{k + 1:02d}.png'
        im.crop((x0, y0, x1, y1)).convert('RGB').save(f)
        out.append(rel(f))
    return out

log = []
for e in inv['projects']:
    folder = CACHE / f"{e['order']:03d}-{e['id']}"
    if e['layout'] == 'pdf-pages':
        folder.mkdir(parents=True, exist_ok=True)
        desk, mob, how = [], [], []
        for n in e['pdfPages']:
            d, m, kind = render_page(n, folder, len(desk))
            desk.append(d); mob += m; how.append(f'p.{n}: {kind}')
        e['desktop'], e['mobile'] = desk, mob
        e['render'] = how
        log.append(f"{e['order']:03d} {e.get('client') or e.get('title')}: " + '; '.join(how))
    elif e['layout'] == 'board' and e['chapter'] in ('identity', 'collateral'):
        folder.mkdir(parents=True, exist_ok=True)
        src = ROOT / e['source']
        board = ROOT / e['desktop'][0]
        e['mobile'] = crop_panels(board, src / '_board_report.json', folder)
        log.append(f"{e['order']:03d} {e['client']}: board + {len(e['mobile'])} panels")
json.dump(inv, open(INV, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
(ROOT / '.cache' / 'render-log.txt').write_text('\n'.join(log), encoding='utf-8')
print('\n'.join(log[-12:])); print('projects processed:', len(log))
