// scenes/s07_s12.js — Shots s07..s12 of "Why You Never Actually Touch Anything".
import { E, registerShot, layer, mood, key, lerp, clamp, prog, ease, shake, rr, fillRect, seg, circle, ring, poly, text, glow, linGrad, alpha, FONTS } from '/kit/engine/core.js';
import { POSES, breathe, posesAt, walkPose, autoBlink } from '/kit/engine/rig2d.js';
import { shockwave, foliage } from '/kit/engine/fx2d.js';
import { dataCard, callout, readout, endCard } from '/kit/engine/ui2d.js';
import { drawMilo, drawNora, miloFace, drawCeramicMug, handPos } from './cast.js';
import {
  drawParkBenchBg, drawBench,
  drawFusionLabBg,
  drawTwilightBalconySky, drawTwilightBalconyMid, drawTwilightBalconyStage,
} from './sets/environments.js';

// s07 (29.5 - 34.1s): Bright daytime park bench — Nora smugly "levitates" + high-five spark with Milo!
registerShot('s07', {
  draw(g, t, _st, info) {
    const cam = { x: key(t, [[0, -18], [info.dur, 16]], ease.sine), y: 0, z: key(t, [[0, 1.0], [info.dur, 1.04]], ease.sine) };
    const groundY = 835;

    layer(g, cam, 0.35, () => drawParkBenchBg(g, t));
    layer(g, cam, 1.0, () => {
      drawBench(g, 1160, groundY);

      // Glowing cyan "levitation" shimmer right between Nora and the bench seat!
      glow(g, 1160, groundY - 82, 75, '#7ce8ff', 0.45 + 0.15 * Math.sin(t * 7));
      seg(g, [[1075, groundY - 79], [1245, groundY - 79]], 3, '#b8f4ff');

      const speaking = (t >= 0.15 && t <= 2.05) || (t >= 2.35 && t <= 4.10);
      // Keep Nora seated (`POSES.sit`) hovering above the bench while her near arm lifts for the high-five!
      const hiFiveK = t < 1.7 ? 0 : t < 2.15 ? ease.out((t - 1.7) / 0.45) : Math.max(0, 1 - ease.inOut((t - 2.15) / 0.75));
      const noraSitHiFive = {
        ...breathe(POSES.sit, t, 0.6),
        eF: [lerp(POSES.sit.eF[0], 46, hiFiveK), lerp(POSES.sit.eF[1], -152, hiFiveK)],
        hF: [lerp(POSES.sit.hF[0], 78, hiFiveK), lerp(POSES.sit.hF[1], -196, hiFiveK)],
      };
      const noraOpts = {
        x: 1160, y: (groundY - 18) + Math.sin(t * 3.2) * 3,
        s: 1.24,
        pose: noraSitHiFive,
        facing: -1,
        expr: 'smirk',
        openMouth: speaking ? 0.25 + 0.35 * Math.abs(Math.sin(t * 15)) : 0,
        blink: autoBlink(t, 3),
        rim: { color: '#fff2cc', dir: [-1, -0.35], w: 3.4 },
      };
      drawNora(g, noraOpts);

      // Milo walks in from left (0..1.4s), then raises hand for high-five at t=2.15s!
      const miloX = key(t, [[0, 620], [1.4, 830, ease.out]]);
      const miloPose = t < 1.35
        ? walkPose(t * 1.45)
        : posesAt(t, [[1.35, 'stand'], [2.12, 'wave', ease.out], [2.95, 'stand', ease.inOut]]);
      const miloOpts = {
        x: miloX, y: groundY, s: 1.24,
        pose: miloPose,
        facing: 1,
        expr: t > 2.1 ? 'surprised' : 'smile',
        blink: autoBlink(t, 6),
        rim: { color: '#fff2cc', dir: [-1, -0.35], w: 3.4 },
      };
      drawMilo(g, miloOpts);

      // Tiny electrostatic spark shockwave right between their high-five hands at t = 2.15s!
      if (t >= 2.12 && t <= 2.85) {
        const [mhx, mhy] = handPos(miloOpts, 'F');
        const [nhx, nhy] = handPos(noraOpts, 'F');
        const sx = (mhx + nhx) / 2, sy = (mhy + nhy) / 2;
        shockwave(g, sx, sy, (t - 2.12) / 0.55, 78, '#9be8ff');
        glow(g, sx, sy, 48 * (1 - (t - 2.12) / 0.75), '#ffffff', 0.75);
      }

      callout(g, 1210, groundY - 79, 1450, 645, '0.2 nm Levitation Gap', {
        sub: 'Zero bench atoms touched',
        reveal: (t - 0.55) / 0.55,
        color: '#1b2838',
      });
      foliage(g, 210, groundY, { s: 1.2, n: 7, color: '#589e6c', t });
    });
  },
});

