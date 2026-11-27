import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const KIT = path.join(ROOT, 'code-film-studio/skills/make-film/kit');
const PROJ = __dirname;
const VIDEO_PATH = path.join(ROOT, 'why-you-never-touch-anything.mp4');
const PORT = Number(process.env.PORT || 4173);

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

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Why You Never Touch Anything — Screening Room</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 0%, #1c2036 0%, #0b0d14 70%);
      color: #f3efe6;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 20px 40px;
    }
    .wrap { width: min(1120px, 100%); }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .meta { color: #a7aec4; font-size: 13px; }
    .stage {
      background: #05060a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.55);
    }
    video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
      align-items: center;
    }
    a.btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 15px;
      border-radius: 9px;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 600;
      background: #ffb86c;
      color: #15131d;
    }
    a.btn.secondary {
      background: rgba(255,255,255,0.08);
      color: #e9e5dc;
      border: 1px solid rgba(255,255,255,0.14);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Why You Never Touch Anything</h1>
      <div class="meta">1920×1080 · 24 fps · 66.0s · -14.1 LUFS Master</div>
    </header>
    <div class="stage">
      <video controls playsinline preload="metadata" poster="/exports/sheet.png">
        <source src="/why-you-never-touch-anything.mp4" type="video/mp4" />
        <track label="English" kind="subtitles" srclang="en" src="/exports/subtitles.vtt" />
      </video>
    </div>
    <div class="actions">
      <a class="btn" href="/why-you-never-touch-anything.mp4" download="why-you-never-touch-anything.mp4">Download MP4 (1080p)</a>
      <a class="btn secondary" href="/exports/sheet.png" target="_blank">12-Shot Contact Sheet</a>
      <a class="btn secondary" href="/kit/player.html?project=__proj">Open Interactive Canvas Studio</a>
    </div>
  </div>
</body>
</html>`;

function serveFile(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
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
    res.end(INDEX_HTML);
    return;
  }
  if (u === '/why-you-never-touch-anything.mp4') return serveFile(req, res, VIDEO_PATH);
  if (u.startsWith('/exports/')) {
    const p = path.resolve(PROJ, '.' + u);
    if (!p.startsWith(PROJ)) { res.writeHead(403); return res.end(); }
    return serveFile(req, res, p);
  }
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
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Screening room listening on http://0.0.0.0:${PORT}`);
});
