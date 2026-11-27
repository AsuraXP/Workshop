// engine/core.js — shared deterministic runtime for every shot. All drawing is in LOGICAL units:
// 16:9 stage = 1920x1080, 9:16 stage = 1080x1920. The player scales automatically to output pixels.
import { STYLES, BASE_MOODS, COATS } from './styles.js';
export { COATS };

export const E = { W: 1920, H: 1080, PX: 1, fps: 24, vertical: false, style: STYLES.awaken, styleId: 'awaken', cfg: {}, words: [], shots: [] };
export const V = (h, v) => (E.vertical ? v : h);           // pick a value by aspect: V(landscape, vertical)

// ---------- math / timing ----------
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const ease = {
  linear: x => clamp(x),
  smooth: x => { x = clamp(x); return x * x * (3 - 2 * x); },
  in: x => (x = clamp(x)) ** 3,
  out: x => 1 - (1 - clamp(x)) ** 3,
  inOut: x => ((x = clamp(x)) < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  sine: x => -(Math.cos(Math.PI * clamp(x)) - 1) / 2,
  outBack: x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
  outElastic: x => { x = clamp(x); return x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; },
};

// Classical animation curve: slight counter-move anticipation -> fast action -> subtle overshoot -> settle
export function anticipate(t, start, end, anti = 0.12, over = 0.06) {
  if (t <= start) return 0;
  if (t >= end) return 1;
  const u = (t - start) / Math.max(1e-6, end - start);
  if (u < 0.2) { const k = u / 0.2; return -anti * Math.sin(k * Math.PI); }
  if (u < 0.78) { const k = ease.inOut((u - 0.2) / 0.58); return (1 + over) * k; }
  const k = ease.out((u - 0.78) / 0.22);
  return 1 + over * (1 - k);
}

// Damped spring settle from 0 -> 1 starting at `start` over `dur` seconds
export function spring(t, start = 0, dur = 0.65, freq = 9, decay = 5.5) {
  if (t <= start) return 0;
  const u = (t - start) / Math.max(1e-6, dur);
  if (u >= 1.5) return 1;
  return 1 - Math.exp(-decay * u) * Math.cos(freq * u);
}

// Shot-local keyframes: key(t, [[0, 1], [2, 1.2, ease.out], [4, 1]], ease.inOut) -> number | hex colour | array | object
export function key(t, frames, fn = ease.inOut) {
  if (!Array.isArray(frames) || !frames.length) throw new Error('key() requires a non-empty keyframe array');
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      const u = t1 === t0 ? 1 : (frames[i][2] || fn)((t - t0) / (t1 - t0));
      return mixVal(v0, v1, u);
    }
  }
  return frames[frames.length - 1][1];
}

// Convert global film-time keyframes [[globalT, val, ease?], ...] into shot-local keyframes, rejecting out-of-shot keys
export function localKeys(frames, shotStart, shotDur) {
  return frames.map((f) => {
    const lt = f[0] - shotStart;
    if (lt < -1e-4 || lt > shotDur + 1e-4) throw new Error(`Keyframe ${f[0]}s is outside shot [${shotStart}, ${shotStart + shotDur}]`);
    return [clamp(lt, 0, shotDur), ...f.slice(1)];
  });
}

export function mixVal(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (typeof a === 'string' && typeof b === 'string' && a.startsWith('#') && b.startsWith('#')) return mix(a, b, k);
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mixVal(v, b[i] ?? v, k));
  if (a && b && typeof a === 'object') {
    const o = {};
    for (const kk in a) o[kk] = (typeof a[kk] === 'number' || Array.isArray(a[kk]) || (typeof a[kk] === 'string' && a[kk].startsWith('#'))) ? mixVal(a[kk], b[kk] ?? a[kk], k) : (k < 0.5 ? a[kk] : b[kk] ?? a[kk]);
    return o;
  }
  return k < 0.5 ? a : b;
}

