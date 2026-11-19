#!/usr/bin/env bash
# instalar.sh — prepara o ambiente para o motor (rode uma vez por sessão).
set -e
cd "$(dirname "$0")"
[ -d node_modules/three ] || npm i --silent three@0.160.0
node -e "import('playwright').then(()=>console.log('playwright ok'))" 2>/dev/null || { npm i --silent playwright && npx playwright install chromium; }
if ! fc-list | grep -q "Montserrat Black"; then
  mkdir -p ~/.fonts && curl -sSfL -o ~/.fonts/Montserrat-Black.ttf https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Black.ttf && fc-cache -f >/dev/null
fi
python3 -c "import numpy, PIL" 2>/dev/null || pip install --break-system-packages -q numpy pillow
echo "motor pronto"
