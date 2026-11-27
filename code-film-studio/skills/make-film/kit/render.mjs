#!/usr/bin/env node
// render.mjs — unified renderer & dev server (Playwright Chromium 2D/3D primary + Node @napi-rs/canvas 2D fallback).
// Usage:
//   node render.mjs --serve --project <dir>                       live browser player
//   node render.mjs --project <dir> --still 12.4 --out frame.png  single frame PNG
//   node render.mjs --project <dir> --sheet --out sheet.png       contact sheet (1 thumb per shot)
//   node render.mjs --project <dir> --styles --at 8.5 --out s.png style comparison grid (all styles)
//   node render.mjs --project <dir> --preview --out draft.mp4     fast 960p preview MP4
//   node render.mjs --project <dir> --out final.mp4               full-resolution MP4 (+ build/mix.wav or voiceover)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire, register } from 'node:module';

const KIT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const flag = k => args.includes(`--${k}`);
const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };

const rawProj = opt('project', path.join(KIT, 'examples/what-if-demo'));
const projAbs = path.resolve(rawProj);
if (!fs.existsSync(path.join(projAbs, 'config.json'))) {
  console.error(`ERROR: No config.json in ${projAbs}`); process.exit(2);
}
const cfg = JSON.parse(fs.readFileSync(path.join(projAbs, 'config.json'), 'utf8'));

// ---------- Locate FFmpeg (env -> PATH -> imageio-ffmpeg fallback) ----------
function findFFmpeg() {
  if (process.env.FFMPEG_BIN && fs.existsSync(process.env.FFMPEG_BIN)) return process.env.FFMPEG_BIN;
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['ffmpeg'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim().split(/\r?\n/)[0];
  for (const py of [process.env.PYTHON_BIN, 'python3', 'python', '/tmp/venv/bin/python'].filter(Boolean)) {
    const r = spawnSync(py, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() && fs.existsSync(r.stdout.trim())) return r.stdout.trim();
  }
  return 'ffmpeg';
}

// ---------- Static server exposing /kit/* and /__proj/* ----------
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2' };
function startServer(port = 0, host = '127.0.0.1') {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const full = u.startsWith('/__proj/') ? path.join(projAbs, u.slice(8))
                 : u.startsWith('/kit/')    ? path.join(KIT, u.slice(5))
                 :                            path.join(KIT, u);
      const root = u.startsWith('/__proj/') ? projAbs : KIT;
      if (!path.resolve(full).startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
        rsp.writeHead(404); rsp.end('not found'); return;
      }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(full).pipe(rsp);
    }).listen(port, host, () => res({ srv, port: srv.address().port }));
  });
}

if (flag('serve')) {
  const host = opt('host', '0.0.0.0');
  const { port } = await startServer(Number(opt('port', 4321)), host);
  console.log(`Live player -> http://localhost:${port}/kit/player.html?project=__proj`);
  await new Promise(() => {});
}

// ---------- Dimensions & options ----------
const aspect = opt('aspect', cfg.aspect || '16:9');
const vertical = aspect === '9:16';
const preview = flag('preview');
const baseW = vertical ? (cfg.verticalWidth || 1080) : (cfg.width || 1920);
const W = Number(opt('w', preview ? Math.round(baseW / 2) : baseW));
const H = Math.round(W * (vertical ? 16 / 9 : 9 / 16));
const styleOpt = opt('style', '');
const backendPref = opt('backend', 'auto'); // auto | browser | node

// Try loading Playwright or Node @napi-rs/canvas
async function tryPlaywright() {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'] });
    return browser;
  } catch { return null; }
}

function tryNodeCanvas() {
  const candidates = ['@napi-rs/canvas', path.join(KIT, 'node_modules/@napi-rs/canvas'), '/tmp/node-test/node_modules/@napi-rs/canvas'];
  for (const c of candidates) {
    try { return require(c); } catch {}
  }
  return null;
}