// s08 (34.1 - 42.1s): Sensory nerve stage — forcefield indents skin & fires golden pulses up to Milo's face
registerShot('s08', {
  draw(g, t, _st, info) {
    const cam = { x: 0, y: 0, z: key(t, [[0, 1.0], [info.dur, 1.04]], ease.linear) };
    g.fillStyle = linGrad(g, 0, 0, E.W, E.H, ['#141a2e', '#1e2744', '#161b30']);
    g.fillRect(0, 0, E.W, E.H);

    layer(g, cam, 1.0, () => {
      text(g, 'HOW FORCE BECOMES "FEELING"', E.W / 2, 96, { size: 30, font: FONTS.ui, weight: 800, color: '#9ac4f2', spacing: 2.5 });

      // Left card: stylized arm + fingertip pressing toward glowing surface without touching
      rr(g, 110, 165, 920, 620, 24);
      g.fillStyle = 'rgba(14, 18, 34, 0.78)'; g.fill();
      g.strokeStyle = 'rgba(154, 196, 242, 0.28)'; g.lineWidth = 2; g.stroke();

      // Solid surface bar at bottom of card
      const surfY = 655;
      rr(g, 210, surfY, 720, 44, 10);
      g.fillStyle = linGrad(g, 210, surfY, 930, surfY, ['#754932', '#b97c56']); g.fill();

      // Forcefield waves pushing upward from surface
      const press = ease.inOut(prog(t, 0.3, 1.6));
      for (let i = 0; i < 3; i++) {
        const wy = surfY - 14 - i * 12;
        g.strokeStyle = alpha('#7ce8ff', (0.35 + 0.25 * Math.sin(t * 7 + i)) * press);
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(390, wy);
        g.quadraticCurveTo(560, wy - 14 * press, 730, wy);
        g.stroke();
      }

      // Stylized MC v2 sleeve + forearm + ball hand with bright rim separation against dark cutaway card!
      const handY = lerp(510, 574, press);
      const nervePts = [[560, handY], [640, 465], [790, 385], [1030, 365], [1240, 390]];
      // Cream coat sleeve cuff at upper right of forearm + rimmed forearm
      seg(g, [[890, 350], [740, 418]], 58, '#dfd8cc');
      seg(g, [[755, 412], [640, 465], [560, handY]], 48, '#7ce8ff');
      seg(g, [[755, 412], [640, 465], [560, handY]], 42, '#222436');
      g.save();
      g.translate(560, handY);
      g.scale(1 + press * 0.10, 1 - press * 0.12);
      circle(g, 0, 0, 46, '#222436');
      ring(g, 0, 0, 46, 3.5, '#9be8ff');
      g.restore();

      // Golden sensory nerve pathway + racing action-potential pulses!
      seg(g, nervePts, 4, alpha('#ffd47e', 0.35));
      if (t > 1.3) {
        for (let p = 0; p < 5; p++) {
          const u = ((t - 1.3) * 0.62 + p * 0.2) % 1;
          // Interpolate along nervePts
          const segIdx = Math.min(nervePts.length - 2, Math.floor(u * (nervePts.length - 1)));
          const localU = u * (nervePts.length - 1) - segIdx;
          const px = lerp(nervePts[segIdx][0], nervePts[segIdx + 1][0], localU);
          const py = lerp(nervePts[segIdx][1], nervePts[segIdx + 1][1], localU);
          glow(g, px, py, 32, '#ffd47e', 0.85);
          circle(g, px, py, 7, '#fff6e6');
        }
      }

      // Right side: Milo close-up receiving the sensory signal -> expression shifts into wonder/awe!
      const aweK = ease.out(prog(t, 2.4, 3.6));
      if (aweK > 0.1) glow(g, 1440, 465, 240, '#ffd47e', aweK * 0.24);
      miloFace(g, 1440, 495 + Math.sin(t * 2.2) * 4, 150, {
        facing: -1,
        expr: aweK > 0.55 ? 'awe' : 'neutral',
        brow: lerp(0.05, 0.58, aweK),
        mouth: lerp(0.15, 0.35, aweK),
        openMouth: lerp(0, 0.38, aweK),
        blink: autoBlink(t, 2),
        rim: { color: '#ffd47e', dir: [-1, -0.3], w: 6.0 },
      });

      if (t > 2.6) {
        readout(g, 1440, 255, 'BRAIN DECODES: "SOLID SURFACE"', {
          size: 26, color: '#ffd47e', align: 'center', a: ease.out(prog(t, 2.6, 3.2)),
        });
      }
    });
  },
});

