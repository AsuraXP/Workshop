// scenes/s01_s06.js — Shots s01..s06 of "Why You Never Actually Touch Anything".
import { E, registerShot, layer, mood, key, lerp, clamp, prog, ease, rr, seg, circle, ring, poly, text, glow, linGrad, alpha, FONTS } from '/kit/engine/core.js';
import { breathe, posesAt, autoBlink } from '/kit/engine/rig2d.js';
import { shockwave } from '/kit/engine/fx2d.js';
import { titleCard, dataCard, blueprint, compareBars, callout, dimension, readout } from '/kit/engine/ui2d.js';
import { drawMilo, drawNora, drawCeramicMug, handPos } from './cast.js';
import { drawStudyRoomBg, drawOakTable, drawStudyForeground } from './sets/environments.js';

// s01 (0.0 - 4.1s): Cozy warm study room — Milo lifts steaming mug locked via handPos(); Nora reads across oak table
registerShot('s01', {
  draw(g, t, _st, info) {
    const M = mood('interiorWarm');
    const cam = { x: key(t, [[0, -16], [info.dur, 18]], ease.sine), y: 0, z: key(t, [[0, 1.0], [info.dur, 1.05]], ease.sine) };
    const floorY = 835;

    layer(g, cam, 0.45, () => drawStudyRoomBg(g, t));
    layer(g, cam, 1.0, () => {
      const miloPose = breathe(posesAt(t, [[0, 'stand'], [0.9, 'hold', ease.inOut], [2.4, 'talk', ease.inOut]]), t);
      const miloOpts = {
        x: 685, y: floorY, s: 1.24,
        pose: miloPose, facing: 1,
        expr: t > 1.3 ? 'smile' : 'neutral',
        blink: autoBlink(t, 1),
        rim: { color: M.rim, dir: [1, -0.32], w: 3.5 },
      };
      drawMilo(g, miloOpts);

      const noraOpts = {
        x: 1235, y: floorY, s: 1.21,
        pose: breathe('hold', t + 1.1, 0.8),
        facing: -1,
        expr: 'neutral',
        blink: autoBlink(t, 4),
        prop: 'book',
        propColor: '#6fa4d8',
        rim: { color: M.rim, dir: [1, -0.32], w: 3.5 },
      };
      drawNora(g, noraOpts);

      drawOakTable(g, 960, 715, 500, floorY);

      // Steaming mug locked mathematically to Milo's near hand!
      const [mx, my] = handPos(miloOpts, 'F');
      drawCeramicMug(g, mx + 6, my - 4, { t, steam: true, s: 1.05 });
    });
    layer(g, cam, 1.18, () => drawStudyForeground(g, t));

    titleCard(g, t, {
      title: 'Why You Never Touch Anything',
      sub: 'THE SUB-NANOMETER ILLUSION',
      y: 205,
      hold: 3.0,
    });
  },
});

// s02 (4.1 - 9.7s): Push-in on Milo & his mug + "LIFETIME DIRECT CONTACTS: 0" card
registerShot('s02', {
  draw(g, t, _st, info) {
    const M = mood('interiorWarm');
    const cam = { x: key(t, [[0, -40], [info.dur, -10]], ease.sine), y: key(t, [[0, -10], [info.dur, -28]], ease.sine), z: key(t, [[0, 1.08], [info.dur, 1.15]], ease.sine) };
    const floorY = 835;

    layer(g, cam, 0.45, () => drawStudyRoomBg(g, t + 4.1));
    layer(g, cam, 1.0, () => {
      const surpriseK = ease.out(prog(t, 1.2, 2.2));
      const miloOpts = {
        x: 590, y: floorY, s: 1.34,
        pose: breathe(posesAt(t, [[0, 'talk'], [1.5, 'hold', ease.inOut]]), t),
        facing: 1,
        brow: lerp(0.1, 0.55, surpriseK),
        browTilt: lerp(0.0, -0.35, surpriseK),
        mouth: lerp(0.35, -0.18, surpriseK),
        openMouth: surpriseK > 0.6 ? 0.28 : 0,
        blink: autoBlink(t, 2),
        look: [lerp(0.2, 0.42, surpriseK), lerp(0, 0.25, surpriseK)],
        rim: { color: M.rim, dir: [1, -0.32], w: 3.6 },
      };
      drawMilo(g, miloOpts);
      drawOakTable(g, 880, 715, 420, floorY);

      const [mx, my] = handPos(miloOpts, 'F');
      drawCeramicMug(g, mx + 6, my - 4, { t: t + 4.1, steam: true, s: 1.1 });

      // Subtle glowing inspection ring around hand-to-mug interface
      const ringA = ease.out(prog(t, 0.8, 1.6));
      if (ringA > 0.01) {
        ring(g, mx + 4, my, 36 + Math.sin(t * 4) * 3, 2.8, alpha('#ffd47e', ringA * 0.85));
      }
    });

    dataCard(g, 960, 230, 760, 300, {
      label: 'Things You Have Directly Touched',
      value: 100, to: 0, decimals: 0,
      t: Math.max(0, t - 0.35), dur: 2.0,
      sub: 'Every chair, floor, and coffee mug stops a hair above your skin',
    });
  },
});

