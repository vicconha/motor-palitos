// renderizar.mjs — renderiza os quadros de um projeto em paralelo.
// Uso:
//   node renderizar.mjs <projeto> stills "10,45,90"   -> <projeto>/stills/q0010.jpg ...
//   node renderizar.mjs <projeto> stills meio          -> 1 still no meio de cada plano (para a folha de aprovação)
//   node renderizar.mjs <projeto> tudo [inicio-fim]    -> <projeto>/quadros/f00000.jpg ... (pula os que já existem)
// Variáveis: TRABALHADORES=2 (processos em paralelo; padrão = nº de núcleos), REFAZER=1 (ignora os prontos)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { cpus } from 'node:os';
import path from 'node:path';

const raiz = path.dirname(new URL(import.meta.url).pathname);
const [projeto, modo = 'stills', alvo = 'meio'] = process.argv.slice(2);
if (!projeto) { console.error('uso: node renderizar.mjs <projeto> stills|tudo [quadros]'); process.exit(1); }
const pj = path.resolve(projeto);
const receita = JSON.parse(readFileSync(path.join(pj, 'receita.json'), 'utf8'));
const tempos = JSON.parse(readFileSync(path.join(pj, 'work/tempos.json'), 'utf8'));

const porta = 8800 + Math.floor(Math.random() * 500);
const srv = spawn('python3', ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: raiz, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function abrir() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('erro na página:', e.message));
  await p.goto(`http://127.0.0.1:${porta}/web/index.html`);
  await p.waitForFunction('window.ready === true', null, { timeout: 60000 });
  return [p, await p.evaluate(([r, t]) => window.iniciar(r, t), [receita, tempos])];
}

const [p0, info] = await abrir();
let quadros, pasta, nome;
if (modo === 'stills') {
  pasta = path.join(pj, 'stills'); nome = f => `q${String(f).padStart(5, '0')}.jpg`;
  quadros = alvo === 'meio' ? info.planos.map(([a, b]) => Math.floor((a + b) / 2)) : alvo.split(',').map(Number);
  writeFileSync(path.join(pj, 'work/stills.json'), JSON.stringify({ quadros, planos: info.planos }));
} else {
  pasta = path.join(pj, 'quadros'); nome = f => `f${String(f).padStart(5, '0')}.jpg`;
  const [a, b] = (alvo !== 'meio' && alvo.includes('-')) ? alvo.split('-').map(Number) : [0, info.total - 1];
  quadros = []; for (let f = a; f <= b; f++) quadros.push(f);
  if (!process.env.REFAZER) quadros = quadros.filter(f => !existsSync(path.join(pasta, nome(f))));
}
mkdirSync(pasta, { recursive: true });

const N = Math.max(1, Number(process.env.TRABALHADORES || cpus().length));
const paginas = [p0]; for (let i = 1; i < Math.min(N, quadros.length); i++) paginas.push((await abrir())[0]);
let feitos = 0; const t0 = Date.now(); const fila = [...quadros];
await Promise.all(paginas.map(async (pg) => {
  while (fila.length) {
    const f = fila.shift();
    const url = await pg.evaluate(f => window.renderFrame(f), f);
    writeFileSync(path.join(pasta, nome(f)), Buffer.from(url.split(',')[1], 'base64'));
    feitos++;
    if (feitos % 30 === 0 || feitos === quadros.length) {
      const s = (Date.now() - t0) / 1000;
      console.log(`${feitos}/${quadros.length} quadros · ${(s / feitos).toFixed(2)} s/quadro · faltam ~${Math.round(s / feitos * (quadros.length - feitos) / 60)} min`);
    }
  }
}));
console.log(`pronto: ${quadros.length} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s (total do vídeo: ${info.total})`);
await browser.close(); srv.kill();
