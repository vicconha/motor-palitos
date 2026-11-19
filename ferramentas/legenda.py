"""legenda.py — gera a legenda .ass (Montserrat Black, uma palavra por vez) a partir de work/tempos.json.
Uso: python3 ferramentas/legenda.py <projeto>
Na receita.json, a chave "legenda" diz o que destacar (palavras sem pontuação, sem diferenciar maiúsculas):
  "amarelo": ["82", "tito"]   palavra-chave (números, nomes, o objeto da piada, a palavra da virada)
  "vermelho": ["explodiu"]    perigo / raiva / explosão
  "azul": ["frio"]            sono / frio / tristeza
  "impacto": ["explodiu"]     estoura 80% -> 118%, treme e vai em MAIÚSCULAS
  "susto": ["bum"]            cresce até 125%
  "suave_desde_frase": 6      da frase 6 em diante (a explicação), pop mais suave
Planos em cenário de noite (ou com "noite": true) deixam o branco azulado.
"""
import sys, json, os, re

NOITE = {"vila_noite", "espaco"}
CURTAS = {"o", "a", "os", "as", "e", "é", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas", "um", "uma", "que", "se", "não", "por", "pra", "com", "ao", "à", "mas", "ou", "eu", "me", "te", "lhe", "seu", "sua"}
COR = {"amarelo": r"\c&H3FD2FF&", "vermelho": r"\c&H4A5AFF&", "azul": r"\c&HFFC88A&"}
CAB = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Palavra,Montserrat Black,92,&H00FFFFFF,&H00FFFFFF,&H00111111,&H78000000,0,0,0,0,100,100,1,0,1,8,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def tc(s):
    s = max(0, s); h = int(s // 3600); m = int(s % 3600 // 60); return f"{h}:{m:02d}:{s % 60:05.2f}"

def limpa(p): return re.sub(r"[^\wÀ-ÿ]", "", p).lower()

def main(pj):
    rc = json.load(open(os.path.join(pj, "receita.json"), encoding="utf8"))
    tp = json.load(open(os.path.join(pj, "work/tempos.json"), encoding="utf8"))
    lg = rc.get("legenda", {})
    grupos = {k: {limpa(x) for x in lg.get(k, [])} for k in ["amarelo", "vermelho", "azul", "impacto", "susto"]}
    suave_desde = lg.get("suave_desde_frase", 10 ** 6)
    # início de cada plano (em segundos) para saber se é noite e se a legenda sobe (close)
    planos = []
    for k, pl in enumerate(rc["planos"]):
        f0 = pl["frases"][0] if isinstance(pl["frases"], list) else pl["frases"]
        ini = 0 if k == 0 else tp["frases"][f0]["inicio"]
        planos.append((ini, pl.get("noite", pl.get("cenario") in NOITE), pl.get("legenda_alta", False)))
    def plano_em(t): return [p for p in planos if p[0] <= t + 1e-6][-1] if planos else (0, False, False)

    blocos = []
    for fi, fr in enumerate(tp["frases"]):
        ws = fr["palavras"]; i = 0
        while i < len(ws):
            grupo = [ws[i]]
            while (limpa(grupo[-1]["p"]) in CURTAS or len(limpa(grupo[-1]["p"])) <= 2) and i + 1 < len(ws) and len(" ".join(w["p"] for w in grupo + [ws[i + 1]])) <= 14 and len(grupo) < 2:
                i += 1; grupo.append(ws[i])
            i += 1
            blocos.append({"txt": " ".join(w["p"] for w in grupo), "ini": grupo[0]["inicio"], "fim_fala": grupo[-1]["fim"], "frase": fi, "fim_frase": fr["fim"], "pals": [limpa(w["p"]) for w in grupo]})
    linhas = []
    for k, b in enumerate(blocos):
        ini = b["ini"] - 1.5 / 30
        prox = blocos[k + 1]["ini"] - 1.5 / 30 if k + 1 < len(blocos) else b["fim_frase"] + 0.3
        fim = prox if prox - b["fim_fala"] < 0.4 else b["fim_fala"] + 0.1
        _, noite, alta = plano_em(b["ini"])
        y = 1536 if alta else 1344
        cor = r"\c&HFFE6CF&" if noite else ""
        for g in ["amarelo", "vermelho", "azul"]:
            if any(p in grupos[g] for p in b["pals"]): cor = COR[g]
        txt = b["txt"]
        if any(p in grupos["impacto"] for p in b["pals"]):
            txt = txt.upper()
            for j, (dx, dy) in enumerate([(6, -4), (-6, 3), (4, 5), (-3, -5)]):
                t0 = ini + j / 30
                linhas.append(f"Dialogue: 1,{tc(t0)},{tc(t0 + 1 / 30)},Palavra,,0,0,0,,{{\\pos({540 + dx},{y + dy}){cor}\\fscx{80 + j * 10}\\fscy{80 + j * 10}}}{txt}")
            linhas.append(f"Dialogue: 0,{tc(ini + 4 / 30)},{tc(fim)},Palavra,,0,0,0,,{{\\pos(540,{y}){cor}\\fscx118\\fscy118\\t(0,120,\\fscx108\\fscy108)}}{txt}")
            continue
        if any(p in grupos["susto"] for p in b["pals"]): ef = r"\fscx85\fscy85\t(0,140,\fscx125\fscy125)"
        elif b["frase"] >= suave_desde: ef = r"\fscx96\fscy96\t(0,120,\fscx100\fscy100)"
        else: ef = r"\fscx92\fscy92\t(0,80,\fscx100\fscy100)"
        linhas.append(f"Dialogue: 0,{tc(ini)},{tc(fim)},Palavra,,0,0,0,,{{\\pos(540,{y}){cor}{ef}}}{txt}")
    open(os.path.join(pj, "work/legenda.ass"), "w", encoding="utf8").write(CAB + "\n".join(linhas) + "\n")
    print(f"legenda: {len(blocos)} blocos")

if __name__ == "__main__":
    main(sys.argv[1])
