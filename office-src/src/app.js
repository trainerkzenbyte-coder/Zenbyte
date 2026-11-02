/* =====================================================================
   ZENBYTE TECHNOLOGIES — 3D IT office with animated people
   Every chapter takes you to a different part of the office:
   reception, data wall, coding floor, meeting room, coffee break,
   manager cabin and celebration. Drag (or move the mouse) to look around.
   ===================================================================== */
(function () {
'use strict';
const CAPTURE = /[?&]capture/.test(location.search);
const $ = s => document.querySelector(s);
const T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const MOB = () => innerWidth < 900;

/* ---------------- renderer / scene ---------------- */
const canvas = $('#gl');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = new T.Scene();
scene.background = new T.Color(0xdfe6ee);
scene.fog = new T.Fog(0xdfe6ee, 18, 42);
scene.environment = new T.PMREMGenerator(renderer).fromScene(new T.RoomEnvironment(renderer), .04).texture;
const camera = new T.PerspectiveCamera(42, 1, .1, 120);

function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const M = {
  wood: new T.MeshStandardMaterial({ roughness: .55, map: tex(1024, 1024, (x, w, h) => {
    for (let r = 0; r < 8; r++) for (let k = 0; k < 3; k++) {
      const y = r * h / 8, off = (r % 2) * w / 6 + k * w / 3, tone = 175 + Math.random() * 30;
      x.fillStyle = `rgb(${tone},${tone * .78 | 0},${tone * .56 | 0})`; x.fillRect(off % w, y, w / 3, h / 8);
      if (off % w + w / 3 > w) x.fillRect(0, y, (off % w + w / 3) - w, h / 8);
      for (let g = 0; g < 14; g++) { x.strokeStyle = `rgba(110,70,40,${.04 + Math.random() * .07})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const gy = y + Math.random() * h / 8; x.moveTo(0, gy); x.bezierCurveTo(w / 3, gy + 3, w * 2 / 3, gy - 3, w, gy + 1); x.stroke(); }
    }
    x.strokeStyle = 'rgba(60,40,25,.35)'; x.lineWidth = 2; for (let r = 0; r <= 8; r++) { x.beginPath(); x.moveTo(0, r * h / 8); x.lineTo(w, r * h / 8); x.stroke(); }
  }, [10, 10]) }),
  carpet: new T.MeshStandardMaterial({ roughness: .95, map: tex(512, 512, (x, w, h) => { x.fillStyle = '#5d6672'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,.05)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.strokeStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); } }, [8, 8]) }),
  wall: new T.MeshStandardMaterial({ color: 0xf1f1ee, roughness: .9 }),
  accent: new T.MeshStandardMaterial({ color: 0x0e2a4a, roughness: .7 }),
  ceil: new T.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 1 }),
  deskTop: new T.MeshStandardMaterial({ color: 0xf3f1ec, roughness: .45 }),
  oak: new T.MeshStandardMaterial({ color: 0xc89f72, roughness: .5 }),
  metal: new T.MeshStandardMaterial({ color: 0x2b2f36, metalness: .8, roughness: .35 }),
  steel: new T.MeshStandardMaterial({ color: 0xb9bec6, metalness: 1, roughness: .25 }),
  fabric: new T.MeshStandardMaterial({ color: 0x22262e, roughness: .9 }),
  fabricBlue: new T.MeshStandardMaterial({ color: 0x2d5a8a, roughness: .9 }),
  sofa: new T.MeshStandardMaterial({ color: 0x9aa7b5, roughness: .95 }),
  glass: new T.MeshPhysicalMaterial({ color: 0xe8f4ff, metalness: 0, roughness: .05, transmission: 0, transparent: true, opacity: .16, envMapIntensity: 1.5, depthWrite: false }),
  frame: new T.MeshStandardMaterial({ color: 0x1b1e23, metalness: .7, roughness: .4 }),
  black: new T.MeshStandardMaterial({ color: 0x0c0d10, roughness: .3, metalness: .4 }),
  white: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .4 }),
  cup: new T.MeshStandardMaterial({ color: 0xffffff, roughness: .25 }),
  leaf: new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: .8 }),
  leaf2: new T.MeshStandardMaterial({ color: 0x2f6a34, roughness: .8 }),
  pot: new T.MeshStandardMaterial({ color: 0xe6e1d8, roughness: .7 }),
  lightPanel: new T.MeshBasicMaterial({ color: 0xffffff }),
  sky: new T.MeshBasicMaterial({ map: tex(512, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9cc4ea'); g.addColorStop(.62, '#dceaf6'); g.addColorStop(.63, '#8b98a6'); g.addColorStop(1, '#6f7c89'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const bx = Math.random() * w, bw = 14 + Math.random() * 40, bh = 40 + Math.random() * 150; x.fillStyle = `rgba(${120 + Math.random() * 40},${135 + Math.random() * 40},${150 + Math.random() * 40},.9)`; x.fillRect(bx, h * .63 - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,.35)'; for (let wy = h * .63 - bh + 6; wy < h * .63 - 4; wy += 9) for (let wx = bx + 3; wx < bx + bw - 3; wx += 7) x.fillRect(wx, wy, 3, 4); }
  }), fog: false })
};
function box(w, h, d, m, x, y, z, parent, shadow = true) { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; (parent || scene).add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 24) { const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; (parent || scene).add(o); return o; }
function group(x, y, z, ry = 0, parent) { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; (parent || scene).add(g); return g; }

/* ---------------- screens with live content (code, charts) ---------------- */
const liveScreens = [];
const CODE = [
  ['k', 'import'], ['t', ' { Candidate, Offer } '], ['k', 'from'], ['s', " '@zenbyte/careers'"], ['n', ''],
  ['k', 'export async function'], ['f', ' placeCandidate'], ['t', '(profile) {'], ['n', ''],
  ['t', '  const '], ['v', 'skills'], ['t', ' = profile.skills.'], ['f', 'filter'], ['t', '(s => s.verified);'], ['n', ''],
  ['t', '  const '], ['v', 'matches'], ['t', ' = '], ['k', 'await'], ['f', ' findCompanies'], ['t', '({ skills, city });'], ['n', ''],
  ['k', '  for'], ['t', ' ('], ['k', 'const'], ['v', ' company'], ['k', ' of'], ['t', ' matches) {'], ['n', ''],
  ['t', '    '], ['k', 'await'], ['f', ' scheduleInterview'], ['t', '(profile, company);'], ['n', ''],
  ['t', '  }'], ['n', ''], ['c', '  // No offer, no fee.'], ['n', ''],
  ['k', '  return'], ['k', ' new'], ['f', ' Offer'], ['t', '({ ctc: '], ['v', 'expected'], ['t', ', joining });'], ['n', ''],
  ['t', '}'], ['n', ''], ['n', ''],
  ['k', 'def'], ['f', ' train_model'], ['t', '(data):'], ['n', ''],
  ['t', '    model = '], ['f', 'XGBClassifier'], ['t', '(n_estimators='], ['v', '400'], ['t', ')'], ['n', ''],
  ['t', '    model.'], ['f', 'fit'], ['t', '(data.X, data.y)'], ['n', ''],
  ['k', '    return'], ['t', ' model'], ['n', ''], ['n', ''],
  ['k', 'SELECT'], ['t', ' city, '], ['f', 'COUNT'], ['t', '(*) '], ['k', 'AS'], ['t', ' offers'], ['n', ''],
  ['k', 'FROM'], ['t', ' placements '], ['k', 'GROUP BY'], ['t', ' city;'], ['n', '']
];
const CC = { k: '#c792ea', t: '#d6deeb', s: '#ecc48d', f: '#82aaff', v: '#f78c6c', c: '#637777' };
function codeScreen(seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320; const x = c.getContext('2d');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const s = { c, x, t, seed, draw(time) {
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 512, 320);
    x.fillStyle = '#121a2b'; x.fillRect(0, 0, 512, 22); x.fillRect(0, 0, 34, 320);
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(12 + i * 14, 11, 4, 0, 7); x.fill(); });
    x.font = '13px monospace'; x.textBaseline = 'top';
    const total = Math.floor((time * 9 + seed * 37) % 160);
    let line = 0, col = 44, chars = 0;
    const scroll = Math.max(0, Math.floor(total / 22) * 0);
    for (const [k, txt] of CODE) {
      if (k === 'n') { line++; col = 44; continue; }
      const y = 30 + (line - scroll) * 17; if (y > 305) break;
      const n = Math.min(txt.length, Math.max(0, total * 1.6 - chars)); chars += txt.length;
      if (n <= 0) break;
      x.fillStyle = CC[k]; x.fillText(txt.slice(0, n), col, y); col += x.measureText(txt).width;
      x.fillStyle = '#4b5a75'; x.fillText(String(line + 1).padStart(2, ' '), 8, y);
    }
    t.needsUpdate = true;
  } };
  liveScreens.push(s); return s;
}
function chartScreen() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576; const x = c.getContext('2d');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  const a = months(2025), b = months(2026), mx = Math.max(...a, ...b);
  const s = { t, draw(time) {
    const g = x.createLinearGradient(0, 0, 1024, 576); g.addColorStop(0, '#0c1830'); g.addColorStop(1, '#050a16'); x.fillStyle = g; x.fillRect(0, 0, 1024, 576);
    x.fillStyle = '#e8c27c'; x.font = '600 22px Inter, sans-serif'; x.fillText('ZENBYTE · PLACEMENT RECORD', 50, 60);
    x.fillStyle = '#fff'; x.font = '500 54px Cormorant, Georgia, serif'; x.fillText(`${a.reduce((p, q) => p + q, 0)} offers in 2025`, 50, 120);
    const k = clamp((time % 9) / 2.5);
    for (let i = 0; i < 12; i++) {
      const bx = 60 + i * 76, h1 = a[i] / mx * 300 * ease(clamp(k * 1.4 - i * .03)), h2 = b[i] / mx * 300 * ease(clamp(k * 1.4 - i * .03 - .05));
      x.fillStyle = '#4fb8ff'; x.fillRect(bx, 500 - h1, 28, h1); x.fillStyle = '#e8c27c'; x.fillRect(bx + 32, 500 - h2, 28, h2);
      x.fillStyle = '#8f9bb2'; x.font = '18px Inter, sans-serif'; x.fillText('JFMAMJJASOND'[i], bx + 22, 532);
    }
    t.needsUpdate = true;
  } };
  liveScreens.push(s); return s;
}
function logoTex() {
  return tex(1024, 512, (x, w, h) => {
    x.fillStyle = '#0e2a4a'; x.fillRect(0, 0, w, h);
    const im = $('#logoImg'); x.drawImage(im, w / 2 - 120, 40, 240, 244);
    x.fillStyle = '#ffffff'; x.font = '600 76px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('ZENBYTE TECHNOLOGIES', w / 2, 380);
    x.fillStyle = '#e8c27c'; x.font = '500 30px Inter, sans-serif'; x.fillText('YOUR BRIDGE TO IT CAREERS', w / 2, 440);
  });
}

/* ---------------- furniture ---------------- */
function monitor(parent, x, z, ry, seed) {
  const g = group(x, .76, z, ry, parent);
  box(.04, .3, .04, M.metal, 0, .15, -.05, g); box(.24, .015, .18, M.metal, 0, .008, -.05, g);
  box(.62, .38, .025, M.black, 0, .42, -.05, g);
  const scr = new T.Mesh(new T.PlaneGeometry(.58, .345), new T.MeshBasicMaterial({ map: codeScreen(seed).t, toneMapped: false }));
  scr.position.set(0, .42, -.036); g.add(scr);
  return g;
}
function deskUnit(parent, x, z, ry, seed, withChair = true) {
  const g = group(x, 0, z, ry, parent);
  box(1.4, .035, .75, M.deskTop, 0, .74, 0, g);
  [[-.66, -.33], [.66, -.33], [-.66, .33], [.66, .33]].forEach(([a, b]) => box(.04, .74, .04, M.metal, a, .37, b, g));
  monitor(g, 0, -.18, 0, seed);
  box(.44, .02, .14, M.black, 0, .76, .12, g);          // keyboard
  box(.06, .02, .1, M.black, .32, .76, .14, g);         // mouse
  if (Math.random() < .5) { const c = cyl(.035, .03, .1, M.cup, -.5, .8, .1, g); }
  if (withChair) chair(g, 0, .62, 0);
  return g;
}
function chair(parent, x, z, ry) {
  const g = group(x, 0, z, ry, parent);
  box(.48, .07, .46, M.fabric, 0, .46, 0, g); box(.46, .55, .06, M.fabric, 0, .78, .22, g);
  cyl(.03, .03, .4, M.steel, 0, .24, 0, g, 12);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; box(.03, .03, .3, M.steel, Math.sin(a) * .14, .05, Math.cos(a) * .14, g).rotation.y = a; }
  return g;
}
function plant(parent, x, z, s = 1) {
  const g = group(x, 0, z, 0, parent); g.scale.setScalar(s);
  cyl(.22, .17, .45, M.pot, 0, .225, 0, g);
  for (let i = 0; i < 26; i++) {
    const l = new T.Mesh(new T.SphereGeometry(.12, 8, 6), i % 2 ? M.leaf : M.leaf2);
    const a = Math.random() * 6.28, r = Math.random() * .22, y = .55 + Math.random() * .9;
    l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); l.scale.set(1, 1.8, .5); l.rotation.set(Math.random(), a, Math.random() * .6); l.castShadow = true; g.add(l);
  }
  return g;
}
function glassWall(x, z, w, ry, parent) {
  const g = group(x, 0, z, ry, parent);
  const p = new T.Mesh(new T.PlaneGeometry(w, 3), M.glass); p.position.y = 1.5; g.add(p);
  box(w, .05, .06, M.frame, 0, .025, 0, g, false); box(w, .05, .06, M.frame, 0, 2.98, 0, g, false);
  for (let i = 0; i <= Math.round(w / 1.4); i++) box(.04, 3, .06, M.frame, -w / 2 + i * w / Math.round(w / 1.4), 1.5, 0, g, false);
  return g;
}

/* ---------------- the office building ---------------- */
const ZX = [0, 15, 30, 45, 60, 75, 90];     // centre of each zone along X
const LEN = 110;
const floor = new T.Mesh(new T.PlaneGeometry(LEN, 18), M.wood); floor.rotation.x = -Math.PI / 2; floor.position.set(45, 0, 2); floor.receiveShadow = true; scene.add(floor);
const ceil = new T.Mesh(new T.PlaneGeometry(LEN, 18), M.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(45, 3.2, 2); scene.add(ceil);
for (let x = -8; x < 100; x += 3) for (let z = -4.5; z <= 9; z += 3) { const l = new T.Mesh(new T.PlaneGeometry(1.2, .6), M.lightPanel); l.rotation.x = Math.PI / 2; l.position.set(x, 3.19, z); scene.add(l); }
/* back wall with big windows onto the city */
const back = group(45, 0, -6);
box(LEN, 3.2, .2, M.wall, 0, 1.6, -.1, back, false);
const win = new T.Mesh(new T.PlaneGeometry(LEN - 2, 2.2), M.sky); win.position.set(0, 1.65, .02); back.add(win);
for (let x = -LEN / 2; x <= LEN / 2; x += 2.4) box(.08, 2.3, .1, M.frame, x, 1.65, .05, back, false);
box(LEN, .08, .12, M.frame, 0, .53, .05, back, false); box(LEN, .08, .12, M.frame, 0, 2.77, .05, back, false);
/* front wall (the opposite side) with a big screen in every zone, and glass partitions between zones */
const front = group(45, 0, 10.1);
box(LEN, 3.2, .2, M.wall, 0, 1.6, .1, front, false);
box(LEN, .5, .06, M.accent, 0, .25, -.02, front, false);
for (let i = 0; i < ZX.length - 1; i++) glassWall((ZX[i] + ZX[i + 1]) / 2, 2, 16, Math.PI / 2);
function slideTex(title, big, lines, foot) {
  return tex(1280, 720, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0f2b4d'); g.addColorStop(1, '#060f1f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.drawImage($('#logoImg'), w - 150, 40, 96, 98);
    x.fillStyle = '#e8c27c'; x.font = '600 30px Inter, sans-serif'; x.fillText(title, 80, 100);
    x.fillStyle = '#ffffff'; x.font = '500 84px Cormorant, Georgia, serif'; x.fillText(big, 80, 210);
    lines.forEach((l, i) => { const y = 300 + i * 92; x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(80, y, w - 160, 74); x.fillStyle = '#e8c27c'; x.fillRect(80, y, 6, 74); x.fillStyle = '#e6edf7'; x.font = '500 36px Inter, sans-serif'; x.fillText(l, 116, y + 49); });
    if (foot) { x.fillStyle = '#8fb8e0'; x.font = '500 26px Inter, sans-serif'; x.fillText(foot, 80, h - 50); }
  });
}
function frontScreen(zone, w, h, map, x = 0) {
  const g = group(ZX[zone] + x, 1.7, 9.98, Math.PI);
  box(w + .14, h + .14, .08, M.black, 0, 0, .02, g, false);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map, toneMapped: false })); m.position.z = .07; g.add(m);
  return g;
}
const callTex = tex(1280, 720, (x, w, h) => { x.fillStyle = '#0b0f17'; x.fillRect(0, 0, w, h); const names = ['Priya · Chennai', 'Arjun · Bengaluru', 'Client · Hiring team', 'Karthik · Coimbatore', 'Divya · HR', 'You'];
  names.forEach((n, i) => { const cx = 20 + (i % 3) * 420, cy = 20 + Math.floor(i / 3) * 340; const g = x.createLinearGradient(cx, cy, cx, cy + 320); g.addColorStop(0, ['#2c3e57', '#3b2f2f', '#24413a', '#3a3550', '#45362a', '#2a3445'][i]); g.addColorStop(1, '#10141c'); x.fillStyle = g; x.fillRect(cx, cy, 400, 320);
    x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(cx + 200, cy + 135, 62, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + 200, cy + 300, 115, 90, 0, Math.PI, 0); x.fill();
    x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(cx + 12, cy + 274, 250, 34); x.fillStyle = '#fff'; x.font = '500 22px Inter, sans-serif'; x.fillText(n, cx + 22, cy + 298); }); });
const sun = new T.DirectionalLight(0xfff3e2, 2.6); sun.position.set(6, 12, -10); sun.castShadow = true;
sun.shadow.mapSize.set(MOB() ? 1024 : 2048, MOB() ? 1024 : 2048); sun.shadow.camera.left = -11; sun.shadow.camera.right = 11; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12; sun.shadow.camera.far = 40; sun.shadow.bias = -.0005; sun.shadow.normalBias = .02;
scene.add(sun); scene.add(sun.target);
scene.add(new T.HemisphereLight(0xffffff, 0xb59a7c, .9));
const fill = new T.DirectionalLight(0xdfe9ff, .6); fill.position.set(-4, 6, 10); scene.add(fill);

/* zone 1: reception with the Zenbyte wall */
const Z1 = group(ZX[0], 0, 0);
const logoWall = box(7, 3.2, .15, new T.MeshStandardMaterial({ map: null, color: 0xffffff, roughness: .6 }), 0, 1.6, -5.6, Z1, false);
const recDesk = group(0, 0, -3.2, 0, Z1);
box(3.2, 1.05, .7, M.white, 0, .525, 0, recDesk); box(3.3, .05, .8, M.oak, 0, 1.07, 0, recDesk);
box(3.22, .08, .72, new T.MeshBasicMaterial({ color: 0x3aa8ff, toneMapped: false }), 0, .06, 0, recDesk, false);
monitor(recDesk, -.7, -.05, Math.PI, 3).position.y = 1.07;
plant(Z1, -3.1, -4.6, 1.2); plant(Z1, 3.1, -4.6, 1.1); plant(Z1, -5.5, 2, 1);
const sofa1 = group(4.2, 0, 1.5, -Math.PI / 2, Z1); box(2.2, .42, .85, M.sofa, 0, .21, 0, sofa1); box(2.2, .5, .2, M.sofa, 0, .62, .35, sofa1);
box(1, .4, .6, M.oak, 3.1, .2, 1.5, Z1);

/* zone 2: data wall (our record) */
const Z2 = group(ZX[1], 0, 0);
const chart = chartScreen();
box(4.6, 2.65, .1, M.black, 0, 1.7, -5.75, Z2, false);
const chartMesh = new T.Mesh(new T.PlaneGeometry(4.45, 2.5), new T.MeshBasicMaterial({ map: chart.t, toneMapped: false })); chartMesh.position.set(0, 1.7, -5.69); Z2.add(chartMesh);
deskUnit(Z2, -3.6, -1.8, .3, 11); deskUnit(Z2, 3.6, -1.8, -.3, 12); plant(Z2, -5.6, -4.8);

/* zone 3: coding floor */
const Z3 = group(ZX[2], 0, 0);
const deskSpots = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
  const x = -3.3 + c * 3.3, z = -3.6 + r * 2.8;
  deskUnit(Z3, x, z, 0, 20 + r * 3 + c, true); deskSpots.push([x, z]);
}
plant(Z3, 5.8, -4.8); plant(Z3, -5.8, 1.5);

/* zone 4: meeting room */
const Z4 = group(ZX[3], 0, 0);
const table = group(0, 0, -2.6, 0, Z4);
const top4 = new T.Mesh(new T.CylinderGeometry(1, 1, .05, 48), M.oak); top4.scale.set(2.1, 1, 1); top4.position.y = .75; top4.castShadow = top4.receiveShadow = true; table.add(top4);
box(.1, .72, .9, M.metal, -1.2, .37, 0, table); box(.1, .72, .9, M.metal, 1.2, .37, 0, table);
const presSys = codeScreen(41);
box(3.2, 1.85, .08, M.black, 0, 1.65, -5.7, Z4, false);
const pres = new T.Mesh(new T.PlaneGeometry(3.1, 1.75), new T.MeshBasicMaterial({ map: tex(1024, 576, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0e2a4a'); g.addColorStop(1, '#071426'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#e8c27c'; x.font = '600 26px Inter, sans-serif'; x.fillText('CANDIDATE JOURNEY', 70, 90); x.fillStyle = '#fff'; x.font = '500 64px Cormorant, Georgia, serif'; x.fillText('Join · Profile · Calls', 70, 190); x.fillText('Interview · Offer', 70, 270); ['Bengaluru', 'Chennai', 'Coimbatore'].forEach((c, i) => { x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(70 + i * 300, 360, 270, 130); x.fillStyle = '#cfe9ff'; x.font = '600 30px Inter, sans-serif'; x.fillText(c, 95 + i * 300, 435); }); }), toneMapped: false }));
pres.position.set(0, 1.65, -5.65); Z4.add(pres);
plant(Z4, -5.6, -4.8);

/* zone 5: coffee break area */
const Z5 = group(ZX[4], 0, 0);
const counter = group(-2.4, 0, -5.1, 0, Z5);
box(4.4, .92, .65, M.white, 0, .46, 0, counter); box(4.5, .05, .72, M.oak, 0, .945, 0, counter);
box(1.2, 1.6, .5, M.oak, 0, 2.2, -.1, counter);
const cm = group(-1.3, .97, -.05, 0, counter); box(.38, .5, .38, M.steel, 0, .25, 0, cm); box(.3, .06, .2, M.black, 0, .1, .15, cm); cyl(.04, .035, .09, M.cup, 0, .05, .14, cm);
for (let i = 0; i < 5; i++) cyl(.04, .035, .1, M.cup, .4 + i * .14, 1.02, .1, counter);
const bar = group(2.6, 0, -2.4, 0, Z5); cyl(.4, .4, .04, M.oak, 0, 1.05, 0, bar, 32); cyl(.04, .04, 1.05, M.metal, 0, .52, 0, bar);
plant(Z5, 5.6, -4.8, 1.3); plant(Z5, -5.7, 1.8);
const sofa5 = group(3.8, 0, 1.2, -Math.PI / 2, Z5); box(2.2, .42, .85, M.fabricBlue, 0, .21, 0, sofa5); box(2.2, .5, .2, M.fabricBlue, 0, .62, .35, sofa5);

/* zone 6: manager cabin */
const Z6 = group(ZX[5], 0, 0);
const mdesk = group(0, 0, -3.4, 0, Z6);
box(2.2, .05, .95, M.oak, 0, .76, 0, mdesk); box(2.1, .72, .06, M.black, 0, .37, -.4, mdesk); box(.06, .72, .9, M.black, -1.05, .37, 0, mdesk); box(.06, .72, .9, M.black, 1.05, .37, 0, mdesk);
monitor(mdesk, .5, -.15, -.25, 55);

const shelf = group(-4.5, 0, -5.5, 0, Z6); box(2.4, 2.4, .4, M.oak, 0, 1.2, 0, shelf);
for (let i = 0; i < 18; i++) box(.06, .3, .25, [M.accent, M.white, M.black][i % 3], -1 + (i % 9) * .25, .65 + Math.floor(i / 9) * .8, .1, shelf);
plant(Z6, 4.8, -4.8, 1.2);

/* zone 7: celebration / town hall */
const Z7 = group(ZX[6], 0, 0);
const wall7 = box(5.5, 2.4, .12, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .6 }), 0, 1.75, -5.6, Z7, false);
plant(Z7, -4, -4.8, 1.2); plant(Z7, 4, -4.8, 1.2);
const CONF = 260, cGeo = new T.BufferGeometry(), cPos = new Float32Array(CONF * 3), cSeed = [];
for (let i = 0; i < CONF; i++) cSeed.push([Math.random() * 8 - 4, Math.random() * 3, Math.random() * 6 - 4, Math.random()]);
cGeo.setAttribute('position', new T.BufferAttribute(cPos, 3));
const confetti = new T.Points(cGeo, new T.PointsMaterial({ size: .06, color: 0xe8c27c })); Z7.add(confetti);

/* the opposite side of every zone: a big screen people can watch */
frontScreen(0, 4.2, 2.36, slideTex('WELCOME TO ZENBYTE', 'Your bridge to IT careers', ['MNCs · product companies · startups', 'Chennai · Coimbatore · Bengaluru', 'No offer, no fee'], 'Visitors: please check in at the reception'));
const sofaF1 = group(ZX[0] - 1, 0, 6.6, Math.PI, null); box(2.4, .42, .85, M.sofa, 0, .21, 0, sofaF1); box(2.4, .5, .2, M.sofa, 0, .62, .35, sofaF1);
frontScreen(1, 4.6, 2.6, slideTex('SKILLS WE PLACE FOR', 'In demand right now', ['Data Science · ML · Data Engineering', 'Java · Full Stack · Python · .NET', 'DevOps · Cloud · Testing · Salesforce'], 'Around 50 offers every month'));
frontScreen(2, 4.6, 2.6, codeScreen(77).t);
frontScreen(3, 4.4, 2.48, callTex);

frontScreen(4, 3.8, 2.14, slideTex('HIRING NOW', 'Fresh openings this week', ['Java Developer · Chennai', 'Data Engineer · Bengaluru', 'QA Automation · Coimbatore'], 'Ask your counsellor to apply'));
frontScreen(5, 3.8, 2.14, slideTex('THIS MONTH', 'Offer letters released', ['Day 1 to 45: usual time to place', 'Salary talks and counter offers', 'Joining support included'], 'Zenbyte Technologies'));
frontScreen(6, 4.6, 2.6, slideTex('PLACED THIS MONTH', 'Congratulations, team!', ['Anitha · Data Analyst · MNC', 'Rahul · Java Developer · Product company', 'Meena · QA Engineer · Bank IT'], 'Refer friends and earn rewards'));

/* ---------------- people ---------------- */
/* Two realistic base people (a man and a woman), dressed in many different
   IT-office outfits: T-shirts and jeans, shirts, hoodies, kurtis and suits. */
const people = [], loader = new T.GLTFLoader(), MODELS = {};
const SKIN = [0xd9b49a, 0xc79c7e, 0xb98a6a, 0xe6c3a8, 0xa87b5e, 0xcfa587];
const HAIR = [0x2a1d16, 0x1b1411, 0x3b2a1f, 0x120e0c, 0x4a3324];
const OUTFITS = [   /* men: formal shirt + trousers · women: T-shirt + jeans */
  { sex: 'm', top: 0xf4f6f8, bot: 0x26324a, shoe: 0x1a1a1a },
  { sex: 'f', top: 0xf2f2f0, bot: 0x3d6ea8, shoe: 0x2a2a2a },
  { sex: 'm', top: 0xa9cbea, bot: 0x2e2f33, shoe: 0x3b2a20 },
  { sex: 'f', top: 0xb5404f, bot: 0x22324a, shoe: 0x3a2a22 },
  { sex: 'm', top: 0xe7e1d3, bot: 0x3a4250, shoe: 0x1a1a1a },
  { sex: 'f', top: 0x1d1f24, bot: 0x4a6f9c, shoe: 0x1a1a1a },
  { sex: 'm', top: 0xd7e6f4, bot: 0x8a7a5e, shoe: 0x5a3b26 },
  { sex: 'f', top: 0x2f7d77, bot: 0x2f4f7c, shoe: 0x111111 },
  { sex: 'm', top: 0xf1d9de, bot: 0x1f2a3a, shoe: 0x161616 },
  { sex: 'm', top: 0x8fa3b8, bot: 0x22252b, shoe: 0x161616 },
  { sex: 'f', top: 0xd8a9b8, bot: 0x30507d, shoe: 0x4a3426 },
  { sex: 'm', top: 0xffffff, bot: 0x4a4f57, shoe: 0x2a1e16 },
  { sex: 'f', top: 0x6a5acd, bot: 0x3d5f8f, shoe: 0x2a2a2a },
  { sex: 'm', top: 0xcfe0d4, bot: 0x2d3b55, shoe: 0x1a1a1a }
];
/* grey copy of a texture so any colour can be applied to it */
const greyCache = new Map();
function grey(map, lift = 1.15, flat = 1) {
  if (!map || !map.image) return null; const ck = map.uuid + flat; if (greyCache.has(ck)) return greyCache.get(ck);
  const im = map.image, c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data; let sum = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) { const l = .3 * a[i] + .59 * a[i + 1] + .11 * a[i + 2]; a[i] = l; if (a[i + 3] > 20) { sum += l; n++; } }
  const k = Math.min(3, 205 / Math.max(1, sum / Math.max(1, n))) * lift;
  const mean = sum / Math.max(1, n);
  for (let i = 0; i < a.length; i += 4) { const l = Math.min(255, (mean + (a[i] - mean) * flat) * k); a[i] = a[i + 1] = a[i + 2] = l; }
  x.putImageData(d, 0, 0); const t = new T.CanvasTexture(c); t.flipY = map.flipY; t.colorSpace = T.SRGBColorSpace; t.wrapS = map.wrapS; t.wrapT = map.wrapT; t.anisotropy = 4;
  greyCache.set(ck, t); return t;
}
const _c = new T.Color(), _v = new T.Vector3();
function tint(mat, hex, map) { const m = mat.clone(); if (map !== undefined) m.map = map; m.color.setHex(hex); m.metalness = 0; m.roughness = Math.max(.55, m.roughness || .7); return m; }
function dress(root, o, k) {
  const skin = SKIN[(k * 5 + 2) % SKIN.length], hair = HAIR[k % HAIR.length];
  root.updateMatrixWorld(true);
  root.traverse(n => {
    if (!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = true; n.frustumCulled = false;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    const nm = (n.name + ' ' + mats.map(m => m.name).join(' ')).toLowerCase();
    let m = mats[0];
    if (/outfit_top/.test(nm)) {
      m = tint(m, o.top, grey(m.map, 1.12, .3));
      /* remove the bead necklace: it is made of small separate pieces, so fold every small piece away */
      const g = n.geometry = n.geometry.clone(), pos = g.attributes.position, idx = g.index;
      const par = new Int32Array(pos.count).map((_, i) => i), find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
      const key = new Map();
      for (let i = 0; i < pos.count; i++) { const k = pos.getX(i).toFixed(4) + ',' + pos.getY(i).toFixed(4) + ',' + pos.getZ(i).toFixed(4); if (key.has(k)) par[find(i)] = find(key.get(k)); else key.set(k, i); }
      for (let i = 0; i < idx.count; i += 3) { const a0 = find(idx.getX(i)); par[find(idx.getX(i + 1))] = a0; par[find(idx.getX(i + 2))] = a0; }
      const size = new Map(); for (let i = 0; i < pos.count; i++) { const r = find(i); size.set(r, (size.get(r) || 0) + 1); }
      let big = 0, bigR = -1; size.forEach((v, r) => { if (v > big) { big = v; bigR = r; } });
      for (let i = 0; i < pos.count; i++) if (find(i) !== bigR) pos.setXYZ(i, 0, 0, 0);
      /* shirt tucked into the trousers: fold the long hem up to the belt and pull it in */
      n.updateMatrixWorld(true);
      const inv2 = new T.Matrix4().copy(n.matrixWorld).invert(), hipY = root.getObjectByName('Hips').getWorldPosition(new T.Vector3()).y, belt = hipY + .09 * root.scale.y / MODELS.m.scale;
      for (let i = 0; i < pos.count; i++) { if (find(i) !== bigR) continue; _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); if (_v.y < belt) { _v.y = belt; _v.x *= .9; _v.z *= .9; _v.applyMatrix4(inv2); pos.setXYZ(i, _v.x, _v.y, _v.z); } }
    }
    else if (/outfit_bottom/.test(nm)) m = tint(m, o.bot, grey(m.map, 1.1, .45));
    else if (/footwear/.test(nm)) m = tint(m, o.shoe, grey(m.map, 1));
    else if (/hair|ponytail|eyebrow/.test(nm)) {
      m = tint(m, hair, grey(m.map, .9));
      if (/wolf3d_hair/.test(nm)) {                         /* a shorter, office-style haircut for the men */
        const g = n.geometry = n.geometry.clone(), pos = g.attributes.position, inv = new T.Matrix4().copy(n.matrixWorld).invert();
        const hy = root.getObjectByName('Head').getWorldPosition(new T.Vector3()).y, top = root.getObjectByName('HeadTop_End').getWorldPosition(new T.Vector3()).y, cut = hy + (top - hy) * .3;
        for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); if (_v.y < cut) { _v.y = cut; _v.applyMatrix4(inv); pos.setXYZ(i, _v.x, _v.y, _v.z); } }
      }
    }
    else if (/casualsuit/.test(nm)) {
      /* one mesh for top + jeans: colour by height (vertex colours) on a grey copy */
      const g = n.geometry = n.geometry.clone(), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
      const hips = root.getObjectByName('Hips').getWorldPosition(new T.Vector3()).y / root.scale.y;
      for (let i = 0; i < pos.count; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); const y = _v.y / root.scale.y;
        _c.setHex(y > hips + .07 ? o.top : o.bot).convertSRGBToLinear(); col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
      }
      g.setAttribute('color', new T.BufferAttribute(col, 3));
      m = tint(m, 0xffffff, grey(m.map)); m.vertexColors = true;
    }
    else if (/skin|body|^base| base/.test(nm)) {
      m = m.clone(); m.color.setHex(skin);
      if (o.sex === 'f' && /base|body/.test(nm)) {                       /* shoes on bare feet: darken below the ankle */
        const g = n.geometry = n.geometry.clone(), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); const y = _v.y / root.scale.y; _c.setHex(y < .085 ? o.shoe : 0xffffff).convertSRGBToLinear(); col.set([_c.r, _c.g, _c.b], i * 3); }
        g.setAttribute('color', new T.BufferAttribute(col, 3)); m.vertexColors = true;
      }
    }
    n.material = m;
  });
}
/* Zenbyte ID card on a lanyard for everyone */
const NAMES = ['Arun', 'Priya', 'Karthik', 'Divya', 'Rahul', 'Meena', 'Vijay', 'Anitha', 'Suresh', 'Kavya', 'Ravi', 'Deepa', 'Ajay', 'Lakshmi'];
const cardTexCache = {};
function cardTex(k) {
  const nm = NAMES[k % NAMES.length]; if (cardTexCache[nm]) return cardTexCache[nm];
  return cardTexCache[nm] = tex(220, 340, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#0e2a4a'); g.addColorStop(1, '#2d82d2'); x.fillStyle = g; x.fillRect(0, 0, w, 92);
    x.drawImage($('#logoImg'), 14, 14, 62, 63); x.fillStyle = '#fff'; x.font = '700 22px Inter, sans-serif'; x.fillText('ZENBYTE', 84, 46); x.font = '500 13px Inter, sans-serif'; x.fillText('TECHNOLOGIES', 86, 66);
    x.fillStyle = '#dfe7f1'; x.fillRect(60, 110, 100, 112); x.fillStyle = '#9fb3c8'; x.beginPath(); x.arc(110, 152, 26, 0, 7); x.fill(); x.beginPath(); x.ellipse(110, 222, 44, 34, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#0e2a4a'; x.font = '700 28px Inter, sans-serif'; x.textAlign = 'center'; x.fillText(nm, w / 2, 262);
    x.fillStyle = '#5b6b80'; x.font = '500 16px Inter, sans-serif'; x.fillText('EMP ' + (2400 + k * 37), w / 2, 288);
    x.fillStyle = '#e8c27c'; x.fillRect(0, h - 22, w, 22);
  });
}
const lanyardMat = new T.MeshStandardMaterial({ color: 0x1f5fae, roughness: .6, side: T.DoubleSide });
const clipMat = new T.MeshStandardMaterial({ color: 0xb9bec6, metalness: 1, roughness: .3 });
function idCard(root, o, k) {
  root.updateMatrixWorld(true);
  const S = root.scale.y / MODELS[o.sex].scale;                 // body size factor
  /* how far the chest sticks out at card height */
  let front = .1 * S; const cy = 1.2 * S, ny = 1.43 * S;
  root.traverse(n => { if (!n.isSkinnedMesh || !/top|casualsuit/i.test(n.name)) return; const pos = n.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); if (Math.abs(_v.x) < .05 * S && Math.abs(_v.y - cy) < .05 * S) front = Math.max(front, _v.z); } });
  let neckF = .06 * S;
  root.traverse(n => { if (!n.isSkinnedMesh || !/top|casualsuit/i.test(n.name)) return; const pos = n.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { _v.fromBufferAttribute(pos, i).applyMatrix4(n.matrixWorld); if (Math.abs(Math.abs(_v.x) - .06 * S) < .02 * S && Math.abs(_v.y - ny) < .03 * S) neckF = Math.max(neckF, _v.z); } });
  const spine = root.getObjectByName('Spine2'), g = new T.Group();
  const card = new T.Mesh(new T.BoxGeometry(.058, .09, .004), [clipMat, clipMat, clipMat, clipMat, new T.MeshStandardMaterial({ map: cardTex(k), roughness: .35 }), new T.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })]);
  card.position.set(0, cy - .045 * S, front + .012); card.rotation.x = -.08; g.add(card);
  const clip = new T.Mesh(new T.BoxGeometry(.016, .012, .006), clipMat); clip.position.set(0, cy + .006 * S, front + .01); g.add(clip);
  [-1, 1].forEach(sd => {                                     /* the strap from the neck to the card */
    const a = new T.Vector3(sd * .062 * S, ny, neckF + .004), b = new T.Vector3(sd * .008, cy + .01 * S, front + .01);
    const len = a.distanceTo(b), strap = new T.Mesh(new T.PlaneGeometry(.014, len), lanyardMat);
    strap.position.copy(a).add(b).multiplyScalar(.5); strap.lookAt(strap.position.clone().add(new T.Vector3(0, 0, 1)));
    strap.rotation.z = Math.atan2(b.x - a.x, a.y - b.y); strap.rotation.x = -Math.atan2(b.z - a.z, a.y - b.y); g.add(strap);
  });
  /* attach to the chest bone so it moves with the body */
  const inv = new T.Matrix4().copy(spine.matrixWorld).invert();
  g.updateMatrix(); g.applyMatrix4(inv); spine.add(g);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
}
const _a = new T.Vector3(), _b = new T.Vector3(), _q = new T.Quaternion(), _q2 = new T.Quaternion(), _q3 = new T.Quaternion(), _d = new T.Vector3();
/* point a bone (towards its child) in a direction given in the person's own space: works for any skeleton */
function aim(p, name, child, dir, w = 1) {
  const bone = p.b[name], ch = p.b[child]; if (!bone || !ch) return;
  bone.updateWorldMatrix(true, false); ch.updateWorldMatrix(false, false);
  bone.getWorldPosition(_a); ch.getWorldPosition(_b);
  const cur = _b.sub(_a).normalize();
  _d.copy(dir).normalize().applyQuaternion(p.root.quaternion);
  _q.setFromUnitVectors(cur, _d);
  bone.getWorldQuaternion(_q2); _q.multiply(_q2);
  bone.parent.getWorldQuaternion(_q3); _q3.invert().multiply(_q);
  bone.quaternion.slerp(_q3, w); bone.updateMatrixWorld(true);
}
const BONES = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'LeftHandMiddle1', 'RightHandMiddle1'];
function spawn(zone, x, z, ry, mode, opts = {}) {
  const k = people.length, o = OUTFITS[opts.outfit !== undefined ? opts.outfit : k % OUTFITS.length];
  const base = MODELS[o.sex]; if (!base) return null;
  const root = T.SkeletonUtils.clone(base.scene);
  const rel = o.sex === 'm' ? 1.04 + (k % 3) * .015 : .98 + (k % 2) * .02; root.scale.setScalar(base.scale * rel);
  dress(root, o, k);
  idCard(root, o, k);
  const holder = group(ZX[zone] + x, 0, z, ry); holder.add(root);
  const b = {}; BONES.forEach(n => b[n] = root.getObjectByName(n));
  const rest = {}; BONES.forEach(n => { if (b[n]) rest[n] = b[n].quaternion.clone(); });
  const p = { root: holder, model: root, b, rest, mode, opts, phase: Math.random() * 10, zone, hipY: b.Hips.position.y, rel };
  if (mode === 'coffee') p.cup = cyl(.045, .038, .11, M.cup, 0, 0, 0, null);
  people.push(p); return p;
}
function seat(zone, x, z, ry, mode, opts) {
  /* chair under the person, backrest behind them */
  chair(null, ZX[zone] + x - Math.sin(ry) * .06, z - Math.cos(ry) * .06, ry + Math.PI);
  return spawn(zone, x, z, ry, mode, opts);
}
const L = (x, y, z) => _d.set(x, y, z).clone();
/* two-bone IK: put the hand on a point (in the person's own space), elbow pointing towards 'pole' */
const _s = new T.Vector3(), _e = new T.Vector3(), _t = new T.Vector3(), _p = new T.Vector3(), _f = new T.Vector3();
function aimW(p, name, child, worldDir) {
  const bone = p.b[name], ch = p.b[child]; if (!bone || !ch) return;
  bone.updateWorldMatrix(true, false); ch.updateWorldMatrix(false, false);
  bone.getWorldPosition(_a); ch.getWorldPosition(_b);
  _q.setFromUnitVectors(_b.sub(_a).normalize(), worldDir.clone().normalize());
  bone.getWorldQuaternion(_q2); _q.multiply(_q2);
  bone.parent.getWorldQuaternion(_q3); _q3.invert().multiply(_q);
  bone.quaternion.copy(_q3); bone.updateMatrixWorld(true);
}
function toWorld(p, v) { return v.clone().applyMatrix4(p.root.matrixWorld); }
function ik(p, side, target, pole) {
  const U = side + 'Arm', F = side + 'ForeArm', H = side + 'Hand';
  if (!p.len) { p.len = {}; }
  if (!p.len[side]) { p.b[U].getWorldPosition(_a); p.b[F].getWorldPosition(_b); p.b[H].getWorldPosition(_e); p.len[side] = [_a.distanceTo(_b), _b.distanceTo(_e)]; }
  const [l1, l2] = p.len[side];
  p.b[U].updateWorldMatrix(true, false); p.b[U].getWorldPosition(_s);
  const tw = toWorld(p, target), d = tw.clone().sub(_s), dist = Math.min(Math.max(d.length(), .05), (l1 + l2) * .999);
  d.normalize();
  const cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1), A = Math.acos(cosA);
  const pw = pole.clone().applyQuaternion(p.root.quaternion); pw.sub(_p.copy(d).multiplyScalar(pw.dot(d))).normalize();
  const elbow = _s.clone().add(d.clone().multiplyScalar(Math.cos(A) * l1)).add(pw.multiplyScalar(Math.sin(A) * l1));
  aimW(p, U, F, elbow.clone().sub(_s));
  p.b[F].getWorldPosition(_f);
  aimW(p, F, H, tw.clone().sub(_f));
}
function handDir(p, side, dir) { aim(p, side + 'Hand', side + 'HandMiddle1', dir); }
function bone(p, n) { return p.b[n] || (p.b[n] = p.model.getObjectByName(n)); }
/* turn the hand around its own length so the thumb side points along 'up' (person space) */
const _h1 = new T.Vector3(), _h2 = new T.Vector3(), _h3 = new T.Vector3(), _h4 = new T.Vector3();
function twist(p, side, up) {
  const H = bone(p, side + 'Hand'), M = bone(p, side + 'HandMiddle1'), I = bone(p, side + 'HandIndex1'), K = bone(p, side + 'HandPinky1'); if (!H || !M || !I || !K) return;
  H.updateWorldMatrix(true, true);
  H.getWorldPosition(_h1); M.getWorldPosition(_h2); const dir = _h2.sub(_h1).normalize().clone();
  I.getWorldPosition(_h3); K.getWorldPosition(_h4); const lat = _h3.sub(_h4); lat.sub(dir.clone().multiplyScalar(lat.dot(dir))).normalize();
  const want = up.clone().applyQuaternion(p.root.quaternion); want.sub(dir.clone().multiplyScalar(want.dot(dir))).normalize();
  let ang = Math.acos(clamp(lat.dot(want), -1, 1)); if (lat.clone().cross(want).dot(dir) < 0) ang = -ang;
  _q.setFromAxisAngle(dir, ang); H.getWorldQuaternion(_q2); _q.multiply(_q2); H.parent.getWorldQuaternion(_q3); _q3.invert().multiply(_q);
  H.quaternion.copy(_q3); H.updateMatrixWorld(true);
}
/* bend the fingers towards the palm (for holding a hand or a cup) */
function curl(p, side, a) {
  const H = bone(p, side + 'Hand'), M = bone(p, side + 'HandMiddle1'), I = bone(p, side + 'HandIndex1'), K = bone(p, side + 'HandPinky1'), Th = bone(p, side + 'HandThumb1'); if (!H || !M || !I || !K || !Th) return;
  H.updateWorldMatrix(true, true);
  H.getWorldPosition(_h1); M.getWorldPosition(_h2); const dir = _h2.clone().sub(_h1).normalize();
  I.getWorldPosition(_h3); K.getWorldPosition(_h4); const lat = _h3.clone().sub(_h4).normalize();
  Th.getWorldPosition(_h3); let palm = _h3.sub(_h1); palm.sub(dir.clone().multiplyScalar(palm.dot(dir))); palm.sub(lat.clone().multiplyScalar(palm.dot(lat))); palm.normalize();
  ['Index', 'Middle', 'Ring', 'Pinky'].forEach(f => {
    for (let j = 1; j <= 3; j++) {
      const b0 = bone(p, side + 'Hand' + f + j), b1 = bone(p, side + 'Hand' + f + (j + 1)); if (!b0 || !b1) continue;
      const th = a * j; aimWb(b0, b1, dir.clone().multiplyScalar(Math.cos(th)).add(palm.clone().multiplyScalar(Math.sin(th))));
    }
  });
}
function aimWb(bone, ch, worldDir) {
  bone.updateWorldMatrix(true, false); ch.updateWorldMatrix(false, false);
  bone.getWorldPosition(_a); ch.getWorldPosition(_b);
  _q.setFromUnitVectors(_b.sub(_a).normalize(), worldDir.normalize());
  bone.getWorldQuaternion(_q2); _q.multiply(_q2); bone.parent.getWorldQuaternion(_q3); _q3.invert().multiply(_q);
  bone.quaternion.copy(_q3); bone.updateMatrixWorld(true);
}
function pose(p, t) {
  const ph = t + p.phase, m = p.mode;
  if (!p.allRest) { p.allRest = []; p.model.traverse(o => { if (o.isBone) p.allRest.push([o, o.quaternion.clone()]); }); }
  p.allRest.forEach(([o, q]) => o.quaternion.copy(q));
  p.b.Hips.position.y = p.hipY; p.model.position.y = 0;
  p.model.updateMatrixWorld(true);
  const breathe = Math.sin(ph * 1.6) * .012;
  /* standing base pose */
  let walkK = 0;
  if (m === 'walk') {
    const path = p.opts.path, sp = p.opts.speed || .9, len = p.opts.len;
    const d = ((t * sp + p.phase * 3) % len + len) % len, half = len / 2, fwd = d < half, u = fwd ? d / half : 2 - d / half;
    const a = path[0], c = path[1];
    p.root.position.set(ZX[p.zone] + a[0] + (c[0] - a[0]) * u, 0, a[1] + (c[1] - a[1]) * u);
    p.root.rotation.y = Math.atan2(c[0] - a[0], c[1] - a[1]) + (fwd ? 0 : Math.PI);
    p.root.updateMatrixWorld(true); walkK = 1;
  }
  const cyc = ph * 5.2 * (p.opts.speed || .9);
  const sw = walkK ? Math.sin(cyc) : 0;
  aim(p, 'Spine', 'Spine2', L(0, 1, .02 + breathe));
  if (m !== 'type' && m !== 'sitMeet' && m !== 'sitTalk') {
    const lA = sw * .42, rA = -sw * .42;
    const lK = walkK ? Math.max(0, -Math.sin(cyc - .9)) * .75 : 0, rK = walkK ? Math.max(0, Math.sin(cyc - .9)) * .75 : 0;
    aim(p, 'LeftUpLeg', 'LeftLeg', L(.04, -Math.cos(lA), Math.sin(lA))); aim(p, 'RightUpLeg', 'RightLeg', L(-.04, -Math.cos(rA), Math.sin(rA)));
    aim(p, 'LeftLeg', 'LeftFoot', L(0, -Math.cos(lA - lK), Math.sin(lA - lK))); aim(p, 'RightLeg', 'RightFoot', L(0, -Math.cos(rA - rK), Math.sin(rA - rK)));
    aim(p, 'LeftFoot', 'LeftToeBase', L(0, -.45, 1)); aim(p, 'RightFoot', 'RightToeBase', L(0, -.45, 1));
    if (walkK) p.b.Hips.position.y = p.hipY * (1 + Math.abs(Math.cos(cyc)) * .02);
    /* arms hang down and swing a little */
    aim(p, 'LeftArm', 'LeftForeArm', L(.12, -1, -sw * .35)); aim(p, 'RightArm', 'RightForeArm', L(-.12, -1, sw * .35));
    aim(p, 'LeftForeArm', 'LeftHand', L(.04, -1, .18 - sw * .25)); aim(p, 'RightForeArm', 'RightHand', L(-.04, -1, .18 + sw * .25));
  }
  if (m === 'walk') { aim(p, 'Neck', 'Head', L(0, 1, .06)); return; }
  if (m === 'type' || m === 'sitTalk' || m === 'sitMeet') {
    p.model.position.y = -.46 * p.rel;
    aim(p, 'LeftUpLeg', 'LeftLeg', L(.1, -.06, 1)); aim(p, 'RightUpLeg', 'RightLeg', L(-.1, -.06, 1));
    aim(p, 'LeftLeg', 'LeftFoot', L(.03, -1, .1)); aim(p, 'RightLeg', 'RightFoot', L(-.03, -1, .1));
    aim(p, 'LeftFoot', 'LeftToeBase', L(0, -.3, 1)); aim(p, 'RightFoot', 'RightToeBase', L(0, -.3, 1));
    aim(p, 'Spine', 'Spine2', L(0, 1, m === 'type' ? .18 : .06));
    if (m === 'type') {
      const k1 = Math.max(0, Math.sin(ph * 15)) * .025, k2 = Math.max(0, Math.sin(ph * 13 + 1.3)) * .025;
      ik(p, 'Left', L(.13, .8 + k1, .46), L(.8, -1, -.3)); ik(p, 'Right', L(-.13, .8 + k2, .46), L(-.8, -1, -.3));
      handDir(p, 'Left', L(-.15, -.25, 1)); handDir(p, 'Right', L(.15, -.25, 1));
      aim(p, 'Neck', 'Head', L(Math.sin(ph * .4) * .1, 1, .2));
    } else {
      const g = m === 'sitTalk' ? Math.max(0, Math.sin(ph * 1.3)) * .16 : 0;
      ik(p, 'Left', L(.16, .66, .38), L(.8, -1, -.3)); ik(p, 'Right', L(-.16, .66 + g, .38 + g * .5), L(-.8, -1, -.3));
      handDir(p, 'Left', L(-.2, -.3, 1)); handDir(p, 'Right', L(.2, -.3 + g * 2, 1));
      aim(p, 'Neck', 'Head', L(Math.sin(ph * .7) * .22, 1, .05));
    }
    return;
  }
  const R = p.opts.right === undefined ? 1 : p.opts.right;
  const hs = p.rel;                                           // body height factor
  if (m === 'shake') {
    /* right hands clasp in the middle: palms facing, thumbs up, fingers wrapped, a gentle up-and-down shake */
    const shaking = (t % 6) < 2.8, sh = shaking ? Math.sin(t * 9) * .03 : 0;
    const mw = V3(ZX[p.zone] + p.opts.meet[0], .97 * hs + sh, p.opts.meet[1]);
    const local = p.root.worldToLocal(mw.clone()); local.x -= .022; local.z -= .02;
    ik(p, 'Right', local, L(-.7, -1, -.1)); handDir(p, 'Right', L(.25, -.05, 1));
    twist(p, 'Right', L(0, 1, 0)); curl(p, 'Right', .55);
    aim(p, 'Neck', 'Head', L(0, 1, .12));
  } else if (m === 'coffee') {
    /* cup held in front of the chest, lifted to the mouth now and then */
    const sip = Math.max(0, Math.sin(ph * .7)) ** 4;
    const chest = L(.1, 1.12 * hs, .27), mouth = L(.04, 1.48 * hs, .16);
    ik(p, 'Left', chest.clone().lerp(mouth, sip), L(.8, -1, -.3)); handDir(p, 'Left', L(-.6, .15 + sip * .4, .7)); twist(p, 'Left', L(0, 1, 0)); curl(p, 'Left', .62);
    const g = Math.max(0, Math.sin(ph * 1.6 + 1)) * .45;
    aim(p, 'RightArm', 'RightForeArm', L(-.16, -.95, .12 + g * .3)); aim(p, 'RightForeArm', 'RightHand', L(.25, -.45 + g, .8));
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .8) * .15, 1, .05 + sip * .1));
    if (p.cup) { p.b.LeftHand.getWorldPosition(_a); p.b.LeftHandMiddle1.getWorldPosition(_b); const th = bone(p, 'LeftHandThumb1').getWorldPosition(new T.Vector3()); p.cup.position.copy(_a).lerp(_b, .55).lerp(th, .35); p.cup.position.y -= .02; p.cup.rotation.set(0, 0, 0); }
  } else if (m === 'talk') {
    const g1 = Math.max(0, Math.sin(ph * 1.7)) * .6, g2 = Math.max(0, Math.sin(ph * 1.3 + 2)) * .5;
    aim(p, 'RightArm', 'RightForeArm', L(-.2, -.92, .15 + g1 * .3)); aim(p, 'RightForeArm', 'RightHand', L(.15, -.35 + g1, .9));
    aim(p, 'LeftArm', 'LeftForeArm', L(.2, -.92, .15 + g2 * .3)); aim(p, 'LeftForeArm', 'LeftHand', L(-.15, -.45 + g2, .9));
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .9) * .22, 1, .05));
  } else if (m === 'present') {
    const g = Math.sin(ph * 1.1) * .12;
    aim(p, 'RightArm', 'RightForeArm', L(-.85 * R, .05 + g, .45)); aim(p, 'RightForeArm', 'RightHand', L(-.9 * R, .15 + g, .4));
    aim(p, 'LeftArm', 'LeftForeArm', L(.18, -.9, .22)); aim(p, 'LeftForeArm', 'LeftHand', L(-.2, -.2 + Math.max(0, Math.sin(ph * 1.5)) * .4, .9));
    aim(p, 'Neck', 'Head', L(-.3 * R + Math.sin(ph * .5) * .25, 1, .05));
  } else if (m === 'clap') {
    /* palms meet in front of the chest */
    const gap = .015 + .07 * (.5 + .5 * Math.sin(ph * 13));
    ik(p, 'Left', L(gap, 1.2 * hs, .3), L(1, -1, -.4)); ik(p, 'Right', L(-gap, 1.2 * hs, .3), L(-1, -1, -.4));
    handDir(p, 'Left', L(-.35, .5, 1)); handDir(p, 'Right', L(.35, .5, 1)); twist(p, 'Left', L(0, 1, .3)); twist(p, 'Right', L(0, 1, .3)); curl(p, 'Left', .12); curl(p, 'Right', .12);
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .5) * .15, 1, .08));
  } else if (m === 'watch') {
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .3) * .1, 1, -.02));
    if (p.opts.arms === 'cross') { aim(p, 'LeftArm', 'LeftForeArm', L(.18, -.9, .3)); aim(p, 'RightArm', 'RightForeArm', L(-.18, -.9, .3)); aim(p, 'LeftForeArm', 'LeftHand', L(-1, .35, .35)); aim(p, 'RightForeArm', 'RightHand', L(1, .25, .4)); }
  } else {
    aim(p, 'Neck', 'Head', L(Math.sin(ph * .4) * .2, 1, .2));
  }
}

/* ---------------- story: camera view for every chapter ---------------- */
/* each zone: where the camera stands and where it looks first; drag turns it all the way round (360°) */
const VIEWS = [{ x: .9, at: [-.2, -2.6] }, { x: -.7, at: [.4, -4] }, { x: 1.3, at: [-.4, -2.2] }, { x: .9, at: [0, -3.2] }, { x: -.9, at: [.2, -2.6] }, { x: .7, at: [-.2, -3.2] }, { x: 0, at: [0, -3] }];
const ZONE_NAME = ['Reception', 'Data wall', 'Coding floor', 'Meeting room', 'Coffee break', 'Manager cabin', 'Celebration'];

/* ---------------- page UI ---------------- */
const panel = $('#panel'), chapNav = $('#chap'), rail = $('#rail');
chapNav.innerHTML = ROOMS.map((r, k) => `<button data-k="${k}">${E(r.name.replace(' and next steps', '').replace(' and timing', ''))}</button>`).join('');
rail.innerHTML = P.map((p, i) => `<button data-i="${i}" aria-label="Page ${i + 1}"></button>`).join('');
let page = -1, mode = 'intro';
function showPage(i) {
  i = Math.max(0, Math.min(P.length - 1, i)); if (i === page) return;
  const prevZone = page < 0 ? -1 : PAGE_ROOM[page];
  page = i; const z = PAGE_ROOM[i], j = ROOMS[z].pages.indexOf(i);
  panel.classList.add('out');
  setTimeout(() => {
    panel.className = 'panel out ' + (VIEWS[z].side || (z % 2 ? 'left' : 'right'));
    panel.innerHTML = `<div class="zone"><i></i>${E(ZONE_NAME[z])}</div>` + pageHTML(i);
    panel.querySelector('.ey').dataset.n = String(i + 1).padStart(2, '0');
    if (/DataMeet/.test(panel.textContent)) panel.querySelectorAll('.nt').forEach(n => { if (/DataMeet/.test(n.textContent)) n.remove(); });
    /* heading, eyebrow and intro go together on one glass card; every point becomes its own colourful tile */
    const card = panel.querySelector('.card'), head = document.createElement('div'); head.className = 'head';
    ['.ey', 'h2', '.lede'].forEach(q => { const e = card.querySelector(':scope > ' + q); if (e) head.appendChild(e); }); card.prepend(head);
    afterRender(i, panel); panel.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove('out')));
  }, prevZone === z ? 260 : 700);
  flyTo(z, j);
  [...chapNav.children].forEach((b, k) => b.classList.toggle('on', k === z));
  [...rail.children].forEach((b, k) => b.classList.toggle('on', k === i));
  $('#count').textContent = String(i + 1).padStart(2, '0') + ' / ' + P.length;
  $('#prev').disabled = i === 0; $('#next').disabled = i === P.length - 1;
}
chapNav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showPage(ROOMS[+b.dataset.k].pages[0]); });
rail.addEventListener('click', e => { const b = e.target.closest('button'); if (b) showPage(+b.dataset.i); });
$('#prev').onclick = () => showPage(page - 1); $('#next').onclick = () => showPage(page + 1);
function enter() { if (mode !== 'intro') return; mode = 'office'; document.body.classList.add('office'); showPage(0); }
$('#enter').addEventListener('click', enter);
let wheelLock = 0;
addEventListener('wheel', e => {
  if (mode !== 'office') { if (e.deltaY > 20) enter(); return; }
  if (e.target.closest('#panel') && panel.scrollHeight > panel.clientHeight + 4) {
    const atEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2, atTop = panel.scrollTop <= 0;
    if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atTop)) return;
  }
  const n = Date.now(); if (n < wheelLock || Math.abs(e.deltaY) < 15) return; wheelLock = n + 900; showPage(page + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
addEventListener('keydown', e => {
  if (mode !== 'office') { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') enter(); return; }
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) showPage(page + 1);
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) showPage(page - 1);
});

/* ---------------- camera: fly between zones, drag / mouse to look around ---------------- */
const cam = { from: null, to: null, t0: 0, dur: 1, pos: V3(2.6, 1.7, 4.2), yaw0: 0 };
let yaw = 0, pitch = 0, yawT = 0, pitchT = 0, hoverX = 0, hoverY = 0, dragging = false, lx = 0, ly = 0, now = 0, auto = false, dbg = null;
function viewOf(z, j) {
  const v = VIEWS[z], px = ZX[z] + v.x + (j > 0 ? (j % 2 ? 1 : -1) * Math.min(1.4, .5 * j) : 0), pz = MOB() ? 4.9 : 4.2;
  return { pos: V3(px, 1.7, pz), yaw0: Math.atan2(-(ZX[z] + v.at[0] - px), -(v.at[1] - pz)) };
}
function flyTo(z, j) {
  const v = viewOf(z, j);
  const far = Math.abs(v.pos.x - cam.pos.x) > 6;
  const start = cam.yaw0 + yaw; yaw = 0; yawT = 0; pitchT = 0;
  let d = (v.yaw0 - start) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
  cam.from = { pos: cam.pos.clone(), yaw0: start }; cam.to = { pos: v.pos, yaw0: start + d };
  cam.t0 = now; cam.dur = far ? 2.4 : 1.2; cam.far = far;
  sun.position.set(ZX[z] + 6, 12, -10); sun.target.position.set(ZX[z], 0, 2);
}
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  hoverX = e.clientX / innerWidth - .5; hoverY = e.clientY / innerHeight - .5;
  if (!dragging) return;
  yawT += (e.clientX - lx) * .006; pitchT = clamp(pitchT - (e.clientY - ly) * .003, -.25, .3); auto = false; document.body.classList.remove('spin');
  lx = e.clientX; ly = e.clientY;
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('dblclick', () => { yawT = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2; pitchT = 0; });
$('#spin').addEventListener('click', () => { auto = !auto; document.body.classList.toggle('spin', auto); });

/* ---------------- loading the people ---------------- */
const status = $('#loadTxt');
function loadModel(url) { return new Promise((res, rej) => loader.load(url, res, ev => { if (ev.total) status.textContent = 'Loading the office · ' + Math.round(ev.loaded / ev.total * 100) + '%'; }, rej)); }
function prep(g) {
  g.scene.updateMatrixWorld(true); const hips = g.scene.getObjectByName('Hips'); g.scale = 1;
  const y = hips.getWorldPosition(new T.Vector3()).y; g.scale = .98 / y;   // hips at about 0.98 m
  return g;
}
function loadPeople() {
  return Promise.all([loadModel(MAN_URL), loadModel(WOMAN_URL)]).then(([man, woman]) => {
    MODELS.m = prep(man); MODELS.f = prep(woman);
    /* ---- reception: receptionist, a handshake, visitors; opposite side: visitors watching the welcome screen ---- */
    spawn(0, -.3, -4.05, 0, 'look', { outfit: 1 });
    spawn(0, -.37, -.4, Math.PI / 2, 'shake', { outfit: 0, meet: [0, -.4] }); spawn(0, .37, -.4, -Math.PI / 2, 'shake', { outfit: 2, meet: [0, -.4] });
    spawn(0, 0, 0, 0, 'walk', { path: [[-5.6, -1.7], [-1.6, -1.9]], len: 8, speed: .7, outfit: 3 });
    spawn(0, -1.6, 6.55, 0, 'sitMeet', { outfit: 5 }); spawn(0, -.4, 6.55, 0, 'sitMeet', { outfit: 6 });
    spawn(0, 1.6, 6.9, 0, 'watch', { outfit: 13, arms: 'cross' });
    /* ---- data wall: presenter and team; opposite side: team reading the skills screen ---- */
    spawn(1, -1.6, -4.2, .25, 'present', { right: -1, outfit: 9 });
    spawn(1, -.3, -1.6, Math.PI, 'watch', { outfit: 12 }); spawn(1, .7, -1.3, Math.PI + .2, 'coffee', { outfit: 2 }); spawn(1, 1.6, -2, Math.PI + .5, 'talk', { outfit: 5 });
    spawn(1, -3.6, -1.18, Math.PI + .3, 'type', { outfit: 8 });
    spawn(1, -.8, 7.3, 0, 'watch', { outfit: 3, arms: 'cross' }); spawn(1, .5, 7.1, -.15, 'talk', { outfit: 11 }); spawn(1, 1.5, 7.4, -.3, 'watch', { outfit: 10 });
    /* ---- coding floor: developers typing; opposite side: two devs reviewing code on the big screen ---- */
    deskSpots.forEach(([x, z], k) => spawn(2, x, z + .62, Math.PI, 'type', { outfit: [11, 1, 4, 5, 8, 12][k] }));
    spawn(2, 0, 0, 0, 'walk', { path: [[-5, -.3], [5, -.3]], len: 20, speed: .8, outfit: 9 });
    spawn(2, -.7, 7.4, .2, 'present', { right: 1, outfit: 13 }); spawn(2, .6, 7.2, -.2, 'watch', { outfit: 10, arms: 'cross' });
    /* ---- meeting room; opposite side: video call with the client ---- */
    [[-1.4, -3.45, 0], [0, -3.5, 0], [1.4, -3.45, 0], [-1.4, -1.75, Math.PI], [1.4, -1.75, Math.PI]].forEach(([x, z, r], k) => seat(3, x, z, r, 'sitMeet', { outfit: [0, 3, 6, 7, 2][k] }));
    spawn(3, 2.6, -4.6, -.6, 'present', { right: 1, outfit: 9 });
    seat(3, -1.2, 6.75, 0, 'sitTalk', { outfit: 12 }); seat(3, 0, 6.75, 0, 'sitMeet', { outfit: 4 }); seat(3, 1.2, 6.75, 0, 'sitMeet', { outfit: 1 });
    /* ---- coffee break; opposite side: watching the hiring news ---- */
    spawn(4, -3.2, -4.1, 0, 'coffee', { outfit: 8 }); spawn(4, -2.4, -3.2, Math.PI * .85, 'talk', { outfit: 3 });
    spawn(4, 2.1, -2.1, Math.PI * .3, 'coffee', { outfit: 5 }); spawn(4, 3.1, -2.2, -Math.PI * .4, 'coffee', { outfit: 11 });
    spawn(4, 2.6, -1.4, Math.PI * 1.02, 'talk', { outfit: 12 });
    spawn(4, 0, 0, 0, 'walk', { path: [[-4.6, -.7], [1.2, -.5]], len: 11.6, speed: .8, outfit: 6 });
    spawn(4, -.6, 7.3, .1, 'coffee', { outfit: 13 }); spawn(4, .6, 7.4, -.1, 'watch', { outfit: 1, arms: 'cross' });
    /* ---- manager cabin; opposite side: offer review ---- */
    seat(5, 0, -4.3, 0, 'sitTalk', { outfit: 0 }); seat(5, -.6, -2.3, Math.PI, 'sitTalk', { outfit: 3 }); seat(5, .6, -2.3, Math.PI, 'sitMeet', { outfit: 6 });
    spawn(5, -.5, 7.3, .1, 'present', { right: 1, outfit: 7 }); spawn(5, .7, 7.1, -.2, 'watch', { outfit: 4 });
    /* ---- celebration: offer handshake, team clapping; opposite side: everyone watching "Placed this month" ---- */
    spawn(6, -.37, -2.4, Math.PI / 2, 'shake', { outfit: 9, meet: [0, -2.4] }); spawn(6, .37, -2.4, -Math.PI / 2, 'shake', { outfit: 12, meet: [0, -2.4] });
    [[-2.3, -2.9, .5], [2.3, -2.9, -.5], [-1.6, -1.2, .7], [1.6, -1.2, -.7], [0, -4.1, 0]].forEach(([x, z, r], k) => spawn(6, x, z, r, 'clap', { outfit: [2, 5, 8, 10, 13][k] }));
    [[-1.8, 7.2], [-.6, 7.4], [.6, 7.3], [1.8, 7.1]].forEach(([x, z], k) => spawn(6, x, z, 0, k % 2 ? 'clap' : 'watch', { outfit: [1, 4, 3, 11][k] }));
    if (/lineup/.test(location.search)) OUTFITS.forEach((o, i) => spawn(0, -5.2 + i * .8, 3.2, Math.PI, 'look', { outfit: i }));
    people.forEach(p => { if (p.cup) scene.add(p.cup); });
  }).catch(err => { status.textContent = 'Could not load the people'; console.error(err); });
}

/* ---------------- main loop ---------------- */
function resize() {
  renderer.setPixelRatio(CAPTURE ? 1 : Math.min(devicePixelRatio || 1, MOB() ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 58 : 42; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
let last = 0, screenTick = 0;
const tmpPos = V3(0, 0, 0), tmpAt = V3(0, 0, 0);
function frame(t) {
  const dt = Math.min(.05, Math.max(0, t - last)); last = t; now = t;
  /* camera */
  if (cam.to) {
    const u = clamp((t - cam.t0) / cam.dur), e = ease(u), f = cam.from, g = cam.to;
    cam.pos.lerpVectors(f.pos, g.pos, e); cam.yaw0 = f.yaw0 + (g.yaw0 - f.yaw0) * e;
    if (cam.far) cam.pos.y += Math.sin(u * Math.PI) * .4;
    if (u >= 1) cam.to = null;
  }
  if (auto) yawT += dt * .25;
  yaw += (yawT + (dragging || auto ? 0 : -hoverX * .35) - yaw) * .08; pitch += (pitchT + (dragging ? 0 : -hoverY * .12) - pitch) * .08;
  const A = cam.yaw0 + yaw;
  camera.position.copy(cam.pos);
  tmpAt.set(cam.pos.x - Math.sin(A) * 5, cam.pos.y - .55 + pitch * 3, cam.pos.z - Math.cos(A) * 5);
  if (dbg) { camera.position.copy(dbg[0]); tmpAt.copy(dbg[1]); }
  camera.lookAt(tmpAt);
  /* people */
  people.forEach(p => { p.root.updateMatrixWorld(true); pose(p, t); });
  /* live screens (not every frame) */
  if (t - screenTick > .12) { screenTick = t; liveScreens.forEach(s => s.draw(t)); }
  /* confetti */
  const cp = cGeo.attributes.position.array;
  for (let i = 0; i < CONF; i++) { const s = cSeed[i]; cp[i * 3] = s[0] + Math.sin(t * 1.3 + i) * .2; cp[i * 3 + 1] = 3 - ((t * (.3 + s[3] * .4) + s[1]) % 3); cp[i * 3 + 2] = s[2] + Math.cos(t + i) * .2; }
  cGeo.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}
logoWall.material.map = logoTex(); logoWall.material.needsUpdate = true;
wall7.material.map = tex(1024, 448, (x, w, h) => { x.fillStyle = '#0e2a4a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8c27c'; x.font = '600 34px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('CONGRATULATIONS', w / 2, 120); x.fillStyle = '#fff'; x.font = 'italic 500 110px Cormorant, Georgia, serif'; x.fillText('Welcome aboard!', w / 2, 260); x.fillStyle = '#cfe9ff'; x.font = '500 30px Inter, sans-serif'; x.fillText('Another Zenbyte candidate placed', w / 2, 340); });
flyTo(0, 0); cam.pos.copy(cam.to.pos); cam.yaw0 = cam.to.yaw0; cam.to = null;

loadPeople().then(() => {
  document.body.classList.add('ready');
  if (CAPTURE) {
    window.renderAt = (t, pg, yw = 0) => { dbg = null; if (pg !== undefined && pg !== page) { mode = 'office'; document.body.classList.add('office'); showPage(pg); cam.t0 = t - 99; } yawT = yaw = yw; frame(t); };
    window.debugCam = (px, py, pz, ax, ay, az, t) => { dbg = [V3(px, py, pz), V3(ax, ay, az)]; frame(t || 3); };
    window.capReady = true;
  } else {
    const t0 = performance.now();
    (function loop() { frame((performance.now() - t0) / 1000); requestAnimationFrame(loop); })();
  }
});
})();
