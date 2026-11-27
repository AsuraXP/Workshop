// tests/test_engine.mjs — unit & rendering tests for core.js, styles.js, rig2d.js (MC v2), fx2d.js, ui2d.js, compositor.js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire, register } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(HERE, '../Skill/kit');
const require = createRequire(import.meta.url);

// Register /kit/* resolver identical to render.mjs
const kitUrl = pathToFileURL(KIT + path.sep).href;
register('data:text/javascript,' + encodeURIComponent(
  `export async function resolve(s, c, next) { return s.startsWith('/kit/') ? next(${JSON.stringify(kitUrl)} + s.slice(5), c) : next(s, c); }`
));

let createCanvas = null;
for (const c of ['@napi-rs/canvas', path.join(KIT, 'node_modules/@napi-rs/canvas'), '/tmp/node-test/node_modules/@napi-rs/canvas']) {
  try { createCanvas = require(c).createCanvas; break; } catch {}
}
if (createCanvas) globalThis.__createCanvas = createCanvas;

const core = await import('/kit/engine/core.js');
const styles = await import('/kit/engine/styles.js');
const rig = await import('/kit/engine/rig2d.js');
const fx = await import('/kit/engine/fx2d.js');
const ui = await import('/kit/engine/ui2d.js');
const comp = await import('/kit/engine/compositor.js');

test('core timing, keyframe, localKeys, anticipate, and spring math', () => {
  assert.equal(core.E.styleId, 'awaken');
  assert.equal(core.key(0, [[0, 10], [2, 30]], core.ease.linear), 10);
  assert.equal(core.key(1, [[0, 10], [2, 30]], core.ease.linear), 20);
  assert.equal(core.key(5, [[0, 10], [2, 30]], core.ease.linear), 30);

  const lk = core.localKeys([[10, 0], [12.5, 100]], 10, 3);
  assert.deepEqual(lk[0], [0, 0]);
  assert.deepEqual(lk[1], [2.5, 100]);
  assert.throws(() => core.localKeys([[8.0, 0]], 10, 3), /outside shot/);

  // Anticipation dips slightly negative first, overshoots >1, then settles to 1
  assert.ok(core.anticipate(0.1, 0, 1) < 0);
  assert.ok(core.anticipate(0.78, 0, 1) > 1);
  assert.equal(core.anticipate(1.0, 0, 1), 1);
  assert.equal(core.spring(0, 0, 0.5), 0);
  assert.equal(core.spring(2.0, 0, 0.5), 1);
});

test('all 9 universal visual styles resolve cleanly with complete grade & UI tokens', () => {
  const expected = ['awaken', 'daylight', 'cinema', 'noir', 'emerald', 'ember', 'arctic', 'sakura', 'retro'];
  assert.deepEqual(styles.STYLE_IDS, expected);
  for (const id of expected) {
    core.setStyle(id);
    assert.equal(core.E.styleId, id);
    const m = core.mood('dusk');
    assert.ok(Array.isArray(m.sky) && m.sky.length >= 2);
    assert.ok(m.rim.startsWith('#'));
    const luts = comp.getChannelLUTs(core.S().grade);
    assert.equal(luts.length, 3);
    assert.equal(luts[0].length, 256);
  }
  core.setStyle('awaken');
});

test('MC v2 handPos and headPos sockets mirror and scale accurately', () => {
  const rightOpts = { x: 500, y: 800, s: 1.5, pose: 'point', facing: 1 };
  const leftOpts  = { x: 500, y: 800, s: 1.5, pose: 'point', facing: -1 };
  const [rx, ry] = rig.handPos(rightOpts, 'F');
  const [lx, ly] = rig.handPos(leftOpts, 'F');
  // Point pose hF is [88, -172] -> scaled by 1.5 -> dx = ±132, dy = -258
  assert.ok(Math.abs(rx - (500 + 88 * 1.5)) < 1e-6);
  assert.ok(Math.abs(lx - (500 - 88 * 1.5)) < 1e-6);
  assert.equal(ry, ly);
  assert.ok(Math.abs(ry - (800 - 172 * 1.5)) < 1e-6);
});

test('MC v2 renders all expressions, poses, coats, fx, and UI cleanly onto canvas', { skip: !createCanvas }, () => {
  const canvas = createCanvas(640, 360);
  const g = canvas.getContext('2d');
  comp.configureStage({ style: 'awaken', aspect: '16:9', width: 640, fps: 24 });

  for (const expr of Object.keys(rig.EXPRESSIONS)) {
    rig.bigFace(g, 320, 180, 70, { expr, rim: { color: '#eea865', dir: [1, -0.3] } });
  }
  for (const pose of Object.keys(rig.POSES)) {
    rig.drawFigure(g, { x: 320, y: 310, s: 0.9, pose, coat: rig.COATS.sage, outfit: { top: 'cardigan', head: 'elder' }, prop: 'mug' });
  }
  fx.skyStreaks(g, { t: 1 });
  fx.bokeh(g, { t: 1 });
  fx.tileWall(g, 0, 0, 300, 200);
  fx.foliage(g, 100, 300, { pot: true, t: 1 });
  ui.storyCaption(g, 'Clean lower-band subtitle inside title-safe area.', { speaker: 'Host' });
  ui.endCard(g, 1.0, { title: 'Clean End', question: 'Universal closing card', cta: false });

  const px = g.getImageData(0, 0, 640, 360).data;
  let nonZero = 0;
  for (let i = 0; i < px.length; i += 16) if (px[i] + px[i + 1] + px[i + 2] > 0) nonZero++;
  assert.ok(nonZero > 1000, 'Canvas should contain rendered pixels');
});