const shotsDoc = fs.existsSync(path.join(projAbs, 'story/shots.json'))
  ? JSON.parse(fs.readFileSync(path.join(projAbs, 'story/shots.json'), 'utf8'))
  : { shots: [] };
const wordsDoc = fs.existsSync(path.join(projAbs, 'timeline/words.json'))
  ? JSON.parse(fs.readFileSync(path.join(projAbs, 'timeline/words.json'), 'utf8'))
  : { words: [] };

let browser = null;
if (backendPref !== 'node') browser = await tryPlaywright();

// ---------- Node Canvas fallback engine ----------
let _kitHookRegistered = false;
async function createNodeRenderer() {
  const napi = tryNodeCanvas();
  if (!napi) throw new Error('Neither Playwright Chromium nor @napi-rs/canvas is installed. Run npm install in kit/.');
  globalThis.__createCanvas = napi.createCanvas;
  if (!_kitHookRegistered) {
    const kitUrl = pathToFileURL(KIT + path.sep).href;
    const hook = `export async function resolve(s, c, next) { return s.startsWith('/kit/') ? next(${JSON.stringify(kitUrl)} + s.slice(5), c) : next(s, c); }`;
    register('data:text/javascript,' + encodeURIComponent(hook));
    _kitHookRegistered = true;
  }
  const core = await import('/kit/engine/core.js');
  const stylesMod = await import('/kit/engine/styles.js');
  const comp = await import('/kit/engine/compositor.js');
  core.E.words = wordsDoc.words || [];
  core.E.shots = shotsDoc.shots || [];
  const { outW, outH } = comp.configureStage(cfg, { aspect, width: W, height: H, styleOverride: styleOpt || undefined });
  await import(pathToFileURL(path.join(projAbs, 'scenes/index.js')).href);
  // Ensure no 3D shot silently fails in Node mode
  for (const s of core.E.shots) {
    const def = core.getShot(s.id);
    if (def?.kind === '3d') throw new Error(`Shot '${s.id}' is kind:'3d' and requires Playwright Chromium WebGL backend.`);
  }
  const canvas = napi.createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  const duration = core.E.shots.reduce((m, s) => Math.max(m, s.start + s.dur), cfg.duration || 10);
  return {
    napi, core, stylesMod, comp, canvas, ctx,
    meta: { duration, fps: core.E.fps, width: outW, height: outH, shots: core.E.shots.length, style: core.E.styleId },
    setStyle(id) { core.setStyle(id); comp.resetCompositorState(); },
    frameBuffer(t, fmt = 'png') {
      comp.renderFilmFrame(ctx, canvas, core.E.shots, t);
      if (fmt === 'raw') return canvas.data();
      return fmt === 'jpeg' ? canvas.toBuffer('image/jpeg', 94) : canvas.toBuffer('image/png');
    },
  };
}

