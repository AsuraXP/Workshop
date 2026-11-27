// engine/compositor.js — shared frame compositor, transitions, LUT color grading, bloom, grain, and captions.
// Works identically in browser Canvas2D (Playwright / live preview) and headless Node (@napi-rs/canvas).
import { E, S, setStyle, getShot, clamp, ease, radGrad, alpha } from './core.js';
import { captions, storyCaption } from './ui2d.js';

const makeOffscreen = (w, h) => {
  if (typeof document !== 'undefined' && document.createElement) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  if (typeof globalThis.__createCanvas === 'function') return globalThis.__createCanvas(w, h);
  return null;
};

// Precompute 256-entry per-channel LUT for lift/gamma/gain + contrast (~15x faster than per-pixel Math.pow!)
const _lutCache = new Map();
export function getChannelLUTs(gr) {
  const key = JSON.stringify([gr.lift, gr.gamma, gr.gain, gr.contrast]);
  if (_lutCache.has(key)) return _lutCache.get(key);
  const { lift = [0, 0, 0], gamma = [1, 1, 1], gain = [1, 1, 1], contrast = 1 } = gr;
  const iv = [1 / gamma[0], 1 / gamma[1], 1 / gamma[2]];
  const luts = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < 256; i++) {
      let v = Math.pow(clamp((i / 255) * gain[c] + lift[c]), iv[c]);
      v = (v - 0.5) * contrast + 0.5;
      luts[c][i] = clamp(v) * 255 + 0.5;
    }
  }
  _lutCache.set(key, luts);
  return luts;
}

let _bloomA = null, _bloomB = null, _noiseTile = null;
function ensureGrainTile() {
  if (_noiseTile) return _noiseTile;
  const c = makeOffscreen(160, 160);
  if (!c) return null;
  const g = c.getContext('2d'), im = g.createImageData(160, 160);
  let s = 1337; const r = () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) / 4294967296); };
  for (let i = 0; i < im.data.length; i += 4) { const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  _noiseTile = c;
  return _noiseTile;
}

export function postGrade(ctx, canvas, globalT) {
  const gr = S().grade;
  if (!gr) return;
  const w = canvas.width, h = canvas.height;

  // Soft highlight bloom via 1/6-res downsample
  if (gr.bloom > 0.02) {
    const bw = Math.max(8, (w / 6) | 0), bh = Math.max(8, (h / 6) | 0);
    if (!_bloomA) _bloomA = makeOffscreen(bw, bh);
    if (!_bloomB) _bloomB = makeOffscreen(bw, bh);
    if (_bloomA && _bloomB) {
      if (_bloomA.width !== bw || _bloomA.height !== bh) { _bloomA.width = bw; _bloomA.height = bh; _bloomB.width = bw; _bloomB.height = bh; }
      const ax = _bloomA.getContext('2d'), bx = _bloomB.getContext('2d');
      try { ax.filter = 'brightness(1.15) contrast(1.8)'; } catch {}
      ax.drawImage(canvas, 0, 0, bw, bh);
      try { ax.filter = 'none'; } catch {}
      bx.clearRect(0, 0, bw, bh);
      try { bx.filter = 'blur(6px)'; } catch {}
      bx.drawImage(_bloomA, 0, 0);
      try { bx.filter = 'none'; } catch {}
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = gr.bloom * 0.24; ctx.drawImage(_bloomB, 0, 0, w, h); ctx.restore();
    }
  }

  // Fast LUT lift/gamma/gain + saturation
  const [lutR, lutG, lutB] = getChannelLUTs(gr);
  const sat = gr.sat ?? 1;
  const im = ctx.getImageData(0, 0, w, h), d = im.data;
  if (Math.abs(sat - 1) < 0.005) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = lutR[d[i]]; d[i + 1] = lutG[d[i + 1]]; d[i + 2] = lutB[d[i + 2]];
    }
  } else {
    for (let i = 0; i < d.length; i += 4) {
      const r = lutR[d[i]], g = lutG[d[i + 1]], b = lutB[d[i + 2]];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      d[i]     = clamp((l + (r - l) * sat) / 255) * 255;
      d[i + 1] = clamp((l + (g - l) * sat) / 255) * 255;
      d[i + 2] = clamp((l + (b - l) * sat) / 255) * 255;
    }
  }
  ctx.putImageData(im, 0, 0);

  // Vignette + subtle film grain + optional letterbox bars (bars defaults to 'none'!)
  ctx.save(); ctx.setTransform(E.PX, 0, 0, E.PX, 0, 0);
  if (gr.vignette > 0.01) {
    const R = Math.hypot(E.W, E.H) * 0.56;
    ctx.fillStyle = radGrad(ctx, E.W / 2, E.H / 2, R * 0.42, R, ['rgba(0,0,0,0)', alpha('#000', gr.vignette)]);
    ctx.fillRect(0, 0, E.W, E.H);
  }
  if (gr.grain > 0.003) {
    const tile = ensureGrainTile();
    if (tile) {
      const ox = ((Math.floor(globalT * 24) * 47) % 160), oy = ((Math.floor(globalT * 24) * 89) % 160);
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = gr.grain;
      for (let x = -ox; x < E.W; x += 160) for (let y = -oy; y < E.H; y += 160) ctx.drawImage(tile, x, y);
      ctx.restore();
    }
  }
  const bars = E.cfg.bars ?? 'none';
  if (!E.vertical && bars && bars !== 'none') {
    const bh = typeof bars === 'number' ? bars : (bars === 'scope' ? 132 : bars === 'wide' ? 92 : bars === 'thin' ? 48 : 0);
    if (bh > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, E.W, bh); ctx.fillRect(0, E.H - bh, E.W, bh); }
  }
  ctx.restore();
}

