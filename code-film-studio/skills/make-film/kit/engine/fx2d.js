// engine/fx2d.js — lighting, weather, depth, architectural textures, and visual-effects helpers (all deterministic in t).
import { E, rng, lerp, clamp, alpha, mix, shade, linGrad, radGrad, seg, poly, circle, rr } from './core.js';

// Volumetric light cone (lamp, projector, window shaft, doorway spill)
export function beam(g, x, y, angle, spread, len, color, a = 0.35) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const x1 = x + Math.cos(angle - spread / 2) * len, y1 = y + Math.sin(angle - spread / 2) * len;
  const x2 = x + Math.cos(angle + spread / 2) * len, y2 = y + Math.sin(angle + spread / 2) * len;
  const xm = x + Math.cos(angle) * len, ym = y + Math.sin(angle) * len;
  g.fillStyle = linGrad(g, x, y, xm, ym, [alpha(color, a), alpha(color, a * 0.35), alpha(color, 0)]);
  poly(g, [[x, y], [x1, y1], [x2, y2]], g.fillStyle); g.restore();
}

// Horizontal anamorphic practical-bulb lens flare streak (e.g., porch bulb or streetlamp at dusk/night)
export function lensStreak(g, x, y, { w = 420, h = 8, color = '#ffe2a8', a = 0.55 } = {}) {
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = linGrad(g, x - w / 2, y, x + w / 2, y, [alpha(color, 0), alpha(color, a * 0.45), alpha(color, a), alpha(color, a * 0.45), alpha(color, 0)]);
  g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
  circle(g, x, y, h * 1.4, alpha('#ffffff', a * 0.8));
  g.restore();
}

// Atmospheric ground fog / horizon mist band
export function haze(g, y0, y1, color, a = 0.45) {
  g.fillStyle = linGrad(g, 0, y0, 0, y1, [alpha(color, 0), alpha(color, a), alpha(color, 0)]);
  g.fillRect(-E.W, y0, E.W * 3, y1 - y0);
}

// Soft horizontal sky streaks / sunset cloud bands (signature twilight atmosphere)
export function skyStreaks(g, { n = 6, y0 = 80, y1 = 560, color = '#f8c8a0', a = 0.16, t = 0, seed = 19 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const bw = 380 + r() * 680, bh = 10 + r() * 24;
    const bx = ((r() * (E.W + 600) + t * (4 + r() * 6)) % (E.W + 800)) - 400;
    const by = lerp(y0, y1, r());
    rr(g, bx, by, bw, bh, bh / 2);
    g.fillStyle = alpha(color, a * (0.5 + r() * 0.6));
    g.fill();
  }
}

