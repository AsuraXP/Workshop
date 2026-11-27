// scenes/cast.js — recurring MC v2 characters & locked hand-prop helpers for "Why You Never Actually Touch Anything".
import { drawFigure, bigFace, handPos, headPos, COATS } from '/kit/engine/rig2d.js';
import { rr, seg, alpha, shade, linGrad } from '/kit/engine/core.js';

export const CAST = {
  milo: {
    coat: COATS.cream,
    outfit: { top: 'coat' },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
  nora: {
    coat: COATS.sage,
    glasses: true,
    outfit: { top: 'cardigan', shirtColor: COATS.cream },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
};

export const drawMilo = (g, o = {}) => drawFigure(g, { ...CAST.milo, ...o, rim: o.rim || CAST.milo.rim });
export const drawNora = (g, o = {}) => drawFigure(g, { ...CAST.nora, ...o, rim: o.rim || CAST.nora.rim });
export const miloFace = (g, x, y, r, o = {}) => bigFace(g, x, y, r, { ...CAST.milo, ...o, rim: o.rim || CAST.milo.rim });
export const noraFace = (g, x, y, r, o = {}) => bigFace(g, x, y, r, { ...CAST.nora, ...o, rim: o.rim || CAST.nora.rim });

// Shaded ceramic mug with rising warm steam curls — attach directly to handPos(opts, 'F'|'B')!
export function drawCeramicMug(g, x, y, { color = '#e58b72', steam = true, t = 0, tilt = 0, s = 1 } = {}) {
  g.save();
  g.translate(x, y);
  if (tilt) g.rotate(tilt);
  g.scale(s, s);
  rr(g, -13, -16, 26, 30, 6);
  g.fillStyle = linGrad(g, -13, 0, 13, 0, [shade(color, -0.22), color, shade(color, 0.12)]);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(13, -1, 8, -1.2, 1.2);
  g.stroke();

  if (steam) {
    g.strokeStyle = alpha('#fff6e6', 0.42);
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    for (let i = -1; i <= 1; i += 2) {
      const ph = t * 2.6 + i * 1.4;
      const sx = i * 5;
      g.beginPath();
      g.moveTo(sx, -20);
      g.quadraticCurveTo(sx + Math.sin(ph) * 6, -32, sx - Math.sin(ph) * 4, -44);
      g.stroke();
    }
  }
  g.restore();
}

export { handPos, headPos, COATS };
