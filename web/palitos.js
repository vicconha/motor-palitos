// palitos.js — elenco de bonecos de palito (Canvas 2D), para folhas e para os cartões 2D nos cenários 3D.
// Coordenadas locais em "unidades": origem nos pés, y negativo para cima. Cabeça humana: base do pescoço em -100, raio 20*CABECA.
// Uso: desenhar(ctx, 'tito', {expr:'feliz', pose:'acenando', x, y, escala})  |  cartao('zuza', {...}) -> canvas 600x1000, pés em y=975

export const CONTORNO = '#1f2a44';
const PELE = '#ffffff';
export const CABECA = 1.7;      // cabeça humana: raio 20 x 1.7 (estilo viral: cabeção)
export const CABECA_CAO = 1.6;
const CONT = 4.4;                // espessura extra do contorno preto em volta dos membros (2,2 de cada lado)
const PRETO = '#14161c';
const ESCURO = '#3a1f1f';

export const ELENCO = {
  tito:   { nome: 'Tito',   papel: 'o azarado',   cor: '#2b6cd4', tipo: 'humano' },
  zuza:   { nome: 'Zuza',   papel: 'a debochada', cor: '#e2553f', tipo: 'humano' },
  bento:  { nome: 'Bento',  papel: 'o sábio',     cor: '#2f9e6b', tipo: 'humano' },
  pipoca: { nome: 'Pipoca', papel: 'o cachorro',  cor: '#f2b632', tipo: 'cachorro' },
  figurante: { nome: 'Figurante', papel: 'multidão', cor: '#9aa0a8', tipo: 'humano' },
};

// olhos, sobrancelhas [interna, externa] (esq.) ou [ie, oe, id, od], boca, olhar [dx,dy], extras, rosto (cor da pele)
export const EXPRESSOES = {
  neutro:       { olhos: 'ponto', sob: [0, 0], boca: 'neutra' },
  feliz:        { olhos: 'ponto', sob: [-1, -1], boca: 'sorriso' },
  rindo:        { olhos: 'feliz', sob: [-2, -1], boca: 'risada', extras: ['tremor'] },
  bravo:        { olhos: 'ponto', sob: [3, -2], boca: 'cerrada', extras: ['veia'] },
  furioso:      { olhos: 'pequeno', sob: [4, -3], boca: 'grito', extras: ['fumaca', 'veia'], rosto: '#ffb4a6' },
  surpreso:     { olhos: 'grande', sob: [-5, -4], boca: 'o' },
  chocado:      { olhos: 'grande-mini', sob: [-6, -5], boca: 'grito', extras: ['choque'], rosto: '#e4ecf7' },
  assustado:    { olhos: 'grande', sob: [-4, 1], boca: 'onda', extras: ['suor', 'choque'] },
  triste:       { olhos: 'ponto', olhar: [0, 1], sob: [-3, 1], boca: 'triste' },
  chorando:     { olhos: 'apertado', sob: [-4, 1], boca: 'choro', extras: ['lagrimas'] },
  preocupado:   { olhos: 'ponto', sob: [-3, 1], boca: 'onda', extras: ['suor'] },
  desconfiado:  { olhos: 'semi', olhar: [2, 0], sob: [2, 1, -3, -4], boca: 'lateral' },
  debochado:    { olhos: 'semi', olhar: [-1, 0], sob: [1, 1, -3, -5], boca: 'deboche' },
  pensativo:    { olhos: 'ponto', olhar: [2, -2], sob: [0, 0, -3, -4], boca: 'lateral', extras: ['interrogacao'] },
  ideia:        { olhos: 'grande', olhar: [0, -1], sob: [-5, -5], boca: 'sorriso_aberto', extras: ['lampada'] },
  determinado:  { olhos: 'ponto', sob: [2, -1], boca: 'confiante', extras: ['brilho'] },
  apaixonado:   { olhos: 'coracao', sob: [-2, -2], boca: 'sorriso', extras: ['rubor', 'coracoes'] },
  envergonhado: { olhos: 'ponto', olhar: [-1, 2], sob: [-3, 0], boca: 'onda', extras: ['rubor_forte', 'suor'] },
  tonto:        { olhos: 'espiral', sob: [-2, 1, 1, -2], boca: 'onda', extras: ['estrelas'] },
  dormindo:     { olhos: 'fechado', sob: [0, 1], boca: 'o', extras: ['zzz'] },
  // do cachorro
  'pipoca-feliz':     { olhos: 'feliz', sob: null, boca: 'lingua' },
  'pipoca-assustado': { olhos: 'grande', sob: [-4, 1], boca: 'o', extras: ['choque', 'suor'] },
  'pipoca-triste':    { olhos: 'ponto', olhar: [0, 1], sob: [-4, 1], boca: 'triste', extras: ['lagrima'] },
  'pipoca-dormindo':  { olhos: 'fechado', sob: null, boca: 'neutra', extras: ['zzz'] },
  'pipoca-curioso':   { olhos: 'grande', olhar: [1, -1], sob: [0, 0, -3, -3], boca: 'neutra', extras: ['interrogacao'], inclina: 0.3 },
};