// Out-of-focus distant bokeh light orbs (valley houses, city lights, fireflies)
export function bokeh(g, { n = 24, x0 = 0, x1 = null, y0 = 520, y1 = 920, rMin = 6, rMax = 26, color = '#ffd89a', a = 0.28, t = 0, seed = 31 } = {}) {
  x1 = x1 ?? E.W;
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const px = lerp(x0, x1, r()) + Math.sin(t * 0.4 + i) * 3;
    const py = lerp(y0, y1, r());
    const rad = lerp(rMin, rMax, r() ** 1.6);
    const tw = (0.65 + 0.35 * Math.sin(t * (1.2 + r()) + i * 2.1)) * a;
    g.fillStyle = radGrad(g, px, py, 0, rad, [alpha(color, tw), alpha(color, tw * 0.45), alpha(color, 0)]);
    g.beginPath(); g.arc(px, py, rad, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

// Clean subtle tiled interior wall linework (kitchen, lab, bathroom, subway)
export function tileWall(g, x, y, w, h, { tileW = 96, tileH = 52, color = '#000000', a = 0.1, stagger = true } = {}) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = alpha(color, a);
  g.lineWidth = 1.6;
  let row = 0;
  for (let py = y; py <= y + h; py += tileH, row++) {
    seg(g, [[x, py], [x + w, py]], 1.6, g.strokeStyle);
    const off = stagger && (row % 2 === 1) ? tileW / 2 : 0;
    for (let px = x - off; px <= x + w; px += tileW) {
      seg(g, [[px, py], [px, py + tileH]], 1.6, g.strokeStyle);
    }
  }
  g.restore();
}

// Soft shaded botanical / potted plant leaves for foreground or set dressing
export function foliage(g, x, y, { s = 1, n = 6, color = '#6ca88e', shadowColor = '#3f685c', sway = 1, t = 0, seed = 13, pot = false, potColor = '#d89a7c' } = {}) {
  const r = rng(seed);
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  for (let i = 0; i < n; i++) {
    const spread = ((i / Math.max(1, n - 1)) - 0.5) * 1.45 + (r() - 0.5) * 0.18;
    const len = 68 + r() * 48;
    const wid = 16 + r() * 10;
    const wag = Math.sin(t * 1.4 + i * 1.1) * 0.04 * sway;
    g.save();
    g.rotate(spread + wag);
    g.fillStyle = linGrad(g, 0, 0, 0, -len, [shadowColor, color, shade(color, 0.14)]);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(-wid, -len * 0.48, 0, -len);
    g.quadraticCurveTo(wid, -len * 0.48, 0, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  if (pot) {
    poly(g, [[-26, -4], [26, -4], [20, 38], [-20, 38]], linGrad(g, -26, 0, 26, 0, [shade(potColor, -0.22), potColor]));
    rr(g, -30, -10, 60, 10, 4); g.fillStyle = potColor; g.fill();
  }
  g.restore();
}

// Procedural ridgeline / hills silhouette across [-pad .. W+pad]
export function hills(g, yBase, amp, color, seed = 1, detail = 5, pad = 500) {
  const r = rng(seed), pts = [[-pad, E.H + 400], [-pad, yBase]]; const n = 14 * detail;
  const freqs = [1, 2.3, 5.1].map(f => ({ f, p: r() * 6.28, a: 1 / f }));
  for (let i = 0; i <= n; i++) {
    const x = lerp(-pad, E.W + pad, i / n);
    let h = 0; for (const o of freqs) h += Math.sin((i / n) * Math.PI * 2 * o.f + o.p) * o.a;
    pts.push([x, yBase - (h * 0.5 + 0.5) * amp]);
  }
  pts.push([E.W + pad, E.H + 400]); poly(g, pts, color);
}

// Distant city skyline silhouette with lit windows
export function skyline(g, yBase, color, winColor = '#ffd27a', seed = 2, density = 26, maxH = 280) {
  const r = rng(seed); let x = -300;
  while (x < E.W + 300) {
    const w = 55 + r() * 95, h = 70 + r() ** 1.4 * maxH;
    g.fillStyle = color; g.fillRect(x, yBase - h, w + 1, h + 300);
    if (winColor) {
      for (let wy = yBase - h + 14; wy < yBase - 18; wy += 18)
        for (let wx = x + 9; wx < x + w - 10; wx += 14)
          if (r() < 0.38) { g.fillStyle = alpha(winColor, 0.35 + r() * 0.5); g.fillRect(wx, wy, 7, 10); }
    }
    x += w - 4 + r() * 14;
  }
}

export function stars(g, n = 90, t = 0, seed = 4, yMax = 560) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * (E.W + 400) - 200, y = r() * yMax, sz = 0.8 + r() * 2.1;
    const tw = 0.45 + 0.55 * Math.sin(t * (1.5 + r() * 2.5) + r() * 6.28);
    circle(g, x, y, sz, alpha('#ffffff', tw * (0.4 + r() * 0.6)));
  }
}

export function clouds(g, t, { n = 6, y = 180, color = '#ffffff', a = 0.55, speed = 10, seed = 8, scale = 1 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const w = (180 + r() * 220) * scale, cx = ((r() * (E.W + 600) + t * speed * (0.5 + r())) % (E.W + 700)) - 350, cy = y + (r() - 0.5) * 140;
    g.save(); g.fillStyle = alpha(color, a * (0.6 + r() * 0.4));
    for (let k = 0; k < 4; k++) circle(g, cx + (k - 1.5) * w * 0.22, cy + (k % 2) * 10 * scale, w * (0.18 + (k === 1 || k === 2 ? 0.06 : 0)), g.fillStyle);
    g.restore();
  }
}

// Floating dust motes / embers / pollen / snow
export function motes(g, t, { n = 45, color = '#ffd9a0', area = [0, 0, null, null], speed = 18, drift = 12, size = [1.5, 4.5], seed = 11, glow = false } = {}) {
  area = [area[0], area[1], area[2] ?? E.W, area[3] ?? E.H];
  const r = rng(seed); g.save(); if (glow) g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), sp = 0.4 + r() * 0.9, ph = r() * 6.28, sz = lerp(size[0], size[1], r());
    const x = area[0] + ((bx * area[2] + Math.sin(t * 0.7 + ph) * drift + t * drift * 0.2) % area[2]);
    const y = area[1] + ((by * area[3] - t * speed * sp) % area[3] + area[3]) % area[3];
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + ph));
    circle(g, x, y, sz, alpha(color, tw * 0.75));
  }
  g.restore();
}

