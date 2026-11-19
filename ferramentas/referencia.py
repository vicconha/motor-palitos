"""Analisa vídeos de referência: 60 quadros, câmera/cortes, cores e transcrição da legenda.
Uso: python3 -I ferramentas/referencia.py <saida_dir> <video1.mp4> [video2.mp4 ...]
Saída: quadros/video_XX_60_quadros.png, por_segundo.csv, cortes.csv, transcricao_XX.txt, duracoes.json
"""
import sys, os, re, json, math, subprocess, tempfile
import cv2, numpy as np, pandas as pd

FPS_AN, W, H = 10, 180, 320          # quadros/s analisados e resolução de análise
LEG = (0.62, 0.78)                   # faixa vertical da legenda (fração da altura)
ZOOM_THR, PAN_THR, EV_THR = 2.0, 4.0, 0.5
OCR_LANG = os.environ.get("OCR_LANG", "eng")   # "por" para vídeos com legenda em português

def ler(path, fps):
    cap = cv2.VideoCapture(path); vf = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); step = vf / fps
    fr, ts, i, nxt = [], [], 0, 0.0
    while True:
        ok, f = cap.read()
        if not ok: break
        if i >= nxt - 1e-6: fr.append(f); ts.append(i / vf); nxt += step
        i += 1
    cap.release(); return fr, ts, n / vf

def folha60(path, dur, out, titulo):
    cap = cv2.VideoCapture(path); tw, th = 120, 213
    sh = np.zeros((6 * th + 40, 10 * tw, 3), np.uint8)
    cv2.putText(sh, titulo[:60], (6, 28), cv2.FONT_HERSHEY_SIMPLEX, .7, (255, 255, 255), 2, cv2.LINE_AA)
    for k in range(60):
        t = (k + .5) * dur / 60; cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
        if not ok: continue
        f = cv2.resize(f, (tw, th)); cv2.rectangle(f, (0, 0), (52, 18), (0, 0, 0), -1)
        cv2.putText(f, f"{t:.1f}s", (3, 14), cv2.FONT_HERSHEY_SIMPLEX, .45, (0, 255, 255), 1, cv2.LINE_AA)
        r, c = divmod(k, 10); sh[40 + r * th:40 + (r + 1) * th, c * tw:(c + 1) * tw] = f
    cap.release(); cv2.imwrite(out, sh)

def hist(s):
    h = cv2.calcHist([cv2.cvtColor(s, cv2.COLOR_BGR2HSV)], [0, 1, 2], None, [16, 8, 8], [0, 180, 0, 256, 0, 256])
    return cv2.normalize(h, h).flatten().astype(np.float32)
corr = lambda a, b: float(np.corrcoef(a.ravel(), b.ravel())[0, 1])
hd = lambda a, b: cv2.compareHist(a, b, cv2.HISTCMP_BHATTACHARYYA)

def eventos(sm, g, h, ts, S=3):
    """Mudanças de plano: 'Corte seco' (troca em 1 quadro) ou 'Transição' (fusão/movimento rápido)."""
    n = len(g); D = np.zeros(n); d1 = np.zeros(n)
    for i in range(1, n):
        j = max(0, i - S)
        D[i] = max(1 - corr(g[j], g[i]), hd(h[j], h[i]) * 1.4)
        d1[i] = max(1 - corr(g[i - 1], g[i]), hd(h[i - 1], h[i]) * 1.4)
    ev, i = [], 1
    while i < n:
        if D[i] > EV_THR:
            k = i
            while k + 1 < n and D[k + 1] > EV_THR: k += 1
            a, b = max(0, i - S - 1), min(n - 1, k + 1)
            if max(1 - corr(g[a], g[b]), hd(h[a], h[b]) * 1.4) > EV_THR:
                lo = max(1, i - S); st = d1[lo:k + 2]; pk = lo + int(np.argmax(st))
                viz = [d1[j] for j in (pk - 1, pk + 1) if 1 <= j < n]
                ev.append((round(ts[pk], 1), "Corte seco" if st.max() > .45 and all(x < .25 for x in viz) else "Transição"))
            i = k + 1
        else: i += 1
    return ev

def movimento(a, b, mask):
    p0 = cv2.goodFeaturesToTrack(a, 300, .01, 6, mask=mask)
    if p0 is None or len(p0) < 12: return None
    p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None, winSize=(21, 21), maxLevel=3); ok = st.ravel() == 1
    if ok.sum() < 12: return None
    M, inl = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if M is None or inl is None or inl.sum() < 10: return None
    cx, cy = W / 2, H / 2
    return (math.hypot(M[0, 0], M[1, 0]), (M[0, 0] * cx + M[0, 1] * cy + M[0, 2] - cx) / W * 100,
            (M[1, 0] * cx + M[1, 1] * cy + M[1, 2] - cy) / H * 100)

