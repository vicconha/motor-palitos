"""som.py — trilha + efeitos sintetizados e mixagem com a voz (a voz nunca é alterada).
Uso: python3 ferramentas/som.py <projeto>
Na receita.json:
  "som": {"musica": "comica" | "suspense" | "epica" | "leve" | "nenhuma", "efeitos": true | false,
          "extras": [{"frase": 3, "tipo": "ting"}, {"segundo": 12.4, "tipo": "explosao"}]}
Efeitos automáticos: whoosh na troca de plano, baque no fx "tremor", sting + a música para no plano com "virada": true.
Tipos de efeito: whoosh, baque, ting, explosao, sting, pop.
Níveis: música a 50% do RMS da voz (−6 dB); efeitos ≤ 50% e picos ≤ 0,7× o pico da voz. Final ~−14 LUFS, pico −1 dBFS.
Saída: <projeto>/work/mix.wav (48 kHz estéreo).
"""
import sys, os, json, glob, subprocess
import numpy as np

SR = 48000
rng = np.random.default_rng(3)

def ler_voz(pj):
    voz = glob.glob(os.path.join(pj, "voz.*"))[0]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", voz, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def rms_gate(x, lim=-40):
    b = 2400; n = len(x) // b
    if n == 0: return np.sqrt(np.mean(x ** 2) + 1e-12)
    r = np.sqrt(np.mean(x[: n * b].reshape(n, b) ** 2, axis=1) + 1e-12)
    r = r[20 * np.log10(r) > lim]
    return np.sqrt(np.mean(r ** 2)) if len(r) else 1e-6

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d); return e

def tom(f, dur, forma="sen", a=0.005, d=0.3):
    t = np.arange(int(dur * SR)) / SR
    if forma == "sen": w = np.sin(2 * np.pi * f * t)
    elif forma == "tri": w = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    else: w = 2 * ((f * t) % 1) - 1
    return w * env(len(t), a, d)

def ruido(dur): return rng.standard_normal(int(dur * SR))