// s09 (42.1 - 49.3s): Fusion containment lab — forcing two nuclei to touch at t = 5.17s ("nuclear fusion"!)
registerShot('s09', {
  draw(g, t) {
    const fuseT = 5.17; // exact spoken timestamp of "nuclear fusion" in s07.mp3!
    const post = t >= fuseT ? (t - fuseT) : -1;
    const [sx, sy] = post >= 0 && post < 1.1 ? shake(t, 12 * (1 - post / 1.1), 10) : [0, 0];
    const cam = { x: sx, y: sy, z: key(t, [[0, 1.0], [fuseT, 1.06, ease.in], [7.2, 1.03]]) };

    layer(g, cam, 0.5, () => drawFusionLabBg(g, t));
    layer(g, cam, 1.0, () => {
      // Containment viewport chamber on left/center (bounded so whole-frame luminance never flashes unsafely!)
      const vx = 160, vy = 155, vw = 1040, vh = 560;
      rr(g, vx, vy, vw, vh, 26);
      g.fillStyle = '#0d1222'; g.fill();
      g.strokeStyle = post >= 0 ? '#f29a58' : 'rgba(154,196,242,0.35)';
      g.lineWidth = 4; g.stroke();

      const cx = vx + vw / 2, cy = vy + vh / 2;
      if (post < 0) {
        // Two nuclei forced closer & closer against screaming electron barrier!
        const k = ease.in(prog(t, 0.6, fuseT));
        const dist = lerp(280, 14, k);
        const jitter = k * 5 * Math.sin(t * 38);
        for (const side of [-1, 1]) {
          const nx = cx + side * dist + jitter;
          ring(g, nx, cy, 78 * (1 - k * 0.55), 2, alpha('#7ce8ff', 0.5 * (1 - k * 0.5)));
          glow(g, nx, cy, 52, '#ff7a45', 0.7);
          circle(g, nx, cy, 18, '#ffd47e');
          text(g, '+', nx, cy + 1, { size: 22, font: FONTS.ui, weight: 800, color: '#141a30' });
        }
        readout(g, cx, vy + 54, `OVERCOMING REPULSION: ${Math.round(k * 100)}%`, { size: 25, color: '#ff9a62', align: 'center' });
      } else {
        // Controlled golden fusion corona inside viewport + shockwave!
        const u = clamp(post / 1.6);
        glow(g, cx, cy, 320 * (0.6 + 0.4 * u), '#ff9a48', 0.65 * (1 - u * 0.35));
        glow(g, cx, cy, 160, '#fff2c6', 0.8 * (1 - u * 0.3));
        shockwave(g, cx, cy, post / 1.1, 380, '#ffd47e');
        circle(g, cx, cy, 34 * (1 - u * 0.25), '#fffaf0');
        dataCard(g, cx - 320, vy + 46, 640, 175, {
          label: 'Nuclei Contact Achieved',
          value: 15, decimals: 0, unit: 'M °C',
          t: post, dur: 0.5,
          accent: '#ffa53d',
          sub: 'NUCLEAR FUSION IGNITION',
        });
      }

      // Nora standing on the right by the lab pedestal, jumping into handsOnHead on fusion!
      const noraPose = post >= 0
        ? posesAt(post, [[0, 'handsOnHead'], [1.4, 'shrug', ease.inOut]])
        : breathe(t > 2.8 ? 'ready' : 'stand', t);
      drawNora(g, {
        x: 1540, y: 845, s: 1.28,
        pose: noraPose,
        facing: -1,
        expr: post >= 0 ? 'shocked' : (t > 3.0 ? 'worry' : 'neutral'),
        rim: { color: post >= 0 ? '#ffa53d' : '#9be8ff', dir: [-1, -0.25], w: 4.0 },
      });

      // Control pedestal
      fillRect(g, 1335, 690, 84, 155, '#252d48');
      rr(g, 1315, 674, 124, 22, 6); g.fillStyle = '#384368'; g.fill();
      circle(g, 1377, 668, 12, '#e8564a');
    });
  },
});