def camera_cores(vid, path, out):
    fr, ts, dur = ler(path, FPS_AN)
    folha60(path, dur, f"{out}/quadros/video_{vid:02d}_60_quadros.png", f"Video {vid} - {os.path.basename(path)}")
    y0, y1 = int(H * LEG[0]), int(H * LEG[1])
    mask = np.full((H, W), 255, np.uint8); mask[y0:y1] = 0
    sm, g, gb, h, cores = [], [], [], [], []
    for f in fr:
        s = cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA); sm.append(s)
        x = cv2.cvtColor(s, cv2.COLOR_BGR2GRAY); g.append(x)
        xb = x.astype(float); xb[y0:y1] = xb.mean(); gb.append(cv2.GaussianBlur(xb, (5, 5), 0)); h.append(hist(s))
        Y = cv2.cvtColor(s, cv2.COLOR_BGR2YCrCb)[:, :, 0].astype(float); hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
        cores.append((Y.mean() / 2.55, Y.std() / 1.275, hsv[:, :, 1].mean() / 2.55,
                      (s[:, :, 2].astype(float).mean() - s[:, :, 0].astype(float).mean()) / 2.55))
    ev = eventos(sm, gb, h, ts)
    pares = [(ts[i], None if any(abs(ts[i] - t) <= .35 for t, _ in ev) else movimento(g[i - 1], g[i], mask))
             for i in range(1, len(fr))]
    linhas = []
    for sec in range(int(math.ceil(dur))):
        v = [m for t, m in pares if sec <= t < sec + 1 and m]
        zoom = (np.prod([m[0] for m in v]) - 1) * 100 if v else 0.0
        dx, dy = sum(m[1] for m in v), sum(m[2] for m in v)
        cs = [c for t, c in zip(ts, cores) if sec <= t < sec + 1]; cs = np.mean(cs, axis=0) if cs else [np.nan] * 4
        evs = [tp for t, tp in ev if sec <= t < sec + 1]; tipos = []
        if evs: tipos.append("CORTE SECO" if "Corte seco" in evs else "TRANSIÇÃO")
        if zoom >= ZOOM_THR: tipos.append("Aproximação")
        elif zoom <= -ZOOM_THR: tipos.append("Afastamento")
        if abs(dx) >= PAN_THR: tipos.append("Panorâmica → (dir.)" if dx < 0 else "Panorâmica ← (esq.)")
        if abs(dy) >= PAN_THR: tipos.append("Sobe ↑" if dy > 0 else "Desce ↓")
        linhas.append(dict(video=vid, segundo=sec, movimento=" + ".join(tipos) or "Parada / quase parada",
                           mudancas=len(evs), zoom_pct=round(zoom, 1), pan_x_pct=round(-dx, 1), pan_y_pct=round(dy, 1),
                           brilho=round(cs[0], 1), contraste=round(cs[1], 1), saturacao=round(cs[2], 1),
                           temperatura=round(cs[3], 1)))
    return linhas, [dict(video=vid, tempo_s=t, tipo=tp) for t, tp in ev], dur

def binariza(band):
    b = cv2.resize(band, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC); hsv = cv2.cvtColor(b, cv2.COLOR_BGR2HSV)
    white = ((hsv[:, :, 2] > 215) & (hsv[:, :, 1] < 40)).astype(np.uint8) * 255
    dark = (hsv[:, :, 2] < 60).astype(np.uint8) * 255
    n, lab, st, _ = cv2.connectedComponentsWithStats(white); keep = np.zeros_like(white)
    for i in range(1, n):
        x, y, ww, hh, a = st[i]
        if a < 25 or not (15 <= hh <= 70) or ww > 120: continue
        comp = lab == i; borda = cv2.dilate(comp.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~comp
        if borda.sum() and dark[borda].mean() > .10 * 255: keep[comp] = 255   # letra branca com contorno preto
    return None if keep.sum() == 0 else 255 - keep

def transcrever(path, fps=15):
    fr, ts, _ = ler(path, fps); grupos, prev = [], None
    for t, f in zip(ts, fr):
        hh = f.shape[0]; bi = binariza(f[int(hh * LEG[0]):int(hh * LEG[1]), int(f.shape[1] * .05):int(f.shape[1] * .95)])
        if bi is None: prev = None; continue
        if prev is not None and prev.shape == bi.shape and np.mean(prev != bi) < .01: continue
        grupos.append((t, bi)); prev = bi
    d = tempfile.mkdtemp(); pal = []
    for k, (t, im) in enumerate(grupos):
        p = f"{d}/{k}.png"; cv2.imwrite(p, im)
        tx = subprocess.run(["tesseract", p, "-", "--psm", "7", "-l", OCR_LANG], capture_output=True, text=True).stdout
        tx = re.sub(r"[^A-Za-zÀ-ÿ0-9,.!?'’\-$%& ]", "", tx).strip()
        if tx and not (pal and pal[-1][1].lower() == tx.lower()): pal.append((round(t, 2), tx))
    return pal

if __name__ == "__main__":
    out, vids = sys.argv[1], sys.argv[2:]; os.makedirs(f"{out}/quadros", exist_ok=True)
    todas, cortes, durs = [], [], {}
    for vid, path in enumerate(vids, 1):
        l, c, d = camera_cores(vid, path, out); todas += l; cortes += c; durs[vid] = d
        pal = transcrever(path)
        with open(f"{out}/transcricao_{vid:02d}.txt", "w") as fh:
            fh.write(f"# Video {vid} - {path}\n" + " ".join(w for _, w in pal) + "\n\n" + "".join(f"{t}\t{w}\n" for t, w in pal))
        print(vid, os.path.basename(path), f"{d:.1f}s", len(c), "mudanças,", len(pal), "trechos de legenda", flush=True)
    pd.DataFrame(todas).to_csv(f"{out}/por_segundo.csv", index=False)
    pd.DataFrame(cortes).to_csv(f"{out}/cortes.csv", index=False)
    json.dump(durs, open(f"{out}/duracoes.json", "w"))
