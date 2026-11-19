"""voz_teste.py — cria uma "voz" falsa (sílabas sintéticas com pausas) a partir do roteiro, só para testar o motor
sem gravar nada. Uso: python3 ferramentas/voz_teste.py <projeto>  ->  <projeto>/voz.wav
"""
import sys, os, re, wave
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from tempos import frases_de, silabas

SR = 48000

def main(pj):
    frases = frases_de(open(os.path.join(pj, "roteiro.txt"), encoding="utf8").read())
    rng = np.random.default_rng(1); partes = [np.zeros(int(0.25 * SR))]
    for fr in frases:
        for p in fr.split():
            for _ in range(silabas(p)):
                d = 0.16 + rng.random() * 0.05; t = np.arange(int(d * SR)) / SR
                f0 = 140 + rng.random() * 40
                v = sum(np.sin(2 * np.pi * f0 * k * t) / k for k in range(1, 8)) * np.sin(np.pi * t / d) ** 0.6
                partes.append(v * 0.15)
            partes.append(np.zeros(int(0.03 * SR)))
        partes.append(np.zeros(int((0.45 if fr[-1] in ".!?…" else 0.3) * SR)))
    x = np.concatenate(partes); x = (x / np.max(np.abs(x)) * 0.5 * 32767).astype(np.int16)
    with wave.open(os.path.join(pj, "voz.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())
    print(f"voz de teste: {len(x) / SR:.1f} s")

if __name__ == "__main__":
    main(sys.argv[1])
