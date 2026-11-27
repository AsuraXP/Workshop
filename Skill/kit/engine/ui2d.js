// engine/ui2d.js — universal title cards, narrative subtitles, data graphics, diagrams, and clean end cards.
import { E, V, S, FONTS, rr, seg, circle, ring, text, measure, alpha, lerp, clamp, ease, prog } from './core.js';

export function card(g, x, y, w, h, { fill, line, r = 20, shadow = 0.32, a = 1 } = {}) {
  const u = S().ui; g.save(); g.globalAlpha *= a;
  if (shadow) { g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = 28; g.shadowOffsetY = 10; }
  rr(g, x, y, w, h, r); g.fillStyle = fill || u.card; g.fill();
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  if (line !== false) { g.strokeStyle = line || u.cardLine; g.lineWidth = 2; g.stroke(); }
  g.restore();
}

export function titleCard(g, t, { title, sub = '', hold = 2.6, y = null } = {}) {
  y = y ?? E.H * 0.5;
  const u = S().ui, a = Math.min(ease.out(prog(t, 0.1, 0.7)), 1 - ease.in(prog(t, hold, hold + 0.6)));
  if (a <= 0.01) return;
  text(g, title, E.W / 2, y - (sub ? 22 : 0), { size: V(82, 66), color: u.cream, alpha: a, glow: 24, glowColor: alpha(u.accent, 0.45), spacing: 1.5 });
  if (sub) text(g, sub, E.W / 2, y + 48, { size: V(30, 26), font: FONTS.ui, weight: 600, color: u.text, alpha: a * 0.9, spacing: 2.5 });
}

// ---------- Lower-band narrative / dialogue subtitle (title-safe, non-intrusive, universal) ----------
export function storyCaption(g, line, { speaker = '', y = null, a = 1, maxWidth = null, size = null, pill = true } = {}) {
  if (!line || a <= 0.01) return;
  const u = S().ui;
  y = y ?? (E.vertical ? E.H * 0.80 : E.H * 0.885);
  maxWidth = maxWidth ?? E.W * 0.76;
  size = size ?? V(34, 38);

  // Word-wrap inside safe width
  const rawWords = String(line).trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of rawWords) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cur && measure(g, cand, size, FONTS.ui, 700) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) lines.push(cur);

  const lh = size * 1.32;
  const blockH = lines.length * lh + (speaker ? size * 0.85 : 0);
  const widest = Math.max(...lines.map(l => measure(g, l, size, FONTS.ui, 700)), speaker ? measure(g, speaker.toUpperCase(), size * 0.62, FONTS.ui, 800) : 0);

  g.save();
  g.globalAlpha *= clamp(a);
  if (pill) {
    const pw = widest + 56, ph = blockH + 26;
    rr(g, E.W / 2 - pw / 2, y - ph / 2, pw, ph, 16);
    g.fillStyle = u.captionBg;
    g.fill();
  }
  let cy = y - blockH / 2 + lh * 0.5;
  if (speaker) {
    text(g, speaker.toUpperCase(), E.W / 2, cy - lh * 0.12, { size: Math.round(size * 0.6), font: FONTS.ui, weight: 800, color: u.gold, spacing: 2 });
    cy += size * 0.85;
  }
  for (const l of lines) {
    text(g, l, E.W / 2, cy, { size, font: FONTS.ui, weight: 700, color: u.cream, stroke: pill ? 0 : 6, strokeColor: 'rgba(0,0,0,0.75)' });
    cy += lh;
  }
  g.restore();
}

// ---------- Timeline strip (scales across millisecond / historical / generational / distance scales) ----------
export function timelineStrip(g, { x = null, y = null, w = null, ticks = [], markers = [], reveal = 1, title = '' } = {}) {
  w = w ?? V(1480, 920); x = x ?? (E.W - w) / 2; y = y ?? V(880, 1480);
  const u = S().ui, a = ease.out(clamp(reveal));
  card(g, x - 44, y - 92, w + 88, 178, { a });
  if (title) text(g, title, x, y - 58, { size: 22, font: FONTS.ui, weight: 700, color: u.sub, align: 'left', alpha: a, spacing: 2 });
  g.save(); g.globalAlpha *= a;
  seg(g, [[x, y + 6], [x + w * ease.out(clamp(reveal * 1.2)), y + 6]], 5, u.text);
  for (const tk of ticks) {
    const tx = x + tk.pos * w;
    seg(g, [[tx, y - 8], [tx, y + 20]], 3, u.sub);
    text(g, tk.label, tx, y + 48, { size: 22, font: FONTS.ui, weight: 700, color: u.sub });
  }
  for (const m of markers) {
    const k = ease.outBack(clamp((reveal - (m.at ?? 0.2)) * 2.2)); if (k <= 0) continue;
    const mx = x + m.pos * w, col = m.color || u.accent;
    seg(g, [[mx, y + 6], [mx, y - 28 * k]], 3, col);
    circle(g, mx, y + 6, 9 * k, col); circle(g, mx, y + 6, 4 * k, u.cream);
    text(g, m.label, mx, y - 44 * k, { size: 24, font: FONTS.title, color: col, alpha: k });
  }
  g.restore();
}

