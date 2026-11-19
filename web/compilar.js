// compilar.js — transforma a receita (receita.json) + os tempos da voz (frases.json) no plano de quadros.
// Roda no Node e no navegador. Nada aqui desenha: só calcula quando cada plano começa e para onde a câmera vai.

export const FPS = 30;

// câmeras prontas: distância, altura da câmera e altura do ponto olhado (metros)
const TIPOS = {
  geral:  { dist: 7.2, alt: 1.35, olha: 1.3 },
  medio:  { dist: 4.6, alt: 1.3, olha: 1.2 },
  close:  { dist: 2.5, alt: 1.3, olha: 1.2 },
  detalhe:{ dist: 1.6, alt: 1.2, olha: 1.0 },
};

function camera(c = {}, atores = []) {
  if (c.de && c.para) return { de: c.de, para: c.para, curva: c.curva || 'suave' };
  const t = { ...TIPOS[c.tipo || 'geral'] };
  let x = 0, z = 0;
  const alvo = atores.find(a => a.id === c.alvo);
  if (alvo) { x = alvo.x || 0; z = alvo.z || 0; }
  else if (typeof c.alvo === 'number') x = c.alvo;
  else if (atores.length) { x = atores.reduce((s, a) => s + (a.x || 0), 0) / atores.length; z = Math.max(...atores.map(a => a.z || 0)) * 0.5; }
  if (c.alvo_y != null) t.olha = c.alvo_y;
  const p = (d, a, dx = 0, oy = t.olha) => [x + dx, a, z + d, x + dx * 0.6, oy, z];
  const mov = c.mov || 'aproxima';
  const D = t.dist, A = t.alt;
  switch (mov) {
    case 'afasta': return { de: p(D * 0.9, A), para: p(D * 1.12, A), curva: 'suave' };
    case 'panoramica_dir': return { de: p(D, A, -0.45), para: p(D, A, 0.45), curva: 'suave' };
    case 'panoramica_esq': return { de: p(D, A, 0.45), para: p(D, A, -0.45), curva: 'suave' };
    case 'sobe': return { de: p(D, A - 0.5, 0, t.olha - 0.3), para: p(D * 0.95, A + 0.4, 0, t.olha + 0.2), curva: 'suave' };
    case 'desce': return { de: p(D, A + 0.6, 0, t.olha + 0.3), para: p(D, A, 0), curva: 'suave' };
    case 'chicote': return { de: p(D * 1.25, A), para: p(D * 0.92, A), curva: 'entrada' };
    case 'parado': return { de: p(D, A), para: p(D * 0.97, A), curva: 'suave' };
    default: return { de: p(D * 1.12, A), para: p(D * 0.94, A), curva: 'suave' };   // aproxima (o mais comum nos virais)
  }
}

export function compilar(receita, tempos) {
  const frases = tempos.frases;
  const total = Math.round(tempos.duracao * FPS);
  const planos = receita.planos.map((pl, k) => {
    const primeira = Array.isArray(pl.frases) ? pl.frases[0] : pl.frases;
    const ini = k === 0 ? 0 : Math.round(frases[primeira].inicio * FPS) - 2;   // a imagem muda 2 quadros antes da palavra
    return { ...pl, ini, camera: camera(pl.camera, pl.atores || []) };
  });
  planos.forEach((p, k) => { p.fim = k + 1 < planos.length ? planos[k + 1].ini : total; });
  return { fps: FPS, total, planos };
}
