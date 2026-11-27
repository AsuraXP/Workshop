// scenes/sets/plaza.js — reusable 2.5D twilight overlook & plaza set.
import { E, mood, backdrop, fillRect, linGrad, circle, seg, alpha, mix } from '/kit/engine/core.js';
import { hills, skyStreaks, bokeh, stars, lensStreak, motes } from '/kit/engine/fx2d.js';

export function drawPlazaSky(g, t = 0) {
  const M = mood('dusk');
  backdrop(g, M.sky);
  stars(g, 55, t, 9, E.H * 0.42);
  skyStreaks(g, { n: 6, y0: 90, y1: E.H * 0.52, color: M.key, a: 0.16, t });
  // Glowing low sunset disc
  circle(g, E.W * 0.78, E.H * 0.52, 68, alpha(M.key, 0.25));
  circle(g, E.W * 0.78, E.H * 0.52, 42, alpha('#fff4dc', 0.85));
}

export function drawPlazaMid(g, t = 0) {
  const M = mood('dusk');
  hills(g, E.H * 0.63, 125, mix(M.ambient, M.dark, 0.18), 3);
  hills(g, E.H * 0.71, 85, mix(M.ambient, M.dark, 0.42), 8);
  bokeh(g, { n: 22, y0: E.H * 0.62, y1: E.H * 0.78, color: M.practical, a: 0.28, t });
}

export function drawPlazaGround(g, t = 0, groundY = null) {
  const M = mood('dusk');
  const gy = groundY ?? E.H * 0.80;
  fillRect(g, -400, gy, E.W + 800, E.H - gy + 300, linGrad(g, 0, gy, 0, E.H, [M.floor, M.dark]));
  // Clean overlook railing + warm practical lamp post
  seg(g, [[-250, gy], [E.W + 250, gy]], 4, alpha(M.rim, 0.35));
  const lampX = E.W * 0.84;
  seg(g, [[lampX, gy], [lampX, gy - 250]], 8, M.dark);
  circle(g, lampX, gy - 258, 13, '#fff5dc');
  lensStreak(g, lampX, gy - 258, { w: 340, h: 8, color: M.practical, a: 0.5 });
  motes(g, t, { n: 24, color: M.key, speed: 10 });
}

// scenes/sets/interiorLab.js — tiled research room with potted foliage & soft ambient daylight/dusk
export function drawLabRoom(g, t = 0, tileWallFn, foliageFn) {
  const M = mood('interiorCool');
  fillRect(g, -300, -200, E.W + 600, E.H * 0.78 + 200, linGrad(g, 0, 0, E.W, E.H * 0.78, [M.wall, mix(M.wall, M.key, 0.12)]));
  tileWallFn(g, -200, 40, E.W + 400, E.H * 0.74, { tileW: 104, tileH: 54, color: M.dark, a: 0.14 });
  fillRect(g, -300, E.H * 0.78, E.W + 600, E.H * 0.35, linGrad(g, 0, E.H * 0.78, 0, E.H, [M.floor, M.dark]));
  seg(g, [[-300, E.H * 0.78], [E.W + 300, E.H * 0.78]], 5, alpha(M.dark, 0.45));
  foliageFn(g, E.W * 0.16, E.H * 0.78, { s: 1.15, n: 7, pot: true, t });
}
