// scenes/index.js — all 6 shots of What If Everyone Jumped at Once?
import { E, V, registerShot, layer, mood, key, ease, anticipate, shake, rr, circle, seg, text, alpha, FONTS } from '/kit/engine/core.js';
import { breathe, posesAt, crowd, autoBlink } from '/kit/engine/rig2d.js';
import { tileWall, foliage, shockwave } from '/kit/engine/fx2d.js';
import { titleCard, dataCard, blueprint, compareBars, endCard, callout } from '/kit/engine/ui2d.js';
import { drawHost, drawFriend, drawScientist, friendCloseUp, handPos } from './cast.js';
import { drawPlazaSky, drawPlazaMid, drawPlazaGround, drawLabRoom } from './sets/plaza.js';

// s01: Wide twilight plaza establishing shot
registerShot('s01', {
  draw(g, t, _st, info) {
    const cam = { x: key(t, [[0, -18], [info.dur, 16]], ease.sine), y: 0, z: key(t, [[0, 1.0], [info.dur, 1.05]], ease.sine) };
    const gy = V(850, 1420);
    layer(g, cam, 0.2, () => drawPlazaSky(g, t));
    layer(g, cam, 0.5, () => drawPlazaMid(g, t));
    layer(g, cam, 1.0, () => {
      drawPlazaGround(g, t, gy);
      drawHost(g, {
        x: E.W * 0.43, y: gy, s: V(1.22, 1.35),
        pose: breathe(posesAt(t, [[0, 'stand'], [1.1, 'explain', ease.out]]), t),
        expr: t > 1.0 ? 'smile' : 'neutral',
        facing: 1,
      });
      drawFriend(g, {
        x: E.W * 0.57, y: gy, s: V(1.20, 1.33),
        pose: breathe('stand', t + 1.2),
        expr: 'neutral',
        facing: -1,
      });
    });
    titleCard(g, t, { title: 'What If Everyone Jumped?', sub: '8,000,000,000 PEOPLE · ONE SECOND', y: V(215, 340), hold: 2.3 });
  },
});

// s02: Close-up deadpan reaction (continuous brow/mouth transition + breathing + blink)
registerShot('s02', {
  draw(g, t, _st, info) {
    const cam = { x: key(t, [[0, -14], [info.dur, 14]], ease.linear), y: 0, z: key(t, [[0, 1.0], [info.dur, 1.08]], ease.linear) };
    layer(g, cam, 0.25, () => drawPlazaSky(g, t + 3.2));
    layer(g, cam, 0.55, () => drawPlazaMid(g, t + 3.2));
    layer(g, cam, 1.0, () => {
      const browTilt = key(t, [[0, 0.0], [0.55, -0.68, ease.out], [info.dur, -0.58]]);
      const browLift = key(t, [[0, 0.05], [0.55, 0.35, ease.out], [info.dur, 0.28]]);
      friendCloseUp(g, E.W * 0.5, V(560, 960) + Math.sin(t * 2.4) * 4, V(165, 185), {
        facing: -1,
        brow: browLift,
        browTilt,
        blink: autoBlink(t, 2),
        mouth: key(t, [[0, 0.1], [0.6, -0.38, ease.out]]),
        openMouth: t > 0.35 && t < 2.2 ? 0.25 + 0.3 * Math.abs(Math.sin(t * 14)) : 0,
        look: [key(t, [[0, 0.12], [info.dur, 0.36]], ease.linear), -0.05],
        headTilt: key(t, [[0, 0], [0.7, -0.06, ease.out], [info.dur, -0.03]]),
      });
    });
  },
});

// s03: Tiled lab interior — custom seismometer tablet locked to moving handPos()
registerShot('s03', {
  draw(g, t, _st, info) {
    const cam = { x: key(t, [[0, 12], [info.dur, -8]], ease.sine), y: 0, z: 1.02 };
    const gy = V(845, 1420);
    layer(g, cam, 0.8, () => drawLabRoom(g, t, tileWall, foliage));
    layer(g, cam, 1.0, () => {
      const pose = breathe(posesAt(t, [[0, 'hold'], [0.9, 'point', ease.inOut], [2.1, 'explain']]), t, 0.7);
      const sciOpts = {
        x: E.W * 0.36, y: gy, s: V(1.26, 1.38),
        pose, facing: 1,
        expr: t > 0.9 ? 'determined' : 'thinking',
      };
      drawScientist(g, sciOpts);

      // Attach custom tablet directly to far hand socket so it never floats!
      const [hx, hy] = handPos(sciOpts, 'B');
      g.save();
      g.translate(hx, hy);
      rr(g, -18, -26, 36, 46, 6); g.fillStyle = '#1e2438'; g.fill();
      rr(g, -13, -20, 26, 34, 3); g.fillStyle = '#7fe7c4'; g.fill();
      g.restore();

      dataCard(g, V(960, 140), V(230, 420), V(720, 800), 290, {
        label: 'Earth vs Humanity Mass Ratio',
        value: 1, to: 1000, t, dur: 1.5, unit: 'B : 1',
        sub: 'Momentum cancels out the instant feet touch back down',
      });
    });
  },
});