// ---------- Big animated stat / number card ----------
export function dataCard(g, x, y, w, h, { label = '', value = 0, to = null, t = 1, dur = 1.2, unit = '', sub = '', decimals = 0, accent } = {}) {
  const u = S().ui, col = accent || u.gold, k = ease.out(prog(t, 0, dur));
  const v = to === null ? value : lerp(value, to, k);
  card(g, x, y, w, h, { a: ease.out(prog(t, 0, 0.45)) });
  if (label) text(g, label.toUpperCase(), x + w / 2, y + 42, { size: 21, font: FONTS.ui, weight: 800, color: u.sub, spacing: 2.5 });
  const numStr = (typeof v === 'number' ? v.toFixed(decimals) : String(v)) + unit;
  text(g, numStr, x + w / 2, y + h * 0.54, { size: Math.min(86, h * 0.42), color: col, glow: 18, glowColor: alpha(col, 0.35) });
  if (sub) text(g, sub, x + w / 2, y + h - 34, { size: 22, font: FONTS.ui, weight: 600, color: u.text });
}

// ---------- Horizontal comparison bars ----------
export function compareBars(g, x, y, w, items, t = 1, { rowH = 68, max = null, unit = '' } = {}) {
  const u = S().ui, m = max ?? Math.max(...items.map(i => i.value)) * 1.12;
  const labelW = V(230, 200), barX = x + labelW, barW = w - labelW - 130;
  items.forEach((it, i) => {
    const k = ease.out(prog(t, i * 0.16, i * 0.16 + 0.75)), ry = y + i * rowH, col = it.color || (it.hi ? u.accent : u.blueprint);
    text(g, it.label, barX - 20, ry + 22, { size: 25, font: FONTS.ui, weight: 700, color: it.hi ? u.cream : u.text, align: 'right', alpha: k });
    rr(g, barX, ry + 6, barW, 32, 10); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill();
    const bw = Math.max(14, (it.value / m) * barW * k);
    rr(g, barX, ry + 6, bw, 32, 10); g.fillStyle = col; g.fill();
    text(g, `${Math.round(it.value * k)}${unit}`, barX + bw + 14, ry + 22, { size: 24, weight: 700, color: col, align: 'left', alpha: k });
  });
}

// ---------- Technical / schematic blueprint grid ----------
export function blueprint(g, fn, { step = 60, a = 1 } = {}) {
  const u = S().ui; g.save(); g.globalAlpha *= a;
  g.fillStyle = u.bpBg; g.fillRect(-200, -200, E.W + 400, E.H + 400);
  g.strokeStyle = alpha(u.blueprint, 0.1); g.lineWidth = 1; g.beginPath();
  for (let x = 0; x <= E.W; x += step) { g.moveTo(x, 0); g.lineTo(x, E.H); }
  for (let y = 0; y <= E.H; y += step) { g.moveTo(0, y); g.lineTo(E.W, y); }
  g.stroke();
  g.strokeStyle = alpha(u.blueprint, 0.22); g.beginPath();
  for (let x = 0; x <= E.W; x += step * 4) { g.moveTo(x, 0); g.lineTo(x, E.H); }
  for (let y = 0; y <= E.H; y += step * 4) { g.moveTo(0, y); g.lineTo(E.W, y); }
  g.stroke();
  if (fn) fn(g, u.blueprint);
  g.restore();
}

// ---------- Callout pointer + label ----------
export function callout(g, px, py, lx, ly, label, { sub = '', reveal = 1, color } = {}) {
  const u = S().ui, col = color || u.gold, k = ease.out(clamp(reveal)); if (k <= 0.01) return;
  const side = lx >= px ? 1 : -1, elbowX = lx - side * 34;
  g.save(); g.globalAlpha *= k;
  ring(g, px, py, 14, 3, col); circle(g, px, py, 5, col);
  seg(g, [[px, py], [elbowX, ly], [lx + side * (measure(g, label, 26) + 18), ly]], 2.5, col);
  text(g, label, lx + side * 8, ly - 18, { size: 26, color: u.cream, align: side > 0 ? 'left' : 'right' });
  if (sub) text(g, sub, lx + side * 8, ly + 18, { size: 19, font: FONTS.ui, weight: 600, color: u.sub, align: side > 0 ? 'left' : 'right' });
  g.restore();
}