// braços [cotovelo x,y, mão x,y] esquerdo e direito; pernas [joelho x,y, pé x,y]; incl = inclinação do tronco; sobe = pulo
export const NOMES_POSE = { neutro: 'neutro', acenando: 'acenando', apontando: 'apontando', comemorando: 'comemorando', mao_cintura: 'mão na cintura',
  dar_ombros: 'dar de ombros', pensando: 'pensando', explicando: 'explicando', desespero: 'desespero', cruzados: 'braços cruzados', correndo: 'correndo', susto: 'susto',
  em_pe: 'em pé', sentado: 'sentado', pulando: 'pulando', deitado: 'deitado', rolando: 'rolando' };
export const POSES = {
  neutro:      { bracos: [[-10, -70, -14, -52], [10, -70, 14, -52]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  acenando:    { bracos: [[-10, -70, -14, -52], [27, -98, 44, -120]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]], acena: true },
  apontando:   { bracos: [[-10, -70, -14, -52], [19, -90, 38, -94]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  comemorando: { bracos: [[-25, -100, -44, -122], [25, -100, 44, -122]], pernas: [[-9, -22, -16, 0], [9, -22, 16, 0]] },
  mao_cintura: { bracos: [[-18, -70, -5, -52], [18, -70, 5, -52]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  dar_ombros:  { bracos: [[-16, -77, -23, -90], [16, -77, 23, -90]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  pensando:    { bracos: [[-10, -72, 8, -74], [17, -74, 8, -97]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  explicando:  { bracos: [[-10, -70, -14, -52], [27, -96, 42, -116]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]], dedo: true },
  desespero:   { bracos: [[-42, -104, -38, -136], [42, -104, 38, -136]], pernas: [[-7, -22, -14, 0], [7, -22, 14, 0]] },
  cruzados:    { bracos: [[-13, -74, 10, -78], [13, -71, -10, -75]], pernas: [[-6, -22, -12, 0], [6, -22, 12, 0]] },
  correndo:    { incl: 10, bracos: [[-10, -76, -20, -64], [20, -80, 26, -96]], pernas: [[16, -28, 12, -4], [-6, -20, -24, -12]] },
  susto:       { sobe: 16, bracos: [[-28, -96, -48, -106], [28, -96, 48, -106]], pernas: [[-12, -28, -10, -10], [12, -28, 10, -10]] },
};

export const POSES_CACHORRO = {
  em_pe:    { corpo: [-15, -30, 15, -30], pernas: [[-13, -30, -17, 0], [-8, -30, -6, 0], [9, -30, 6, 0], [14, -30, 18, 0]], rabo: [-15, -30, -25, -36, -21, -48], cab: [24, -60] },
  sentado:  { corpo: [-8, -10, 6, -36], pernas: [[-8, -10, -13, 0], [-5, -13, -3, 0], [4, -34, 5, 0], [8, -35, 11, 0]], rabo: [-8, -10, -20, -10, -25, -3], cab: [15, -66] },
  pulando:  { sobe: 22, corpo: [-15, -30, 15, -32], pernas: [[-13, -30, -28, -22], [-9, -30, -24, -18], [10, -31, 24, -20], [14, -32, 30, -26]], rabo: [-15, -30, -24, -42, -20, -54], cab: [26, -62] },
  deitado:  { corpo: [-16, -8, 14, -8], pernas: [[-14, -8, -24, -1], [-10, -8, -18, 0], [11, -8, 30, -4], [14, -8, 33, -1]], rabo: [-16, -8, -26, -10, -32, -4], cab: [31, -25] },
  rolando:  { corpo: [-15, -14, 15, -14], pernas: [[-13, -14, -18, -36], [-8, -14, -5, -38], [9, -14, 6, -38], [14, -14, 19, -34]], rabo: [-15, -14, -25, -12, -30, -4], cab: [31, -17], vira: true },
};

// ---------- utilidades ----------
function linha(ctx, pts, cor, w) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.stroke();
}
function circ(ctx, x, y, r, fill, stroke, w) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
}
function coracao(ctx, x, y, s, cor) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.fillStyle = cor; ctx.fill();
}
function estrela(ctx, x, y, r, cor) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 0.8; ctx.stroke();
}
function gota(ctx, x, y, s, cor = '#6fb7ff') {
  ctx.beginPath(); ctx.moveTo(x, y - s * 1.3);
  ctx.quadraticCurveTo(x + s, y, x, y + s * 0.8); ctx.quadraticCurveTo(x - s, y, x, y - s * 1.3);
  ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 0.8; ctx.stroke();
}
function texto(ctx, t, x, y, px, cor) {
  ctx.font = `900 ${px}px Inter, "DejaVu Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = px * 0.18; ctx.strokeStyle = CONTORNO; ctx.strokeText(t, x, y); ctx.fillStyle = cor; ctx.fillText(t, x, y);
}

// ---------- rosto (coordenadas da cabeça: centro 0,0, raio 20) ----------
const EY = 3, EX = 7;
function olhos(ctx, tipo, olhar = [0, 0]) {
  const [lx, ly] = olhar;
  for (const s of [-1, 1]) {
    const x = s * EX, y = EY;
    ctx.strokeStyle = CONTORNO; ctx.fillStyle = CONTORNO; ctx.lineWidth = 2;
    switch (tipo) {
      case 'ponto': circ(ctx, x + lx, y + ly, 2.6, CONTORNO); break;
      case 'pequeno': circ(ctx, x + lx, y + ly, 1.6, CONTORNO); break;
      case 'grande': case 'grande-mini':
        circ(ctx, x, y, 5, '#fff', CONTORNO, 1.6);
        circ(ctx, x + lx * 1.4, y + ly * 1.4, tipo === 'grande' ? 2.4 : 1.1, CONTORNO);
        if (tipo === 'grande') circ(ctx, x + lx * 1.4 + 0.9, y + ly * 1.4 - 0.9, 0.7, '#fff');
        break;
      case 'feliz':
        ctx.beginPath(); ctx.moveTo(x - 3.5, y + 1.5); ctx.quadraticCurveTo(x, y - 4.5, x + 3.5, y + 1.5); ctx.stroke(); break;
      case 'fechado':
        ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.quadraticCurveTo(x, y + 3.5, x + 3.5, y); ctx.stroke(); break;
      case 'apertado':
        ctx.beginPath(); ctx.moveTo(x - s * 3.5, y - 3); ctx.lineTo(x + s * 2.5, y); ctx.lineTo(x - s * 3.5, y + 3); ctx.stroke(); break;
      case 'semi':
        ctx.beginPath(); ctx.arc(x + lx, y, 2.8, 0, Math.PI); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineWidth = 2.2; ctx.stroke(); break;
      case 'x':
        linha(ctx, [x - 3, y - 3, x + 3, y + 3], CONTORNO, 2); linha(ctx, [x + 3, y - 3, x - 3, y + 3], CONTORNO, 2); break;
      case 'espiral': {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 0.5 + a * 0.3; ctx.lineTo(x + Math.cos(a * s) * r, y + Math.sin(a * s) * r); }
        ctx.lineWidth = 1.3; ctx.stroke(); break;
      }
      case 'coracao': coracao(ctx, x, y, 4.2, '#e8344e'); break;
    }
  }
}
function sobrancelhas(ctx, sob, cor = CONTORNO) {
  if (!sob) return;
  const [li, lo, ri = li, ro = lo] = sob;
  linha(ctx, [-3, -5 + li, -11, -5 + lo], cor, 2.3);
  linha(ctx, [3, -5 + ri, 11, -5 + ro], cor, 2.3);
}
function lingua(ctx, x, y, rx, ry) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = '#f07a9a'; ctx.fill();
}
function boca(ctx, tipo, dy = 0) {
  ctx.save(); ctx.translate(0, dy);
  ctx.strokeStyle = CONTORNO; ctx.lineWidth = 2; ctx.fillStyle = ESCURO;
  switch (tipo) {
    case 'neutra': linha(ctx, [-4, 12, 4, 12], CONTORNO, 2); break;
    case 'sorriso': ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(0, 17, 6, 10); ctx.stroke(); break;
    case 'sorriso_aberto':
      ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(0, 20, 6, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'risada':
      ctx.beginPath(); ctx.moveTo(-7, 9); ctx.lineTo(7, 9); ctx.quadraticCurveTo(7, 20, 0, 20); ctx.quadraticCurveTo(-7, 20, -7, 9); ctx.closePath();
      ctx.fill(); ctx.save(); ctx.clip(); lingua(ctx, 0, 20, 5, 4); ctx.restore(); ctx.stroke(); break;
    case 'triste': ctx.beginPath(); ctx.moveTo(-5, 15); ctx.quadraticCurveTo(0, 9, 5, 15); ctx.stroke(); break;
    case 'o': ctx.beginPath(); ctx.ellipse(0, 13, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
    case 'grito':
      ctx.beginPath(); ctx.ellipse(0, 13.5, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.clip(); lingua(ctx, 0, 19, 4, 3.5); ctx.restore(); ctx.stroke(); break;
    case 'choro':
      ctx.beginPath(); ctx.moveTo(-7, 17); ctx.quadraticCurveTo(0, 5, 7, 17); ctx.quadraticCurveTo(0, 19, -7, 17); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'onda': ctx.beginPath(); ctx.moveTo(-6, 12); ctx.quadraticCurveTo(-3, 9.5, 0, 12); ctx.quadraticCurveTo(3, 14.5, 6, 12); ctx.stroke(); break;
    case 'deboche': ctx.beginPath(); ctx.moveTo(-5, 12); ctx.quadraticCurveTo(1, 15, 7, 8); ctx.stroke(); break;
    case 'lateral': linha(ctx, [1, 13, 6, 12], CONTORNO, 2); break;
    case 'cerrada':
      ctx.beginPath(); ctx.rect(-6, 9, 12, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
      linha(ctx, [-6, 12.5, 6, 12.5], CONTORNO, 1); for (const x of [-2, 2]) linha(ctx, [x, 9, x, 16], CONTORNO, 1); break;
    case 'confiante':
      ctx.beginPath(); ctx.moveTo(-6, 11); ctx.quadraticCurveTo(0, 16, 6, 9); ctx.lineTo(-6, 11); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); break;
    case 'lingua':
      ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(0, 17, 6, 10); ctx.stroke();
      lingua(ctx, 2, 16, 2.6, 4); break;
  }
  ctx.restore();
}
function extras(ctx, lista = [], t = 0) {
  for (const e of lista) {
    switch (e) {
      case 'suor': gota(ctx, 22, -4, 3); break;
      case 'lagrima': gota(ctx, -8, 10, 2.2); break;
      case 'rubor': case 'rubor_forte': {
        ctx.save(); ctx.globalAlpha = e === 'rubor' ? 0.5 : 0.8;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 11, 9, e === 'rubor' ? 4 : 5.5, 2.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#ff7f9b'; ctx.fill(); }
        ctx.restore();
        if (e === 'rubor_forte') for (const s of [-1, 1]) for (const k of [-2, 0, 2]) linha(ctx, [s * 11 + k - 1, 11, s * 11 + k + 1, 7], '#d94a6a', 0.8);
        break;
      }
      case 'lagrimas':
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * 7, 6); ctx.quadraticCurveTo(s * 9, 16, s * 8, 26);
          ctx.strokeStyle = '#5aa8ff'; ctx.lineWidth = 3; ctx.stroke(); gota(ctx, s * 9, 29, 2);
        }
        break;
      case 'choque':
        for (const [a, b, c, d] of [[-24, -14, -30, -19], [-26, -2, -33, -2], [24, -14, 30, -19], [26, -2, 33, -2], [-14, -25, -18, -31], [14, -25, 18, -31]])
          linha(ctx, [a, b, c, d], CONTORNO, 1.8);
        break;
      case 'tremor':
        for (const s of [-1, 1]) for (const dy of [-6, 2]) { ctx.beginPath(); ctx.arc(s * 20, dy, 6, s > 0 ? -0.5 : Math.PI - 0.5, s > 0 ? 0.5 : Math.PI + 0.5); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.2; ctx.stroke(); }
        break;
      case 'veia': {
        const x = 14, y = -14; ctx.strokeStyle = '#e0242f'; ctx.lineWidth = 1.8;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(x + sx * 3.5, y + sy * 3.5, 2.5, 0, Math.PI * 2); ctx.stroke(); }
        break;
      }
      case 'fumaca':
        for (const [x, y, r] of [[-12, -28, 5], [-4, -33, 6], [6, -31, 5.5], [14, -26, 4.5], [0, -40, 4]]) circ(ctx, x, y, r, '#c7c9cf', CONTORNO, 1);
        break;
      case 'interrogacao': texto(ctx, '?', 24, -20, 14, '#ffd23f'); break;
      case 'exclamacao': texto(ctx, '!', 24, -20, 14, '#ff5a4a'); break;
      case 'lampada':
        circ(ctx, 0, -36, 7, '#ffe066', CONTORNO, 1.4);
        ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-3, -29.5, 6, 3.5); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1; ctx.strokeRect(-3, -29.5, 6, 3.5);
        for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * 0.55; linha(ctx, [Math.cos(a) * 10, -36 + Math.sin(a) * 10, Math.cos(a) * 14, -36 + Math.sin(a) * 14], '#f2b632', 1.6); }
        break;
      case 'brilho': estrela(ctx, 17, -12, 3.2, '#ffffff'); break;
      case 'coracoes': coracao(ctx, 22, -18, 3.4, '#e8344e'); coracao(ctx, 28, -6, 2.4, '#e8344e'); coracao(ctx, -24, -14, 2.6, '#e8344e'); break;
      case 'estrelas':
        ctx.beginPath(); ctx.ellipse(0, -22, 18, 5, 0, 0, Math.PI * 2); ctx.strokeStyle = '#c9a400'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 3; i++) { const a = t * 0.2 + i * 2.09; estrela(ctx, Math.cos(a) * 18, -22 + Math.sin(a) * 5, 3, '#ffd23f'); }
        break;
      case 'zzz': texto(ctx, 'Z', 19, -16, 7, '#ffffff'); texto(ctx, 'Z', 25, -25, 9, '#ffffff'); texto(ctx, 'Z', 32, -36, 11, '#ffffff'); break;
    }
  }
}

// ---------- acessórios ----------
function bone(ctx, cor) {
  ctx.beginPath(); ctx.moveTo(-19, -9); ctx.quadraticCurveTo(0, -33, 19, -11); ctx.quadraticCurveTo(0, -13, -19, -9); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 2; ctx.stroke();
  linha(ctx, [15, -11, 33, -6], cor, 4.5); linha(ctx, [15, -11, 33, -6], CONTORNO, 0.8);
  circ(ctx, 0, -21, 1.8, '#ffffff');
}
function antesDaCabeca(ctx, id) {
  if (id === 'zuza') circ(ctx, 0, -22, 8, '#3a2a22', CONTORNO, 1.5);
}
function lentesBento(ctx) { for (const s of [-1, 1]) circ(ctx, s * EX, EY, 6, '#fff'); }
function depoisDoRosto(ctx, id, cor) {
  if (id === 'zuza') {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(s * EX, EY, 5.8, 4.4, 0, 0, Math.PI * 2); ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.stroke();
      linha(ctx, [s * 12, EY - 2, s * 14.5, EY - 5.5], cor, 2);
    }
    linha(ctx, [-1.4, EY - 1, 1.4, EY - 1], cor, 1.6);
  } else if (id === 'bento') {
    for (const s of [-1, 1]) circ(ctx, s * EX, EY, 6, null, CONTORNO, 2);
    linha(ctx, [-1, EY, 1, EY], CONTORNO, 2);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 19, -5); ctx.quadraticCurveTo(s * 21, -13, s * 15, -17); ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-9, 12.5); ctx.quadraticCurveTo(-4.5, 8, 0, 11.5); ctx.quadraticCurveTo(4.5, 8, 9, 12.5);
    ctx.strokeStyle = '#8f8f8f'; ctx.lineWidth = 4.2; ctx.stroke();
  }
}

// ---------- figurinos (criados por roteiro) ----------
// Cada figurino: corpo(ctx, {ombro, quadril, cor, id}) desenha sobre o tronco (antes dos braços);
// cabeca(ctx, {cor, id}) desenha nas coordenadas da cabeça (raio 20). escondeBone: true tira o boné do Tito.
// Sempre com contorno PRETO grosso. Use: desenhar(ctx, 'bento', {roupa: ['jaleco']}).
export const FIGURINOS = {
  jaleco: {
    corpo(ctx, { ombro }) {
      const [x] = ombro;
      ctx.beginPath(); ctx.moveTo(x - 9, -91); ctx.lineTo(x + 9, -91); ctx.lineTo(13, -38); ctx.lineTo(-13, -38); ctx.closePath();
      ctx.fillStyle = '#f4f6fa'; ctx.fill(); ctx.strokeStyle = PRETO; ctx.lineWidth = 2.4; ctx.stroke();
      linha(ctx, [x * 0.6, -90, 0, -38], '#b9c0cc', 1.2);
      ctx.strokeStyle = PRETO; ctx.lineWidth = 1.2; ctx.strokeRect(4, -66, 5, 5);
    },
  },
  coroa: {
    escondeBone: true,
    cabeca(ctx) {
      ctx.beginPath(); ctx.moveTo(-13, -16); ctx.lineTo(-15, -31); ctx.lineTo(-7, -23); ctx.lineTo(0, -34); ctx.lineTo(7, -23); ctx.lineTo(15, -31); ctx.lineTo(13, -16); ctx.closePath();
      ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = PRETO; ctx.lineWidth = 1.8; ctx.stroke();
      circ(ctx, 0, -21, 2, '#e8344e', PRETO, 0.8);
    },
  },
};

// ---------- humano ----------
function humano(ctx, id, e, p, t, roupas = []) {
  const cor = ELENCO[id].cor;
  const sobe = p.sobe || 0, incl = p.incl || 0;
  ctx.save(); ctx.translate(0, -sobe);
  const R = 20 * CABECA;
  const ombro = [incl, -87], quadril = [0, -45], cab = [incl * 1.25, -100 - R + 2];
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bracos = p.bracos.map(b => b.slice());
  if (p.acena) { const w = Math.sin(t * 0.5) * 4; bracos[1][2] += w; }
  const segs = [];
  // pernas terminam no tornozelo (6 acima do pé) para o sapato encostar no chão sem afundar
  for (const [kx, ky, fx, fy] of p.pernas) segs.push([[quadril[0], quadril[1], kx, ky, fx, fy - 6], 5]);
  segs.push([[cab[0], -98, ombro[0], ombro[1], quadril[0], quadril[1]], 5]);
  for (const [ex, ey, hx, hy] of bracos) segs.push([[ombro[0], ombro[1], ex + incl * 0.5, ey, hx + incl * 0.5, hy], 5]);
  const saia = () => { ctx.beginPath(); ctx.moveTo(ombro[0] * 0.4, -64); ctx.lineTo(-15, -32); ctx.lineTo(15, -32); ctx.closePath(); };
  // contorno preto de tudo, depois as cores
  for (const [pts, w] of segs) linha(ctx, pts, PRETO, w + CONT);
  if (id === 'zuza') { saia(); ctx.strokeStyle = PRETO; ctx.lineWidth = CONT; ctx.stroke(); }
  for (const [pts, w] of segs.slice(0, 3)) linha(ctx, pts, cor, w);
  if (id === 'zuza') { saia(); ctx.fillStyle = cor; ctx.fill(); }
  // sapatos pretos pequenos: a sola fica exatamente no y do pé
  for (const [kx, , fx, fy] of p.pernas) {
    const d = Math.sign(fx - kx) || (fx < 0 ? -1 : 1);
    ctx.beginPath(); ctx.ellipse(fx + d * 2.6, fy - 3.4, 6.2, 3.4, 0, 0, Math.PI * 2); ctx.fillStyle = PRETO; ctx.fill();
    circ(ctx, fx + d * 4.4, fy - 4.8, 1.1, '#6a7080');
  }
  for (const r of roupas) if (r.corpo) r.corpo(ctx, { ombro, quadril, cor, id });
  for (const [pts, w] of segs.slice(3)) linha(ctx, pts, cor, w);
  // mãos pequenas (brancas com contorno preto); dedo levantado na pose "explicando"
  bracos.forEach(([, , hx, hy], i) => {
    const x = hx + incl * 0.5;
    if (p.dedo && i === 1) { linha(ctx, [x, hy, x + 1, hy - 7], PRETO, 4); linha(ctx, [x, hy, x + 1, hy - 7], '#ffffff', 1.8); }
    circ(ctx, x, hy, 4.2, '#ffffff', PRETO, 2.1);
  });
  ctx.save(); ctx.translate(cab[0], cab[1]); if (e.inclina) ctx.rotate(e.inclina); ctx.scale(CABECA, CABECA);
  antesDaCabeca(ctx, id);
  circ(ctx, 0, 0, 20, e.rosto || PELE, PRETO, 3.2);
  if (id === 'bento') lentesBento(ctx);
  if (id === 'tito' && !roupas.some(r => r.escondeBone)) bone(ctx, cor);
  olhos(ctx, e.olhos, e.olhar);
  sobrancelhas(ctx, e.sob, id === 'bento' ? '#7d7d7d' : CONTORNO);
  boca(ctx, e.boca, id === 'bento' ? 2 : 0);
  depoisDoRosto(ctx, id, cor);
  for (const r of roupas) if (r.cabeca) r.cabeca(ctx, { cor, id });
  extras(ctx, e.extras, t);
  ctx.restore(); ctx.restore();
}

// ---------- cachorro ----------
function cachorro(ctx, e, p, t) {
  const cor = ELENCO.pipoca.cor;
  ctx.save(); ctx.translate(0, -(p.sobe || 0)); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const [r0, r1, r2, r3, r4, r5] = p.rabo;
  const rabo = (c, w) => { ctx.beginPath(); ctx.moveTo(r0, r1); ctx.quadraticCurveTo(r2, r3, r4, r5); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); };
  const [x0, y0, x1, y1] = p.corpo; const [hx, hy] = p.cab;
  const pata = ([a, b, c, d]) => d > -1 ? [c, d - 4.5] : [c, d];  // perna no chão termina acima da patinha
  const segs = p.pernas.map(l => [[l[0], l[1], ...pata(l)], 5]);
  segs.push([[x0, y0, x1, y1], 8], [[x1, y1, hx - 2, hy + 10], 5]);
  rabo(PRETO, 5 + CONT);
  for (const [pts, w] of segs) linha(ctx, pts, PRETO, w + CONT);
  rabo(cor, 5);
  for (const [pts, w] of segs) linha(ctx, pts, cor, w);
  for (const l of p.pernas) { const [c, d] = pata(l); ctx.beginPath(); ctx.ellipse(c + 0.8, d + (l[3] > -1 ? 2.3 : 0), 3.4, 2.2, 0, 0, Math.PI * 2); ctx.fillStyle = PRETO; ctx.fill(); }
  ctx.save(); ctx.translate(hx, hy); if (p.vira) ctx.rotate(Math.PI); if (e.inclina) ctx.rotate(e.inclina); ctx.scale(CABECA_CAO, CABECA_CAO);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 11, -2, 5, 10, s * 0.25, 0, Math.PI * 2); ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = PRETO; ctx.lineWidth = 2.4; ctx.stroke(); }
  circ(ctx, 0, 0, 13, PELE, PRETO, 3);
  ctx.save(); ctx.scale(0.62, 0.62); ctx.translate(0, -4);
  olhos(ctx, e.olhos, e.olhar); sobrancelhas(ctx, e.sob); boca(ctx, e.boca, 6);
  ctx.restore();
  circ(ctx, 0, 4.2, 2.5, CONTORNO);
  ctx.save(); ctx.scale(0.75, 0.75); extras(ctx, e.extras, t); ctx.restore();
  ctx.restore(); ctx.restore();
}

// ---------- API ----------
// piscar: troca olhos abertos por fechados (só para olhos que piscam)
const pisca = (e, p) => (p && ['ponto', 'pequeno', 'grande', 'grande-mini', 'semi'].includes(e.olhos)) ? { ...e, olhos: 'fechado' } : e;
export function desenhar(ctx, id, { expr = 'neutro', pose, x = 0, y = 0, escala = 1, t = 0, espelhar = false, roupa = [], piscar = false } = {}) {
  const roupas = [].concat(roupa).map(r => typeof r === 'string' ? FIGURINOS[r] : r).filter(Boolean);
  const tipo = ELENCO[id].tipo;
  ctx.save(); ctx.translate(x, y); ctx.scale(espelhar ? -escala : escala, escala);
  if (tipo === 'cachorro') {
    const key = EXPRESSOES['pipoca-' + expr] ? 'pipoca-' + expr : expr;
    cachorro(ctx, pisca(EXPRESSOES[key] || EXPRESSOES['pipoca-feliz'], piscar), POSES_CACHORRO[pose || 'em_pe'], t);
  } else humano(ctx, id, pisca(EXPRESSOES[expr] || EXPRESSOES.neutro, piscar), POSES[pose || 'neutro'], t, roupas);
  ctx.restore();
}

// Cartão para o mundo 3D: canvas 600x1000, pés em y=975 (padrão da skill). Escala 3.9 para caber cabeção e efeitos.
export function cartao(id, opts = {}, canvas) {
  const c = canvas || Object.assign(document.createElement('canvas'), { width: 600, height: 1000 });
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
  desenhar(ctx, id, { ...opts, x: 300, y: 975, escala: 3.9 });
  return c;
}
