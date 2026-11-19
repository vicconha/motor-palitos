"""tempos.py — alinha o roteiro limpo com a narração gravada (sem reconhecimento de voz).
Uso: python3 ferramentas/tempos.py <projeto>
Lê <projeto>/roteiro.txt (texto limpo, sem marcações) e <projeto>/voz.* (mp3/wav/m4a).
Grava <projeto>/work/tempos.json: duração, e cada frase com início/fim e o tempo de cada palavra.
Como funciona: acha os silêncios da voz (ffmpeg), conta sílabas de cada frase e distribui o tempo de fala
proporcionalmente; cada fronteira entre frases é puxada para o silêncio mais próximo.
"""
import sys, re, json, glob, subprocess, os

VOGAIS = re.compile(r"[aeiouáéíóúâêôãõàü]+", re.I)

def silabas(txt):
    return max(1, sum(len(VOGAIS.findall(p)) for p in txt.split()))

def frases_de(texto):
    """Uma frase por linha do roteiro.txt. Se vier tudo numa linha só, separa por . ! ? (reticências não separam)."""
    linhas = [l.strip() for l in texto.strip().splitlines() if l.strip()]
    if len(linhas) > 1: return linhas
    t = re.sub(r"\s+", " ", texto.strip())
    return [p.strip() for p in re.split(r"(?<=[!?]|(?<!\.)\.(?!\.))\s+", t) if p.strip()]

def duracao(arq):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq], capture_output=True, text=True).stdout
    return float(out.strip())

def silencios(arq, db=-35, minimo=0.22):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", arq, "-af", f"silencedetect=noise={db}dB:d={minimo}", "-f", "null", "-"], capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    fim = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(ini, fim + [None] * (len(ini) - len(fim))))

def main(pj):
    voz = [f for f in glob.glob(os.path.join(pj, "voz.*"))][0]
    frases = frases_de(open(os.path.join(pj, "roteiro.txt"), encoding="utf8").read())
    dur = duracao(voz)
    sil = [(a, b if b is not None else dur) for a, b in silencios(voz)]
    # trechos de fala = complemento dos silêncios
    fala, t = [], 0.0
    for a, b in sil:
        if a > t + 0.05: fala.append((t, a))
        t = b
    if t < dur - 0.05: fala.append((t, dur))
    if not fala: fala = [(0, dur)]
    total_fala = sum(b - a for a, b in fala)

    def real(ts):   # tempo "só de fala" -> tempo real
        acc = 0.0
        for a, b in fala:
            if ts <= acc + (b - a): return a + (ts - acc)
            acc += b - a
        return fala[-1][1]

    sils = [s for s in silabas_list(frases)]
    tot = sum(sils); acc = 0; fronteiras = []; ultimo = fala[0][0]
    for s in sils[:-1]:
        acc += s
        alvo = real(total_fala * acc / tot)
        # puxa para a pausa mais próxima (o fim de um silêncio = começo da próxima frase), sempre depois da anterior
        cand = [(abs(b - alvo), a, b) for a, b in sil if a > ultimo + 0.3]
        if cand:
            d, a, b = min(cand)
            if d < 0.9: fronteiras.append((a, b)); ultimo = b; continue
        alvo = max(alvo, ultimo + 0.3); fronteiras.append((alvo, alvo)); ultimo = alvo
    inicios = [fala[0][0]] + [b for a, b in fronteiras]
    fins = [a for a, b in fronteiras] + [fala[-1][1]]
    saida = []
    for txt, i0, i1 in zip(frases, inicios, fins):
        pal = txt.split(); ss = [silabas(p) + 0.3 for p in pal]; st = sum(ss); t = i0; ws = []
        for p, s in zip(pal, ss):
            d = (i1 - i0) * s / st; ws.append({"p": p, "inicio": round(t, 3), "fim": round(t + d, 3)}); t += d
        saida.append({"texto": txt, "inicio": round(i0, 3), "fim": round(i1, 3), "palavras": ws})
    os.makedirs(os.path.join(pj, "work"), exist_ok=True)
    json.dump({"duracao": round(dur, 3), "frases": saida}, open(os.path.join(pj, "work/tempos.json"), "w"), ensure_ascii=False, indent=1)
    for k, f in enumerate(saida): print(f"{k:2d}  {f['inicio']:6.2f}-{f['fim']:6.2f}  {f['texto']}")
    print(f"duração {dur:.2f} s · {round(dur * 30)} quadros")

def silabas_list(frases): return [silabas(f) for f in frases]

if __name__ == "__main__":
    main(sys.argv[1])
