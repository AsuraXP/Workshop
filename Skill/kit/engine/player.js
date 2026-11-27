// engine/player.js — browser player & Playwright frame-stepper (supports live preview + deterministic headless render).
import { E, setStyle } from './core.js';
import { STYLES, STYLE_IDS } from './styles.js';
import { configureStage, renderFilmFrame, findShotAt, resetCompositorState } from './compositor.js';

const q = new URLSearchParams(location.search);
const PROJ = (q.get('project') || 'examples/what-if-demo').replace(/\/$/, '');
const HEADLESS = q.has('headless');
const BASE = `../${PROJ}`;
const jget = async (p, fb = null) => { try { const r = await fetch(`${BASE}/${p}`); return r.ok ? r.json() : fb; } catch { return fb; } };

const cfg = (await jget('config.json')) || {};
const shotsDoc = await jget('story/shots.json', { shots: [] });
const wordsDoc = await jget('timeline/words.json', { words: [] });
E.words = wordsDoc?.words || [];
E.shots = shotsDoc?.shots || [];
const DURATION = E.shots.reduce((m, s) => Math.max(m, s.start + s.dur), cfg.duration || 10);

const { outW, outH } = configureStage(cfg, {
  aspect: q.get('aspect'),
  width: q.get('w'),
  height: q.get('h'),
  styleOverride: q.get('style'),
});

const canvas = document.getElementById('stage');
canvas.width = outW; canvas.height = outH;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

await import(`${BASE}/scenes/index.js`);
await document.fonts.ready;

const drawAt = (globalT) => renderFilmFrame(ctx, canvas, E.shots, globalT);

// ---------- Headless Playwright API ----------
window.__READY = true;
window.__META = { duration: DURATION, fps: E.fps, width: outW, height: outH, shots: E.shots.length, style: E.styleId };
window.__setStyle = id => { setStyle(id); resetCompositorState(); };
window.__frame = async (t, mime = 'image/jpeg', quality = 0.94) => {
  drawAt(t);
  const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
  return await blob.arrayBuffer();
};
window.__renderAt = drawAt;

// ---------- Interactive preview UI ----------
if (!HEADLESS) {
  document.body.classList.add('interactive');
  const ui = document.getElementById('ui'), scrub = document.getElementById('scrub'), lab = document.getElementById('tlabel');
  const sel = document.getElementById('stylesel'), aspBtn = document.getElementById('aspectbtn'), playBtn = document.getElementById('playbtn');
  for (const id of STYLE_IDS) { const o = document.createElement('option'); o.value = id; o.textContent = `${STYLES[id].name} (${id})`; if (id === E.styleId) o.selected = true; sel.appendChild(o); }
  scrub.max = DURATION.toFixed(2); scrub.step = (1 / E.fps).toFixed(4);

  const audio = new Audio(`${BASE}/build/mix.wav`);
  let playing = false, curT = Number(q.get('t') || 0), rafLast = 0, hasAudio = false;
  audio.addEventListener('canplay', () => { hasAudio = true; });
  audio.addEventListener('error', () => {
    if (cfg.voiceover) { audio.src = `${BASE}/${cfg.voiceover}`; audio.load(); }
  }, { once: true });

  const sync = t => {
    curT = ((t % DURATION) + DURATION) % DURATION;
    drawAt(curT);
    scrub.value = curT;
    const s = findShotAt(E.shots, curT);
    lab.textContent = `${curT.toFixed(2)}s / ${DURATION.toFixed(1)}s  ·  ${s?.id || ''}`;
  };
  const tick = now => {
    if (playing) {
      const dt = (now - rafLast) / 1000;
      sync(hasAudio && !audio.paused ? audio.currentTime : curT + dt);
    }
    rafLast = now; requestAnimationFrame(tick);
  };
  playBtn.onclick = () => {
    playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play'; rafLast = performance.now();
    if (hasAudio) { audio.currentTime = curT; playing ? audio.play() : audio.pause(); }
  };
  scrub.oninput = () => { playing = false; playBtn.textContent = 'Play'; audio.pause(); sync( Number(scrub.value)); };
  sel.onchange = () => { window.__setStyle(sel.value); sync(curT); };
  aspBtn.onclick = () => { q.set('aspect', E.vertical ? '16:9' : '9:16'); location.search = q.toString(); };
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
    if (e.code === 'ArrowRight') sync(curT + (e.shiftKey ? 1 : 1 / E.fps));
    if (e.code === 'ArrowLeft') sync(curT - (e.shiftKey ? 1 : 1 / E.fps));
  });
  ui.hidden = false; sync(curT); requestAnimationFrame(tick);
} else {
  drawAt(Number(q.get('t') || 0));
}
