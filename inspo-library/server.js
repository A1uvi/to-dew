#!/usr/bin/env node
// Inspo Library — a tiny local server. No npm dependencies.
//   node server.js            → http://localhost:4747
// Env:
//   INSPO_DIR         folder of screenshots/videos (default ../to-dew-inspo)
//   PORT              default 4747
//   ANTHROPIC_API_KEY enables the "Analyze" button (Claude vision) for new images
//   INSPO_MODEL       default claude-sonnet-4-5

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ROOT = __dirname;
const INSPO_DIR = path.resolve(process.env.INSPO_DIR || path.join(ROOT, '..', 'to-dew-inspo'));
const CACHE_DIR = path.join(ROOT, '.cache');
const LIB_PATH = path.join(ROOT, 'library.json');
const PORT = Number(process.env.PORT || 4747);
const MODEL = process.env.INSPO_MODEL || 'claude-sonnet-4-5';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.m4v': 'video/mp4', '.svg': 'image/svg+xml'
};

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(INSPO_DIR, { recursive: true });

// ---------- library ----------
function idFor(file) { return crypto.createHash('sha1').update(file).digest('hex').slice(0, 12); }
function loadLib() {
  if (!fs.existsSync(LIB_PATH)) return { version: 1, families: [], items: [] };
  return JSON.parse(fs.readFileSync(LIB_PATH, 'utf8'));
}
let lib = loadLib();
let saveTimer = null;
function saveLib() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = LIB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(lib, null, 2));
    fs.renameSync(tmp, LIB_PATH);
  }, 150);
}
function kindOf(file) {
  const ext = path.extname(file).toLowerCase();
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return null;
}

// Walk the inspo folder; add new files, drop items whose file vanished.
function rescan() {
  const files = fs.readdirSync(INSPO_DIR).filter(f => !f.startsWith('.') && kindOf(f));
  const seen = new Set(files);
  const byFile = new Map(lib.items.map(i => [i.file, i]));
  let added = 0, removed = 0;
  for (const f of files) {
    if (!byFile.has(f)) {
      lib.items.push({
        id: idFor(f), file: f, title: f.replace(/\.[^.]+$/, ''), families: [], tags: [],
        imagePrompt: '', brief: '', notes: '', url: '', addedAt: new Date().toISOString(), analyzed: false
      });
      added++;
    }
  }
  const before = lib.items.length;
  lib.items = lib.items.filter(i => seen.has(i.file));
  removed = before - lib.items.length;
  for (const it of lib.items) { it.id = it.id || idFor(it.file); it.kind = kindOf(it.file); }
  if (added || removed) saveLib();
  return { added, removed, total: lib.items.length };
}
rescan();

// ---------- video posters ----------
function posterPath(item) { return path.join(CACHE_DIR, item.id + '.jpg'); }
function ensurePoster(item) {
  return new Promise(resolve => {
    const out = posterPath(item);
    if (fs.existsSync(out)) return resolve(out);
    const src = path.join(INSPO_DIR, item.file);
    execFile('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1', '-i', src, '-frames:v', '1', '-vf', 'scale=900:-2', out],
      err => resolve(err ? null : out));
  });
}

// ---------- claude analysis ----------
async function analyze(item) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Set ANTHROPIC_API_KEY to enable automatic analysis (or fill the fields in by hand).');
  let imgPath = path.join(INSPO_DIR, item.file);
  let mediaType = MIME[path.extname(item.file).toLowerCase()];
  if (item.kind === 'video') {
    imgPath = await ensurePoster(item);
    if (!imgPath) throw new Error('ffmpeg is needed to extract a frame from videos.');
    mediaType = 'image/jpeg';
  }
  const data = fs.readFileSync(imgPath).toString('base64');
  const famList = lib.families.map(f => `- id "${f.id}": ${f.name} — ${f.description}`).join('\n');
  const prompt = `You are a design director cataloguing a personal design-inspiration library.
Analyze this saved screenshot/image and return ONLY a JSON object with these keys:
{
 "title": short descriptive title (max 8 words),
 "tags": 6-10 short design-vocabulary keywords (e.g. "monospace type", "editorial grid", "frosted glass cards"),
 "families": array of existing family ids this image belongs to (can be several, can be empty),
 "newFamilies": array of NEW families to create ONLY if the image clearly doesn't fit the existing ones. Each: {"id": kebab-case, "name": string, "description": 1-2 sentences, "vocabulary": {"typography": ..., "layout": ..., "color": ..., "texture": ..., "motion": ...}},
 "imagePrompt": a ready-to-use prompt (2-4 sentences) for an AI image generator to create a background/hero image in this style. Describe subject, composition, palette, texture, lighting, aspect ratio. No brand names or real people.
 "brief": a markdown design brief someone could hand to Claude Code to build an entire website in this aesthetic. Sections: Typography (specific font suggestions + sizes), Color palette (hex codes), Layout, Spacing & shape, Texture & imagery, Motion, Do / Don't. Be concrete and opinionated.
}
Existing families:
${famList || '(none yet)'}
Return only JSON, no prose.`;

  const body = {
    model: MODEL, max_tokens: 2500,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
      { type: 'text', text: prompt }
    ] }]
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Claude API error ' + res.status + ': ' + (await res.text()).slice(0, 300));
  const json = await res.json();
  const text = json.content.map(c => c.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Could not parse analysis: ' + text.slice(0, 200));
  const out = JSON.parse(m[0]);
  for (const nf of out.newFamilies || []) {
    if (nf.id && !lib.families.some(f => f.id === nf.id)) lib.families.push({ id: nf.id, name: nf.name, description: nf.description, vocabulary: nf.vocabulary || {} });
    if (nf.id && !(out.families || []).includes(nf.id)) (out.families = out.families || []).push(nf.id);
  }
  const valid = new Set(lib.families.map(f => f.id));
  item.title = out.title || item.title;
  item.tags = (out.tags || []).map(String);
  item.families = (out.families || []).filter(f => valid.has(f));
  item.imagePrompt = out.imagePrompt || '';
  item.brief = out.brief || '';
  item.analyzed = true;
  item.analyzedBy = MODEL;
  saveLib();
  return item;
}

