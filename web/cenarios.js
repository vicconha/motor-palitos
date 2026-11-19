// cenarios.js — cenários prontos (mundo 3D estilizado com contorno preto). Para criar um novo, copie um preset,
// mude as peças e registre em CENARIOS e META. Cada função recebe a cena vazia e monta céu, luz, chão e objetos.
import * as THREE from 'three';

// ---------- materiais toon + contorno ----------
const grad = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const toon = (o = {}) => new THREE.MeshToonMaterial({ gradientMap: grad, ...o });
const tinta = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { w: { value: 0.035 } },
  vertexShader: `uniform float w; void main(){ vec3 p = position + normal * w; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
  fragmentShader: `void main(){ gl_FragColor = vec4(0.07,0.07,0.09,1.0); }`,
});
function malha(geo, mat, { contorno = true, w = 0.035, sombra = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = sombra; m.receiveShadow = true;
  if (contorno) { const t = tinta.clone(); t.uniforms.w.value = w; const o = new THREE.Mesh(geo, t); m.add(o); }
  return m;
}
function tex(px, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = px; const g = c.getContext('2d'); draw(g, px);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
let _s = 7;
const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647;
// mesma semente = mesmo cenário em todos os processos de renderização
export const semente = (v) => { _s = v; };
function riscos(g, n, cores, w, h, len = 10, lw = 3) {
  for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h; g.strokeStyle = cores[i % cores.length]; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 4, y - len * (0.5 + rnd())); g.stroke(); }
}
const T = {
  grama: () => tex(256, (g, s) => { g.fillStyle = '#6dbb4a'; g.fillRect(0, 0, s, s); riscos(g, 500, ['#5aa53c', '#82cc5a', '#4f9634'], s, s); }, [30, 30]),
  terra: () => tex(256, (g, s) => { g.fillStyle = '#c99a62'; g.fillRect(0, 0, s, s); for (let i = 0; i < 160; i++) { g.fillStyle = ['#b98852', '#d8ab74', '#a87a48'][i % 3]; g.beginPath(); g.arc(rnd() * s, rnd() * s, 2 + rnd() * 5, 0, 7); g.fill(); } }, [2, 12]),
  tabuas: (cor = '#b07a45') => tex(256, (g, s) => { g.fillStyle = cor; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(40,20,10,.55)'; g.lineWidth = 4; for (let y = 0; y <= s; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); } for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(60,30,10,.25)'; g.lineWidth = 2; const y = rnd() * s; g.beginPath(); g.moveTo(rnd() * s, y); g.lineTo(rnd() * s, y + 2); g.stroke(); } }, [2, 2]),
  tijolo: (cor = '#c9664a') => tex(256, (g, s) => { g.fillStyle = '#e8d8c0'; g.fillRect(0, 0, s, s); for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) { g.fillStyle = r % 3 ? cor : '#b85a40'; g.fillRect(c * 72 + (r % 2) * 36 + 4, r * 32 + 4, 64, 24); } }, [3, 3]),
  reboco: (cor) => tex(256, (g, s) => { g.fillStyle = cor; g.fillRect(0, 0, s, s); for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(0,0,0,.05)'; g.beginPath(); g.arc(rnd() * s, rnd() * s, 4 + rnd() * 14, 0, 7); g.fill(); } }, [1, 1]),
  telha: (cor = '#c4473a') => tex(256, (g, s) => { g.fillStyle = cor; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(60,10,10,.5)'; g.lineWidth = 3; for (let y = 0; y < s; y += 28) for (let x = (y / 28 % 2) * 16; x < s; x += 32) { g.beginPath(); g.arc(x + 16, y, 16, 0, Math.PI); g.stroke(); } }, [3, 2]),
  areia: () => tex(256, (g, s) => { g.fillStyle = '#e9c27a'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(180,120,50,.35)'; g.lineWidth = 3; for (let y = 10; y < s; y += 22) { g.beginPath(); for (let x = 0; x <= s; x += 8) g.lineTo(x, y + Math.sin(x / 20 + y) * 4); g.stroke(); } }, [20, 20]),
  pedraEgito: () => tex(256, (g, s) => { g.fillStyle = '#d9b26e'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(110,70,30,.45)'; g.lineWidth = 3; for (let y = 0; y < s; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); for (let x = (y / 21 % 2) * 20; x < s; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 21); g.stroke(); } } }, [6, 6]),
  lua: () => tex(256, (g, s) => { g.fillStyle = '#b9bcc6'; g.fillRect(0, 0, s, s); for (let i = 0; i < 60; i++) { const x = rnd() * s, y = rnd() * s, r = 3 + rnd() * 16; g.fillStyle = '#9ea2ae'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#d4d7df'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, r, 3.6, 5.6); g.stroke(); } }, [14, 14]),
  ceu: (cima, baixo, estrelas = 0) => { const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, cima); gr.addColorStop(1, baixo); g.fillStyle = gr; g.fillRect(0, 0, 8, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; },
};

// ---------- peças ----------
function casa(scene, x, z, { parede = '#f3e3c3', telhado = '#c4473a', larg = 3, alt = 2.4, prof = 3, rot = 0, janelaAcesa = false } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
  const corpo = malha(new THREE.BoxGeometry(larg, alt, prof), toon({ map: T.reboco(parede) })); corpo.position.y = alt / 2; g.add(corpo);
  const tg = new THREE.CylinderGeometry(0.01, larg * 0.82, 1.5, 4, 1); const tel = malha(tg, toon({ map: T.telha(telhado) })); tel.rotation.y = Math.PI / 4; tel.scale.set(1, 1, prof / larg); tel.position.y = alt + 0.75; g.add(tel);
  const porta = malha(new THREE.BoxGeometry(0.7, 1.3, 0.08), toon({ map: T.tabuas('#8a5530') }), { w: 0.02 }); porta.position.set(-larg * 0.2, 0.65, prof / 2 + 0.03); g.add(porta);
  const jm = janelaAcesa ? new THREE.MeshBasicMaterial({ color: '#ffcf6a' }) : toon({ color: '#7fb6e0' });
  const jan = malha(new THREE.BoxGeometry(0.7, 0.6, 0.08), jm, { w: 0.025 }); jan.position.set(larg * 0.22, 1.45, prof / 2 + 0.03); g.add(jan);
  scene.add(g); return g;
}
function arvore(scene, x, z, s = 1, cor = '#4f9e3a') {
  const t = malha(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.4 * s, 7), toon({ color: '#7a5030' })); t.position.set(x, 0.7 * s, z); scene.add(t);
  for (const [dx, dy, r] of [[0, 1.9, 0.8], [0.35, 1.6, 0.55], [-0.35, 1.65, 0.55]]) { const c = malha(new THREE.IcosahedronGeometry(r * s, 1), toon({ color: cor })); c.position.set(x + dx * s, dy * s, z); scene.add(c); }
}
function colina(scene, x, z, r, cor) { const c = malha(new THREE.SphereGeometry(r, 24, 12), toon({ color: cor }), { w: 0.08 }); c.position.set(x, -r * 0.55, z); c.castShadow = false; scene.add(c); }
function nuvem(scene, x, y, z, s = 1) { const g = new THREE.Group(); for (const [dx, dy, r] of [[0, 0, 1], [1.1, -0.2, 0.75], [-1.1, -0.2, 0.8], [0.5, 0.4, 0.7]]) { const m = malha(new THREE.SphereGeometry(r * s, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), { w: 0.06, sombra: false }); m.position.set(dx * s, dy * s, 0); g.add(m); } g.position.set(x, y, z); scene.add(g); }

function solarCam(sol) { sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const c = sol.shadow.camera; c.left = c.bottom = -12; c.right = c.top = 12; c.near = 1; c.far = 80; sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.02; }

export const CENARIOS = {
  vila_dia(scene) {
    scene.background = T.ceu('#5fb4f0', '#cfeaff'); scene.fog = new THREE.Fog('#cfeaff', 18, 70);
    scene.add(new THREE.HemisphereLight('#dff1ff', '#6a8f4a', 0.9));
    const sol = new THREE.DirectionalLight('#fff4dc', 2.2); sol.position.set(8, 14, 6); solarCam(sol); scene.add(sol);
    const chao = malha(new THREE.PlaneGeometry(200, 200), toon({ map: T.grama() }), { contorno: false }); chao.rotation.x = -Math.PI / 2; scene.add(chao);
    const cam2 = malha(new THREE.PlaneGeometry(2.6, 60), toon({ map: T.terra() }), { contorno: false }); cam2.rotation.x = -Math.PI / 2; cam2.position.set(0.3, 0.005, -20); scene.add(cam2);
    casa(scene, -3.6, -4, { rot: 0.35 }); casa(scene, 3.8, -6, { parede: '#e9d3f0', telhado: '#3e6fb5', rot: -0.3 }); casa(scene, -1, -14, { parede: '#fff1d6', larg: 3.4, rot: 0.1 });
    arvore(scene, 2.4, -2.5, 1.1); arvore(scene, -5.5, -9, 1.3, '#3f8f37'); arvore(scene, 6.5, -12, 1.5); arvore(scene, -2.6, -1.4, 0.8, '#5fae3f');
    colina(scene, -14, -40, 16, '#7cc25a'); colina(scene, 12, -45, 20, '#69b04c'); colina(scene, 0, -60, 26, '#8fd06c');
    nuvem(scene, -6, 13, -30, 1.6); nuvem(scene, 7, 15, -36, 2);
  },
  vila_noite(scene) {
    scene.background = T.ceu('#0b1838', '#284a7e'); scene.fog = new THREE.Fog('#1c3460', 10, 45);
    scene.add(new THREE.HemisphereLight('#6d8fd0', '#1a2a44', 0.55));
    const lua = new THREE.DirectionalLight('#8fb0ff', 0.6); lua.position.set(-8, 14, 4); solarCam(lua); scene.add(lua);
    const chao = malha(new THREE.PlaneGeometry(200, 200), toon({ map: T.grama() }), { contorno: false }); chao.rotation.x = -Math.PI / 2; scene.add(chao);
    const cam2 = malha(new THREE.PlaneGeometry(2.6, 60), toon({ map: T.terra() }), { contorno: false }); cam2.rotation.x = -Math.PI / 2; cam2.position.set(0.3, 0.005, -20); scene.add(cam2);
    casa(scene, -3.4, -3.5, { rot: 0.35, janelaAcesa: true }); casa(scene, 3.8, -6, { parede: '#e9d3f0', telhado: '#3e6fb5', rot: -0.3, janelaAcesa: true });
    arvore(scene, -5.5, -9, 1.3, '#3f8f37'); arvore(scene, 6.5, -12, 1.5);
    colina(scene, -14, -40, 16, '#3d6a52'); colina(scene, 12, -45, 20, '#35604a');
    const poste = malha(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8), toon({ color: '#2d2d35' })); poste.position.set(1.15, 1.4, -1.2); scene.add(poste);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffd27a' })); lamp.position.set(1.15, 2.85, -1.2); scene.add(lamp);
    const luz = new THREE.PointLight('#ffb54a', 9, 9, 1.6); luz.position.set(1.15, 2.7, -1.0); luz.castShadow = true; scene.add(luz);
    for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff7d6', fog: false })); s.position.set((rnd() - .5) * 60, 14 + rnd() * 18, -40 - rnd() * 10); scene.add(s); }
    const luaM = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 16), new THREE.MeshBasicMaterial({ color: '#fff3c8', fog: false })); luaM.position.set(-9, 22, -45); scene.add(luaM);
  },
  laboratorio(scene) {
    scene.background = new THREE.Color('#3a2414'); scene.fog = new THREE.Fog('#4a2e18', 9, 25);
    scene.add(new THREE.HemisphereLight('#ffd7a0', '#5a3a20', 0.6));
    const sol = new THREE.DirectionalLight('#ffb860', 1.6); sol.position.set(4, 7, 5); solarCam(sol); scene.add(sol);
    const chao = malha(new THREE.PlaneGeometry(30, 30), toon({ map: T.tabuas('#a26a3a') }), { contorno: false }); chao.material.map.repeat.set(8, 8); chao.rotation.x = -Math.PI / 2; scene.add(chao);
    const parede = malha(new THREE.BoxGeometry(14, 6, 0.3), toon({ map: T.tijolo() }), { contorno: false }); parede.position.set(0, 3, -3.2); scene.add(parede);
    const mesa = malha(new THREE.BoxGeometry(3.2, 0.12, 1.1), toon({ map: T.tabuas('#7a4a28') })); mesa.position.set(0.4, 1.0, -1.8); scene.add(mesa);
    for (const dx of [-1.4, 1.4]) for (const dz of [-0.4, 0.4]) { const p = malha(new THREE.BoxGeometry(0.1, 1, 0.1), toon({ color: '#5a3418' }), { w: 0.02 }); p.position.set(0.4 + dx, 0.5, -1.8 + dz); scene.add(p); }
    const cores = ['#46e07a', '#ff5ab0', '#4ad0ff', '#ffd23f'];
    cores.forEach((c, i) => { const f = malha(new THREE.CylinderGeometry(0.1, 0.18, 0.45, 12), new THREE.MeshBasicMaterial({ color: c }), { w: 0.02 }); f.position.set(-0.5 + i * 0.5, 1.3, -1.8); scene.add(f); const l = new THREE.PointLight(c, 1.2, 2.5); l.position.set(f.position.x, 1.6, -1.6); scene.add(l); });
    const est = malha(new THREE.BoxGeometry(2.4, 0.08, 0.5), toon({ map: T.tabuas('#7a4a28') })); est.position.set(-2.5, 2.6, -2.9); scene.add(est);
    for (let i = 0; i < 4; i++) { const b = malha(new THREE.BoxGeometry(0.25, 0.5 + rnd() * 0.2, 0.35), toon({ color: ['#c84a3a', '#3a6ac8', '#d8b03a', '#4a9a5a'][i] }), { w: 0.02 }); b.position.set(-3.3 + i * 0.32, 2.9, -2.9); scene.add(b); }
    const fum = []; for (let i = 0; i < 7; i++) { const s = malha(new THREE.SphereGeometry(0.35 + rnd() * 0.3, 14, 10), new THREE.MeshBasicMaterial({ color: ['#cfc7ba', '#b9b1a5', '#ddd6ca'][i % 3] }), { w: 0.04, sombra: false }); s.position.set(0.6 + (rnd() - .5) * 1.6, 1.9 + rnd() * 1.3, -2.0); scene.add(s); }
  },
  deserto(scene) {
    scene.background = T.ceu('#ff9a4a', '#ffe3a8'); scene.fog = new THREE.Fog('#ffd9a0', 25, 110);
    scene.add(new THREE.HemisphereLight('#ffe8c0', '#c08040', 0.9));
    const sol = new THREE.DirectionalLight('#ffd08a', 2.3); sol.position.set(-10, 9, 4); solarCam(sol); scene.add(sol);
    const chao = malha(new THREE.PlaneGeometry(300, 300), toon({ map: T.areia() }), { contorno: false }); chao.rotation.x = -Math.PI / 2; scene.add(chao);
    const pir = (x, z, s) => { const p = malha(new THREE.ConeGeometry(s, s * 1.25, 4), toon({ map: T.pedraEgito() }), { w: 0.12 }); p.position.set(x, s * 0.62, z); p.rotation.y = 0.5; scene.add(p); };
    pir(-6, -38, 14); pir(12, -55, 11); pir(28, -70, 8);
    for (const [x, z, r] of [[-20, -30, 10], [18, -28, 8], [0, -90, 30]]) { const d = malha(new THREE.SphereGeometry(r, 24, 12), toon({ color: '#eec07a' }), { w: 0.1 }); d.position.set(x, -r * 0.7, z); scene.add(d); }
    const palm = (x, z) => { const t = malha(new THREE.CylinderGeometry(0.12, 0.2, 3.2, 7), toon({ color: '#9a6a3a' })); t.position.set(x, 1.6, z); t.rotation.z = 0.12; scene.add(t); for (let i = 0; i < 6; i++) { const f = malha(new THREE.ConeGeometry(0.28, 1.8, 4), toon({ color: '#4fa04a' }), { w: 0.02 }); f.position.set(x + 0.2, 3.2, z); f.rotation.set(Math.cos(i) * 1.2, i, Math.sin(i * 1.7) * 1.2 + 1.2); scene.add(f); } };
    palm(2.8, -3.5); palm(-3.4, -6);
    const solM = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff1b0', fog: false })); solM.position.set(-18, 14, -80); scene.add(solM);
  },
  espaco(scene) {
    scene.background = new THREE.Color('#05060f'); scene.fog = null;
    scene.add(new THREE.HemisphereLight('#a0b0ff', '#202030', 0.5));
    const sol = new THREE.DirectionalLight('#ffffff', 2.6); sol.position.set(10, 8, 6); solarCam(sol); scene.add(sol);
    const chao = malha(new THREE.PlaneGeometry(200, 200), toon({ map: T.lua() }), { contorno: false }); chao.rotation.x = -Math.PI / 2; scene.add(chao);
    for (const [x, z, r] of [[-3, -5, 1.6], [4, -9, 2.4], [-7, -16, 3]]) { const cr = malha(new THREE.TorusGeometry(r, 0.25, 8, 28), toon({ color: '#c8cbd4' }), { w: 0.04 }); cr.rotation.x = -Math.PI / 2; cr.position.set(x, 0.05, z); scene.add(cr); }
    for (let i = 0; i < 6; i++) { const p = malha(new THREE.DodecahedronGeometry(0.3 + rnd() * 0.5, 0), toon({ color: '#9da1ad' }), { w: 0.03 }); p.position.set((rnd() - .5) * 10, 0.2, -2 - rnd() * 8); scene.add(p); }
    for (let i = 0; i < 160; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rnd() * 0.06, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); s.position.set((rnd() - .5) * 80, 4 + rnd() * 40, -40 - rnd() * 20); scene.add(s); }
    const terra = new THREE.Mesh(new THREE.SphereGeometry(6, 48, 32), toon({ map: tex(512, (g, s) => { g.fillStyle = '#2f7fd8'; g.fillRect(0, 0, s, s); g.fillStyle = '#4fbf5a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 30 + rnd() * 50, 20 + rnd() * 40, rnd() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.ellipse(rnd() * s, rnd() * s, 30 + rnd() * 40, 6, 0, 0, 7); g.fill(); } }) }));
    terra.position.set(5, 20, -45); terra.add(new THREE.Mesh(terra.geometry, (() => { const t = tinta.clone(); t.uniforms.w.value = 0.15; return t; })())); scene.add(terra);
  },
};


// tint: cor multiplicada nos cartões dos personagens; noite: a legenda fica branco-azulada
export const META = {
  vila_dia: { tint: '#ffffff', noite: false },
  vila_noite: { tint: '#c0ccf5', noite: true },
  laboratorio: { tint: '#fff1dc', noite: false },
  deserto: { tint: '#fff4e6', noite: false },
  espaco: { tint: '#ffffff', noite: true },
};
export { malha, toon, tex, T, casa, arvore, colina, nuvem, solarCam };