// =========================================================================
// PATH A: PLAYWRIGHT BROWSER BACKEND
// =========================================================================
if (browser) {
  const { srv, port } = await startServer(0);
  const url = extra => `http://127.0.0.1:${port}/kit/player.html?project=__proj&headless=1&aspect=${encodeURIComponent(aspect)}&w=${W}${styleOpt ? `&style=${styleOpt}` : ''}${extra || ''}`;
  const openPage = async extra => {
    const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    p.on('pageerror', e => console.error('[pageerror]', e.message));
    await p.goto(url(extra));
    await p.waitForFunction(() => window.__READY === true, null, { timeout: 30000 });
    return p;
  };
  const grab = async (p, t, mime = 'image/png', q = 0.94) =>
    Buffer.from(await p.evaluate(async ([tt, m, qq]) => Array.from(new Uint8Array(await window.__frame(tt, m, qq))), [t, mime, q]));

  const page0 = await openPage();
  const meta = await page0.evaluate(() => window.__META);

  if (opt('still') !== null) {
    const out = path.resolve(opt('out', 'still.png')); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await grab(page0, Number(opt('still')), 'image/png'));
    console.log(`wrote ${out}`); await browser.close(); srv.close(); process.exit(0);
  }

  if (flag('styles')) {
    const { STYLE_IDS, STYLES } = await import(pathToFileURL(path.join(KIT, 'engine/styles.js')).href);
    const t = Number(opt('at', meta.duration * 0.35)), cols = 3, rows = Math.ceil(STYLE_IDS.length / cols);
    const tw = 640, th = Math.round(tw * H / W);
    const thumbs = [];
    for (const id of STYLE_IDS) {
      await page0.evaluate(s => window.__setStyle(s), id);
      thumbs.push({ id, name: STYLES[id].name, b64: (await grab(page0, t, 'image/jpeg', 0.92)).toString('base64') });
    }
    const grid = await page0.evaluate(async ({ thumbs, cols, rows, tw, th }) => {
      const pad = 22, head = 46, c = document.createElement('canvas');
      c.width = cols * tw + (cols + 1) * pad; c.height = rows * (th + head) + (rows + 1) * pad;
      const g = c.getContext('2d'); g.fillStyle = '#0e1018'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < thumbs.length; i++) {
        const im = new Image(); im.src = 'data:image/jpeg;base64,' + thumbs[i].b64; await im.decode();
        const x = pad + (i % cols) * (tw + pad), y = pad + Math.floor(i / cols) * (th + head + pad);
        g.drawImage(im, x, y, tw, th);
        g.fillStyle = '#e8e4f4'; g.font = '700 21px Fredoka, sans-serif';
        g.fillText(`${thumbs[i].name}  (--style ${thumbs[i].id})`, x + 6, y + th + 30);
      }
      const b = await new Promise(r => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer()));
    }, { thumbs, cols, rows, tw, th });
    const out = path.resolve(opt('out', path.join(projAbs, 'exports/styles.png'))); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(grid)); console.log(`wrote ${out}`);
    await browser.close(); srv.close(); process.exit(0);
  }

  if (flag('sheet')) {
    const shots = shotsDoc.shots;
    const cols = vertical ? 6 : 4, tw = vertical ? 270 : 480, th = Math.round(tw * H / W), rows = Math.ceil(shots.length / cols);
    const thumbs = [];
    for (const s of shots) thumbs.push({ label: `${s.id}  (${s.start.toFixed(1)}-${(s.start + s.dur).toFixed(1)}s)`, b64: (await grab(page0, s.start + s.dur * 0.5, 'image/jpeg', 0.9)).toString('base64') });
    const sheet = await page0.evaluate(async ({ thumbs, cols, rows, tw, th }) => {
      const pad = 16, head = 34, c = document.createElement('canvas');
      c.width = cols * tw + (cols + 1) * pad; c.height = rows * (th + head) + (rows + 1) * pad;
      const g = c.getContext('2d'); g.fillStyle = '#0c0d14'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < thumbs.length; i++) {
        const im = new Image(); im.src = 'data:image/jpeg;base64,' + thumbs[i].b64; await im.decode();
        const x = pad + (i % cols) * (tw + pad), y = pad + Math.floor(i / cols) * (th + head + pad);
        g.drawImage(im, x, y, tw, th); g.fillStyle = '#d8d4e8'; g.font = '600 15px Nunito, sans-serif'; g.fillText(thumbs[i].label, x + 4, y + th + 22);
      }
      const b = await new Promise(r => c.toBlob(r, 'image/png')); return Array.from(new Uint8Array(await b.arrayBuffer()));
    }, { thumbs, cols, rows, tw, th });
    const out = path.resolve(opt('out', path.join(projAbs, 'exports/sheet.png'))); fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(sheet)); console.log(`wrote ${out}`);
    await browser.close(); srv.close(); process.exit(0);
  }

  // Video render (parallel workers)
  const fps = Number(opt('fps', meta.fps));
  const t0 = Number(opt('from', 0)), t1 = Number(opt('to', meta.duration));
  const total = Math.max(1, Math.round((t1 - t0).toFixed ? (t1 - t0) * fps : 1));
  const workers = Math.min(total, Number(opt('workers', Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2))))));
  const out = path.resolve(opt('out', path.join(projAbs, `exports/${preview ? 'preview' : 'final'}.mp4`)));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const mixWav = path.join(projAbs, 'build/mix.wav');
  const voRaw = cfg.voiceover ? path.join(projAbs, cfg.voiceover) : '';
  const audioPath = fs.existsSync(mixWav) ? mixWav : (voRaw && fs.existsSync(voRaw) ? voRaw : null);
  const mime = preview ? 'image/jpeg' : 'image/png';
  const ffBin = findFFmpeg();

  const pages = [page0]; for (let i = 1; i < workers; i++) pages.push(await openPage());
  const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', preview ? 'mjpeg' : 'png', '-framerate', String(fps), '-i', '-'];
  if (audioPath) ffArgs.push('-ss', String(t0), '-t', String(t1 - t0), '-i', audioPath, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', preview ? 'veryfast' : 'medium', '-crf', preview ? '22' : '17', '-movflags', '+faststart', out);
  const ff = spawn(ffBin, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  console.log(`Rendering [browser] ${total} frames (${(t1 - t0).toFixed(1)}s @ ${fps}fps, ${W}x${H}, ${workers} workers) -> ${out}`);
  const startWall = Date.now();
  const inflight = new Map(); let scheduled = 0, nextWrite = 0;
  const schedule = w => {
    if (scheduled >= total) return;
    const f = scheduled++;
    inflight.set(f, grab(pages[w], t0 + f / fps, mime, 0.92).then(buf => ({ buf, w })));
  };
  for (let w = 0; w < workers; w++) schedule(w);
  while (nextWrite < total) {
    const { buf, w } = await inflight.get(nextWrite); inflight.delete(nextWrite);
    schedule(w);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    nextWrite++;
    if (nextWrite % fps === 0 || nextWrite === total) {
      const el = (Date.now() - startWall) / 1000;
      process.stdout.write(`\r  ${nextWrite}/${total} (${((nextWrite / total) * 100).toFixed(0)}%)  ${(nextWrite / Math.max(0.01, el)).toFixed(1)} fps`);
    }
  }
  ff.stdin.end();
  const exitCode = await new Promise(r => ff.on('close', r));
  console.log(exitCode === 0 ? `\ndone -> ${out}` : `\nffmpeg failed (exit ${exitCode})`);
  await browser.close(); srv.close();
  process.exit(exitCode || 0);
}

// =========================================================================
// PATH B: NODE @napi-rs/canvas 2D FALLBACK BACKEND
// =========================================================================
const nr = await createNodeRenderer();
const meta = nr.meta;

if (opt('still') !== null) {
  const out = path.resolve(opt('out', 'still.png')); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, nr.frameBuffer(Number(opt('still')), 'png'));
  console.log(`wrote ${out}`); process.exit(0);
}

