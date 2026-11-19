# motor-palitos

Motor dos shorts animados com o elenco de palitos (Tito, Zuza, Bento, Pipoca): bonecos 2D em cenários 3D estilizados,
legenda em Montserrat Black, trilha e efeitos sintetizados. Usado pela skill `cartoon-audio-short`.

A cada vídeo só se escreve **um arquivo pequeno**: a `receita.json`. Todo o resto já está aqui.

## Instalar (uma vez por sessão)

```bash
bash instalar.sh
```

Instala three.js, confere o Playwright/Chromium e baixa a fonte Montserrat Black.

## Fazer um vídeo

Crie a pasta `projetos/<nome>/` com:

- `roteiro.txt`: o roteiro **limpo** (sem marcações de emoção), **uma frase por linha**. Cada linha é uma frase da narração.
- `voz.mp3` (ou .wav/.m4a): a narração. Para testar sem voz: `python3 ferramentas/voz_teste.py projetos/<nome>`.
- `receita.json`: os planos (formato abaixo).

Depois:

```bash
P=projetos/<nome>
python3 ferramentas/tempos.py $P                     # alinha frases e palavras com a voz -> work/tempos.json
node renderizar.mjs $P stills meio                   # 1 still por plano
python3 ferramentas/folha.py $P                      # folha numerada para aprovação -> saida/folha_aprovacao.jpg
# (aprovação: refaça só o plano pedido e rode os stills de novo)
python3 ferramentas/legenda.py $P                    # work/legenda.ass
python3 ferramentas/som.py $P                        # work/mix.wav (voz + música + efeitos)
node renderizar.mjs $P tudo                          # todos os quadros, em paralelo, retomável
bash ferramentas/finalizar.sh $P                     # saida/<titulo>.mp4 (+ QA)
```

Mudou só o som? Rode `som.py` e `finalizar.sh`; não precisa renderizar de novo.
Mudou um plano? Apague os quadros daquele intervalo (`quadros/f0XXXX.jpg`) e rode `renderizar.mjs $P tudo`: ele só faz os que faltam.

## Formato da receita

```json
{
  "titulo": "Foguete de papelão",
  "planos": [
    {
      "frases": [0],                       // índices das linhas do roteiro.txt que este plano cobre
      "cenario": "vila_dia",               // vila_dia | vila_noite | laboratorio | deserto | espaco (ou um novo em web/cenarios.js)
      "camera": {"tipo": "medio", "alvo": "tito", "mov": "aproxima"},
      "transicao": "fusao",                // fusao (padrão) | corte | flash (salto no tempo)
      "fx": ["tremor:0.7", "explosao:0.7"],// efeitos no tempo (0..1 do plano): tremor, explosao, ting, pop, flash
      "virada": false,                     // true no plano da virada: a música para, sting e leve rotação
      "noite": false,                      // força legenda azulada (vila_noite e espaco já são noite)
      "legenda_alta": false,               // sobe a legenda para 80% (closes com rosto na faixa da legenda)
      "atores": [
        {"id": "tito", "x": 0, "z": 0, "expr": "determinado", "pose": "apontando",
         "roupa": ["coroa"], "espelhar": false,
         "muda": [{"em": 0.6, "expr": "chocado", "pose": "susto"}],
         "anda": {"para": [0.8, 0], "de": 0.2, "ate": 0.8}}
      ]
    }
  ],
  "legenda": {"amarelo": ["lua", "82"], "vermelho": ["explodiu"], "azul": [], "impacto": ["explodiu"], "susto": [], "suave_desde_frase": 6},
  "som": {"musica": "comica", "efeitos": true, "extras": [{"frase": 3, "tipo": "ting"}]}
}
```

- **Câmera** `tipo`: geral (corpo inteiro, ~7 m) · medio · close (rosto) · detalhe. `alvo`: id do ator (ou um x). `mov`: aproxima (padrão) · afasta · panoramica_dir · panoramica_esq · sobe · desce · chicote · parado. Ou dê `de`/`para` exatos: `[x, y, z, olhaX, olhaY, olhaZ]`.
- **Atores**: x entre −0,7 e 0,7 no plano geral (o quadro vertical é estreito); z positivo = mais perto da câmera. Expressões, poses e figurinos: veja `web/palitos.js` (EXPRESSOES, POSES, POSES_CACHORRO, FIGURINOS).
- **Som** `musica`: comica · suspense · epica · leve · nenhuma. Música a 50% da voz; efeitos ≤ 50%.

## Onde mexer

| Arquivo | O que tem |
|---|---|
| `web/palitos.js` | elenco, expressões, poses, figurinos (adicione roupas novas em `FIGURINOS`) |
| `web/cenarios.js` | cenários prontos (adicione novos em `CENARIOS` e `META`) |
| `web/compilar.js` | receita + tempos -> plano de quadros, câmeras prontas |
| `web/motor.js` | renderização de cada quadro (fusões, flash, tremida, vinheta, piscadas, respiração) |
| `renderizar.mjs` | stills e vídeo, em paralelo (`TRABALHADORES=N`), retomável |
| `ferramentas/` | tempos, legenda, som, folha de aprovação, finalizar, voz de teste, análise de referências |