// s04: Crowd synchronized anticipation crouch -> jump -> landing shockwave
registerShot('s04', {
  draw(g, t) {
    const impact = t > 1.42 && t < 2.2 ? (1 - (t - 1.42) / 0.78) : 0;
    const [sx, sy] = impact > 0 ? shake(t, 14 * impact, 9) : [0, 0];
    const cam = { x: sx, y: sy, z: 1.03 };
    const gy = V(850, 1420);

    // Jump arc: crouch at 0.5..0.85, airborne peak at 1.15, land at 1.45
    const jumpArc = t < 0.5 ? 0 : t < 0.85 ? -18 * Math.sin(((t - 0.5) / 0.35) * Math.PI) : t < 1.45 ? 95 * Math.sin(((t - 0.85) / 0.6) * Math.PI) : 0;
    const pose = t < 0.5 ? 'stand' : t < 0.85 ? 'crouch' : t < 1.42 ? 'jump' : 'stand';

    layer(g, cam, 0.25, () => drawPlazaSky(g, t + 9));
    layer(g, cam, 0.55, () => drawPlazaMid(g, t + 9));
    layer(g, cam, 0.85, () => {
      crowd(g, { x: 80, y: gy - 35 - jumpArc * 0.55, w: E.W - 160, n: 20, scale: 0.48, seed: 12 });
    });
    layer(g, cam, 1.0, () => {
      drawPlazaGround(g, t + 9, gy);
      drawHost(g, { x: E.W * 0.42, y: gy - jumpArc, s: 1.22, pose, expr: t > 1.42 ? 'surprised' : 'joy', facing: 1 });
      drawFriend(g, { x: E.W * 0.58, y: gy - jumpArc * 0.94, s: 1.2, pose, expr: t > 1.42 ? 'shocked' : 'joy', facing: -1 });
      if (t >= 1.45) shockwave(g, E.W * 0.5, gy, (t - 1.45) / 0.85, 420, '#ffd89c');
    });
    if (t >= 1.42) {
      dataCard(g, V(620, 140), V(130, 260), V(680, 800), 210, {
        label: 'Landing Energy Released',
        value: 0, to: 2.0, decimals: 1, t: t - 1.42, dur: 0.9, unit: ' TJ',
        sub: 'Two trillion joules into the crust',
      });
    }
  },
});

// s05: Blueprint schematic energy comparison
registerShot('s05', {
  draw(g, t, _st, info) {
    const cam = { x: 0, y: 0, z: key(t, [[0, 1.0], [info.dur, 1.045]], ease.linear) };
    layer(g, cam, 1.0, () => blueprint(g, (gg, bpCol) => {
      text(gg, 'SEISMIC ENERGY COMPARISON (LOG SCALE)', E.W * 0.5, V(140, 260), { size: 32, font: FONTS.ui, weight: 800, color: bpCol, spacing: 2.5 });
      compareBars(gg, V(210, 80), V(260, 440), V(1500, 920), [
        { label: '8B Jump',          value: 40,  hi: true },
        { label: 'Lightning Bolt',   value: 28 },
        { label: 'Mag 5 Quake',      value: 68 },
        { label: 'Shift Earth Orbit',value: 100, color: '#8e9ab8' },
      ], t, { rowH: 96, max: 105, unit: ' idx' });

      // Clean Earth orbit diagram + continuously sweeping radar ring & satellite in lower right
      const cx = V(1480, 540), cy = V(790, 1280);
      const pulseR = 54 + ((t * 48) % 85);
      gg.strokeStyle = alpha(bpCol, Math.max(0, 0.55 * (1 - ((t * 48) % 85) / 85)));
      gg.lineWidth = 2.5; gg.beginPath(); gg.arc(cx, cy, pulseR, 0, Math.PI * 2); gg.stroke();
      circle(gg, cx, cy, 62, alpha(bpCol, 0.22));
      circle(gg, cx, cy, 42, bpCol);
      const satA = t * 1.6;
      circle(gg, cx + Math.cos(satA) * 108, cy + Math.sin(satA) * 34, 6, '#ffd47e');
      seg(gg, [[cx - 140, cy], [cx + 140, cy]], 2, alpha(bpCol, 0.45));
      callout(gg, cx + 42, cy - 12, cx - 220, cy - 58, 'Δ Orbit = 0.000 m', { sub: 'Closed Earth + human system', reveal: (t - 0.6) / 0.7 });
      void anticipate;
    }));
  },
});

// s06: Deliberate serene hold (`hold: true` in shots.json) + clean closing card clear of characters
registerShot('s06', {
  draw(g, t) {
    const gy = V(855, 1420);
    // Still camera (`hold: true`) — gentle calm resolution
    layer(g, {}, 0.2, () => drawPlazaSky(g, 18));
    layer(g, {}, 0.5, () => drawPlazaMid(g, 18));
    layer(g, {}, 1.0, () => {
      drawPlazaGround(g, 18, gy);
      drawHost(g, { x: E.W * 0.44, y: gy, s: 1.18, pose: 'stand', expr: 'smile', facing: 1 });
      drawFriend(g, { x: E.W * 0.56, y: gy, s: 1.16, pose: 'stand', expr: 'smile', facing: -1 });
    });
    endCard(g, t, {
      title: 'Earth keeps right on spinning.',
      question: 'What impossible question should we test next?',
      y: V(240, 380),
      cta: false,
    });
  },
});
