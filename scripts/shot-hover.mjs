// Screenshot with a CSS selector force-hovered (CDP Emulation + forced pseudo state).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [, , url, out, selector, wStr, hStr, yStr] = process.argv;
const width = Number(wStr ?? 1440);
const height = Number(hStr ?? 900);
const scrollY = Number(yStr ?? 0);

const userDir = mkdtempSync(path.join(tmpdir(), 'cdp-'));
const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  `--window-size=${width},${height}`,
  'about:blank',
]);
chrome.stderr.on('data', () => {});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
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
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
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
await send('DOM.enable', {}, sessionId);
await send('CSS.enable', {}, sessionId);
await send('Runtime.enable', {}, sessionId);
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
await send('Page.navigate', { url }, sessionId);
await sleep(3200);

if (scrollY) {
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY})` }, sessionId);
  await sleep(500);
}

if (selector) {
  const { root } = await send('DOM.getDocument', {}, sessionId);
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector }, sessionId);
  if (nodeId) {
    await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }, sessionId);
    await sleep(1200);
  } else {
    console.log(`selector not found: ${selector}`);
  }
}

const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
writeFileSync(out, Buffer.from(data, 'base64'));
console.log(`saved ${out}`);
ws.close();
chrome.kill();
process.exit(0);