// ---------- http ----------
function send(res, code, body, type = 'application/json') {
  const buf = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(buf);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function streamFile(req, res, file) {
  if (!fs.existsSync(file)) return send(res, 404, 'not found', 'text/plain');
  const stat = fs.statSync(file);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) { // video seeking
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = Number(s), end = e ? Number(e) : stat.size - 1;
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${stat.size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': stat.size, 'cache-control': 'max-age=3600' });
  fs.createReadStream(file).pipe(res);
}
function safeName(name) {
  const base = path.basename(name).replace(/[\/\\:*?"<>|]/g, '_');
  let out = base, n = 1;
  while (fs.existsSync(path.join(INSPO_DIR, out))) {
    const ext = path.extname(base); out = base.slice(0, -ext.length || undefined) + `-${n++}` + ext;
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/' || p === '/index.html') return streamFile(req, res, path.join(ROOT, 'public', 'index.html'));
    if (p.startsWith('/public/')) return streamFile(req, res, path.join(ROOT, p));
    if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }

    if (p === '/api/library' && req.method === 'GET')
      return send(res, 200, { ...lib, dir: INSPO_DIR, canAnalyze: !!process.env.ANTHROPIC_API_KEY, model: MODEL });

    if (p === '/api/rescan' && req.method === 'POST') return send(res, 200, rescan());

    if (p.startsWith('/media/')) {
      const id = p.slice(7);
      const item = lib.items.find(i => i.id === id);
      if (!item) return send(res, 404, 'no item', 'text/plain');
      return streamFile(req, res, path.join(INSPO_DIR, item.file));
    }
    if (p.startsWith('/poster/')) {
      const item = lib.items.find(i => i.id === p.slice(8));
      if (!item) return send(res, 404, 'no item', 'text/plain');
      const poster = await ensurePoster(item);
      if (!poster) return send(res, 404, 'no poster', 'text/plain');
      return streamFile(req, res, poster);
    }

    if (p === '/api/upload' && req.method === 'POST') {
      const name = safeName(decodeURIComponent(url.searchParams.get('name') || 'upload.png'));
      if (!kindOf(name)) return send(res, 400, { error: 'unsupported file type' });
      fs.writeFileSync(path.join(INSPO_DIR, name), await readBody(req));
      rescan();
      return send(res, 200, lib.items.find(i => i.file === name));
    }

    let m;
    if ((m = p.match(/^\/api\/items\/([a-z0-9]+)$/)) && req.method === 'PATCH') {
      const item = lib.items.find(i => i.id === m[1]);
      if (!item) return send(res, 404, { error: 'no item' });
      const patch = JSON.parse((await readBody(req)).toString() || '{}');
      for (const k of ['title', 'notes', 'url', 'tags', 'families', 'imagePrompt', 'brief']) if (k in patch) item[k] = patch[k];
      saveLib();
      return send(res, 200, item);
    }
    if ((m = p.match(/^\/api\/items\/([a-z0-9]+)$/)) && req.method === 'DELETE') {
      const item = lib.items.find(i => i.id === m[1]);
      if (!item) return send(res, 404, { error: 'no item' });
      if (url.searchParams.get('file') === '1') fs.rmSync(path.join(INSPO_DIR, item.file), { force: true });
      lib.items = lib.items.filter(i => i !== item);
      saveLib();
      return send(res, 200, { ok: true });
    }
    if ((m = p.match(/^\/api\/items\/([a-z0-9]+)\/analyze$/)) && req.method === 'POST') {
      const item = lib.items.find(i => i.id === m[1]);
      if (!item) return send(res, 404, { error: 'no item' });
      return send(res, 200, await analyze(item));
    }
    if (p === '/api/families' && req.method === 'POST') {
      const f = JSON.parse((await readBody(req)).toString());
      if (!f.id || !f.name) return send(res, 400, { error: 'id and name required' });
      const ex = lib.families.find(x => x.id === f.id);
      if (ex) Object.assign(ex, f); else lib.families.push({ vocabulary: {}, ...f });
      saveLib();
      return send(res, 200, lib.families);
    }
    if ((m = p.match(/^\/api\/families\/([a-z0-9-]+)$/)) && req.method === 'DELETE') {
      lib.families = lib.families.filter(f => f.id !== m[1]);
      for (const it of lib.items) it.families = it.families.filter(f => f !== m[1]);
      saveLib();
      return send(res, 200, lib.families);
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✿ Inspo Library  →  http://localhost:${PORT}`);
  console.log(`    folder: ${INSPO_DIR}`);
  console.log(`    items:  ${lib.items.length}   families: ${lib.families.length}`);
  console.log(`    auto-analyze: ${process.env.ANTHROPIC_API_KEY ? 'on (' + MODEL + ')' : 'off — set ANTHROPIC_API_KEY to enable'}\n`);
});
