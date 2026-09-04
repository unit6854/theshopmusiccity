// Headless full-page screenshot via Chrome DevTools Protocol (no extra deps).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] ?? 'http://localhost:4321/';
const out = process.argv[3] ?? 'shot.png';
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const fullPage = (process.argv[6] ?? 'full') === 'full';

const userDir = mkdtempSync(path.join(tmpdir(), 'cdp-'));
const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  ...(fullPage ? ['--hide-scrollbars'] : []),
  '--force-device-scale-factor=1',
  `--window-size=${width},${height}`,
  'about:blank',
]);
chrome.stderr.on('data', () => {});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await res.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

const ws = new WebSocket(await getWs());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  } else events.push(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const msgId = ++id;
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

await send('Page.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId);
await sleep(3500);

let clip;
if (fullPage) {
  const m = await send('Page.getLayoutMetrics', {}, sessionId);
  const h = Math.ceil(m.cssContentSize?.height ?? m.contentSize.height);
  await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 1, mobile: false }, sessionId);
  await sleep(900);
  clip = { x: 0, y: 0, width, height: h, scale: 1 };
}

const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage, clip }, sessionId);
writeFileSync(out, Buffer.from(data, 'base64'));
console.log(`saved ${out}`);
ws.close();
chrome.kill();
process.exit(0);
