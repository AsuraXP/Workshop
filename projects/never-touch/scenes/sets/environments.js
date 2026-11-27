// scenes/sets/environments.js — reusable multi-plane 2.5D locations for "Why You Never Actually Touch Anything".
import { E, mood, backdrop, fillRect, linGrad, rr, seg, circle, poly, alpha, mix, shade } from '/kit/engine/core.js';
import { beam, lensStreak, skyStreaks, bokeh, tileWall, foliage, hills, stars, clouds, motes } from '/kit/engine/fx2d.js';

// 1. Cozy sunlit study room (`interiorWarm`)
export function drawStudyRoomBg(g, t = 0) {
  const M = mood('interiorWarm');
  fillRect(g, -300, -200, E.W + 600, E.H * 0.80 + 200, linGrad(g, 0, 0, E.W, E.H * 0.80, [mix(M.wall, M.dark, 0.18), M.wall]));
  tileWall(g, -200, 40, E.W + 400, E.H * 0.74, { tileW: 112, tileH: 58, color: M.dark, a: 0.10 });

  // Right-side tall sunlit window + warm volumetric sunbeam
  const wx = 1440, wy = 130, ww = 310, wh = 430;
  rr(g, wx - 12, wy - 12, ww + 24, wh + 24, 14);
  g.fillStyle = shade(M.wall, -0.22); g.fill();
  rr(g, wx, wy, ww, wh, 8);
  g.fillStyle = linGrad(g, wx, wy, wx, wy + wh, ['#fae4b8', '#f3b684', '#c98a78']); g.fill();
  seg(g, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 8, shade(M.wall, -0.22));
  seg(g, [[wx, wy + wh * 0.48], [wx + ww, wy + wh * 0.48]], 8, shade(M.wall, -0.22));
  beam(g, wx + ww * 0.5, wy + wh * 0.4, 2.38, 0.52, 1100, M.key, 0.16);

  // Framed wall bookshelf detail on left (positioned cleanly below title-card zone)
  rr(g, 140, 340, 270, 18, 6); g.fillStyle = shade(M.floor, -0.18); g.fill();
  for (const [bx, bw, bh, bc] of [[165, 24, 68, '#d97a6c'], [193, 20, 60, '#8fb8a8'], [217, 28, 74, '#e6be74'], [252, 22, 64, '#8fa6cc']]) {
    rr(g, bx, 340 - bh, bw, bh, 3); g.fillStyle = bc; g.fill();
  }

  // Floor + warm pendant lamp overhead
  const floorY = 835;
  fillRect(g, -300, floorY, E.W + 600, E.H - floorY + 250, linGrad(g, 0, floorY, 0, E.H, [M.floor, M.dark]));
  seg(g, [[-300, floorY], [E.W + 300, floorY]], 5, alpha(M.dark, 0.45));

  seg(g, [[960, -80], [960, 118]], 4, M.dark);
  poly(g, [[918, 118], [1002, 118], [1024, 152], [896, 152]], shade(M.dark, 0.12));
  circle(g, 960, 156, 11, '#fff6dc');
  lensStreak(g, 960, 156, { w: 320, h: 7, color: M.practical, a: 0.42 });
  motes(g, t, { n: 22, color: M.key, speed: 9 });
}

export function drawOakTable(g, tableX = 960, tableTopY = 715, tableW = 540, floorY = 835) {
  const oakTop = '#b97c56', oakDark = '#754932';
  // Legs
  fillRect(g, tableX - tableW * 0.42, tableTopY + 20, 18, floorY - tableTopY - 20, oakDark);
  fillRect(g, tableX + tableW * 0.42 - 18, tableTopY + 20, 18, floorY - tableTopY - 20, oakDark);
  // Tabletop slab
  rr(g, tableX - tableW / 2, tableTopY, tableW, 24, 8);
  g.fillStyle = linGrad(g, tableX - tableW / 2, tableTopY, tableX + tableW / 2, tableTopY, [oakDark, oakTop, '#cfa074']);
  g.fill();
}

export function drawStudyForeground(g, t = 0) {
  foliage(g, 130, 835, { s: 1.15, n: 7, pot: true, potColor: '#c9826b', t });
}

