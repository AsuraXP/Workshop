#!/usr/bin/env node
// Code-only hard-cut renderer for InkExplainerSkill projects.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const projectArg = arg('--project');
if (!projectArg || process.argv.includes('--help')) {
  console.log('Usage: node kit/render.mjs --project /path/to/project [--sheet-only | --sheet] [--no-audio]');
  process.exit(projectArg ? 0 : 2);
}
const projectDir = path.resolve(projectArg);
const projectFile = path.join(projectDir, 'project.json');
const storyboardFile = path.join(projectDir, 'storyboard.json');
const scenesFile = path.join(projectDir, 'src', 'scenes.mjs');
for (const p of [projectFile, storyboardFile, scenesFile]) {
  if (!fs.existsSync(p)) throw new Error(`Required project file missing: ${p}`);
}
const config = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
const storyboard = JSON.parse(fs.readFileSync(storyboardFile, 'utf8'));
const mod = await import(pathToFileURL(scenesFile).href);
const sceneFns = mod.scenes || mod.default;
const panels = storyboard.shots;
if (!sceneFns || !Array.isArray(panels) || panels.length === 0) throw new Error('scenes.mjs must export { scenes } and storyboard.json must contain shots.');

const width = Number(config.width || 1920);
const height = Number(config.height || 1080);
const fps = Number(config.fps || 24);
const duration = Number(config.duration_sec || storyboard.duration_sec);
if (!(width > 0 && height > 0 && fps > 0 && duration > 0)) throw new Error('Invalid project dimensions, frame rate, or duration.');
const totalFrames = Math.round(duration * fps);
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
const sorted = [...panels].sort((a, b) => Number(a.start) - Number(b.start));

function renderShot(shot, time) {
  const draw = sceneFns[shot.scene];
  if (typeof draw !== 'function') throw new Error(`No scene function exported for shot ${shot.id}: ${shot.scene}`);
  ctx.clearRect(0, 0, width, height);
  const span = Math.max(0.001, Number(shot.end) - Number(shot.start));
  draw(ctx, {
    time,
    progress: Math.max(0, Math.min(1, (time - Number(shot.start)) / span)),
    panel: shot,
    width,
    height,
  });
  ctx.strokeStyle = '#151515';
  ctx.lineWidth = Math.max(4, Math.round(width / 192));
  ctx.strokeRect(5, 5, width - 10, height - 10);
}

async function writeSheet() {
  const cols = 4, thumbW = 480, thumbH = 270, labelH = 28, gap = 16;
  const rows = Math.ceil(sorted.length / cols);
  const sheet = createCanvas(gap + cols * (thumbW + gap), gap + rows * (thumbH + labelH + gap));
  const sg = sheet.getContext('2d');
  sg.fillStyle = '#11141c'; sg.fillRect(0, 0, sheet.width, sheet.height);
  sg.font = '700 14px sans-serif'; sg.textBaseline = 'middle'; sg.fillStyle = '#f2eee5';
  for (let i = 0; i < sorted.length; i++) {
    const shot = sorted[i];
    const mid = (Number(shot.start) + Number(shot.end)) / 2;
    renderShot(shot, mid);
    const x = gap + (i % cols) * (thumbW + gap);
    const y = gap + Math.floor(i / cols) * (thumbH + labelH + gap);
    sg.drawImage(canvas, x, y, thumbW, thumbH);
    const spoken = String(shot.spoken_text || '').replace(/\s+/g, ' ').slice(0, 48);
    sg.fillText(`#${String(shot.id).padStart(3, '0')} ${Number(shot.start).toFixed(1)}–${Number(shot.end).toFixed(1)}s  ${spoken}`, x + 3, y + thumbH + labelH / 2);
  }
  const out = path.resolve(projectDir, config.contact_sheet || 'exports/contact-sheet.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
  console.log(`Wrote contact sheet: ${out}`);
}

if (process.argv.includes('--sheet-only')) {
  await writeSheet();
  process.exit(0);
}
if (process.argv.includes('--sheet')) await writeSheet();

const noAudio = process.argv.includes('--no-audio');
const audioPath = path.resolve(projectDir, config.audio_mix || 'audio/mix.wav');
if (!noAudio && !fs.existsSync(audioPath)) throw new Error(`Mixed narration audio not found: ${audioPath}. Run kit/audio/mix.py first or pass --no-audio.`);
const output = path.resolve(projectDir, config.output || 'exports/final.mp4');
fs.mkdirSync(path.dirname(output), { recursive: true });
const ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg';
const ffArgs = [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-framerate', String(fps), '-i', 'pipe:0',
];
if (!noAudio) ffArgs.push('-i', audioPath, '-map', '0:v:0', '-map', '1:a:0');
else ffArgs.push('-map', '0:v:0', '-an');
ffArgs.push(
  '-t', String(duration), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
);
if (!noAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
ffArgs.push('-movflags', '+faststart', output);

const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
ff.on('error', (err) => { console.error(`Could not start FFmpeg (${ffmpeg}): ${err.message}`); });
for (let frame = 0; frame < totalFrames; frame++) {
  const time = frame / fps;
  let active = sorted[sorted.length - 1];
  for (const shot of sorted) {
    if (time >= Number(shot.start) && time < Number(shot.end)) { active = shot; break; }
  }
  renderShot(active, time);
  if (!ff.stdin.write(canvas.data())) await once(ff.stdin, 'drain');
}
ff.stdin.end();
const [code] = await once(ff, 'close');
if (code !== 0) throw new Error(`FFmpeg exited with status ${code}`);
console.log(`Rendered ${totalFrames} frames at ${fps} fps -> ${output}`);
