#!/usr/bin/env bash
# finalizar.sh — junta quadros + som + legenda no MP4 final (1080x1920, 30 fps, H.264 CRF 17 + AAC).
# Uso: bash ferramentas/finalizar.sh <projeto> ["sem-legenda"]
set -euo pipefail
PJ="$1"; MODO="${2:-}"
mkdir -p "$PJ/saida"
NOME=$(python3 -c "import json,re,sys;t=json.load(open('$PJ/receita.json'))['titulo'];print(re.sub(r'[^\w]+','_',t.lower()).strip('_'))")
VF="format=yuv420p"
if [ "$MODO" != "sem-legenda" ]; then VF="subtitles=$PJ/work/legenda.ass:fontsdir=$HOME/.fonts,format=yuv420p"; fi
AUDIO="$PJ/work/mix.wav"; [ -f "$AUDIO" ] || AUDIO=$(ls "$PJ"/voz.* | head -1)
ffmpeg -v error -y -framerate 30 -i "$PJ/quadros/f%05d.jpg" -i "$AUDIO" -vf "$VF" \
  -c:v libx264 -preset veryfast -crf 17 -c:a aac -b:a 192k -shortest -movflags +faststart "$PJ/saida/$NOME.mp4"
# QA: quadros congelados (≥0,4 s) e pretos
ffmpeg -v info -i "$PJ/saida/$NOME.mp4" -vf "freezedetect=n=0.001:d=0.4,blackdetect=d=0.1" -an -f null - 2>&1 | grep -E "freeze_start|black_start" || echo "QA: sem quadros congelados ou pretos"
echo "$PJ/saida/$NOME.mp4"