if (flag('styles')) {
  const { STYLE_IDS, STYLES } = nr.stylesMod;
  const t = Number(opt('at', meta.duration * 0.35)), cols = 3, rows = Math.ceil(STYLE_IDS.length / cols);
  const tw = 640, th = Math.round(tw * H / W), pad = 22, head = 46;
  const gridC = nr.napi.createCanvas(cols * tw + (cols + 1) * pad, rows * (th + head) + (rows + 1) * pad);
  const gx = gridC.getContext('2d');
  gx.fillStyle = '#0e1018'; gx.fillRect(0, 0, gridC.width, gridC.height);
  for (let i = 0; i < STYLE_IDS.length; i++) {
    const id = STYLE_IDS[i];
    nr.setStyle(id);
    const snap = await nr.napi.loadImage(nr.frameBuffer(t, 'jpeg'));
    const x = pad + (i % cols) * (tw + pad), y = pad + Math.floor(i / cols) * (th + head + pad);
    gx.drawImage(snap, x, y, tw, th);
    gx.fillStyle = '#e8e4f4'; gx.font = '700 21px sans-serif';
    gx.fillText(`${STYLES[id].name}  (--style ${id})`, x + 6, y + th + 30);
  }
  const out = path.resolve(opt('out', path.join(projAbs, 'exports/styles.png'))); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, gridC.toBuffer('image/png')); console.log(`wrote ${out}`); process.exit(0);
}

