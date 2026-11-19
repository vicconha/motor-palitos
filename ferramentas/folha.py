"""folha.py — folha de aprovação: os stills numerados (1, 2, 3...) com a frase de cada plano embaixo.
Uso: python3 ferramentas/folha.py <projeto>   ->  <projeto>/saida/folha_aprovacao.jpg
"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

FONTE = os.path.expanduser("~/.fonts/Montserrat-Black.ttf")

def fonte(n):
    try: return ImageFont.truetype(FONTE, n)
    except OSError: return ImageFont.truetype("DejaVuSans-Bold.ttf", n)

def quebra(txt, f, larg, d):
    linhas, l = [], ""
    for p in txt.split():
        t = (l + " " + p).strip()
        if d.textlength(t, font=f) > larg and l: linhas.append(l); l = p
        else: l = t
    return linhas + [l]

def main(pj):
    st = json.load(open(os.path.join(pj, "work/stills.json")))
    rc = json.load(open(os.path.join(pj, "receita.json"), encoding="utf8"))
    tp = json.load(open(os.path.join(pj, "work/tempos.json"), encoding="utf8"))
    cols = 3; w, h = 340, 604; leg = 120
    n = len(st["quadros"]); rows = (n + cols - 1) // cols
    folha = Image.new("RGB", (cols * (w + 20) + 20, rows * (h + leg + 20) + 20), "white"); d = ImageDraw.Draw(folha)
    fn, ft = fonte(64), fonte(20)
    for k, q in enumerate(st["quadros"]):
        r, c = divmod(k, cols); x = 20 + c * (w + 20); y = 20 + r * (h + leg + 20)
        im = Image.open(os.path.join(pj, "stills", f"q{q:05d}.jpg")).resize((w, h)); folha.paste(im, (x, y))
        d.rounded_rectangle((x + 10, y + 10, x + 100, y + 100), 18, fill="#ffd23f", outline="#14161c", width=5)
        d.text((x + 55, y + 55), str(k + 1), font=fn, fill="#14161c", anchor="mm")
        pl = rc["planos"][k] if k < len(rc["planos"]) else {}
        fr = pl.get("frases", [])
        fr = fr if isinstance(fr, list) else [fr]
        txt = " ".join(tp["frases"][i]["texto"] for i in fr if i < len(tp["frases"]))
        for j, l in enumerate(quebra(txt, ft, w, d)[:4]): d.text((x, y + h + 8 + j * 25), l, font=ft, fill="#1f2a44")
    os.makedirs(os.path.join(pj, "saida"), exist_ok=True)
    out = os.path.join(pj, "saida/folha_aprovacao.jpg"); folha.save(out, quality=88); print(out)

if __name__ == "__main__":
    main(sys.argv[1])