export function rain(g, t, { n = 140, angle = 0.2, len = 42, speed = 1500, color = '#bcd4ff', a = 0.35, seed = 5 } = {}) {
  const r = rng(seed), dx = Math.sin(angle), dy = Math.cos(angle);
  g.strokeStyle = alpha(color, a); g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i < n; i++) {
    const u = (r() * 1400 + t * speed * (0.8 + r() * 0.4)) % 1400;
    const x = r() * (E.W + 400) - 200 + dx * u * 0.2, y = (u / 1400) * (E.H + 200) - 100;
    g.moveTo(x, y); g.lineTo(x + dx * len, y + dy * len);
  }
  g.stroke();
}

export function lightning(g, x0, y0, x1, y1, seed = 1, col = '#e8f2ff', w = 5) {
  const r = rng(seed), pts = [[x0, y0]]; const steps = 11;
  for (let i = 1; i < steps; i++) { const k = i / steps; pts.push([lerp(x0, x1, k) + (r() - 0.5) * 90, lerp(y0, y1, k) + (r() - 0.5) * 26]); }
  pts.push([x1, y1]); g.save(); g.globalCompositeOperation = 'lighter';
  seg(g, pts, w * 3.5, alpha(col, 0.22)); seg(g, pts, w, col); g.restore();
}

export function speedLines(g, cx, cy, t, { n = 44, r0 = 220, r1 = 1200, color = '#fff', a = 0.5 } = {}) {
  const r = rng(Math.floor(t * 24) + 3); g.save(); g.strokeStyle = alpha(color, a); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + r() * 0.12, a0 = r0 + r() * 160, a1 = lerp(a0 + 120, r1, r());
    g.lineWidth = 1.5 + r() * 3.5; g.beginPath();
    g.moveTo(cx + Math.cos(ang) * a0, cy + Math.sin(ang) * a0);
    g.lineTo(cx + Math.cos(ang) * a1, cy + Math.sin(ang) * a1); g.stroke();
  }
  g.restore();
}

export function shockwave(g, x, y, u, maxR = 260, col = '#fff') {
  if (u <= 0 || u >= 1) return;
  g.save(); g.strokeStyle = alpha(col, (1 - u) * 0.85); g.lineWidth = (1 - u) * 14 + 2;
  g.beginPath(); g.arc(x, y, u * maxR, 0, Math.PI * 2); g.stroke(); g.restore();
}

export function ripples(g, x, y, t, n = 3, maxR = 110, col = '#fff', a = 0.35) {
  for (let i = 0; i < n; i++) {
    const u = (t * 0.55 + i / n) % 1;
    g.strokeStyle = alpha(col, (1 - u) * a); g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y, u * maxR, u * maxR * 0.28, 0, 0, Math.PI * 2); g.stroke();
  }
}

export function flame(g, x, y, s = 1, t = 0, c1 = '#ff6a1a', c2 = '#ffe27a') {
  const w = Math.sin(t * 13) * 5 * s, h = (58 + Math.sin(t * 9) * 7) * s;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [sc, col] of [[1, c1], [0.62, c2], [0.32, '#ffffff']]) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x - 24 * s * sc, y - h * 0.45 * sc, x + w * sc, y - h * sc);
    g.quadraticCurveTo(x + 24 * s * sc, y - h * 0.45 * sc, x, y); g.fill();
  }
  g.restore();
}