export function findShotAt(shots, globalT) {
  let shot = shots[shots.length - 1];
  for (const s of shots) { if (globalT >= s.start && globalT < s.start + s.dur) { shot = s; break; } }
  if (shots.length && globalT < shots[0].start) shot = shots[0];
  return shot;
}

const _shotState = new Map();
export function resetCompositorState() { _shotState.clear(); }

export function renderShot(ctx, s, localT, globalT) {
  const def = getShot(s.id);
  ctx.save(); ctx.setTransform(E.PX, 0, 0, E.PX, 0, 0);
  if (!def) {
    ctx.fillStyle = '#141824'; ctx.fillRect(0, 0, E.W, E.H);
    ctx.fillStyle = '#f08c55'; ctx.font = '700 40px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Missing shot module: ${s.id}`, E.W / 2, E.H / 2);
    ctx.restore(); return;
  }
  let st = _shotState.get(s.id);
  if (!st || st.style !== E.styleId || st.px !== E.PX) {
    st = { style: E.styleId, px: E.PX, data: def.init ? def.init() : null };
    _shotState.set(s.id, st);
  }
  def.draw(ctx, clamp(localT, 0, s.dur), st.data, { globalT, dur: s.dur, start: s.start, shot: s });

  // Shot-level narrative / dialogue caption (`shot.caption` or timed `shot.subtitles`)
  if (E.cfg.storyCaptions !== false) {
    if (typeof s.caption === 'string' && s.caption.trim()) {
      const fadeIn = ease.out(clamp(localT / 0.25));
      const fadeOut = ease.out(clamp((s.dur - localT) / 0.25));
      storyCaption(ctx, s.caption, { speaker: s.speaker || '', a: Math.min(fadeIn, fadeOut) });
    } else if (Array.isArray(s.subtitles)) {
      for (const sub of s.subtitles) {
        const st0 = sub.at ?? 0, st1 = sub.end ?? (st0 + (sub.dur ?? 2.5));
        if (localT >= st0 && localT <= st1) {
          const a = Math.min(ease.out(clamp((localT - st0) / 0.2)), ease.out(clamp((st1 - localT) / 0.2)));
          storyCaption(ctx, sub.text, { speaker: sub.speaker || '', a });
          break;
        }
      }
    }
  }
  ctx.restore();
}

let _transBuf = null;
export function renderFilmFrame(ctx, canvas, shots, globalT) {
  if (!shots.length) return;
  const s = findShotAt(shots, globalT);
  const local = globalT - s.start;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderShot(ctx, s, local, globalT);

  // Transitions in from previous shot
  const tr = s.in || 'cut', td = s.inDur ?? 0.45;
  const idx = shots.indexOf(s);
  if (tr !== 'cut' && local < td && idx > 0) {
    const u = ease.inOut(local / td);
    if (tr === 'fadeBlack' || tr === 'fadeWhite') {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = tr === 'fadeWhite' ? `rgba(255,255,255,${1 - u})` : `rgba(0,0,0,${1 - u})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    } else if (tr === 'dissolve' || tr === 'wipe') {
      if (!_transBuf) _transBuf = makeOffscreen(canvas.width, canvas.height);
      if (_transBuf) {
        if (_transBuf.width !== canvas.width || _transBuf.height !== canvas.height) { _transBuf.width = canvas.width; _transBuf.height = canvas.height; }
        const bx = _transBuf.getContext('2d');
        bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, canvas.width, canvas.height);
        const prev = shots[idx - 1];
        renderShot(bx, prev, prev.dur, globalT);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (tr === 'dissolve') { ctx.globalAlpha = 1 - u; ctx.drawImage(_transBuf, 0, 0); }
        else { const wx = canvas.width * u; ctx.drawImage(_transBuf, wx, 0, canvas.width - wx, canvas.height, wx, 0, canvas.width - wx, canvas.height); }
        ctx.restore();
      }
    }
  }
  if (s.out === 'fadeBlack' && s.dur - local < 0.75) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${ease.in(1 - (s.dur - local) / 0.75)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
  }

  // Word-by-word burned captions (opt-in via cfg.captions: true, default false on 16:9)
  if (E.cfg.captions ?? false) {
    ctx.save(); ctx.setTransform(E.PX, 0, 0, E.PX, 0, 0);
    captions(ctx, E.words, globalT);
    ctx.restore();
  }

  postGrade(ctx, canvas, globalT);
}

export function configureStage(cfg, { aspect, width, height, styleOverride } = {}) {
  const asp = aspect || cfg.aspect || '16:9';
  E.vertical = asp === '9:16';
  E.W = E.vertical ? 1080 : 1920;
  E.H = E.vertical ? 1920 : 1080;
  const defW = E.vertical ? (cfg.verticalWidth || 1080) : (cfg.width || 1920);
  const outW = Number(width || defW);
  const outH = Number(height || Math.round(outW * E.H / E.W));
  E.PX = outW / E.W;
  E.fps = cfg.fps || 24;
  E.cfg = cfg;
  setStyle(styleOverride || cfg.style || 'awaken');
  return { outW, outH };
}
