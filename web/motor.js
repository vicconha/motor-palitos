// motor.js — desenha qualquer quadro do vídeo a partir do plano compilado. Funções puras do número do quadro:
// qualquer processo pode renderizar qualquer quadro, em qualquer ordem (é isso que deixa rodar em paralelo).
import * as THREE from 'three';
import { cartao } from './palitos.js';
import { CENARIOS, META, semente } from './cenarios.js';
import { compilar } from './compilar.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const saida = Object.assign(document.createElement('canvas'), { width: W, height: H });
const sctx = saida.getContext('2d');
const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);

let PLANO = null;
const cenas = new Map();          // cenário -> { scene, atores: Map }
const texturas = new Map();       // chave do desenho -> CanvasTexture

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const lerp = (a, b, t) => a + (b - a) * t;

function cenaDe(nome) {
  if (!cenas.has(nome)) {
    if (!CENARIOS[nome]) throw new Error('cenário desconhecido: ' + nome);
    semente(hash(nome) % 2147483646 + 1);
    const scene = new THREE.Scene(); CENARIOS[nome](scene);
    cenas.set(nome, { scene, atores: new Map() });
  }
  return cenas.get(nome);
}

function sombraContato() {
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }); const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
const TEX_SOMBRA = sombraContato();

function atorMesh(cena, chave, tint) {
  if (cena.atores.has(chave)) return cena.atores.get(chave);
  const h = 2.25, w = h * 0.6;
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2 - h * 0.025, 0);
  const mat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, color: tint });
  const m = new THREE.Mesh(geo, mat); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.28), new THREE.MeshBasicMaterial({ map: TEX_SOMBRA, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2;
  cena.scene.add(m, sh);
  const a = { m, sh }; cena.atores.set(chave, a); return a;
}

function textura(id, o) {
  const chave = JSON.stringify([id, o.expr, o.pose, o.roupa, o.espelhar, o.piscar, o.t]);
  if (!texturas.has(chave)) {
    if (texturas.size > 300) { for (const [k, t] of texturas) { t.dispose(); texturas.delete(k); if (texturas.size < 200) break; } }
    const t = new THREE.CanvasTexture(cartao(id, o)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    texturas.set(chave, t);
  }
  return texturas.get(chave);
}

// estado de um ator num instante do plano (mudanças de expressão/pose, caminhada, respiração, piscadas)
function estadoAtor(a, f, p) {
  const len = Math.max(1, p.fim - p.ini), u = (f - p.ini) / len, seed = hash(a.id + (a.x || 0));
  const s = { expr: a.expr || 'neutro', pose: a.pose, roupa: a.roupa || [], espelhar: !!a.espelhar, x: a.x || 0, z: a.z || 0, pop: 1, pula: 0 };
  let ultima = null;
  for (const m of a.muda || []) if (u >= m.em) { Object.assign(s, Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'em'))); ultima = m; }
  if (ultima) { const k = (f - (p.ini + ultima.em * len)) / 6; if (k < 1) s.pop = 1 + 0.09 * (1 - k) * Math.sin(k * Math.PI * 1.5 + 0.6); }
  if (a.anda) {
    const [x2, z2] = a.anda.para, d = a.anda.de ?? 0, e = a.anda.ate ?? 1;
    const k = ss((u - d) / Math.max(0.01, e - d));
    s.x = lerp(s.x, x2, k); s.z = lerp(s.z, z2, k);
    if (k > 0 && k < 1) s.pula = Math.abs(Math.sin(f * 0.45)) * 0.05;
  }
  s.respira = Math.sin(f * 0.12 + seed) * 0.008;
  s.piscar = ((f + seed % 97) % 97) < 3;
  s.t = Math.floor(f / 4) % 16;   // anima efeitos (estrelas, aceno) devagar
  return s;
}