// s10 (49.3 - 53.0s): Tight comedy reaction — Nora gingerly retracts her hand from the button
registerShot('s10', {
  draw(g, t, _st, info) {
    const cam = { x: key(t, [[0, 18], [info.dur, 38]], ease.sine), y: -25, z: 1.18 };
    const speaking = (t >= 0.15 && t <= 1.25) || (t >= 1.55 && t <= 3.25);

    layer(g, cam, 0.5, () => drawFusionLabBg(g, t + 7.2));
    layer(g, cam, 1.0, () => {
      // Glowing red "FORCE TOUCH" button pedestal on left
      fillRect(g, 560, 650, 130, 220, '#252d48');
      rr(g, 530, 628, 190, 28, 8); g.fillStyle = '#384368'; g.fill();
      glow(g, 625, 616, 54, '#ff5a4e', 0.45);
      rr(g, 590, 608, 70, 22, 8); g.fillStyle = '#e85246'; g.fill();
      readout(g, 625, 558, 'FORCE TOUCH', { size: 22, color: '#ff8a7a', align: 'center' });

      // Nora slowly retracts her extended arm back to her chest!
      const retractPose = posesAt(t, [
        [0.0, 'reach'],
        [1.35, 'hold', ease.inOut],
        [2.6, 'talk', ease.inOut],
      ]);
      const reliefK = ease.inOut(prog(t, 0.8, 1.9));
      drawNora(g, {
        x: 1120, y: 890, s: 1.62,
        pose: breathe(retractPose, t, 0.6),
        facing: -1,
        brow: lerp(0.45, 0.12, reliefK),
        browTilt: lerp(-0.68, -0.05, reliefK),
        mouth: lerp(-0.42, 0.58, reliefK),
        openMouth: speaking ? 0.24 + 0.34 * Math.abs(Math.sin(t * 15)) : 0,
        blink: autoBlink(t, 1),
        rim: { color: '#9be8ff', dir: [-1, -0.25], w: 3.8 },
      });
    });
  },
});

