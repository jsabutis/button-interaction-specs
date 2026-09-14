import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Records media/sweep.mp4 and media/sweep.gif: a pointer crossing one row of
// specimens per section, driven through CDP so the JavaScript specimens see a
// real pointermove. Needs Chrome and ffmpeg on the path.
//   node capture.mjs            record with the default plan
//   node capture.mjs '{"probe":true}'   print grid geometry and the rAF rate

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'specimens-capture-'));
const PAGE = 'file://' + path.join(HERE, 'index.html');
const OUT = path.join(WORK, 'frames');
const MEDIA = path.join(HERE, 'media');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const PORT = Number(process.env.PORT || 9333);
const W = 1280, H = 720;

const DEFAULT_PLAN = { segments: [
  { scroll: 0 }, { top: 150, bottom: 520 },
  { scroll: 2791 }, { top: 100, bottom: 520 },
  { scroll: 5488 }, { top: 100, bottom: 520 },
  { scroll: 6724 }, { top: 100, bottom: 520 },
  { scroll: 9404 }, { top: 100, bottom: 520 },
] };

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=' + PORT, '--hide-scrollbars',
  '--window-size=' + W + ',' + H, '--force-device-scale-factor=2',
  '--user-data-dir=' + path.join(WORK, 'profile'), '--no-first-run', '--allow-file-access-from-files',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

