import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { drawFigure, drawFrame, inkCircle, inkLine, inkPoly } from '../kit/scene-kit.mjs';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

function render(seed) {
  const canvas = createCanvas(640, 360);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8995e'; ctx.fillRect(0, 0, 640, 360);
  inkPoly(ctx, [[0, 260], [160, 200], [360, 250], [640, 205], [640, 360], [0, 360]], { fill: '#c98a55', seed });
  inkCircle(ctx, 500, 190, 52, 52, { fill: '#ffe066', seed: seed + 1 });
  drawFigure(ctx, { x: 285, y: 335, scale: 0.62, expression: 'curious', seed: seed + 2 });
  inkLine(ctx, 280, 70, 370, 70, { width: 5, seed: seed + 3 });
  drawFrame(ctx, 640, 360);
  return Buffer.from(canvas.data());
}

test('ink primitives render and seeded drawings are deterministic', () => {
  const a = render(17);
  const b = render(17);
  const c = render(18);
  assert.ok(a.byteLength === 640 * 360 * 4);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  let colored = 0;
  for (let i = 0; i < a.length; i += 64) if (a[i] + a[i + 1] + a[i + 2] > 0) colored++;
  assert.ok(colored > 1000);
});
