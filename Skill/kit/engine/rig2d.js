// engine/rig2d.js — MC v2 parameterized 2.5D character rig, expression system, poses, and prop sockets.
// Default design matches the MC v2 model sheet: matte dark circular head with directional crescent rim light,
// vertical warm-cream oval eyes, expressive flat pill brow bars, understated mouth, soft-shaded rounded tunic/coat,
// crisp thin limbs, solid ball hands, and flat forward-pointing feet (240 logical units tall at s = 1, feet at [x, y]).
import { seg, circle, poly, rr, mix, alpha, shade, linGrad, radGrad, S, lerp, clamp, ease, COATS } from './core.js';
export { COATS };

// All coordinates in Character Units (feet on y = 0, top of head ~ y = -241), facing RIGHT (+x).
// `facing: -1` mirrors horizontally around x = 0 while preserving world-space light direction.
export const POSES = {
  // --- 5 canonical MC v2 model-sheet poses ---
  stand:       { head:[0,-216], neck:[0,-190], hip:[0,-100], eF:[29,-136], hF:[28,-96],  eB:[-27,-136], hB:[-26,-96],  kF:[10,-50],  fF:[10,-3],  kB:[-10,-50], fB:[-10,-3] },
  wave:        { head:[2,-216], neck:[1,-190], hip:[0,-100], eF:[42,-176], hF:[58,-222], eB:[-27,-136], hB:[-26,-96],  kF:[10,-50],  fF:[10,-3],  kB:[-10,-50], fB:[-10,-3] },
  reach:       { head:[8,-214], neck:[5,-189], hip:[0,-100], eF:[48,-160], hF:[86,-168], eB:[-28,-136], hB:[-34,-98],  kF:[14,-50],  fF:[18,-3],  kB:[-12,-50], fB:[-16,-3] },
  slump:       { head:[14,-204],neck:[8,-182], hip:[-2,-98], eF:[24,-126], hF:[22,-84],  eB:[-20,-128], hB:[-18,-86],  kF:[12,-49],  fF:[10,-3],  kB:[-8,-49],  fB:[-10,-3], tilt: 0.08 },
  stride:      { head:[5,-215], neck:[3,-189], hip:[0,-99],  eF:[-24,-134],hF:[-42,-98], eB:[28,-136],  hB:[48,-102],  kF:[26,-50],  fF:[40,-3],  kB:[-20,-48], fB:[-36,-3] },

  // --- Universal storytelling & acting poses ---
  idle:        { head:[0,-216], neck:[0,-190], hip:[0,-100], eF:[28,-136], hF:[25,-95],  eB:[-26,-136], hB:[-24,-96],  kF:[10,-50],  fF:[11,-3],  kB:[-10,-50], fB:[-10,-3] },
  talk:        { head:[2,-216], neck:[1,-190], hip:[0,-100], eF:[36,-142], hF:[54,-146], eB:[-25,-138], hB:[18,-132],  kF:[10,-50],  fF:[12,-3],  kB:[-10,-50], fB:[-10,-3] },
  explain:     { head:[3,-216], neck:[1,-190], hip:[0,-100], eF:[42,-146], hF:[68,-154], eB:[-34,-144], hB:[-56,-148], kF:[11,-50],  fF:[14,-3],  kB:[-11,-50], fB:[-13,-3] },
  point:       { head:[5,-216], neck:[2,-190], hip:[0,-100], eF:[46,-162], hF:[88,-172], eB:[-26,-136], hB:[-24,-96],  kF:[12,-50],  fF:[15,-3],  kB:[-11,-50], fB:[-13,-3] },
  pointUp:     { head:[3,-217], neck:[1,-190], hip:[0,-100], eF:[38,-182], hF:[46,-238], eB:[-26,-136], hB:[-24,-96],  kF:[10,-50],  fF:[12,-3],  kB:[-10,-50], fB:[-11,-3] },
  think:       { head:[4,-214], neck:[2,-189], hip:[0,-100], eF:[30,-148], hF:[16,-194], eB:[-24,-136], hB:[18,-132],  kF:[10,-50],  fF:[10,-3],  kB:[-10,-50], fB:[-10,-3] },
  facepalm:    { head:[8,-210], neck:[4,-186], hip:[0,-100], eF:[32,-158], hF:[16,-212], eB:[-24,-136], hB:[-22,-96],  kF:[10,-50],  fF:[10,-3],  kB:[-10,-50], fB:[-10,-3], tilt: 0.05 },
  shrug:       { head:[0,-214], neck:[0,-188], hip:[0,-100], eF:[38,-146], hF:[58,-170], eB:[-38,-146], hB:[-58,-170], kF:[11,-50],  fF:[13,-3],  kB:[-11,-50], fB:[-13,-3] },
  handsOnHead: { head:[0,-214], neck:[0,-189], hip:[0,-100], eF:[42,-188], hF:[18,-236], eB:[-40,-188], hB:[-18,-236], kF:[13,-49],  fF:[16,-3],  kB:[-13,-49], fB:[-16,-3] },
  cheer:       { head:[0,-218], neck:[0,-191], hip:[0,-101], eF:[40,-194], hF:[54,-246], eB:[-40,-194], hB:[-54,-246], kF:[13,-50],  fF:[16,-3],  kB:[-13,-50], fB:[-16,-3] },
  hold:        { head:[3,-215], neck:[1,-189], hip:[0,-100], eF:[32,-140], hF:[46,-132], eB:[14,-140],  hB:[36,-130],  kF:[10,-50],  fF:[11,-3],  kB:[-10,-50], fB:[-10,-3] },
  phone:       { head:[8,-211], neck:[4,-187], hip:[0,-100], eF:[28,-140], hF:[38,-154], eB:[-22,-136], hB:[-20,-96],  kF:[10,-50],  fF:[11,-3],  kB:[-10,-50], fB:[-10,-3] },
  ready:       { head:[10,-206],neck:[6,-182], hip:[-6,-92], eF:[34,-142], hF:[52,-152], eB:[-20,-138], hB:[22,-146],  kF:[24,-46],  fF:[32,-3],  kB:[-22,-46], fB:[-30,-3], tilt: 0.06 },
  sit:         { head:[4,-176], neck:[2,-150], hip:[0,-66],  eF:[26,-106], hF:[38,-86],  eB:[-18,-108], hB:[24,-88],   kF:[46,-62],  fF:[48,-3],  kB:[34,-62],  fB:[36,-3] },
  sitBack:     { head:[-6,-174],neck:[-3,-148],hip:[0,-66],  eF:[20,-104], hF:[30,-80],  eB:[-26,-104], hB:[-20,-74],  kF:[46,-62],  fF:[52,-3],  kB:[36,-62],  fB:[42,-3], tilt: -0.06 },
  kneel:       { head:[5,-168], neck:[3,-142], hip:[0,-58],  eF:[26,-98],  hF:[34,-68],  eB:[-20,-100], hB:[-14,-68],  kF:[34,-32],  fF:[36,-3],  kB:[-6,-6],   fB:[-40,-3] },
  crouch:      { head:[12,-154],neck:[7,-130], hip:[-8,-54], eF:[28,-92],  hF:[42,-64],  eB:[-16,-94],  hB:[24,-66],   kF:[32,-32],  fF:[26,-3],  kB:[18,-32],  fB:[10,-3], tilt: 0.1 },
  lie:         { head:[-98,-26],neck:[-70,-24],hip:[12,-20], eF:[-36,-36], hF:[-10,-40], eB:[-40,-14],  hB:[-12,-12],  kF:[58,-22],  fF:[102,-16],kB:[56,-14],  fB:[98,-10] },
  jump:        { head:[3,-234], neck:[1,-208], hip:[0,-118], eF:[40,-188], hF:[52,-234], eB:[-36,-182], hB:[-48,-222], kF:[22,-76],  fF:[10,-34], kB:[-18,-74], fB:[-28,-38] },
  fall:        { head:[26,-178],neck:[14,-158],hip:[-12,-96],eF:[48,-166], hF:[78,-192], eB:[-38,-146], hB:[-68,-164], kF:[18,-56],  fF:[4,-16],  kB:[-32,-58], fB:[-54,-24], tilt: 0.16 },
};