function posicionaCamera(p, f) {
  const len = Math.max(1, p.fim - p.ini), u = (f - p.ini) / len;
  const k = p.camera.curva === 'entrada' ? easeOut(u * 1.6) : ss(u);
  const [a, b] = [p.camera.de, p.camera.para];
  const v = a.map((x, i) => lerp(x, b[i], k));
  // tremida nos impactos: fx "tremor:0.6" = 7 quadros a partir de 60% do plano
  let jx = 0, jy = 0;
  for (const fx of p.fx || []) {
    const [nome, quando] = String(fx).split(':');
    if (nome !== 'tremor') continue;
    const q = (f - (p.ini + Number(quando || 0) * len));
    if (q >= 0 && q < 7) { const amp = 0.06 * (1 - q / 7); jx += Math.sin(q * 9.1) * amp; jy += Math.cos(q * 7.3) * amp; }
  }
  cam.position.set(v[0] + jx, v[1] + jy, v[2]); cam.lookAt(v[3] + jx * 0.5, v[4] + jy * 0.5, v[5]);
  if (p.virada) cam.rotateZ(0.05 * ss(u));       // leve rotação dramática na virada
  cam.fov = 40; cam.updateProjectionMatrix();
}

function desenhaPlano(p, f) {
  const cena = cenaDe(p.cenario), meta = META[p.cenario] || { tint: '#ffffff' };
  for (const a of cena.atores.values()) { a.m.visible = false; a.sh.visible = false; }
  posicionaCamera(p, f);
  (p.atores || []).forEach((a, i) => {
    const s = estadoAtor(a, f, p);
    const am = atorMesh(cena, a.id + '#' + i, meta.tint);
    am.m.material.map = textura(a.id, s); am.m.material.needsUpdate = true;
    am.m.customDepthMaterial.map = am.m.material.map; am.m.customDepthMaterial.needsUpdate = true;
    am.m.position.set(s.x, s.respira + s.pula, s.z);
    am.m.scale.set(s.pop, s.pop * (1 + s.respira), 1);
    const olho = cam.position.clone(); olho.y = am.m.position.y; am.m.lookAt(olho);
    am.sh.position.set(s.x, 0.01, s.z); am.sh.scale.setScalar(a.id === 'pipoca' ? 1.1 : 1);
    am.m.visible = am.sh.visible = true;
  });
  renderer.render(cena.scene, cam);
}

const ALFA_TRANS = 4;   // fusão de 8 quadros (~0,27 s) entre planos
function quadro(f) {
  const P = PLANO.planos;
  const k = P.findIndex(p => f >= p.ini && f < p.fim);
  const p = P[Math.max(0, k)];
  sctx.globalAlpha = 1;
  desenhaPlano(p, f); sctx.drawImage(renderer.domElement, 0, 0);
  // fusão com o plano vizinho perto da borda
  const prox = P[k + 1], ant = P[k - 1];
  if (prox && prox.transicao !== 'corte' && f >= p.fim - ALFA_TRANS) {
    const a = (f - (p.fim - ALFA_TRANS)) / (2 * ALFA_TRANS);
    desenhaPlano(prox, f); sctx.globalAlpha = a; sctx.drawImage(renderer.domElement, 0, 0);
  } else if (ant && p.transicao !== 'corte' && f < p.ini + ALFA_TRANS) {
    const a = 0.5 - (f - p.ini) / (2 * ALFA_TRANS);
    desenhaPlano(ant, f); sctx.globalAlpha = Math.max(0, a); sctx.drawImage(renderer.domElement, 0, 0);
  }
  // flash branco: transicao "flash" (salto no tempo) ou fx "flash"
  const flash = p.transicao === 'flash' || (p.fx || []).includes('flash');
  if (flash && f - p.ini < 6) { sctx.globalAlpha = 0.85 * (1 - (f - p.ini) / 6); sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, W, H); }
  // vinheta leve
  sctx.globalAlpha = 1;
  const vg = sctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  sctx.fillStyle = vg; sctx.fillRect(0, 0, W, H);
  return saida.toDataURL('image/jpeg', 0.92);
}

window.iniciar = (receita, tempos) => { PLANO = compilar(receita, tempos); return { total: PLANO.total, planos: PLANO.planos.map(p => [p.ini, p.fim]) }; };
window.renderFrame = (f) => quadro(f);
window.ready = true;