if (flag('sheet')) {
  const shots = shotsDoc.shots;
  const cols = vertical ? 6 : 4, tw = vertical ? 270 : 480, th = Math.round(tw * H / W), rows = Math.ceil(shots.length / cols);
  const pad = 16, head = 34;
  const sheetC = nr.napi.createCanvas(cols * tw + (cols + 1) * pad, rows * (th + head) + (rows + 1) * pad);
  const sx = sheetC.getContext('2d');
  sx.fillStyle = '#0c0d14'; sx.fillRect(0, 0, sheetC.width, sheetC.height);
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const snap = await nr.napi.loadImage(nr.frameBuffer(s.start + s.dur * 0.5, 'jpeg'));
    const x = pad + (i % cols) * (tw + pad), y = pad + Math.floor(i / cols) * (th + head + pad);
    sx.drawImage(snap, x, y, tw, th);
    sx.fillStyle = '#d8d4e8'; sx.font = '600 15px sans-serif';
    sx.fillText(`${s.id}  (${s.start.toFixed(1)}-${(s.start + s.dur).toFixed(1)}s)`, x + 4, y + th + 22);
  }
  const out = path.resolve(opt('out', path.join(projAbs, 'exports/sheet.png'))); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, sheetC.toBuffer('image/png')); console.log(`wrote ${out}`); process.exit(0);
}

const fps = Number(opt('fps', meta.fps));
const t0 = Number(opt('from', 0)), t1 = Number(opt('to', meta.duration));
const total = Math.max(1, Math.round((t1 - t0) * fps));
const out = path.resolve(opt('out', path.join(projAbs, `exports/${preview ? 'preview' : 'final'}.mp4`)));
fs.mkdirSync(path.dirname(out), { recursive: true });

const mixWav = path.join(projAbs, 'build/mix.wav');
const voRaw = cfg.voiceover ? path.join(projAbs, cfg.voiceover) : '';
const audioPath = fs.existsSync(mixWav) ? mixWav : (voRaw && fs.existsSync(voRaw) ? voRaw : null);
const ffBin = findFFmpeg();
const ffArgs = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${nr.canvas.width}x${nr.canvas.height}`, '-framerate', String(fps), '-i', '-'];
if (audioPath) ffArgs.push('-ss', String(t0), '-t', String(t1 - t0), '-i', audioPath, '-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', preview ? 'veryfast' : 'medium', '-crf', preview ? '22' : '17', '-movflags', '+faststart', out);
const ff = spawn(ffBin, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

console.log(`Rendering [node-canvas] ${total} frames (${(t1 - t0).toFixed(1)}s @ ${fps}fps, ${nr.canvas.width}x${nr.canvas.height}) -> ${out}`);
const startWall = Date.now();
for (let f = 0; f < total; f++) {
  const buf = nr.frameBuffer(t0 + f / fps, 'raw');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((f + 1) % fps === 0 || f + 1 === total) {
    const el = (Date.now() - startWall) / 1000;
    process.stdout.write(`\r  ${f + 1}/${total} (${(((f + 1) / total) * 100).toFixed(0)}%)  ${((f + 1) / Math.max(0.01, el)).toFixed(1)} fps`);
  }
}
ff.stdin.end();
const exitCode = await new Promise(r => ff.on('close', r));
console.log(exitCode === 0 ? `\ndone -> ${out}` : `\nffmpeg failed (exit ${exitCode})`);
process.exit(exitCode || 0);