const KEYS = ['head', 'neck', 'hip', 'eF', 'hF', 'eB', 'hB', 'kF', 'fF', 'kB', 'fB'];
export const resolvePose = p => (typeof p === 'string' ? POSES[p] || POSES.stand : p || POSES.stand);

export function mixPose(a, b, k) {
  a = resolvePose(a); b = resolvePose(b); k = clamp(k);
  const o = {};
  for (const kk of KEYS) o[kk] = [lerp(a[kk][0], b[kk][0], k), lerp(a[kk][1], b[kk][1], k)];
  o.tilt = lerp(a.tilt || 0, b.tilt || 0, k);
  return o;
}

// Track of [[t0,'stand'],[t1,'point',ease.out],[t2,'talk']] -> blended pose at shot-local time t
export function posesAt(t, track) {
  if (!Array.isArray(track) || !track.length) return resolvePose('stand');
  if (t <= track[0][0]) return resolvePose(track[0][1]);
  for (let i = 1; i < track.length; i++) {
    if (t <= track[i][0]) {
      const [t0, p0] = track[i - 1], [t1, p1, fn] = track[i];
      return mixPose(p0, p1, t1 === t0 ? 1 : (fn || ease.inOut)((t - t0) / (t1 - t0)));
    }
  }
  return resolvePose(track[track.length - 1][1]);
}

export function breathe(p, t, amt = 1) {
  p = resolvePose(p);
  const b = Math.sin(t * 2.1) * 1.8 * amt, sway = Math.sin(t * 1.15) * 1.0 * amt;
  return {
    ...p,
    head: [p.head[0] + sway, p.head[1] + b],
    neck: [p.neck[0] + sway * 0.7, p.neck[1] + b * 0.8],
    eF: [p.eF[0], p.eF[1] + b * 0.6],
    eB: [p.eB[0], p.eB[1] + b * 0.6],
    hF: [p.hF[0], p.hF[1] + b * 0.45],
    hB: [p.hB[0], p.hB[1] + b * 0.45],
  };
}

// Smooth procedural walk & run cycles (phase 0..1 per full two-step cycle)
export function walkPose(phase, run = false) {
  const a = phase * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
  const st = run ? 46 : 30, lift = run ? 26 : 13, arm = run ? 42 : 24, bounce = Math.abs(c) * (run ? 9 : 4.5);
  const foot = (sn, cn) => [sn * st, -3 - Math.max(0, cn) * lift];
  const knee = (sn, cn) => [sn * st * 0.62 + (run ? 12 : 7), -50 - Math.max(0, cn) * lift * 0.72 + bounce * 0.3];
  const lean = run ? 12 : 4;
  return {
    head: [lean, -216 - bounce],
    neck: [lean * 0.7, -190 - bounce],
    hip:  [0, -100 - bounce * 0.7],
    eF: [-s * arm * 0.62 + 12, -138 - bounce + Math.abs(s) * 4],
    hF: [-s * arm + 10, -100 - bounce - Math.max(0, -s) * (run ? 24 : 8)],
    eB: [s * arm * 0.62 - 10, -138 - bounce + Math.abs(s) * 4],
    hB: [s * arm - 8, -100 - bounce - Math.max(0, s) * (run ? 24 : 8)],
    kF: knee(s, c), fF: foot(s, c),
    kB: knee(-s, -c), fB: foot(-s, -c),
    tilt: run ? 0.08 : 0.02,
  };
}

// Natural periodic blink curve (returns 0..1 blink amount, blinking gently every ~3.8s)
export function autoBlink(t, seed = 0) {
  const period = 3.8 + (seed % 5) * 0.37;
  const u = (t + seed * 1.31) % period;
  if (u > 0.16) return 0;
  return Math.sin((u / 0.16) * Math.PI);
}