// s03 (9.7 - 13.2s): Nora leans in skeptically and pokes the oak tabletop 3 times (t=1.45, 1.95, 2.45s)
registerShot('s03', {
  draw(g, t, _st, info) {
    const M = mood('interiorWarm');
    const cam = { x: key(t, [[0, 75], [info.dur, 95]], ease.sine), y: -18, z: key(t, [[0, 1.14], [info.dur, 1.20]], ease.sine) };
    const floorY = 835, tableTopY = 715;

    // 3 rhythmic finger pokes onto the oak table!
    const pokeTimes = [1.45, 1.95, 2.45];
    let pokeDip = 0;
    for (const pt of pokeTimes) {
      const d = Math.abs(t - pt);
      if (d < 0.20) pokeDip = Math.max(pokeDip, Math.cos((d / 0.20) * (Math.PI / 2)));
    }

    const basePose = posesAt(t, [[0, 'stand'], [0.7, 'reach', ease.out]]);
    // Aim near hand cleanly down onto the oak tabletop surface at y = 712
    const customPose = {
      ...breathe(basePose, t, 0.6),
      eF: [lerp(basePose.eF[0], 46, prog(t, 0.5, 1.1)), lerp(basePose.eF[1], -126, prog(t, 0.5, 1.1))],
      hF: [lerp(basePose.hF[0], 78, prog(t, 0.5, 1.1)), lerp(basePose.hF[1], -106 + pokeDip * 15, prog(t, 0.5, 1.1))],
    };

    layer(g, cam, 0.45, () => drawStudyRoomBg(g, t + 9.7));
    layer(g, cam, 1.0, () => {
      drawOakTable(g, 990, tableTopY, 520, floorY);

      const speaking = (t >= 0.15 && t <= 0.60) || (t >= 1.15 && t <= 3.10);
      const noraOpts = {
        x: 1185, y: floorY, s: 1.32,
        pose: customPose,
        facing: -1,
        brow: 0.22,
        browTilt: 0.45,
        asymBrow: 0.48,
        mouth: -0.18,
        openMouth: speaking ? 0.24 + 0.36 * Math.abs(Math.sin(t * 16)) : 0,
        blink: autoBlink(t, 5),
        look: [0.35, 0.28],
        rim: { color: M.rim, dir: [1, -0.32], w: 3.6 },
      };
      drawNora(g, noraOpts);

      const [hx, hy] = handPos(noraOpts, 'F');
      for (const pt of pokeTimes) {
        if (t >= pt) shockwave(g, hx, tableTopY, (t - pt) / 0.45, 68, '#ffd89c');
      }
      void hy;
    });
  },
});