export function rng(seed = 1) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export function noise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 57), hash(i + 1 + seed * 57), u) * 2 - 1; }
export const shake = (t, amp = 4, freq = 1.3, seed = 3) => [noise(t * freq, seed) * amp, noise(t * freq, seed + 9) * amp];

// Talking mouth amount (0..1) driven by word timings when available, or procedural syllable cadence in [from, to]
export function talkAmount(globalT, from = -1, to = 1e9) {
  if (globalT < from || globalT > to) return 0;
  if (E.words && E.words.length) {
    const hasWordsInSpan = E.words.some(w => w.end >= from && w.start <= to);
    if (hasWordsInSpan) {
      const w = E.words.find(w => globalT >= w.start && globalT <= w.end);
      if (!w) return 0;
    }
  }
  return clamp(0.25 + 0.75 * Math.abs(Math.sin(globalT * 17)) * (0.6 + 0.4 * Math.sin(globalT * 5.3)));
}

// Global time (seconds) when a word is spoken: wordTime('brain', 40) -> 43.78 (null if not found)
export function wordTime(match, after = 0) {
  const m = String(match).toLowerCase().replace(/[^\w']/g, '');
  const w = (E.words || []).find(w => w.start >= after - 0.05 && w.word.toLowerCase().replace(/[^\w']/g, '').startsWith(m));
  return w ? w.start : null;
}

// ---------- colour ----------
export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (!c || typeof c !== 'string') return [0, 0, 0, 1];
  if (c.startsWith('rgb')) { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] ?? 1]; }
  let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255, h.length > 6 ? parseInt(h.slice(6), 16) / 255 : 1];
}
export const css = ([r, g, b, a = 1]) => `rgba(${r | 0},${g | 0},${b | 0},${+a.toFixed(3)})`;
export const mix = (c1, c2, k) => { const a = rgb(c1), b = rgb(c2); return css(a.map((v, i) => lerp(v, b[i] ?? 1, clamp(k)))); };
export const alpha = (c, a) => { const x = rgb(c); return css([x[0], x[1], x[2], clamp(a)]); };
export const shade = (c, k) => (k < 0 ? mix(c, '#000000', -k) : mix(c, '#ffffff', k));

// ---------- style / moods ----------
export function setStyle(id) { E.styleId = STYLES[id] ? id : 'awaken'; E.style = STYLES[E.styleId]; }
export function mood(name = 'dusk') { const st = E.style || STYLES.awaken; const base = BASE_MOODS[name] || BASE_MOODS.dusk; return { ...base, ...(st.moods?.[name] || {}) }; }
export const S = () => E.style || STYLES.awaken;

// ---------- drawing primitives (logical units) ----------
export function rr(g, x, y, w, h, r) { if (w <= 0 || h <= 0) { g.beginPath(); return; } r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function seg(g, pts, w, col, cap = 'round') { g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
export function poly(g, pts, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
export function circle(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); }
export function ring(g, x, y, r, w, col) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.stroke(); }
export function linGrad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export function radGrad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, Math.max(r0 + 0.01, r1)); stops.forEach((c, i) => Array.isArray(c) ? gr.addColorStop(c[0], c[1]) : gr.addColorStop(i / Math.max(1, stops.length - 1), c)); return gr; }
export function glow(g, x, y, r, col, a = 1) { if (r <= 0 || a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = radGrad(g, x, y, 0, r, [alpha(col, a), alpha(col, a * 0.35), alpha(col, 0)]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); }
export function veil(g, color = '#000', a = 0.3, op = 'source-over') { g.save(); g.globalCompositeOperation = op; g.fillStyle = alpha(color, a); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
export function fillRect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
export function backdrop(g, colors, area = [-E.W, -E.H, E.W * 3, E.H * 3]) { g.fillStyle = Array.isArray(colors) ? linGrad(g, 0, 0, 0, E.H, colors) : colors; g.fillRect(...area); }

// ---------- text ----------
export const FONTS = { title: 'Fredoka', ui: 'Nunito', serif: 'Playfair Display' };
export function text(g, str, x, y, o = {}) {
  const { size = 48, font = FONTS.title, weight = 700, color = '#fff', align = 'center', base = 'middle', glow: gl = 0, glowColor = 'rgba(255,140,60,.8)', spacing = 0, alpha: a = 1, stroke = 0, strokeColor = '#000', italic = false } = o;
  g.save(); g.globalAlpha *= a; g.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${font}", "DejaVu Sans", sans-serif`; g.textAlign = align; g.textBaseline = base;
  if ('letterSpacing' in g && spacing) { try { g.letterSpacing = `${spacing}px`; } catch {} }
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = strokeColor; g.strokeText(str, x, y); }
  if (gl) { g.shadowColor = glowColor; g.shadowBlur = gl; }
  g.fillStyle = color; g.fillText(str, x, y); g.restore();
}
export function measure(g, str, size, font = FONTS.title, weight = 700) { g.save(); g.font = `${weight} ${size}px "${font}", "DejaVu Sans", sans-serif`; const w = g.measureText(str).width; g.restore(); return w; }

// ---------- camera & parallax ----------
// cam = {x, y, z (zoom), r (roll, radians)}; depth 1 = character plane, <1 farther, >1 foreground. Static cam {} is valid for deliberate holds.
export function layer(g, cam = {}, depth = 1, fn) {
  g.save(); const z = Math.max(0.05, 1 + ((cam?.z ?? 1) - 1) * depth);
  g.translate(E.W / 2, E.H / 2); if (cam?.r) g.rotate(cam.r * Math.min(1, depth)); g.scale(z, z);
  g.translate(-E.W / 2 - (cam?.x || 0) * depth, -E.H / 2 - (cam?.y || 0) * depth); fn(g); g.restore();
}

const _makeCanvas = (w, h) => {
  if (typeof document !== 'undefined' && document.createElement) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  if (typeof globalThis.__createCanvas === 'function') return globalThis.__createCanvas(w, h);
  throw new Error('No canvas factory available');
};
const _blurPool = [];
export function blurLayer(g, amount, fn, cam = null, depth = 1) {
  if (amount <= 0.3) { cam ? layer(g, cam, depth, fn) : fn(g); return; }
  const k = clamp(1 / (1 + amount / 3), 0.06, 1);
  const w = Math.max(8, Math.round(E.W * E.PX * k)), h = Math.max(8, Math.round(E.H * E.PX * k));
  let c = _blurPool.find(b => !b.busy && b.width === w && b.height === h);
  if (!c) { c = _makeCanvas(w, h); _blurPool.push(c); }
  c.busy = true; const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
  x.setTransform(w / E.W, 0, 0, h / E.H, 0, 0); cam ? layer(x, cam, depth, fn) : fn(x);
  if (!c.b) c.b = _makeCanvas(w, h);
  if (c.b.width !== w || c.b.height !== h) { c.b.width = w; c.b.height = h; }
  const bx = c.b.getContext('2d'); bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, w, h);
  try { bx.filter = `blur(${Math.max(0.4, amount * E.PX * k)}px)`; } catch {}
  bx.drawImage(c, 0, 0);
  try { bx.filter = 'none'; } catch {}
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true;
  try { g.imageSmoothingQuality = 'high'; } catch {}
  g.drawImage(c.b, 0, 0, E.W * E.PX, E.H * E.PX); g.restore(); c.busy = false;
}

// ---------- shot registry ----------
const SHOTS = {};
export function registerShot(id, def) { SHOTS[id] = { kind: '2d', ...def }; }
export const getShot = id => SHOTS[id];
export const allShots = () => SHOTS;
export function clearShots() { for (const k of Object.keys(SHOTS)) delete SHOTS[k]; }
