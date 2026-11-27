#!/usr/bin/env node
// serve.mjs — Zero-dependency Screening Room & Interactive Studio Server.
// Usage: node kit/serve.mjs --project <dir> [--port 4173] [--video <mp4-path>]
// Binds to 0.0.0.0 with HTTP 206 Range streaming and permissive CORS/iframe support
// so cloud sandbox previews (Arena, Codespaces, Docker) and local browsers work out of the box.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d = null) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

const projArg = opt('project');
if (!projArg) {
  console.error('Usage: node kit/serve.mjs --project <dir> [--port 4173] [--video <mp4-path>]');
  process.exit(1);
}

const PROJ = path.resolve(projArg);
const PORT = Number(opt('port', process.env.PORT || 4173));
const cfgPath = path.join(PROJ, 'config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const TITLE = cfg.title || path.basename(PROJ);

function resolveVideoPath() {
  const explicit = opt('video');
  if (explicit && fs.existsSync(path.resolve(explicit))) return path.resolve(explicit);
  for (const dirName of ['exports', 'out']) {
    const dir = path.join(PROJ, dirName);
    if (!fs.existsSync(dir)) continue;
    for (const preferred of ['final.mp4', 'preview.mp4']) {
      const p = path.join(dir, preferred);
      if (fs.existsSync(p)) return p;
    }
    const mp4 = fs.readdirSync(dir).find(f => f.toLowerCase().endsWith('.mp4'));
    if (mp4) return path.join(dir, mp4);
  }
  return null;
}

function resolveOptionalAsset(names) {
  for (const dirName of ['exports', 'out']) {
    for (const name of names) {
      const p = path.join(PROJ, dirName, name);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.vtt': 'text/vtt; charset=utf-8',
  '.srt': 'text/plain; charset=utf-8',
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function renderIndex() {
  const vid = resolveVideoPath();
  const vtt = resolveOptionalAsset(['subtitles.vtt']);
  const sheet = resolveOptionalAsset(['sheet.png']);
  const dlName = vid ? path.basename(vid) : 'film.mp4';
  const safeTitle = escapeHtml(TITLE);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — Code Film Studio</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, #1c2036 0%, #0b0d14 72%);
      color: #f3efe6; font-family: Inter, system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center; padding: 24px 20px 40px;
    }
    .wrap { width: min(1120px, 100%); }
    header { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .meta { color: #a7aec4; font-size: 13px; }
    .stage {
      background: #05060a; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.55);
    }
    video { display: block; width: 100%; aspect-ratio: ${cfg.aspect === '9:16' ? '9 / 16' : '16 / 9'}; max-height: 76vh; background: #000; }
    .empty { padding: 64px 24px; text-align: center; color: #a7aec4; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; align-items: center; }
    a.btn {
      display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 9px;
      text-decoration: none; font-size: 13.5px; font-weight: 600; background: #ffb86c; color: #15131d;
    }
    a.btn.secondary { background: rgba(255,255,255,0.08); color: #e9e5dc; border: 1px solid rgba(255,255,255,0.14); }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${safeTitle}</h1>
      <div class="meta">${escapeHtml(cfg.aspect || '16:9')} · ${Number(cfg.fps || 24)} fps · style: ${escapeHtml(cfg.style || 'awaken')}</div>
    </header>
    <div class="stage">
      ${vid ? `<video controls playsinline preload="metadata" ${sheet ? 'poster="/__media/sheet.png"' : ''}>
        <source src="/__media/video.mp4" type="video/mp4" />
        ${vtt ? '<track label="Subtitles" kind="subtitles" srclang="en" src="/__media/subtitles.vtt" default />' : ''}
      </video>` : `<div class="empty">No rendered MP4 yet — open the Interactive Canvas Studio below or run <code>node kit/render.mjs --project ${escapeHtml(projArg)}</code>.</div>`}
    </div>
    <div class="actions">
      ${vid ? `<a class="btn" href="/__media/video.mp4" download="${escapeHtml(dlName)}">Download MP4</a>` : ''}
      ${sheet ? `<a class="btn secondary" href="/__media/sheet.png" target="_blank">Contact Sheet</a>` : ''}
      <a class="btn secondary" href="/kit/player.html?project=__proj">Interactive Canvas Studio</a>
    </div>
  </div>
</body>
</html>`;
}

function serveFile(req, res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end('Not found');
    return;
  }
  const stat = fs.statSync(filePath);
  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(stat.size - 1, parseInt(m[2], 10)) : stat.size - 1;
      if (start <= end && start < stat.size) {
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': type,
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
  }

  res.writeHead(200, {
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/' || u === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(renderIndex());
    return;
  }
  if (u === '/__media/video.mp4') return serveFile(req, res, resolveVideoPath());
  if (u === '/__media/sheet.png') return serveFile(req, res, resolveOptionalAsset(['sheet.png']));
  if (u === '/__media/subtitles.vtt') return serveFile(req, res, resolveOptionalAsset(['subtitles.vtt']));
  if (u.startsWith('/kit/')) {
    const p = path.resolve(KIT, '.' + u.slice(4));
    if (!p.startsWith(KIT)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, p);
  }
  if (u.startsWith('/projects/__proj/')) {
    const p = path.resolve(PROJ, '.' + u.slice('/projects/__proj'.length));
    if (!p.startsWith(PROJ)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, p);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  const addr = server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : PORT;
  console.log(`Code Film Studio Screening Room listening on http://0.0.0.0:${actualPort} (project: ${PROJ})`);
});