// s04 (13.2 - 20.3s): 10,000,000x continuous microscope dive into the 0.2 nm hover canyon!
registerShot('s04', {
  draw(g, t) {
    const zoomK = ease.inOut(prog(t, 0.1, 2.35)); // 0 = macro finger + wood, 1 = sub-nanometer lattice view
    // Deep twilight-to-quantum backdrop
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#171a30', '#24294c', '#14192c']);
    g.fillRect(0, 0, E.W, E.H);

    // Subtle zoom grid rings during magnification
    for (let i = 1; i <= 5; i++) {
      const r = ((i * 180 + zoomK * 650) % 950) + 60;
      ring(g, E.W / 2, E.H * 0.50, r, 1.5, alpha('#9ac4f2', 0.12));
    }

    // Upper finger boundary (smooth dark MC v2 ball-hand silhouette curving overhead)
    const fingerY = lerp(455, 345, zoomK) + Math.sin(t * 2.4) * 5;
    // Lower wood tabletop boundary
    const woodY = lerp(495, 635, zoomK);

    // Wood grain -> crystalline carbon/cellulose atomic lattice at bottom
    g.fillStyle = linGrad(g, 0, woodY, 0, E.H, ['#8c583a', '#4a2d20', '#241612']);
    g.fillRect(0, woodY, E.W, E.H - woodY);

    // Finger silhouette above
    g.fillStyle = '#18161f';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(E.W, 0);
    g.lineTo(E.W, fingerY - 65);
    g.quadraticCurveTo(E.W * 0.5, fingerY + 55, 0, fingerY - 65);
    g.closePath();
    g.fill();

    // Atomic lattice spheres fade in as zoom reaches 10,000,000x!
    if (zoomK > 0.25) {
      const atomA = ease.out((zoomK - 0.25) / 0.75);
      // Wood surface atoms + electron halos
      for (let ax = 180; ax <= E.W - 180; ax += 120) {
        const wy = woodY + 26 + Math.sin(t * 3 + ax * 0.02) * 3;
        glow(g, ax, wy, 56, '#f2a864', atomA * 0.35);
        ring(g, ax, wy, 42, 2, alpha('#ffd494', atomA * 0.55));
        circle(g, ax, wy, 7, alpha('#fff6e6', atomA));

        // Finger boundary atoms curving overhead
        const curveOff = Math.pow((ax - E.W * 0.5) / (E.W * 0.5), 2) * 58;
        const fy = fingerY - 12 - curveOff + Math.sin(t * 3.2 + ax * 0.03) * 3;
        glow(g, ax, fy, 56, '#7ce0ff', atomA * 0.35);
        ring(g, ax, fy, 42, 2, alpha('#9be8ff', atomA * 0.55));
        circle(g, ax, fy, 7, alpha('#fff6e6', atomA));
      }

      // Shimmering forcefield waves inside the 0.2 nm hover gap!
      for (let k = 0; k < 4; k++) {
        const gy = lerp(fingerY + 28, woodY - 22, (k + 0.5) / 4);
        g.strokeStyle = alpha('#ffd47e', atomA * (0.24 + 0.14 * Math.sin(t * 5 + k)));
        g.lineWidth = 2.5;
        g.beginPath();
        for (let x = 260; x <= E.W - 260; x += 24) {
          const y = gy + Math.sin(x * 0.025 + t * 6 + k) * 6;
          x === 260 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }

      // Exact dimension caliper measuring the hover gap
      dimension(g, 1380, fingerY + 14, 1380, woodY - 8, '0.2 nm HOVER GAP', {
        offset: 110,
        reveal: (t - 2.35) / 0.7,
        color: '#ffd47e',
      });
    }

    // Live magnification readout in upper-left
    const magExp = Math.round(lerp(0, 7, zoomK));
    const magStr = magExp === 0 ? 'MAGNIFICATION: 1x' : `MAGNIFICATION: ${(10 ** magExp).toLocaleString()}x`;
    readout(g, 72, 78, magStr, { size: 28, color: '#9be8ff' });
  },
});

// s05 (20.3 - 23.9s): Blueprint schematic of an atom wrapped in negative electron shells
registerShot('s05', {
  draw(g, t, _st, info) {
    const cam = { x: 0, y: 0, z: key(t, [[0, 1.0], [info.dur, 1.05]], ease.linear) };
    layer(g, cam, 1.0, () => blueprint(g, (gg, bpCol) => {
      text(gg, 'ATOMIC ARCHITECTURE · NEGATIVE ELECTRON SHELL', E.W / 2, 118, { size: 30, font: FONTS.ui, weight: 800, color: bpCol, spacing: 2.5 });

      const cx = E.W * 0.5, cy = 495;
      // Soft outer negative charge cloud
      glow(gg, cx, cy, 280, bpCol, 0.25);

      // 3 tilted orbital ellipses + racing electrons (`e-`)
      const orbits = [
        { rx: 250, ry: 95,  rot: 0.35,  sp: 2.1 },
        { rx: 250, ry: 95,  rot: -0.35, sp: -2.4 },
        { rx: 185, ry: 185, rot: 0.0,   sp: 1.7 },
      ];
      orbits.forEach((ob, idx) => {
        gg.save();
        gg.translate(cx, cy);
        gg.rotate(ob.rot);
        gg.strokeStyle = alpha(bpCol, 0.42);
        gg.lineWidth = 2.4;
        gg.beginPath(); gg.ellipse(0, 0, ob.rx, ob.ry, 0, 0, Math.PI * 2); gg.stroke();

        for (const phaseOff of [0, Math.PI]) {
          const a = t * ob.sp + idx * 1.1 + phaseOff;
          const ex = Math.cos(a) * ob.rx, ey = Math.sin(a) * ob.ry;
          glow(gg, ex, ey, 28, '#7ce8ff', 0.65);
          circle(gg, ex, ey, 11, '#d8f6ff');
          text(gg, '−', ex, ey + 1, { size: 18, font: FONTS.ui, weight: 800, color: '#0e172a' });
        }
        gg.restore();
      });

      // Tiny dense positive nucleus at center
      glow(gg, cx, cy, 44, '#ffd47e', 0.75);
      circle(gg, cx, cy, 13, '#ffd47e');
      text(gg, '+', cx, cy + 1, { size: 20, font: FONTS.ui, weight: 800, color: '#141a30' });

      callout(gg, cx + 14, cy - 8, cx + 330, cy - 155, 'Tiny Positive Nucleus', { sub: '99.9% of mass, 0.001% of volume', reveal: (t - 0.3) / 0.6 });
      callout(gg, cx - 220, cy + 55, cx - 340, cy + 165, 'Negative Electron Cloud (e⁻)', { sub: 'Forms the outer shield of every atom', reveal: (t - 0.85) / 0.6, color: '#9be8ff' });
    }));
  },
});

// s06 (23.9 - 29.5s): Two negative electron clouds press together & repel like invisible magnets!
registerShot('s06', {
  draw(g, t, _st, info) {
    const cam = { x: 0, y: 0, z: key(t, [[0, 1.0], [info.dur, 1.04]], ease.linear) };
    // Push phase: clouds approach from t=0..2.2s, hit peak repulsion at 2.3s, oscillate gently at barrier
    const pushK = t < 2.3 ? ease.inOut(t / 2.3) : 1 - 0.14 * Math.exp(-(t - 2.3) * 2.2) * Math.cos((t - 2.3) * 9);

    layer(g, cam, 1.0, () => blueprint(g, (gg, bpCol) => {
      text(gg, 'LIKE CHARGES REPEL · COULOMB & PAULI BARRIER', E.W / 2, 112, { size: 30, font: FONTS.ui, weight: 800, color: bpCol, spacing: 2.5 });

      const ax = 560;
      const topY = lerp(260, 392, pushK);
      const botY = lerp(740, 608, pushK);
      const midY = (topY + botY) / 2;

      // Draw both opposing atoms
      for (const [cy, label, col] of [[topY, 'YOUR FINGER (e⁻)', '#7ce8ff'], [botY, 'OAK TABLE (e⁻)', '#f2a864']]) {
        glow(gg, ax, cy, 155, col, 0.32);
        // Squashed electron shell under pressure!
        const squashX = 1 + pushK * 0.18, squashY = 1 - pushK * 0.15;
        gg.save();
        gg.translate(ax, cy);
        gg.scale(squashX, squashY);
        ring(gg, 0, 0, 96, 3, alpha(col, 0.8));
        for (let k = 0; k < 6; k++) {
          const a = t * 2.6 + (k / 6) * Math.PI * 2;
          circle(gg, Math.cos(a) * 96, Math.sin(a) * 96, 8, col);
        }
        gg.restore();
        circle(gg, ax, cy, 10, '#fff6e6');
        text(gg, label, ax - 190, cy, { size: 22, font: FONTS.ui, weight: 800, color: col, align: 'right' });
      }

      // Repulsion shock arcs & opposing arrows in the gap!
      if (pushK > 0.25) {
        const fA = clamp((pushK - 0.25) / 0.75);
        for (let i = -2; i <= 2; i++) {
          const yOff = i * 14;
          gg.strokeStyle = alpha('#ffd47e', fA * (0.55 + 0.25 * Math.sin(t * 12 + i)));
          gg.lineWidth = 3;
          gg.beginPath();
          gg.moveTo(ax - 125, midY + yOff);
          gg.quadraticCurveTo(ax, midY + yOff * 0.35, ax + 125, midY + yOff);
          gg.stroke();
        }
        // Opposing force arrows
        poly(gg, [[ax, topY - 128], [ax - 16, topY - 102], [ax + 16, topY - 102]], '#ffd47e');
        poly(gg, [[ax, botY + 128], [ax - 16, botY + 102], [ax + 16, botY + 102]], '#ffd47e');
      }

      // Right-hand force comparison bars spiking dynamically!
      compareBars(gg, 930, 310, 860, [
        { label: 'e⁻ Repulsion',  value: Math.round(12 + 86 * pushK), hi: true, color: '#f29a58' },
        { label: 'Hand Push',     value: Math.round(15 + 55 * pushK), color: '#7ce8ff' },
        { label: 'Gravity',       value: 4, color: '#8e9ab8' },
      ], 2.0, { rowH: 105, max: 105, unit: '%' });

      readout(gg, 1080, 685, pushK > 0.75 ? 'STATUS: EQUILIBRIUM HOVER (0 CONTACTS)' : 'APPROACHING BARRIER...', {
        size: 25,
        color: pushK > 0.75 ? '#ffd47e' : bpCol,
      });
    }));
  },
});