// 2. Bright daytime park bench (`day`)
export function drawParkBenchBg(g, t = 0) {
  const M = mood('day');
  backdrop(g, ['#6ca6e6', '#b8e0fa', '#f6efe0']);
  circle(g, 310, 180, 62, alpha('#fff9e6', 0.42));
  circle(g, 310, 180, 38, '#fffaf0');
  clouds(g, t, { n: 5, y: 185, a: 0.65, speed: 12 });
  hills(g, 660, 110, '#7eb488', 5);
  hills(g, 735, 72, '#5e986c', 11);
  fillRect(g, -300, 790, E.W + 600, 420, linGrad(g, 0, 790, 0, E.H, ['#8896a6', '#697586']));
  seg(g, [[-300, 790], [E.W + 300, 790]], 5, '#527e5c');
}

export function drawBench(g, x = 1140, groundY = 835) {
  // Cast-iron legs + warm wood slats
  fillRect(g, x - 145, groundY - 72, 12, 72, '#2d3142');
  fillRect(g, x + 133, groundY - 72, 12, 72, '#2d3142');
  fillRect(g, x - 140, groundY - 148, 10, 82, '#2d3142');
  fillRect(g, x + 130, groundY - 148, 10, 82, '#2d3142');
  rr(g, x - 165, groundY - 142, 330, 22, 5); g.fillStyle = '#b97e54'; g.fill();
  rr(g, x - 165, groundY - 112, 330, 22, 5); g.fillStyle = '#a86f48'; g.fill();
  rr(g, x - 172, groundY - 76, 344, 18, 6);  g.fillStyle = '#c98e62'; g.fill();
}

// 3. High-contrast containment lab (`storm` / `interiorCool`)
export function drawFusionLabBg(g, t = 0) {
  const M = mood('storm');
  fillRect(g, -300, -200, E.W + 600, 845 + 200, linGrad(g, 0, 0, 0, 845, ['#141a2e', '#222b48', '#2a3354']));
  tileWall(g, -200, 60, E.W + 400, 785, { tileW: 140, tileH: 90, color: '#0a0e1a', a: 0.25, stagger: false });
  fillRect(g, -300, 845, E.W + 600, 350, linGrad(g, 0, 845, 0, E.H, ['#1a2036', '#0e1220']));
  seg(g, [[-300, 845], [E.W + 300, 845]], 4, alpha(M.rim, 0.28));
  // Subtle status indicator lights
  for (let i = 0; i < 6; i++) {
    const on = Math.sin(t * 3 + i) > 0;
    circle(g, 220 + i * 32, 140, 5, on ? '#7ce8c8' : '#33425e');
  }
}

// 4. Scenic Awaken twilight balcony (`dusk`)
export function drawTwilightBalconySky(g, t = 0) {
  const M = mood('dusk');
  backdrop(g, M.sky);
  stars(g, 65, t, 14, E.H * 0.45);
  skyStreaks(g, { n: 7, y0: 95, y1: 520, color: M.key, a: 0.16, t });
  circle(g, E.W * 0.76, 540, 76, alpha(M.key, 0.24));
  circle(g, E.W * 0.76, 540, 44, alpha('#fff4dc', 0.88));
}

export function drawTwilightBalconyMid(g, t = 0) {
  const M = mood('dusk');
  hills(g, 665, 130, mix(M.ambient, M.dark, 0.18), 6);
  hills(g, 745, 88, mix(M.ambient, M.dark, 0.44), 12);
  bokeh(g, { n: 28, y0: 660, y1: 825, color: M.practical, a: 0.30, t });
}

export function drawTwilightBalconyStage(g, t = 0, gy = 850) {
  const M = mood('dusk');
  // Balcony deck + railing
  fillRect(g, -350, gy, E.W + 700, E.H - gy + 260, linGrad(g, 0, gy, 0, E.H, [M.floor, M.dark]));
  seg(g, [[-300, gy - 110], [E.W + 300, gy - 110]], 6, shade(M.dark, 0.15));
  for (let rx = -180; rx <= E.W + 180; rx += 110) {
    seg(g, [[rx, gy - 110], [rx, gy]], 3.5, alpha(M.dark, 0.72));
  }
  // Wooden pergola beam + warm hanging porch bulb with horizontal lens flare!
  fillRect(g, 1460, -100, 26, gy + 100, M.dark);
  fillRect(g, -200, 68, E.W + 400, 24, M.dark);
  seg(g, [[1280, 92], [1280, 178]], 3.5, M.dark);
  circle(g, 1280, 188, 13, '#fff6de');
  lensStreak(g, 1280, 188, { w: 420, h: 9, color: M.practical, a: 0.55 });
  foliage(g, 220, gy, { s: 1.1, n: 6, pot: true, potColor: '#9c6b66', t });
  motes(g, t, { n: 28, color: M.key, speed: 11, glow: true });
}