// ---------- Expression presets (blended with continuous float overrides) ----------
// browLift: -1 (low) .. +1 (high); browTilt: -1 (worried/sad inner-up) .. +1 (determined/angry inner-down)
// mouthCurve: -1 (frown) .. +1 (smile); mouthOpen: 0 (closed) .. 1 (open 'o'); eyeScaleY: vertical eye multiplier
export const EXPRESSIONS = {
  neutral:    { browLift: 0.0,  browTilt: 0.0,   browArch: 0.0,  mouthCurve: 0.26,  mouthOpen: 0.0,  eyeScaleY: 1.0,  joyEyes: false },
  joy:        { browLift: 0.36, browTilt: -0.1,  browArch: 0.18, mouthCurve: 0.88,  mouthOpen: 0.0,  eyeScaleY: 1.0,  joyEyes: true  },
  happy:      { browLift: 0.3,  browTilt: -0.08, browArch: 0.14, mouthCurve: 0.78,  mouthOpen: 0.0,  eyeScaleY: 1.02, joyEyes: false },
  smile:      { browLift: 0.15, browTilt: 0.0,   browArch: 0.08, mouthCurve: 0.55,  mouthOpen: 0.0,  eyeScaleY: 1.0,  joyEyes: false },
  smirk:      { browLift: 0.22, browTilt: 0.18,  browArch: 0.1,  mouthCurve: 0.45,  mouthOpen: 0.0,  eyeScaleY: 0.92, asymBrow: 0.35 },
  worry:      { browLift: 0.28, browTilt: -0.66, browArch: 0.0,  mouthCurve: -0.45, mouthOpen: 0.06, eyeScaleY: 1.06, joyEyes: false },
  worried:    { browLift: 0.28, browTilt: -0.66, browArch: 0.0,  mouthCurve: -0.45, mouthOpen: 0.06, eyeScaleY: 1.06, joyEyes: false },
  nervous:    { browLift: 0.28, browTilt: -0.62, browArch: 0.0,  mouthCurve: -0.3,  mouthOpen: 0.05, eyeScaleY: 1.05, sweat: true },
  determined: { browLift: -0.24,browTilt: 0.76,  browArch: 0.0,  mouthCurve: -0.22, mouthOpen: 0.0,  eyeScaleY: 0.92, joyEyes: false },
  angry:      { browLift: -0.35,browTilt: 0.92,  browArch: 0.0,  mouthCurve: -0.65, mouthOpen: 0.12, eyeScaleY: 0.86, joyEyes: false },
  sad:        { browLift: -0.08,browTilt: -0.78, browArch: -0.1, mouthCurve: -0.68, mouthOpen: 0.0,  eyeScaleY: 0.82, gazeY: 0.18 },
  cry:        { browLift: 0.05, browTilt: -0.84, browArch: -0.1, mouthCurve: -0.74, mouthOpen: 0.14, eyeScaleY: 0.80, tear: true, gazeY: 0.15 },
  surprised:  { browLift: 0.72, browTilt: -0.12, browArch: 0.28, mouthCurve: 0.0,   mouthOpen: 0.72, eyeScaleY: 1.18, joyEyes: false },
  shocked:    { browLift: 0.85, browTilt: -0.18, browArch: 0.32, mouthCurve: 0.0,   mouthOpen: 0.92, eyeScaleY: 1.24, joyEyes: false },
  scared:     { browLift: 0.68, browTilt: -0.72, browArch: 0.1,  mouthCurve: -0.5,  mouthOpen: 0.65, eyeScaleY: 1.2,  sweat: true },
  awe:        { browLift: 0.6,  browTilt: -0.1,  browArch: 0.24, mouthCurve: 0.2,   mouthOpen: 0.48, eyeScaleY: 1.16, sparkle: true },
  thinking:   { browLift: 0.18, browTilt: 0.22,  browArch: 0.08, mouthCurve: -0.05, mouthOpen: 0.0,  eyeScaleY: 0.95, asymBrow: 0.45 },
  confused:   { browLift: 0.24, browTilt: -0.25, browArch: 0.08, mouthCurve: -0.18, mouthOpen: 0.06, eyeScaleY: 1.0,  asymBrow: 0.55 },
  sleepy:     { browLift: -0.18,browTilt: -0.2,  browArch: 0.0,  mouthCurve: 0.0,   mouthOpen: 0.08, eyeScaleY: 0.38 },
};

function resolveFaceState(o = {}) {
  const base = EXPRESSIONS[o.expr] || EXPRESSIONS.neutral;
  const blinkAmt = typeof o.blink === 'number' ? clamp(o.blink) : (o.blink ? 1 : 0);
  return {
    browLift:   o.brow !== undefined ? clamp(o.brow, -1, 1) : base.browLift,
    browTilt:   o.browTilt !== undefined ? clamp(o.browTilt, -1, 1) : base.browTilt,
    browArch:   o.browArch !== undefined ? o.browArch : (base.browArch || 0),
    asymBrow:   o.asymBrow !== undefined ? o.asymBrow : (base.asymBrow || 0),
    mouthCurve: o.mouth !== undefined ? clamp(o.mouth, -1, 1) : base.mouthCurve,
    mouthOpen:  clamp(Math.max(o.openMouth ?? base.mouthOpen, (o.talk || 0) * 0.85), 0, 1),
    eyeScaleY:  base.eyeScaleY * (1 - blinkAmt * 0.92),
    gazeY:      base.gazeY || 0,
    blinkAmt,
    joyEyes:    Boolean(o.joyEyes ?? base.joyEyes) && blinkAmt < 0.5,
    sweat:      Boolean(o.sweat ?? base.sweat),
    tear:       Boolean(o.tear ?? base.tear),
    sparkle:    Boolean(o.sparkle ?? base.sparkle),
    blush:      clamp(o.blush || 0, 0, 1),
    aged:       Boolean(o.aged || o.outfit?.head === 'elder'),
  };
}

