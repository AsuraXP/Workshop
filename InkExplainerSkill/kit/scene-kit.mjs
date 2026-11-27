// Independent 2D ink primitives for InkExplainerSkill. No Awaken assets or imports.
export const INK = '#151515';
export const WHITE = '#ffffff';
export const PALETTE = Object.freeze({
  paper: '#f4efe4',
  dusk: '#e8995e',
  sun: '#ffd15c',
  earth: '#c98a55',
  bark: '#765036',
  night: '#26344d',
  deepNight: '#1d273b',
  grass: '#73865b',
  darkGrass: '#364a3b',
  stone: '#8b8882',
  fire: '#f58b38',
  ember: '#e85338',
  gold: '#ffe066',
  red: '#d93829',
  sleepBlue: '#5b82b8',
});

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function jitter(x, y, seed, amount = 1.8) {
  const jx = (hash(x * 0.037 + y * 0.053 + seed) - 0.5) * amount * 2;
  const jy = (hash(x * 0.061 - y * 0.029 + seed * 3.1) - 0.5) * amount * 2;
  return [x + jx, y + jy];
}

export function inkLine(ctx, x1, y1, x2, y2, { width = 5, color = INK, seed = 1, wobble = 1.7 } = {}) {
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.min(20, Math.round(distance / 38)));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const [px, py] = i === 0 || i === steps ? [x, y] : jitter(x, y, seed + i * 0.71, wobble);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function inkPoly(ctx, points, { fill = null, stroke = INK, width = 5, seed = 1, close = true, wobble = 1.8 } = {}) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    const [px, py] = jitter(x, y, seed + i * 1.37, wobble);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && width > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function inkCircle(ctx, cx, cy, rx, ry = rx, { fill = WHITE, stroke = INK, width = 5, seed = 1, wobble = 1.7 } = {}) {
  const n = 32;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const radial = 1 + (hash(i * 1.91 + seed) - 0.5) * wobble / Math.max(20, rx);
    const x = cx + Math.cos(a) * rx * radial;
    const y = cy + Math.sin(a) * ry * radial;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && width > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/** Draw the studio's white circular-head stick figure at a baseline y. */
export function drawFigure(ctx, {
  x = 960, y = 930, scale = 1, facing = 1, pose = 'stand', expression = 'neutral', seed = 1,
} = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  const head = [0, -234];
  let hip = [0, -96], neck = [0, -190];
  let leftKnee = [-23, -48], rightKnee = [22, -49];
  let leftFoot = [-43, 0], rightFoot = [42, 0];
  let leftElbow = [-35, -150], rightElbow = [38, -150];
  let leftHand = [-58, -123], rightHand = [58, -126];
  if (pose === 'reach') { rightElbow = [54, -178]; rightHand = [103, -209]; }
  if (pose === 'wave') { rightElbow = [48, -178]; rightHand = [78, -234]; }
  if (pose === 'crouch') {
    hip = [-8, -59]; neck = [5, -134]; head[1] = -176;
    leftKnee = [-42, -26]; rightKnee = [31, -22];
    leftFoot = [-31, 0]; rightFoot = [48, 0];
    leftElbow = [-22, -102]; leftHand = [12, -82];
    rightElbow = [42, -104]; rightHand = [71, -75];
  } else if (pose === 'sit') {
    hip = [0, -42]; neck = [4, -136]; head[1] = -180;
    leftKnee = [35, -39]; rightKnee = [57, -35];
    leftFoot = [55, 0]; rightFoot = [82, 0];
    leftElbow = [-27, -98]; leftHand = [-52, -78];
    rightElbow = [35, -105]; rightHand = [65, -91];
  } else if (pose === 'shiver') {
    leftElbow = [-55, -158]; leftHand = [-25, -190];
    rightElbow = [57, -158]; rightHand = [24, -190];
  }

  inkLine(ctx, -48, 3, 50, 3, { width: 4, seed: seed + 1 });
  inkPoly(ctx, [hip, leftKnee, leftFoot], { close: false, width: 6.2, seed: seed + 2 });
  inkPoly(ctx, [hip, rightKnee, rightFoot], { close: false, width: 6.2, seed: seed + 3 });
  inkLine(ctx, hip[0], hip[1], neck[0], neck[1], { width: 6.5, seed: seed + 4 });
  inkPoly(ctx, [[neck[0], neck[1] + 8], leftElbow, leftHand], { close: false, width: 6.1, seed: seed + 5 });
  inkPoly(ctx, [[neck[0], neck[1] + 8], rightElbow, rightHand], { close: false, width: 6.1, seed: seed + 6 });

  inkCircle(ctx, head[0], head[1], 38, 38, { fill: WHITE, stroke: INK, width: 6, seed: seed + 7 });
  const ex = 6, ey = head[1] - 3;
  if (expression === 'sleeping') {
    inkLine(ctx, ex - 15, ey, ex - 3, ey, { width: 3.8, seed: seed + 10 });
    inkLine(ctx, ex + 6, ey, ex + 18, ey, { width: 3.8, seed: seed + 11 });
    inkLine(ctx, ex - 5, ey + 16, ex + 8, ey + 16, { width: 3, seed: seed + 12 });
  } else if (expression === 'scared' || expression === 'surprised') {
    inkCircle(ctx, ex - 10, ey, 6.5, 8.5, { fill: WHITE, width: 3, seed: seed + 10 });
    inkCircle(ctx, ex + 12, ey, 6.5, 8.5, { fill: WHITE, width: 3, seed: seed + 11 });
    inkCircle(ctx, ex - 10, ey, 2.5, 2.5, { fill: INK, stroke: null, width: 0, seed: seed + 12 });
    inkCircle(ctx, ex + 12, ey, 2.5, 2.5, { fill: INK, stroke: null, width: 0, seed: seed + 13 });
    inkLine(ctx, ex - 16, ey - 14, ex - 4, ey - 17, { width: 3.5, seed: seed + 14 });
    inkLine(ctx, ex + 4, ey - 17, ex + 18, ey - 13, { width: 3.5, seed: seed + 15 });
    inkCircle(ctx, ex + 1, ey + 17, 5.5, 7, { fill: INK, stroke: null, width: 0, seed: seed + 16 });
  } else {
    inkCircle(ctx, ex - 9, ey, 3.4, 4.2, { fill: INK, stroke: null, width: 0, seed: seed + 10 });
    inkCircle(ctx, ex + 10, ey, 3.4, 4.2, { fill: INK, stroke: null, width: 0, seed: seed + 11 });
    if (expression === 'happy') {
      ctx.beginPath(); ctx.arc(ex + 1, ey + 10, 9, 0.18, Math.PI - 0.18);
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke();
      inkLine(ctx, ex - 16, ey - 13, ex - 4, ey - 15, { width: 3, seed: seed + 12 });
      inkLine(ctx, ex + 4, ey - 15, ex + 17, ey - 13, { width: 3, seed: seed + 13 });
    } else if (expression === 'puzzled') {
      inkLine(ctx, ex - 16, ey - 12, ex - 4, ey - 14, { width: 3.5, seed: seed + 12 });
      inkLine(ctx, ex + 4, ey - 17, ex + 18, ey - 13, { width: 3.5, seed: seed + 13 });
      inkLine(ctx, ex - 5, ey + 16, ex + 8, ey + 14, { width: 3.5, seed: seed + 14 });
    } else {
      inkLine(ctx, ex - 6, ey + 15, ex + 8, ey + 15, { width: 3, seed: seed + 12 });
    }
  }
  ctx.restore();
}

export function drawLabel(ctx, text, x, y, { size = 40, color = INK, background = null, align = 'center' } = {}) {
  ctx.save();
  ctx.font = `800 ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (background) {
    const w = ctx.measureText(text).width + 26;
    ctx.fillStyle = background;
    ctx.fillRect(x - w / 2, y - size * 0.7, w, size * 1.4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2, y - size * 0.7, w, size * 1.4);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawFrame(ctx, width = 1920, height = 1080) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, height - 10);
}
