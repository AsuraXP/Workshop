// Project-local scene functions. The renderer calls `scenes[shot.scene]` at every frame.
// Use only solid fills and the local `./scene-kit.mjs` helpers; keep drawings deterministic.
import { PALETTE, drawFigure, inkCircle, inkLine, inkPoly, drawLabel } from './scene-kit.mjs';

export const scenes = {
  opening(ctx, { width, height, progress }) {
    ctx.fillStyle = PALETTE.dusk;
    ctx.fillRect(0, 0, width, height);
    inkPoly(ctx, [[0, height * 0.66], [width * 0.24, height * 0.49], [width * 0.52, height * 0.64], [width * 0.77, height * 0.50], [width, height * 0.63], [width, height], [0, height]], {
      fill: PALETTE.earth, width: 6, seed: 101,
    });
    inkCircle(ctx, width * (0.73 + 0.015 * progress), height * 0.58, 108, 108, { fill: PALETTE.sun, width: 6, seed: 102 });
    drawFigure(ctx, { x: width * 0.43, y: height * 0.88, scale: 1.35, expression: 'curious', seed: 103 });
    drawLabel(ctx, 'Replace this starter scene with a story-specific image', width / 2, height * 0.14, { size: 30, color: '#ffffff' });
  },
};
