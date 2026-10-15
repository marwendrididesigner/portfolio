# Refine the waypoint route onto the original ribbon's measured centre line.
import sys, json
import numpy as np, cv2
from PIL import Image

src, d = sys.argv[1], sys.argv[2]
rgba = np.array(Image.open(src).convert('RGBA')).astype(np.int32)
H, W = rgba.shape[:2]
r, g, b, a = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
blue = (a > 40) & (b > r + 60) & (b > 120)
bm = cv2.morphologyEx(blue.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
dt = cv2.distanceTransform(bm, cv2.DIST_L2, 5)
A = np.array(json.load(open(f'{d}/ribbon-waypoints.json')), float)

# densify the waypoint route (Catmull-Rom through anchors) every 3 px
def catmull(P, n_per):
    P = np.vstack([P[0], P, P[-1]]); out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        seglen = np.linalg.norm(p2 - p1); n = max(2, int(seglen / n_per))
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2]); return np.array(out)

route = catmull(A, 3)
snapped = []; hits = 0
for i, p in enumerate(route):
    j0, j1 = max(0, i - 2), min(len(route) - 1, i + 2)
    t = route[j1] - route[j0]; t /= (np.linalg.norm(t) + 1e-9); n = np.array([-t[1], t[0]])
    prof = []
    for s in np.arange(-10, 10.01, 0.5):
        q = p + n * s; x, y = int(round(q[0])), int(round(q[1]))
        prof.append(dt[y, x] if 0 <= x < W and 0 <= y < H else 0)
    prof = np.array(prof); ss = np.arange(-10, 10.01, 0.5)
    # ridge = local maxima with dt >= 3; choose the one nearest the route
    cand = [k for k in range(1, len(prof) - 1) if prof[k] >= 3 and prof[k] >= prof[k - 1] and prof[k] >= prof[k + 1]]
    if cand:
        k = min(cand, key=lambda k: abs(ss[k]))
        # centre of the plateau around k
        lo = k; hi = k
        while lo > 0 and prof[lo - 1] >= prof[k] - 0.6: lo -= 1
        while hi < len(prof) - 1 and prof[hi + 1] >= prof[k] - 0.6: hi += 1
        snapped.append(p + n * (ss[lo] + ss[hi]) / 2); hits += 1
    else:
        snapped.append(p)                       # hidden behind a letter: keep the route
snapped = np.array(snapped)
print('route samples', len(route), 'snapped to visible ribbon', hits)

# smooth (Gaussian along the curve) and resample every 6 px
def gsmooth(P, sigma):
    k = int(3 * sigma); x = np.arange(-k, k + 1); w = np.exp(-x * x / (2 * sigma * sigma)); w /= w.sum()
    pad = np.vstack([np.repeat(P[:1], k, 0), P, np.repeat(P[-1:], k, 0)])
    return np.stack([np.convolve(pad[:, 0], w, 'valid'), np.convolve(pad[:, 1], w, 'valid')], 1)
sm = gsmooth(snapped, 4)
seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(sm, axis=0), axis=1))]
L = np.arange(0, seg[-1], 6)
res = np.stack([np.interp(L, seg, sm[:, 0]), np.interp(L, seg, sm[:, 1])], 1)
res = np.vstack([res, sm[-1]]); res[0] = sm[0]

vals = [dt[int(round(y)), int(round(x))] for x, y in res if 0 <= int(round(x)) < W and 0 <= int(round(y)) < H and dt[int(round(y)), int(round(x))] > 3]
width = 2 * float(np.percentile(vals, 50)) + 0.5
print('stroke width (2 x median ridge distance + AA):', round(width, 2))

mask = np.zeros((H, W), np.uint8)
cv2.polylines(mask, [np.round(res * 8).astype(np.int32)], False, 255, thickness=int(round(width)), lineType=cv2.LINE_AA, shift=3)
drawn = mask > 127
core = (a > 200) & (b > r + 80)
print('coverage of original ribbon core: %.2f%%' % (100 * (drawn & core).sum() / core.sum()))
cream = (a > 200) & (r > 200) & (g > 190)
print('traced stroke on background where original has no ribbon: %.2f%%' % (100 * (drawn & ~blue & ~cream).sum() / drawn.sum()))
json.dump({'w': W, 'h': H, 'width': width, 'points': res.round(2).tolist()}, open(f'{d}/ribbon_fit.json', 'w'))

# overlay check: original vs fitted (red) at 1:1, two crops
base = np.zeros((H, W, 3), np.uint8); base[:] = (4, 6, 30)
al = a[..., None] / 255.0
base = (base * (1 - al) + rgba[..., :3] * al).astype(np.uint8)
ov = base.copy()
edge = cv2.Canny(mask, 50, 150) > 0
ov[edge] = (255, 40, 40)
Image.fromarray(ov).save(f'{d}/fit_overlay.png')