// Core MC v2 face renderer (works at any head radius r; r = 25 on full body, r = 90..150 on bigFace close-up)
export function renderMCFace(g, r, o = {}) {
  const feat = o.featureColor || S().feature || '#fff6e6';
  const ink = o.ink || S().ink || '#18161f';
  const st = resolveFaceState(o);
  const lx = clamp((o.look?.[0] ?? 0.22), -1, 1) * r * 0.16;
  const ly = clamp((o.look?.[1] ?? st.gazeY), -1, 1) * r * 0.12;
  const cx = r * 0.12 + lx;
  const cy = -r * 0.02 + ly;
  const sep = r * 0.27;
  const exL = cx - sep, exR = cx + sep;
  const ey = cy - r * 0.04;

  // Optional subtle elder forehead lines (from Awaken 6oZ9fdM0n50 'Growing old' design)
  if (st.aged) {
    g.strokeStyle = alpha(feat, 0.36);
    g.lineWidth = Math.max(1.1, r * 0.048);
    g.lineCap = 'round';
    for (const dy of [-r * 0.54, -r * 0.44]) {
      g.beginPath();
      g.moveTo(cx - r * 0.22, dy);
      g.quadraticCurveTo(cx, dy - r * 0.03, cx + r * 0.22, dy);
      g.stroke();
    }
  }

  // Optional soft cheek blush
  if (st.blush > 0.02) {
    const bc = alpha('#f08b84', 0.34 * st.blush);
    g.fillStyle = bc;
    g.beginPath(); g.ellipse(exL - r * 0.1, ey + r * 0.22, r * 0.13, r * 0.075, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(exR + r * 0.1, ey + r * 0.22, r * 0.13, r * 0.075, 0, 0, Math.PI * 2); g.fill();
  }

  // Eyes: vertical warm-cream ovals (or happy curved arcs on 'joy', or closed line on blink)
  const erx = r * 0.118;
  const ery = Math.max(r * 0.025, r * 0.195 * st.eyeScaleY);
  g.strokeStyle = feat;
  g.fillStyle = feat;
  g.lineCap = 'round';

  if (st.joyEyes) {
    g.lineWidth = Math.max(1.8, r * 0.095);
    for (const ex of [exL, exR]) {
      g.beginPath();
      g.arc(ex, ey + r * 0.05, r * 0.13, Math.PI * 1.12, Math.PI * 1.88);
      g.stroke();
    }
  } else if (st.blinkAmt > 0.82) {
    g.lineWidth = Math.max(1.6, r * 0.085);
    for (const ex of [exL, exR]) {
      g.beginPath(); g.moveTo(ex - erx * 1.25, ey); g.lineTo(ex + erx * 1.25, ey); g.stroke();
    }
  } else {
    for (const ex of [exL, exR]) {
      g.beginPath();
      g.ellipse(ex, ey, erx, ery, 0, 0, Math.PI * 2);
      g.fill();
      if (st.sparkle) {
        circle(g, ex + erx * 0.32, ey - ery * 0.35, r * 0.042, '#ffffff');
      }
    }
  }

  // Always-present flat rounded pill brow bars above each eye (signature MC v2 clarity!)
  const bw = r * 0.175;
  const browYBase = cy - r * 0.33 - st.browLift * r * 0.11;
  g.strokeStyle = feat;
  g.lineWidth = Math.max(1.8, r * 0.098);
  g.lineCap = 'round';
  [[-1, exL], [1, exR]].forEach(([side, ex]) => {
    // side = -1 is left eye (inner is +x), side = +1 is right eye (inner is -x)
    const asym = side === 1 ? st.asymBrow * r * 0.09 : -st.asymBrow * r * 0.03;
    const by = browYBase - asym;
    // browTilt > 0 -> inner brow lower (determined/angry); browTilt < 0 -> inner brow higher (worry/sad)
    const innerDy = st.browTilt * r * 0.11;
    const outerDy = -st.browTilt * r * 0.06;
    const leftDy  = side === -1 ? outerDy : innerDy;
    const rightDy = side === -1 ? innerDy : outerDy;
    const archDy  = -st.browArch * r * 0.08;
    g.beginPath();
    g.moveTo(ex - bw, by + leftDy);
    g.quadraticCurveTo(ex, by + (leftDy + rightDy) * 0.5 + archDy, ex + bw, by + rightDy);
    g.stroke();
  });

  // Optional glasses (layered cleanly over eyes)
  if (o.glasses) {
    g.strokeStyle = feat;
    g.lineWidth = Math.max(1.4, r * 0.068);
    const gr = r * 0.2;
    g.beginPath(); g.arc(exL, ey, gr, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(exR, ey, gr, 0, Math.PI * 2); g.stroke();
    seg(g, [[exL + gr, ey], [exR - gr, ey]], Math.max(1.3, r * 0.06), feat);
  }

  // Mouth: tiny understated MC v2 mouth
  const mx = cx + (o.expr === 'smirk' ? r * 0.04 : 0);
  const my = cy + r * 0.34;
  if (st.mouthOpen > 0.16) {
    // Clean vertical/rounded 'o' or talking ellipse
    const mrx = r * lerp(0.085, 0.135, st.mouthOpen);
    const mry = r * lerp(0.06, 0.175, st.mouthOpen);
    g.fillStyle = feat;
    g.beginPath();
    g.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2);
    g.fill();
  } else {
    const mw = r * 0.13;
    const curve = st.mouthCurve * r * 0.11;
    g.strokeStyle = feat;
    g.lineWidth = Math.max(1.5, r * 0.078);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(mx - mw, my - curve * 0.35);
    g.quadraticCurveTo(mx, my + curve, mx + mw, my - curve * 0.35);
    g.stroke();
  }

  // Optional tear / sweat drop
  if (st.tear) {
    g.fillStyle = '#8ad4ff';
    const tx = exR + r * 0.08, ty = ey + ery + r * 0.08;
    poly(g, [[tx, ty - r * 0.08], [tx - r * 0.055, ty + r * 0.06], [tx + r * 0.055, ty + r * 0.06]], '#8ad4ff');
    circle(g, tx, ty + r * 0.065, r * 0.055, '#8ad4ff');
  }
  if (st.sweat) {
    const sx = -r * 0.56, sy = -r * 0.24;
    poly(g, [[sx, sy - r * 0.14], [sx - r * 0.07, sy + r * 0.05], [sx + r * 0.07, sy + r * 0.05]], '#9be0ff');
    circle(g, sx, sy + r * 0.06, r * 0.07, '#9be0ff');
  }

  // Optional mustache / beard accessories
  if (o.mustache) {
    g.strokeStyle = feat; g.lineWidth = Math.max(1.6, r * 0.085);
    g.beginPath(); g.moveTo(mx - r * 0.2, my - r * 0.04);
    g.quadraticCurveTo(mx - r * 0.08, my - r * 0.12, mx, my - r * 0.05);
    g.quadraticCurveTo(mx + r * 0.08, my - r * 0.12, mx + r * 0.2, my - r * 0.04);
    g.stroke();
  }
  void ink;
}

// Draw true razor-tapered spherical crescent rim light on a circular head of radius `r` at [hx, hy]
function drawHeadCrescentRim(g, hx, hy, r, rimColor, localDirX, localDirY, rimW = 3.2) {
  if (!rimColor) return;
  const len = Math.hypot(localDirX, localDirY) || 1;
  const dx = localDirX / len, dy = localDirY / len;
  const off = Math.min(r * 0.32, rimW * 1.15);
  g.save();
  g.beginPath();
  g.arc(hx, hy, r, 0, Math.PI * 2);
  g.clip();
  g.beginPath();
  g.arc(hx, hy, r + 0.5, 0, Math.PI * 2, false);
  g.arc(hx - dx * off, hy - dy * off, r, 0, Math.PI * 2, true);
  g.fillStyle = rimColor;
  g.fill('evenodd');
  g.restore();
}

// ---------- Headwear & hair variants ----------
function drawHeadwear(g, hx, hy, r, outfit, ink, rimColor) {
  const kind = outfit?.head;
  if (!kind || kind === 'none') return;
  const c = outfit.hatColor || outfit.accent || '#e8684a';
  const hi = outfit.hairColor || ink;
  g.save();
  g.translate(hx, hy);
  if (kind === 'elder') {
    // Signature Awaken elderly white hair puffs at temples & crown (from 6oZ9fdM0n50!)
    const hc = outfit.hairColor || '#f4efe6';
    const hs = mix(hc, S().coatShadow || '#78749e', 0.22);
    circle(g, -r * 0.86, -r * 0.18, r * 0.26, hs);
    circle(g, -r * 0.72, -r * 0.44, r * 0.24, hc);
    circle(g,  r * 0.84, -r * 0.18, r * 0.24, hc);
    circle(g,  r * 0.68, -r * 0.44, r * 0.22, hc);
    circle(g, -r * 0.12, -r * 0.92, r * 0.2, hc);
  } else if (kind === 'ponytail') {
    g.fillStyle = hi;
    g.beginPath(); g.moveTo(-r * 0.72, -r * 0.25);
    g.quadraticCurveTo(-r * 1.55, -r * 0.55, -r * 1.48, r * 0.45);
    g.quadraticCurveTo(-r * 1.15, r * 0.55, -r * 0.82, r * 0.05);
    g.closePath(); g.fill();
    circle(g, -r * 0.85, -r * 0.22, r * 0.16, c);
  } else if (kind === 'bun') {
    circle(g, -r * 0.58, -r * 0.92, r * 0.4, hi);
    seg(g, [[-r * 0.85, -r * 0.68], [-r * 0.3, -r * 0.78]], 3.5, c);
  } else if (kind === 'curly') {
    for (let i = 0; i < 7; i++) {
      const a = -2.55 + i * 0.36;
      circle(g, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.3, hi);
    }
  } else if (kind === 'spiky') {
    for (const [ax, ay] of [[-0.5, -1.35], [-0.1, -1.45], [0.3, -1.38], [-0.88, -1.05]]) {
      poly(g, [[ax * r * 0.5 - 6, -r * 0.72], [ax * r, ay * r], [ax * r * 0.5 + 8, -r * 0.72]], hi);
    }
  } else if (kind === 'cap' || kind === 'capBack') {
    const dir = kind === 'capBack' ? -1 : 1;
    g.fillStyle = c;
    g.beginPath(); g.arc(0, -r * 0.18, r * 1.02, Math.PI, 0); g.closePath(); g.fill();
    seg(g, [[dir * r * 0.2, -r * 0.22], [dir * r * 1.48, -r * 0.14]], 6.5, shade(c, -0.18));
  } else if (kind === 'beanie') {
    g.fillStyle = c;
    g.beginPath(); g.arc(0, -r * 0.22, r * 1.04, Math.PI * 1.04, -0.04); g.closePath(); g.fill();
    rr(g, -r * 1.05, -r * 0.38, r * 2.1, r * 0.28, 4); g.fillStyle = shade(c, -0.2); g.fill();
    circle(g, 0, -r * 1.28, r * 0.22, c);
  } else if (kind === 'fedora') {
    poly(g, [[-r * 0.85, -r * 0.45], [-r * 0.62, -r * 1.28], [r * 0.62, -r * 1.28], [r * 0.85, -r * 0.45]], c);
    seg(g, [[-r * 1.38, -r * 0.45], [r * 1.38, -r * 0.45]], 6, shade(c, -0.2));
  } else if (kind === 'headband') {
    seg(g, [[-r * 0.96, -r * 0.42], [r * 0.96, -r * 0.42]], 6.5, c);
  } else if (kind === 'crown') {
    const cr = outfit.hatColor || '#f7c95c';
    poly(g, [[-r * 0.78, -r * 0.72], [-r * 0.86, -r * 1.32], [-r * 0.38, -r * 0.98], [0, -r * 1.42], [r * 0.38, -r * 0.98], [r * 0.86, -r * 1.32], [r * 0.78, -r * 0.72]], cr);
  }
  void rimColor;
  g.restore();
}

// ---------- Shaded 2.5D MC v2 Tunic / Coat & Outfit Variants ----------
function drawTorsoAndCoat(g, p, o, ink, rim, localRimX) {
  const outfit = o.outfit || {};
  const topKind = outfit.top ?? (o.coat === null ? 'none' : 'coat');
  const coatBase = o.coat || outfit.color || COATS.cream;
  const shadowTint = S().coatShadow || '#78749e';
  const coatShadow = mix(coatBase, shadowTint, 0.33);
  const coatMid = mix(coatBase, shadowTint, 0.14);
  const coatLit = shade(coatBase, 0.04);

  if (topKind === 'none') {
    seg(g, [p.hip, p.neck], 11.5, ink);
    return;
  }

  // Torso axis from neck -> hip so coat tilts/bends naturally in sit/slump/crouch/lie poses!
  const nx = p.neck[0], ny = p.neck[1];
  const hx = p.hip[0],  hy = p.hip[1];
  const ang = Math.atan2(hx - nx, hy - ny); // 0 when vertical (hx==nx, hy>ny)
  const torsoLen = Math.max(58, Math.hypot(hx - nx, hy - ny));

  g.save();
  g.translate(nx, ny);
  g.rotate(-ang);

  const wTop = 22.5, wBot = (topKind === 'dress' || topKind === 'royal') ? 32 : 25.5;
  const hCoat = torsoLen + ((topKind === 'trench' || topKind === 'labcoat' || topKind === 'royal') ? 16 : 2);
  const litRight = localRimX >= 0;
  const gx0 = litRight ? -wBot : wBot;
  const gx1 = litRight ?  wBot : -wBot;
  const coatGrad = linGrad(g, gx0, 0, gx1, 0, [
    [0.0, coatShadow],
    [0.52, coatMid],
    [0.88, coatBase],
    [1.0, coatLit],
  ]);

  // Smooth rounded tapered pill/tunic silhouette (signature MC v2!)
  const tunicPath = () => {
    g.beginPath();
    g.moveTo(-wTop + 14, -2);
    g.lineTo(wTop - 14, -2);
    g.quadraticCurveTo(wTop, -2, wTop + 1, 14);
    g.lineTo(wBot, hCoat - 9);
    g.quadraticCurveTo(wBot, hCoat, wBot - 10, hCoat + 1);
    g.quadraticCurveTo(0, hCoat + 3.5, -wBot + 10, hCoat + 1);
    g.quadraticCurveTo(-wBot, hCoat, -wBot, hCoat - 9);
    g.lineTo(-wTop - 1, 14);
    g.quadraticCurveTo(-wTop, -2, -wTop + 14, -2);
    g.closePath();
  };

  tunicPath();
  g.fillStyle = coatGrad;
  g.fill();

  // Subtle ambient rim highlight along the lit edge of the coat (just like mc_v2_model_sheet.png!)
  if (rim?.color) {
    g.save();
    tunicPath();
    g.clip();
    const rx = litRight ? wBot - 1.2 : -wBot + 1.2;
    g.strokeStyle = alpha(rim.color, 0.85);
    g.lineWidth = (rim.w ?? 3.2) * 1.15;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(rx * 0.92, hCoat * 0.36);
    g.lineTo(rx, hCoat - 8);
    g.stroke();
    g.restore();
  }

  // Outfit-specific detailing layered cleanly over the shaded base form
  if (topKind === 'cardigan' || topKind === 'labcoat') {
    // Open cardigan/coat over cream inner shirt strip (matches 6oZ9fdM0n50 right-hand character!)
    const innerCol = outfit.shirtColor || COATS.cream;
    const innerGrad = linGrad(g, -9, 0, 9, 0, [mix(innerCol, shadowTint, 0.2), innerCol]);
    rr(g, -7.5, -1, 15, hCoat + 1, 4);
    g.fillStyle = innerGrad;
    g.fill();
    g.strokeStyle = alpha(ink, 0.22);
    g.lineWidth = 1.6;
    seg(g, [[-7.5, 2], [-7.5, hCoat]], 1.6, alpha(ink, 0.22));
    seg(g, [[ 7.5, 2], [ 7.5, hCoat]], 1.6, alpha(ink, 0.22));
  } else if (topKind === 'suit') {
    const shirtCol = outfit.shirtColor || COATS.cream;
    const tieCol = outfit.accent || '#d9534f';
    poly(g, [[-9, -1], [9, -1], [0, 34]], shirtCol);
    poly(g, [[-2.5, 4], [2.5, 4], [4, 32], [0, 38], [-4, 32]], tieCol);
  } else if (topKind === 'hoodie') {
    // Cozy hood collar fold + kangaroo pocket seam
    g.strokeStyle = mix(coatShadow, ink, 0.25);
    g.lineWidth = 2.2;
    g.beginPath(); g.arc(0, 3, 13, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    seg(g, [[-5, 11], [-6, 28]], 2, alpha(ink, 0.28));
    seg(g, [[ 5, 11], [ 6, 28]], 2, alpha(ink, 0.28));
    rr(g, -14, hCoat - 28, 28, 18, 6);
    g.strokeStyle = alpha(ink, 0.16); g.lineWidth = 1.6; g.stroke();
  } else if (topKind === 'royal') {
    rr(g, -wTop, -2, wTop * 2, 10, 5);
    g.fillStyle = '#f5efe6'; g.fill();
  }

  g.restore();
}

// ---------- Built-in held hand props ----------
function drawHeldProp(g, hx, hy, kind, o) {
  if (!kind) return;
  const col = o.propColor || o.outfit?.accent || '#f29a58';
  g.save();
  g.translate(hx, hy);
  if (kind === 'mug' || kind === 'cup') {
    rr(g, -9, -12, 18, 22, 4); g.fillStyle = o.propColor || '#f6efdd'; g.fill();
    g.strokeStyle = o.propColor || '#f6efdd'; g.lineWidth = 3.2;
    g.beginPath(); g.arc(9, -1, 6, -1.2, 1.2); g.stroke();
  } else if (kind === 'phone') {
    g.rotate(-0.35);
    rr(g, -7, -14, 14, 24, 3); g.fillStyle = '#222436'; g.fill();
    rr(g, -5, -11, 10, 18, 1.5); g.fillStyle = '#9be4ff'; g.fill();
  } else if (kind === 'lantern') {
    seg(g, [[0, 0], [0, 8]], 2.5, '#2b2838');
    rr(g, -9, 8, 18, 24, 5); g.fillStyle = '#ffd47e'; g.fill();
    g.strokeStyle = '#2b2838'; g.lineWidth = 2.8; g.stroke();
  } else if (kind === 'flashlight') {
    rr(g, -4, -5, 22, 10, 3); g.fillStyle = '#3a3c52'; g.fill();
    poly(g, [[18, -5], [46, -18], [46, 18], [18, 5]], 'rgba(255,232,160,0.34)');
  } else if (kind === 'clipboard' || kind === 'book') {
    rr(g, -12, -16, 24, 30, 3); g.fillStyle = col; g.fill();
    rr(g, -9, -11, 18, 22, 1.5); g.fillStyle = '#fff6e6'; g.fill();
  } else if (kind === 'briefcase') {
    rr(g, -18, 4, 36, 26, 4); g.fillStyle = '#5c4338'; g.fill();
    g.strokeStyle = '#5c4338'; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 4, 6, Math.PI, 0); g.stroke();
  } else if (kind === 'sword') {
    seg(g, [[0, 6], [42, -52]], 5, '#dce6f2');
    seg(g, [[-9, -2], [9, 6]], 4.5, '#eab84e');
  } else if (kind === 'flag') {
    seg(g, [[0, 26], [0, -78]], 3.5, '#d8d2c6');
    poly(g, [[0, -78], [44, -64], [0, -48]], col);
  } else if (kind === 'wrench') {
    seg(g, [[-4, 12], [18, -18]], 5, '#aeb8c8');
    circle(g, 20, -21, 7, '#aeb8c8');
  }
  g.restore();
}

// Compute exact world-space [x, y] of a character's hand ('F' near or 'B' far) or head so scene props never float!
export function jointPos(o = {}, joint = 'hF') {
  const { x = 0, y = 0, s = 1, facing = 1, kid = false, rot = 0 } = o;
  const p = resolvePose(o.pose);
  const scale = s * (kid ? 0.68 : 1);
  const pt = p[joint] || p.hF;
  let lx = pt[0] * facing * scale;
  let ly = pt[1] * scale;
  const totalRot = rot + (p.tilt || 0) * facing;
  if (totalRot) {
    const c = Math.cos(totalRot), sn = Math.sin(totalRot);
    const rx = lx * c - ly * sn, ry = lx * sn + ly * c;
    lx = rx; ly = ry;
  }
  return [x + lx, y + ly];
}
export const handPos = (o, hand = 'F') => jointPos(o, hand === 'B' ? 'hB' : 'hF');
export const headPos = (o) => jointPos(o, 'head');

// ---------- Main MC v2 figure renderer ----------
export function drawFigure(g, o = {}) {
  const {
    x = 0, y = 0, s = 1, pose = 'stand', facing = 1,
    ink = S().ink || '#18161f',
    rim = null,          // { color: '#eea865', dir: [1, -0.35], w: 3.5 } in WORLD space
    shadow = true,
    kid = false,
    rot = 0,
    prop = null,
  } = o;

  const p = resolvePose(pose);
  const scale = s * (kid ? 0.68 : 1);
  const HR = (kid ? 28 : 25) * (o.headScale || 1);
  const LW = 9.0, LLW = 9.8, HAND_R = 7.6;
  const inkFar = mix(ink, S().coatShadow || '#58567a', 0.18);
  const pantsNear = o.outfit?.pants || ink;
  const pantsFar = mix(pantsNear, S().coatShadow || '#58567a', 0.18);
  const shoeCol = o.outfit?.shoes || ink;

  // Map world-space rim light direction into mirrored local character space
  const worldRimDir = rim?.dir || [1, -0.35];
  const localRimX = worldRimDir[0] * facing;
  const localRimY = worldRimDir[1];

  const shB = [p.neck[0] + clamp(p.eB[0] * 0.55, -18, -2), p.neck[1] + 15];
  const shF = [p.neck[0] + clamp(p.eF[0] * 0.55, 2, 18), p.neck[1] + 15];
  const hipB = [p.hip[0] - 8.5, p.hip[1]];
  const hipF = [p.hip[0] + 8.5, p.hip[1]];

  const drawFoot = (fx, fy, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(fx - 5, fy - 4.5);
    g.lineTo(fx + 14, fy - 3.5);
    g.quadraticCurveTo(fx + 18, fy + 1, fx + 14, fy + 3);
    g.lineTo(fx - 5, fy + 3);
    g.quadraticCurveTo(fx - 7.5, fy - 0.5, fx - 5, fy - 4.5);
    g.closePath();
    g.fill();
  };

  g.save();
  g.translate(x, y);

  // Soft ground contact shadow (fades and shrinks automatically during jump/fall)
  if (shadow && pose !== 'lie') {
    const airLift = clamp((-Math.min(p.fF[1], p.fB[1]) - 3) / 60, 0, 0.75);
    g.fillStyle = alpha('#000000', 0.22 * (1 - airLift));
    g.beginPath();
    g.ellipse(0, 2, 42 * scale * (1 - airLift * 0.4), 8.5 * scale * (1 - airLift * 0.4), 0, 0, Math.PI * 2);
    g.fill();
  }

  const totalRot = rot + (p.tilt || 0) * facing;
  if (totalRot) g.rotate(totalRot);
  g.scale(facing * scale, scale);

  // 1. Far arm + solid ball hand (behind torso)
  seg(g, [shB, p.eB, p.hB], LW, inkFar);
  circle(g, p.hB[0], p.hB[1], HAND_R * 0.95, inkFar);

  // 2. Far leg + flat foot (behind near leg)
  seg(g, [hipB, p.kB, p.fB], LLW, pantsFar);
  drawFoot(p.fB[0], p.fB[1], mix(shoeCol, S().coatShadow || '#58567a', 0.16));

  // 3. Near leg + flat foot
  seg(g, [hipF, p.kF, p.fF], LLW, pantsNear);
  drawFoot(p.fF[0], p.fF[1], shoeCol);

  // 4. Neck (clean dark column connecting head & rounded tunic collar)
  seg(g, [p.neck, [p.head[0], p.head[1] + HR * 0.78]], 9.5, ink);

  // 5. Shaded 2.5D MC v2 Tunic / Coat & Outfit
  drawTorsoAndCoat(g, p, o, ink, rim, localRimX);

  // Optional subtle short sleeve cap on near shoulder (seen in studio reference crop!)
  if (o.outfit?.sleeveCap || o.outfit?.top === 'tshirt') {
    const capCol = o.coat || o.outfit?.color || COATS.cream;
    g.save();
    g.translate(shF[0], shF[1]);
    const armAng = Math.atan2(p.eF[1] - shF[1], p.eF[0] - shF[0]);
    g.rotate(armAng - Math.PI / 2);
    rr(g, -8.5, -4, 17, 16, 6);
    g.fillStyle = shade(capCol, 0.02);
    g.fill();
    g.restore();
  }

  // 6. Near arm + solid ball hand + optional held prop
  seg(g, [shF, p.eF, p.hF], LW, ink);
  circle(g, p.hF[0], p.hF[1], HAND_R, ink);
  if (prop) drawHeldProp(g, p.hF[0], p.hF[1], prop, o);

  // 7. Matte charcoal circular head with subtle velvety volume + crescent rim light + face + headwear
  g.save();
  g.translate(p.head[0], p.head[1]);
  if (o.headTilt) g.rotate(o.headTilt);

  const headTop = shade(ink, 0.065);
  g.fillStyle = radGrad(g, -HR * 0.18, -HR * 0.25, HR * 0.1, HR * 1.15, [headTop, ink]);
  g.beginPath();
  g.arc(0, 0, HR, 0, Math.PI * 2);
  g.fill();

  if (rim?.color) {
    drawHeadCrescentRim(g, 0, 0, HR, rim.color, localRimX, localRimY, rim.w ?? S().rimWidth ?? 3.5);
  }

  renderMCFace(g, HR, { ...o, ink });
  drawHeadwear(g, 0, 0, HR, o.outfit, ink, rim?.color);
  g.restore();

  g.restore();
}

// Extreme close-up MC v2 portrait (fills shot with expressive head, shoulders/collar, crescent rim, and face)
export function bigFace(g, x, y, r, o = {}) {
  const ink = o.ink || S().ink || '#18161f';
  const coatCol = o.coat || o.outfit?.color || COATS.cream;
  const shadowTint = S().coatShadow || '#78749e';
  const facing = o.facing ?? 1;
  const worldRimDir = o.rim?.dir || [1, -0.35];

  g.save();
  g.translate(x, y);
  g.scale(facing, 1);

  // Neck + top of shaded MC v2 coat shoulders for grounding in close-ups
  if (o.shoulders !== false) {
    seg(g, [[0, r * 0.85], [0, r * 1.25]], r * 0.36, ink);
    const sw = r * 1.28, sh = r * 1.2;
    const cGrad = linGrad(g, -sw, 0, sw, 0, [mix(coatCol, shadowTint, 0.33), coatCol, shade(coatCol, 0.04)]);
    rr(g, -sw, r * 1.08, sw * 2, sh, r * 0.62);
    g.fillStyle = cGrad;
    g.fill();
  }

  if (o.headTilt) g.rotate(o.headTilt);
  g.fillStyle = radGrad(g, -r * 0.18, -r * 0.25, r * 0.1, r * 1.15, [shade(ink, 0.065), ink]);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();

  if (o.rim?.color) {
    drawHeadCrescentRim(g, 0, 0, r, o.rim.color, worldRimDir[0] * facing, worldRimDir[1], o.rim.w ?? 6.5);
  }

  renderMCFace(g, r, { ...o, ink });
  drawHeadwear(g, 0, 0, r, o.outfit, ink, o.rim?.color);
  g.restore();
}

// Distant crowd helper (renders clean mini MC v2 figures with colored coats + heads)
export function crowd(g, { x = 0, y = 900, w = 1920, n = 18, scale = 0.42, seed = 7, color = null, rimColor = null } = {}) {
  const palette = [COATS.cream, COATS.sage, COATS.peach, COATS.sky, COATS.butter, COATS.lavender];
  let s = seed | 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) / 4294967296); };
  for (let i = 0; i < n; i++) {
    const px = x + ((i + 0.5) / n) * w + (rnd() - 0.5) * (w / n) * 0.55;
    const py = y + (rnd() - 0.5) * 18;
    const sc = scale * (0.9 + rnd() * 0.2);
    drawFigure(g, {
      x: px, y: py, s: sc,
      pose: rnd() > 0.7 ? 'talk' : 'stand',
      facing: rnd() > 0.5 ? 1 : -1,
      coat: color || palette[i % palette.length],
      ink: color || S().inkFar,
      rim: rimColor ? { color: rimColor, dir: [1, -0.35], w: 2.5 } : null,
      shadow: false,
    });
  }
}