// s11 (53.0 - 61.5s): Scenic twilight balcony — mug clink (t=3.35s) & warm handshake across the 0.2 nm bridge
registerShot('s11', {
  draw(g, t, _st, info) {
    const M = mood('dusk');
    const cam = { x: key(t, [[0, -14], [info.dur, 14]], ease.sine), y: key(t, [[0, 0], [info.dur, -16]], ease.sine), z: key(t, [[0, 1.0], [info.dur, 1.08]], ease.sine) };
    const gy = 850;

    layer(g, cam, 0.2, () => drawTwilightBalconySky(g, t));
    layer(g, cam, 0.5, () => drawTwilightBalconyMid(g, t));
    layer(g, cam, 1.0, () => {
      drawTwilightBalconyStage(g, t, gy);

      // Phase 1 (0..4.8s): warm mug toast at t=3.35s; Phase 2 (4.8..8.5s): warm handshake reach!
      const miloPose = posesAt(t, [
        [0.0, 'hold'],
        [3.3, 'talk', ease.inOut],
        [4.5, 'hold', ease.inOut],
        [5.9, 'reach', ease.inOut],
      ]);
      const noraPose = posesAt(t, [
        [0.0, 'hold'],
        [3.3, 'talk', ease.inOut],
        [4.5, 'hold', ease.inOut],
        [5.9, 'reach', ease.inOut],
      ]);

      const miloOpts = {
        x: 825, y: gy, s: 1.24,
        pose: breathe(miloPose, t, 0.7),
        facing: 1,
        expr: t > 3.1 ? 'joy' : 'smile',
        blink: autoBlink(t, 2),
        rim: { color: M.rim, dir: [1, -0.32], w: 3.5 },
      };
      const noraOpts = {
        x: 1095, y: gy, s: 1.21,
        pose: breathe(noraPose, t + 0.9, 0.7),
        facing: -1,
        expr: t > 3.1 ? 'joy' : 'smile',
        blink: autoBlink(t, 5),
        rim: { color: M.rim, dir: [1, -0.32], w: 3.5 },
      };
      drawMilo(g, miloOpts);
      drawNora(g, noraOpts);

      const [mhx, mhy] = handPos(miloOpts, 'F');
      const [nhx, nhy] = handPos(noraOpts, 'F');

      if (t < 4.9) {
        drawCeramicMug(g, mhx + 8, mhy - 4, { t, steam: true, tilt: t > 3.0 && t < 3.9 ? 0.14 : 0 });
        drawCeramicMug(g, nhx - 8, nhy - 4, { color: '#eab86e', t: t + 2, steam: true, tilt: t > 3.0 && t < 3.9 ? -0.14 : 0 });
        if (t >= 3.32 && t <= 4.1) {
          shockwave(g, (mhx + nhx) / 2, (mhy + nhy) / 2 - 8, (t - 3.32) / 0.65, 58, '#ffe2a8');
        }
      } else {
        // Mugs resting on balcony rail ledge while hands meet across the glowing golden gap!
        drawCeramicMug(g, 690, gy - 122, { t, steam: true, s: 0.9 });
        drawCeramicMug(g, 1230, gy - 122, { color: '#eab86e', t: t + 2, steam: true, s: 0.9 });
        const bridgeA = ease.out(prog(t, 5.7, 6.5));
        const gx = (mhx + nhx) / 2, gyMid = (mhy + nhy) / 2;
        glow(g, gx, gyMid, 68, '#ffd47e', bridgeA * 0.65);
        ring(g, gx, gyMid, 20 + Math.sin(t * 4) * 2, 2.5, alpha('#fff6dc', bridgeA * 0.8));
      }
    });
  },
});

// s12 (61.5 - 66.0s): Serene twilight horizon hold (`hold: true`) + timeless closing thought
registerShot('s12', {
  draw(g, t) {
    const M = mood('dusk');
    const gy = 855;
    layer(g, {}, 0.2, () => drawTwilightBalconySky(g, 62));
    layer(g, {}, 0.5, () => drawTwilightBalconyMid(g, 62));
    layer(g, {}, 1.0, () => {
      drawTwilightBalconyStage(g, 62, gy);
      drawMilo(g, { x: 850, y: gy, s: 1.18, pose: 'stand', expr: 'smile', facing: 1, rim: { color: M.rim, dir: [1, -0.32], w: 3.4 } });
      drawNora(g, { x: 1070, y: gy, s: 1.15, pose: 'stand', expr: 'smile', facing: -1, rim: { color: M.rim, dir: [1, -0.32], w: 3.4 } });
    });
    endCard(g, t, {
      title: 'Close enough to feel everything.',
      question: 'Without ever colliding.',
      y: 235,
      cta: false,
    });
  },
});