const url = await wsUrl();
const ws = new WebSocket(url);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
const handlers = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method) handlers.forEach(h => h(m));
});
function send(method, params = {}, sessionId) {
  const mid = ++id;
  return new Promise((resolve, reject) => {
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false });

// 60Hz rAF shim: headless runs near 120Hz, which doubles frame-counted specimens.
await S('Page.addScriptToEvaluateOnNewDocument', { source: `
(() => {
  addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;top:0;left:0;width:22px;height:22px;z-index:9999;pointer-events:none;opacity:0;transform:translate(-2px,-2px)';
    c.innerHTML = '<svg viewBox="0 0 22 22" width="22" height="22"><path d="M2 1 L2 17 L6.4 13 L9.2 19.4 L12.2 18 L9.4 11.8 L15.4 11.6 Z" fill="#000" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener('pointermove', (e) => {
      c.style.opacity = '1';
      c.style.transform = 'translate(' + (e.clientX - 2) + 'px,' + (e.clientY - 2) + 'px)';
    }, true);
  });
})();
(() => {
  const raf = window.requestAnimationFrame.bind(window);
  let last = 0;
  window.requestAnimationFrame = (cb) => raf(function step(t) {
    if (t - last < 15.5) return raf(step);
    last = t; cb(t);
  });
})();
` });

const loaded = new Promise(r => handlers.push(m => { if (m.method === 'Page.loadEventFired') r(); }));
await S('Page.navigate', { url: PAGE });
await loaded;
await sleep(2500); // fonts

const evalJs = async (expr) => (await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

// frame capture
const frames = [];
let n = 0;
handlers.push(m => {
  if (m.method !== 'Page.screencastFrame') return;
  const p = m.params;
  const file = path.join(OUT, String(n++).padStart(5, '0') + '.jpg');
  fs.writeFileSync(file, Buffer.from(p.data, 'base64'));
  frames.push({ file, t: p.metadata.timestamp });
  S('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
});

async function move(x, y) {
  await S('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', pointerType: 'mouse' });
}

// sweep a row of buttons: glide in from the left edge, cross each button, dwell inside
async function glide(from, to, steps, ms) {
  for (let i = 1; i <= steps; i++) {
    await move(from[0] + (to[0] - from[0]) * i / steps, from[1] + (to[1] - from[1]) * i / steps);
    await sleep(ms / steps);
  }
}

const plan = process.argv[2] ? JSON.parse(process.argv[2]) : DEFAULT_PLAN;

if (plan.probe) {
  const hz = await evalJs(`new Promise(res => { let n=0; const t0=performance.now(); (function f(){ n++; if (performance.now()-t0 > 1000) return res(Math.round(n/((performance.now()-t0)/1000))); requestAnimationFrame(f); })(); })`);
  console.log('rAF hz', hz);
  const g = await evalJs(`(() => {
    const bs = [...document.querySelectorAll('main .stage > button')];
    const r0 = bs.map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + window.scrollY), Math.round(r.width), Math.round(r.height)]; });
    return {docH: document.documentElement.scrollHeight, cards: document.querySelectorAll('main .card').length, first: r0.slice(0,12), sections: [...document.querySelectorAll('.secbar h2')].map(h => [h.textContent, Math.round(h.getBoundingClientRect().top + window.scrollY)])};
  })()`);
  console.log(JSON.stringify(g, null, 1));
  ws.close(); chrome.kill(); process.exit(0);
}
await S('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });

let cursor = [10, 400];
for (const seg of plan.segments) {
  if (seg.scroll !== undefined) {
    await evalJs(`window.scrollTo({top:${seg.scroll},behavior:'instant'});1`);
    await sleep(350);
    continue;
  }
  const targets = await evalJs(`(() => {
    const bs = [...document.querySelectorAll('main .stage > button')];
    return bs.map(b => { const r = b.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2, r.width, r.height]; })
      .filter(([x,y]) => y > ${seg.top} && y < ${seg.bottom} && x > 0 && x < ${W});
  })()`);
  targets.sort((a, b) => (Math.abs(a[1] - b[1]) > 40 ? a[1] - b[1] : a[0] - b[0]));
  const rows = [];
  for (const t of targets) {
    const r = rows.find(r => Math.abs(r[0][1] - t[1]) < 40);
    r ? r.push(t) : rows.push([t]);
  }
  const picked = rows.slice(0, seg.rows ?? 1).flat();
  for (const [x, y, w] of picked) {
    await glide(cursor, [x - w / 2 + 6, y], 10, 110);
    await glide([x - w / 2 + 6, y], [x + w / 2 - 6, y], 14, 380);
    cursor = [x + w / 2 - 6, y];
    await sleep(seg.dwell ?? 180);
  }
}
await sleep(600);
await S('Page.stopScreencast');
await sleep(300);

ws.close();
chrome.kill();

// Screencast frames arrive irregularly, so hand ffmpeg each frame's own duration.
const list = frames.map((f, i) => {
  const d = Math.max((frames[i + 1]?.t ?? f.t + 0.04) - f.t, 0.005);
  return `file '${f.file}'\nduration ${d.toFixed(4)}`;
}).concat(`file '${frames.at(-1).file}'`).join('\n');
const concat = path.join(WORK, 'concat.txt');
fs.writeFileSync(concat, list + '\n');
fs.mkdirSync(MEDIA, { recursive: true });

const run = (args) => new Promise((resolve, reject) => {
  const p = spawn(FFMPEG, ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('exit', (c) => c === 0 ? resolve() : reject(new Error(FFMPEG + ' exited ' + c)));
});
const mp4 = path.join(MEDIA, 'sweep.mp4');
const gif = path.join(MEDIA, 'sweep.gif');
const pal = path.join(WORK, 'palette.png');
await run(['-f', 'concat', '-safe', '0', '-i', concat, '-vf', `fps=30,scale=${W}:${H}:flags=lanczos`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4]);
await run(['-i', mp4, '-vf', 'fps=15,scale=960:-1:flags=lanczos,palettegen=max_colors=64', pal]);
await run(['-i', mp4, '-i', pal, '-lavfi',
  'fps=15,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3', gif]);
fs.rmSync(WORK, { recursive: true, force: true });

console.log('frames', frames.length, 'span', (frames.at(-1).t - frames[0].t).toFixed(2) + 's');
console.log(mp4);
console.log(gif);
process.exit(0);