export function dimension(g, x0, y0, x1, y1, label, { offset = -36, reveal = 1, color } = {}) {
  const u = S().ui, col = color || u.blueprint, k = ease.out(clamp(reveal)); if (k <= 0.01) return;
  const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang) * offset, ny = Math.cos(ang) * offset;
  const a0 = [x0 + nx, y0 + ny], a1 = [lerp(a0[0], x1 + nx, k), lerp(a0[1], y1 + ny, k)];
  g.save(); g.globalAlpha *= k;
  seg(g, [[x0, y0], a0], 1.5, alpha(col, 0.5)); seg(g, [[x1, y1], [x1 + nx, y1 + ny]], 1.5, alpha(col, 0.5));
  seg(g, [a0, a1], 2.5, col);
  const mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2, w = measure(g, label, 22, FONTS.ui) + 22;
  rr(g, mx - w / 2, my - 16, w, 32, 8); g.fillStyle = u.bpBg; g.fill();
  text(g, label, mx, my, { size: 22, font: FONTS.ui, weight: 700, color: col });
  g.restore();
}

export function readout(g, x, y, str, { size = 34, color, a = 1, align = 'left' } = {}) {
  const u = S().ui, col = color || u.good, w = measure(g, str, size, FONTS.ui, 800) + 32;
  const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.save(); g.globalAlpha *= a; rr(g, bx, y - size * 0.7, w, size * 1.4, 10);
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fill(); g.strokeStyle = alpha(col, 0.5); g.lineWidth = 1.5; g.stroke();
  text(g, str, bx + w / 2, y, { size, font: FONTS.ui, weight: 800, color: col, spacing: 1.5 }); g.restore();
}

export function progressCounter(g, cur, total, label = '') {
  const u = S().ui, s = `${cur}/${total}${label ? '  ' + label : ''}`;
  readout(g, E.W - 48, V(62, 110), s, { size: 24, color: u.gold, align: 'right' });
}

// ---------- Burned-in word-by-word highlight captions (optional, primarily for 9:16 vertical shorts) ----------
export function captions(g, words, globalT, { y = null, maxWords = 5, size = null } = {}) {
  if (!words?.length) return;
  y = y ?? V(975, 1520); size = size ?? V(42, 56);
  const u = S().ui;
  const idx = words.findIndex(w => globalT >= w.start - 0.04 && globalT <= w.end + 0.22);
  if (idx < 0) return;
  let s = idx, e = idx;
  while (s > 0 && idx - s < Math.floor(maxWords / 2) && words[s].start - words[s - 1].end < 0.45 && !/[.!?]$/.test(words[s - 1].word)) s--;
  while (e < words.length - 1 && e - s < maxWords - 1 && words[e + 1].start - words[e].end < 0.45 && !/[.!?]$/.test(words[e].word)) e++;
  const group = words.slice(s, e + 1);
  const ws = group.map(w => measure(g, w.word + ' ', size, FONTS.title, 700));
  const total = ws.reduce((a, b) => a + b, 0);
  rr(g, E.W / 2 - total / 2 - 26, y - size * 0.78, total + 52, size * 1.56, 18);
  g.fillStyle = u.captionBg; g.fill();
  let cx = E.W / 2 - total / 2;
  group.forEach((w, i) => {
    const active = s + i === idx, pop = active ? 1 + 0.12 * ease.out(1 - clamp((globalT - w.start) / 0.18)) : 1;
    g.save(); g.translate(cx + ws[i] / 2, y); g.scale(pop, pop);
    text(g, w.word, 0, 0, { size, color: active ? u.gold : u.cream, stroke: 6, strokeColor: 'rgba(0,0,0,.7)' });
    g.restore(); cx += ws[i];
  });
}

// ---------- Universal closing card (timeless by default; optional CTA button only when requested) ----------
export function endCard(g, t, { title = '', question = '', y = null, cta = false, ctaLabel = 'Subscribe' } = {}) {
  const u = S().ui, a = ease.out(prog(t, 0, 0.7));
  const baseY = y ?? E.H * (cta ? 0.42 : 0.46);
  const head = title || question;
  if (head) text(g, head, E.W / 2, baseY, { size: V(56, 48), color: u.cream, alpha: a });
  if (title && question) text(g, question, E.W / 2, baseY + V(66, 56), { size: V(30, 26), font: FONTS.ui, weight: 600, color: u.text, alpha: a * 0.92 });
  if (cta) {
    const k = ease.outBack(prog(t, 0.45, 1.05)); if (k <= 0) return;
    g.save(); g.translate(E.W / 2, baseY + V(170, 150)); g.scale(k, k);
    rr(g, -170, -40, 340, 80, 40); g.fillStyle = u.accent; g.fill();
    text(g, ctaLabel, 0, 2, { size: 34, color: '#fff', spacing: 1 });
    g.restore();
  }
}
