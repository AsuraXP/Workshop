import { PALETTE, drawFigure, inkCircle, inkLine, inkPoly } from './scene-kit.mjs';

export const scenes = {
  sunset(ctx, { width, height }) {
    ctx.fillStyle = PALETTE.dusk; ctx.fillRect(0, 0, width, height);
    inkCircle(ctx, 1450, 540, 150, 150, { fill: PALETTE.sun, width: 7, seed: 2 });
    inkPoly(ctx, [[0, 700], [360, 570], [720, 680], [1150, 520], [1540, 665], [1920, 560], [1920, 1080], [0, 1080]], { fill: PALETTE.earth, width: 7, seed: 3 });
    drawFigure(ctx, { x: 700, y: 930, scale: 1.55, expression: 'curious', seed: 4 });
  },
  night(ctx, { width, height }) {
    ctx.fillStyle = PALETTE.deepNight; ctx.fillRect(0, 0, width, height);
    inkCircle(ctx, 1500, 240, 58, 58, { fill: PALETTE.paper, width: 4, seed: 5 });
    inkCircle(ctx, 1525, 225, 48, 48, { fill: PALETTE.deepNight, stroke: null, width: 0, seed: 6 });
    inkPoly(ctx, [[0, 715], [420, 520], [920, 680], [1450, 510], [1920, 670], [1920, 1080], [0, 1080]], { fill: '#171f30', width: 6, seed: 7 });
    drawFigure(ctx, { x: 960, y: 970, scale: 1.9, expression: 'scared', pose: 'shiver', seed: 8 });
  },
  fire(ctx, { width, height }) {
    ctx.fillStyle = PALETTE.night; ctx.fillRect(0, 0, width, height);
    inkPoly(ctx, [[0, 820], [1920, 820], [1920, 1080], [0, 1080]], { fill: '#584332', width: 6, seed: 9 });
    inkCircle(ctx, 960, 690, 560, 300, { fill: '#744a2e', stroke: null, width: 0, seed: 10 });
    inkPoly(ctx, [[810, 835], [855, 660], [930, 730], [975, 520], [1050, 720], [1115, 625], [1140, 835]], { fill: PALETTE.fire, width: 8, seed: 11 });
    inkPoly(ctx, [[900, 835], [940, 710], [980, 780], [1010, 650], [1060, 835]], { fill: PALETTE.gold, width: 6, seed: 12 });
    drawFigure(ctx, { x: 610, y: 930, scale: 1.2, pose: 'sit', expression: 'happy', seed: 13 });
    drawFigure(ctx, { x: 1320, y: 930, scale: 1.2, facing: -1, pose: 'sit', expression: 'happy', seed: 14 });
    inkLine(ctx, 890, 857, 1030, 880, { width: 12, color: PALETTE.bark, seed: 15 });
  },
};