def passa_baixa(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def lp_rapido(x, fc):   # passa-baixa via FFT (rápido para sinais longos)
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X[fr > fc] *= np.exp(-(fr[fr > fc] - fc) / (fc * 0.5)); return np.fft.irfft(X, len(x))

def mx(*sinais):   # soma sinais de tamanhos diferentes
    out = np.zeros(max(len(x) for x in sinais))
    for x in sinais: out[: len(x)] += x
    return out

def poe(dst, src, t):
    i = int(t * SR); j = min(len(dst), i + len(src))
    if 0 <= i < len(dst): dst[i:j] += src[: j - i]

NOTA = lambda m: 440 * 2 ** ((m - 69) / 12)

def musica(estilo, dur, para_em=None):
    m = np.zeros(int(dur * SR) + SR)
    fim = para_em if para_em else dur
    if estilo == "comica":
        bpm = 118; bt = 60 / bpm; acordes = [48, 43, 45, 41]
        k = 0; t = 0.0
        while t < fim:
            ac = acordes[(k // 4) % 4]
            poe(m, mx(tom(55, 0.25, d=0.08) * 0.9, lp_rapido(ruido(0.05), 200) * 0.3), t)            # bumbo
            if k % 2: poe(m, lp_rapido(ruido(0.12), 4000) * env(int(0.12 * SR), d=0.05) * 0.35, t)  # caixa
            poe(m, tom(NOTA(ac - 12 + (7 if k % 2 else 0)), bt * 0.9, "tri", d=0.18) * 0.45, t)      # baixo dedilhado
            if k % 4 == 0:
                for n in (0, 4, 7): poe(m, lp_rapido(tom(NOTA(ac + 12 + n), bt * 1.8, "saw", a=0.03, d=0.6), 1800) * 0.08, t)   # metais
            t += bt; k += 1
    elif estilo == "suspense":
        t = np.arange(int(fim * SR)) / SR
        m[: len(t)] += np.sin(2 * np.pi * 55 * t) * 0.25 + np.sin(2 * np.pi * 82.4 * t) * 0.12 * (0.6 + 0.4 * np.sin(t * 0.7))
        b = 0.0
        while b < fim:
            poe(m, tom(48, 0.18, d=0.06) * 0.7, b); poe(m, tom(48, 0.18, d=0.06) * 0.45, b + 0.22); b += 1.1
        tr = np.arange(int(fim * SR)) / SR
        m[: len(tr)] += np.sin(2 * np.pi * 880 * tr) * 0.02 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tr))
    elif estilo == "epica":
        bt = 60 / 92; t = 0.0; k = 0; acordes = [45, 41, 48, 43]
        while t < fim:
            if k % 2 == 0: poe(m, lp_rapido(tom(60, 0.6, d=0.25) + ruido(0.6) * env(int(0.6 * SR), d=0.05) * 0.4, 400) * 0.9, t)   # taiko
            if k % 4 == 0:
                ac = acordes[(k // 4) % 4]
                for n in (0, 3, 7, 12): poe(m, lp_rapido(tom(NOTA(ac + n), bt * 4, "saw", a=0.4, d=3), 1500) * 0.06, t)          # cordas
            t += bt; k += 1
    elif estilo == "leve":
        bt = 60 / 100 / 2; t = 0.0; k = 0; arp = [60, 64, 67, 72, 67, 64]
        while t < fim:
            ac = [0, 5, -3, 7][(k // 12) % 4]
            poe(m, tom(NOTA(arp[k % 6] + ac), 0.5, "tri", d=0.25) * 0.25, t)
            if k % 12 == 0:
                for n in (0, 4, 7): poe(m, tom(NOTA(48 + ac + n), bt * 12, "sen", a=0.3, d=4) * 0.08, t)
            t += bt; k += 1
    if para_em:   # depois da virada: só um drone grave
        t = np.arange(int((dur - para_em) * SR)) / SR
        poe(m, np.sin(2 * np.pi * 41 * t) * 0.3 * np.minimum(1, t / 0.4), para_em)
    return m[: int(dur * SR)]

def efeito(tipo):
    if tipo == "whoosh":
        n = ruido(0.45); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2; return lp_rapido(n * e, 2500) * 0.6
    if tipo == "baque": return mx(tom(50, 0.5, d=0.12), lp_rapido(ruido(0.15), 300) * env(int(0.15 * SR), d=0.04))
    if tipo == "ting": return mx(tom(1760, 0.8, d=0.35) * 0.5, tom(2637, 0.8, d=0.25) * 0.25)
    if tipo == "explosao": return mx(lp_rapido(ruido(1.6) * env(int(1.6 * SR), a=0.003, d=0.45), 900) * 1.5, tom(38, 1.2, d=0.4))
    if tipo == "sting":
        return mx(sum(lp_rapido(tom(NOTA(n), 1.4, "saw", a=0.01, d=0.7), 1600) for n in (36, 43, 48)) * 0.35, tom(45, 1.0, d=0.3))
    if tipo == "pop": return tom(900, 0.12, d=0.03) * 0.6
    return np.zeros(10)

def main(pj):
    rc = json.load(open(os.path.join(pj, "receita.json"), encoding="utf8"))
    tp = json.load(open(os.path.join(pj, "work/tempos.json"), encoding="utf8"))
    cfg = rc.get("som", {}); estilo = cfg.get("musica", "comica"); com_fx = cfg.get("efeitos", True)
    voz = ler_voz(pj); dur = len(voz) / SR
    ini_plano = lambda k, pl: 0 if k == 0 else tp["frases"][(pl["frases"][0] if isinstance(pl["frases"], list) else pl["frases"])]["inicio"]
    virada = next((ini_plano(k, pl) for k, pl in enumerate(rc["planos"]) if pl.get("virada")), None)
    mus = musica(estilo, dur, virada) if estilo != "nenhuma" else np.zeros(len(voz))
    fx = np.zeros(len(voz))
    if com_fx:
        for k, pl in enumerate(rc["planos"]):
            t0 = ini_plano(k, pl)
            fim = ini_plano(k + 1, rc["planos"][k + 1]) if k + 1 < len(rc["planos"]) else dur
            if k > 0: poe(fx, efeito("whoosh") * 0.5, max(0, t0 - 0.2))
            for f in pl.get("fx", []):
                nome, _, q = str(f).partition(":")
                if nome == "tremor": poe(fx, efeito("baque"), t0 + float(q or 0) * (fim - t0))
                if nome in ("explosao", "ting", "pop"): poe(fx, efeito(nome), t0 + float(q or 0) * (fim - t0))
            if pl.get("virada"): poe(fx, efeito("sting"), t0)
        for e in cfg.get("extras", []):
            t = e.get("segundo", tp["frases"][e["frase"]]["inicio"] if "frase" in e else 0); poe(fx, efeito(e["tipo"]), t)
    rv = rms_gate(voz); pv = np.max(np.abs(voz)) + 1e-9
    if np.any(mus): mus *= (rv * 0.5) / rms_gate(mus, -60)
    if np.any(fx):
        fx *= (rv * 0.5) / rms_gate(fx, -50)
        if np.max(np.abs(fx)) > 0.7 * pv: fx *= 0.7 * pv / np.max(np.abs(fx))
    mix = voz + mus + fx
    g = 10 ** ((-17 - 20 * np.log10(rms_gate(mix))) / 20)     # ~−14 LUFS para fala
    mix *= g; teto = 10 ** (-1 / 20)
    mix = np.where(np.abs(mix) > teto * 0.8, np.sign(mix) * (teto * 0.8 + (teto * 0.2) * np.tanh((np.abs(mix) - teto * 0.8) / (teto * 0.2))), mix)
    st = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
    import wave
    with wave.open(os.path.join(pj, "work/mix.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
    db = lambda x: 20 * np.log10(x + 1e-12)
    print(f"voz {db(rv):.1f} dB · música {db(rms_gate(mus, -60)) if np.any(mus) else float('nan'):.1f} dB · efeitos pico {db(np.max(np.abs(fx))):.1f} dB (voz pico {db(pv):.1f}) · estilo {estilo}")

if __name__ == "__main__":
    main(sys.argv[1])
