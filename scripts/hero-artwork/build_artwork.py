# Build the final hero artwork assets from the original "Portfolio" lockup:
#   1. ribbon.ts      — ONE continuous SVG path: smooth left extension + traced original ribbon + smooth right extension
#   2. letters master — the cream lettering with the ribbon removed (fill restored where the ribbon crossed in front)
#   3. over mask      — where the original ribbon passes IN FRONT of a letter (weave), limited to letter shapes
import sys, json
import numpy as np, cv2
from PIL import Image

src, d, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
fit = json.load(open(f'{d}/ribbon_fit.json'))
P = np.array(fit['points'])

# resample the traced centre line every 16 units (loops have radius >= ~45, so this is ample)
seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
L = np.arange(0, seg[-1], 16)
core = np.stack([np.interp(L, seg, P[:, 0]), np.interp(L, seg, P[:, 1])], 1)
core = np.vstack([core, P[-1]])

# Extensions. The original tails carry small decorative curls right at the artwork edges; a straight
# continuation from there reads as a bump. So the traced path starts at the left tail's low point
# (x≈290, its natural trough) and a single long, gentle arc runs from there to the left viewport edge;
# on the right, the original tail's rise continues into one smooth, flattening curve.
trough = int(np.argmax(np.where((core[:, 0] > 200) & (core[:, 0] < 360) & (np.arange(len(core)) < len(core) // 4), core[:, 1], -1)))
core = core[trough:]
x0, y0 = core[0]
left = [(x0 - 260, y0 - 8), (x0 - 620, y0 - 34), (x0 - 1100, y0 - 52), (x0 - 1700, y0 - 50), (x0 - 2500, y0 - 40), (x0 - 3600, y0 - 36), (-6500, y0 - 36)]
# Right: the original tail flattens in its last ~30 units at the artwork edge (invisible there, but a kink
# once continued). Cut at x≈1860 where the rise is steady, then let the slope decay linearly to 0.
cut = int(np.max(np.where(core[:, 0] <= 1860)[0]))
core = core[:cut + 1]
x1, y1 = core[-1]
m = (core[-1][1] - core[-5][1]) / (core[-1][0] - core[-5][0])
right, y, span = [], y1, 300.0
for dx in np.arange(60, span + 1, 60):
    y += m * (1 - (dx - 30) / span) * 60
    right.append((x1 + dx, y))
right += [(x1 + span + 1500, y), (8500, y)]
print('right tail: cut at', round(x1, 1), round(y1, 1), 'slope', round(m, 3), '-> flattens at y', round(y, 1))
pts = np.vstack([np.array(left[::-1], float), core, np.array(right, float)])

# Chord-length (non-uniform) Catmull–Rom → cubic Bézier: tangents are scaled by the real segment
# lengths, so uneven point spacing can never fold the curve back on itself. C1-continuous throughout.
def controls(Q):
    n = len(Q); T = np.zeros_like(Q)
    d = np.linalg.norm(np.diff(Q, axis=0), axis=1)
    for i in range(n):
        if i == 0: T[i] = (Q[1] - Q[0]) / d[0]
        elif i == n - 1: T[i] = (Q[-1] - Q[-2]) / d[-1]
        else: T[i] = (Q[i + 1] - Q[i - 1]) / (d[i - 1] + d[i])
    return [(Q[i], Q[i] + T[i] * d[i] / 3, Q[i + 1] - T[i + 1] * d[i] / 3, Q[i + 1]) for i in range(n - 1)]
def to_path(Q):
    segs = controls(Q)
    parts = [f'M{segs[0][0][0]:.1f} {segs[0][0][1]:.1f}']
    for p1, c1, c2, p2 in segs:
        parts.append(f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}')
    return ''.join(parts)
path = to_path(pts)
width = 12.5
print('path segments', len(pts) - 1, 'chars', len(path))

# verify the Bézier path against the original ribbon (render the path, measure coverage)
rgba = np.array(Image.open(src).convert('RGBA')).astype(np.int32)
H, W = rgba.shape[:2]
r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
blue = (a > 40) & (b > r + 60) & (b > 120)
coreb = (a > 200) & (b > r + 80)
cream = (a > 200) & (r > 200) & (g > 190)
def bez_points(Q, n=12):
    out = []
    for p1, c1, c2, p2 in controls(Q):
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append((1 - t) ** 3 * p1 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t * t * c2 + t ** 3 * p2)
    return np.array(out)
bp = bez_points(pts)
mask = np.zeros((H, W), np.uint8)
cv2.polylines(mask, [np.round(bp * 8).astype(np.int32)], False, 255, thickness=int(round(width)), lineType=cv2.LINE_AA, shift=3)
drawn = mask > 127
print('Bezier path covers %.2f%% of the original ribbon core' % (100 * (drawn & coreb).sum() / coreb.sum()))
print('path pixels on background where the original has no ribbon: %.2f%%' % (100 * (drawn & ~blue & ~cream).sum() / drawn.sum()))

# ---------- letters layer + weave mask (decided per letter crossing) ----------
creamcol = np.median(rgba[cream][:, :3], axis=0).astype(int)
rib = cv2.dilate(blue.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
out = rgba.copy()
bluecol = np.array([67, 158, 218], float)
cvec = creamcol.astype(float) - bluecol
k = np.clip(((rgba[..., :3].astype(float) - bluecol) @ cvec) / (cvec @ cvec), 0, 1)
touched = rib & ~cream
out[touched, :3] = creamcol
out[touched, 3] = np.round(k[touched] * a[touched]).astype(np.int32)   # unmixed letter coverage

# letter shapes with the ribbon gaps closed (only used to decide inside/outside along the path)
letter0 = (out[..., 3] > 128).astype(np.uint8)
closed = cv2.morphologyEx(letter0, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))).astype(bool)

# walk the path; split into runs inside letters; each run is OVER if the original shows the ribbon there
inside = np.array([0 <= int(y) < H and 0 <= int(x) < W and closed[int(y), int(x)] for x, y in bp])
vis = np.array([0 <= int(y) < H and 0 <= int(x) < W and blue[int(y), int(x)] for x, y in bp])
runs = []; i = 0
while i < len(bp):
    if inside[i]:
        j = i
        while j < len(bp) and inside[j]: j += 1
        runs.append((i, j, float(vis[i:j].mean()))); i = j
    else: i += 1
over_runs = [(i, j) for i, j, f in runs if f > 0.5 and j - i > 3]
print('letter crossings along the path:', len(runs), '| in front:', len(over_runs), '| behind:', len(runs) - len(over_runs))
overStroke = np.zeros((H, W), np.uint8)
for i, j in over_runs:
    seg_ = bp[max(0, i - 4):min(len(bp), j + 4)]
    cv2.polylines(overStroke, [np.round(seg_ * 8).astype(np.int32)], False, 255, thickness=int(width + 8), lineType=cv2.LINE_AA, shift=3)
ov = overStroke > 0

# restore letter fill under the in-front crossings (hidden by the ribbon in the final render anyway)
restore = ov & closed
out[restore, :3] = creamcol; out[restore, 3] = 255
Image.fromarray(out.astype(np.uint8), 'RGBA').save(f'{outdir}/wordmark-letters.png')

# weave mask = in-front crossing corridors × letter coverage → mask edges coincide with letter edges
# Binary mask over a slightly grown letter shape: the over/under switch then happens just outside the
# letter edge, where both copies of the ribbon are identical — no alpha-compounding seam.
grown = cv2.dilate((out[..., 3] > 0).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool)
om = np.where(ov & grown, 255, 0).astype(np.uint8)
Image.fromarray(om, 'L').save(f'{outdir}/ribbon-over-mask.png', optimize=True)

ts = f"""// GENERATED by the hero-artwork build step (see README › Hero artwork). Do not edit by hand.
// One continuous ribbon path in the coordinate space of the original "Portfolio" artwork
// (assets-original/Portfolio_Exact_Design_Blue_Line.png, {W}×{H}). The central part is traced
// from the original ribbon's centre line from its left-tail trough (x≈290) onward; only the small curl at
// the far-left tail is replaced. Both ends flow out of the
// original tails as single long, gentle arcs to x = {left[-1][0]} and x = {right[-1][0]}, so the line
// always reaches the viewport edges.
export const ribbon = {{
  viewBox: '0 0 {W} {H}',
  width: {W},
  height: {H},
  strokeWidth: {width},
  color: '#439EDA',
  d: '{path}',
}};
"""
open(f'{outdir}/ribbon.ts', 'w', encoding='utf-8').write(ts)
